# AI 反馈系统优化思考

## 一、Token 优化与数据分析

### 1. 当前数据结构
- 每日目标进度记录
- 支持多个时间范围：7天、30天、自定义时间段
- 包含详细的每日任务完成情况

### 2. 优化后的 Prompt 结构
```javascript
const optimizedPrompt = `
分析时间段：${startDate} 至 ${endDate}

目标基本信息：
- 标题：${goal.title}
- 当前任务：${goal.currentSettings?.dailyTask}

统计数据：
1. 时间投入分析：
   - 总投入时间：${totalTime} 小时
   - 主要活动分布：${activityDistribution}
   - 高频时间段：${peakTimePatterns}

2. 任务完成情况：
   - 完成率：${completionRate}%
   - 连续完成天数：${consecutiveDays}
   - 未完成日期：${incompleteDates}

请按以下格式提供分析：
1. 时间段内的主要贡献活动
2. 每日任务完成情况
3. 优缺点分析：
   - 优点（最多3点）
   - 需改进之处（最多2点）
4. 具体改进建议（最多2点）
5. 鼓励反馈（一句话）

注意：请保持简洁具体，每点建议不超过20字。
`
```

### 3. Token 优化策略
1. **数据预处理**：
   - 在后端预先计算统计数据
   - 只传送必要的汇总信息给 AI
   - 使用固定格式的模板减少描述性文本

2. **响应格式标准化**：
   - 限制每个部分的输出长度
   - 使用结构化的输出格式
   - 避免冗长的描述性语言

## 二、交互式反馈设计

### 1. 基础反馈存储
```javascript
const feedbackSchema = {
  goalId: ObjectId,
  timeRange: {
    start: Date,
    end: Date
  },
  analysis: {
    mainActivities: [String],
    completionStatus: String,
    strengths: [String],
    weaknesses: [String],
    suggestions: [String],
    encouragement: String
  },
  userInteractions: [{
    type: String,  // 'question', 'clarification', 'followup'
    content: String,
    aiResponse: String,
    timestamp: Date
  }]
}
```

### 2. RAG 使用时机
1. **不需要使用 RAG 的场景**：
   - 日常进度报告生成
   - 基础统计数据分析
   - 标准化建议生成

2. **建议使用 RAG 的场景**：
   - 用户提出深入问题时
   - 需要参考历史建议的连续性
   - 分析长期行为模式变化

### 3. 交互式反馈流程
1. **初始反馈**：
   - 使用优化后的标准 prompt
   - 无需 RAG，直接基于当前数据生成

2. **深入对话**：
   - 用户选择特定反馈点深入讨论
   - 启用 RAG 获取相关历史上下文
   - 生成更个性化的建议

3. **反馈优化循环**：
   - 记录用户互动
   - 更新用户偏好
   - 优化未来反馈

## 三、实施建议

### 1. 前端实现
```javascript
// AIFeedback.jsx
const AIFeedback = () => {
  // 基础反馈显示
  const [feedback, setFeedback] = useState(null);
  // 深入对话状态
  const [activeDiscussion, setActiveDiscussion] = useState(null);

  // 处理深入讨论
  const handleDeepDive = async (topic) => {
    // 这里才启用 RAG
    const detailedResponse = await getDetailedFeedback(topic, feedback.id);
    setActiveDiscussion(detailedResponse);
  };
};
```

### 2. 后端实现
1. **基础反馈生成**：
   - 使用优化的 prompt
   - 预处理数据
   - 标准化输出

2. **深入对话处理**：
   - 使用 RAG 增强上下文
   - 保存对话历史
   - 更新用户模型

### 3. 数据存储策略
1. **短期数据**：
   - 基础反馈内容
   - 统计数据
   - 当前对话上下文

2. **长期数据**：
   - 用户偏好
   - 行为模式
   - 改进效果追踪

## 四、注意事项
1. 保持反馈简洁明确
2. 确保建议可执行性
3. 注意数据隐私保护
4. 优化存储空间使用
5. 监控 token 使用情况