# AI 功能实现文档

## 1. AI 功能概述

本项目集成了 AI 分析功能，主要用于生成目标进度报告和提供智能化的反馈建议。目前实现的主要功能是：基于用户的目标数据和进度记录，使用 Hugging Face 的开源模型生成个性化的分析报告。

## 2. 前后端结构

### 2.1 前端结构

- **组件**: `AIFeedback.jsx`
  - 位置：`client/src/components/ProgressReport/AIFeedback.jsx`
  - 功能：提供用户界面，允许用户请求 AI 分析，并展示分析结果
  - 状态管理：使用 React useState 管理 feedback、loading 和 error 状态

- **API 服务**: 
  - 位置：`client/src/services/api.js`
  - 功能：封装了对后端 API 的调用，包括报告生成和获取
  - 主要方法：
    ```javascript
    reports: {
      generate: (goalId) => api.post(`/api/reports/${goalId}`, { timeRange: 'daily' }),
      getLatest: (goalId) => api.get(`/api/reports/${goalId}/latest`)
    }
    ```

### 2.2 后端结构

- **路由层**:
  - 位置：`server/routes/reports.js`
  - 功能：定义 API 端点，处理客户端请求
  - 主要路由：
    ```javascript
    router.post('/:goalId', requireAuth, async (req, res) => {...}); // 生成报告
    router.get('/:goalId/latest', requireAuth, async (req, res) => {...}); // 获取最新报告
    ```

- **服务层**:
  - 位置：`server/services/ReportService.js`
  - 功能：实现核心业务逻辑，包括目标数据处理、AI 分析生成等
  - 主要方法：
    ```javascript
    static async generateReport(goalId, userId, timeRange = 'daily') {...}
    static async _generateAIAnalysis(prompt) {...}
    ```

- **数据模型**:
  - 位置：`server/models/Report.js`
  - 功能：定义报告数据结构，提供数据库操作接口
  - 主要字段：goalId, userId, content, analysis, type, period, insights, recommendations

## 3. 数据流与通讯

1. **生成报告流程**:
   - 用户点击 "生成分析" 按钮
   - 前端调用 `apiService.reports.generate(goalId)`
   - 后端接收请求 `POST /api/reports/:goalId`
   - 验证用户身份 (requireAuth 中间件)
   - 调用 `ReportService.generateReport()`
   - 检索目标和进度数据
   - 调用 Hugging Face API 生成 AI 分析
   - 保存报告到数据库
   - 返回结果给前端
   - 前端更新 UI 显示分析结果

2. **获取报告流程**:
   - 前端调用 `apiService.reports.getLatest(goalId)`
   - 后端接收请求 `GET /api/reports/:goalId/latest`
   - 验证用户身份
   - 查询最新的报告记录
   - 返回结果给前端
   - 前端更新 UI 显示报告内容

## 4. Hugging Face API 使用方法

### 4.1 安装依赖
```bash
npm install @huggingface/inference
```

### 4.2 配置 API

在项目根目录的 `.env` 文件中添加 Hugging Face API 密钥：
```
HUGGING_FACE_API_KEY=your_api_key_here
```

### 4.3 代码实现
```javascript
import { HfInference } from '@huggingface/inference';

const hf = new HfInference(process.env.HUGGING_FACE_API_KEY);

// 文本生成示例
const result = await hf.textGeneration({
  model: 'gpt2',  // 或其他适合的模型
  inputs: prompt,
  parameters: {
    max_new_tokens: 500,
    temperature: 0.7,
    top_p: 0.95,
    do_sample: true
  }
});

// 结果处理
const generatedText = result.generated_text;
```

### 4.4 可选模型
- **gpt2**: 基础文本生成模型
- **tiiuae/falcon-7b-instruct**: 指令型大语言模型，能更好理解和遵循提示
- **facebook/bart-large-cnn**: 适合摘要任务
- **google/flan-t5-base**: 多任务指令型模型

## 5. 当前错误分析

目前系统存在以下问题：

1. **API 404 错误**：
   - 前端调用 `POST /api/reports/:goalId` 时返回 404 Not Found
   - 可能原因：
     - 路由未正确注册或匹配. (check)
     - Express 应用配置问题 (check)
     - 服务器未正确重启 (check)
     - 中间件拦截请求 (uncheck)

2. **模型导入/导出不一致**：
   - `Report.js` 模型使用 CommonJS 模块系统 (`module.exports`) (check)
   - 而服务层使用 ES6 模块系统 (`import/export`) (check)
   - 已修复为统一使用 ES6 模块系统 (check)

3. **环境变量配置**：
   - 可能缺少 Hugging Face API 密钥 (`HUGGING_FACE_API_KEY`) (check)
   - 需要在 `.env` 文件中正确配置 (check)

## 6. 未来调试方向

1. **基础网络测试**：
   - 使用简单路由 (`/api/reports/test`) 验证 API 服务是否正常响应
   - 使用 Postman 或 curl 直接测试 API 端点

2. **鉴权问题排查**：
   - 测试不需要鉴权的路由点
   - 检查 JWT token 是否正确传递
   - 确认 `requireAuth` 中间件逻辑

3. **服务器配置检查**：
   - 查看完整的 Express 应用初始化和配置代码
   - 确认端口号和路由注册顺序
   - 检查错误处理中间件

4. **日志增强**：
   - 在关键点添加详细日志
   - 记录请求头、参数和响应状态
   - 监控服务器启动和路由注册过程

5. **报告生成优化**：
   - 实现本地缓存机制减少 API 调用
   - 添加错误重试机制
   - 优化提示词工程，提高生成质量

6. **前端改进**：
   - 实现渐进式加载和错误恢复
   - 添加用户反馈机制
   - 提供报告导出和分享功能

## 7. 参考资源

- [Hugging Face 官方文档](https://huggingface.co/docs)
- [Hugging Face JS库](https://www.npmjs.com/package/@huggingface/inference)
- [Express.js 路由文档](https://expressjs.com/en/guide/routing.html)
- [React 状态管理](https://reactjs.org/docs/hooks-state.html) 