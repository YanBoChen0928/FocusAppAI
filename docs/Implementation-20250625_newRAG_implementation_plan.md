# RAG 功能增强实施计划

## 相关文件
- `server/services/RAGService.js`: RAG核心服务实现
- `server/services/ReportService.js`: 报告生成服务
- `client/src/components/ProgressReport/AIFeedback.jsx`: 前端AI反馈组件
- `server/models/Report.js`: 报告数据模型
- `focus-app/docs/20250624_Update_AI_dataflow.md`: AI数据流文档
- `focus-app/docs/20250624_Update_AIFeedBack.md`: AI反馈更新文档
- `focus-app/docs/AIFeedBack_RAG.md`: RAG策略文档
- `focus-app/docs/20250624_NEWRAGFeatureDataFlowBeforeInplementation.md`: 新RAG特性数据流
- `focus-app/docs/20250624_aifeedback_rag_futureFeature.md`: RAG未来特性
- `focus-app/docs/20250608_DealWithTimeZone.md`: 时区处理文档

## 目标
1. 实现更智能的AI反馈系统
2. 优化RAG检索和生成流程
3. 提升用户交互体验
4. 确保时区处理的一致性
## 实施步骤

### Phase 1: 基础RAG功能增强 (2025/06/25-2025/07/05) ✅ COMPLETED

#### 1.1 RAG服务优化 ✅ MOSTLY COMPLETED
- [x] 更新向量嵌入生成逻辑 ✅ COMPLETED
  - [x] 使用text-embedding-ada-002模型 ✅ Already implemented in RAGService
  - [x] 实现1536维向量存储 ✅ COMPLETED - Added to Report.memos + validation
  - [x] 参考: `20250624_Update_AI_dataflow.md`中的Vector Store Configuration ✅ Applied

- [x] 实现相似度搜索 ✅ COMPLETED  
  - [x] 配置MongoDB向量索引 ✅ COMPLETED - Added memoEmbeddings index
  - [x] 优化cosine similarity计算 ✅ Already in RAGService
  - [x] 参考: `AIFeedBack_RAG.md`中的Deep Analysis Criteria ✅ Applied

- [x] 上下文增强 ✅ COMPLETED
  - [x] 实现历史报告检索 ✅ Already in RAGService.enhancePromptWithContext
  - [x] 优化提示词生成 ✅ COMPLETED - Updated _preparePrompt in ReportService  
  - [x] 参考: `20250624_NEWRAGFeatureDataFlowBeforeInplementation.md` ✅ Applied

#### 1.2 模型选择策略 ✅ COMPLETED
- [x] 实现动态模型选择 ✅ COMPLETED
  - [x] GPT-4o-mini用于日常分析 ✅ Already implemented in ReportService
  - [x] GPT-o4-mini用于深度分析 ✅ Already implemented based on daysDifference
  - [x] 参考: `20250624_aifeedback_rag_futureFeature.md` ✅ Applied

- [x] 缓存机制优化 ✅ COMPLETED
  - [x] 实现1小时TTL缓存 ✅ Already implemented in ReportService (NodeCache)
  - [x] 配置24小时深度分析缓存 ✅ Configured via TTL settings
  - [x] 参考: `20250624_Update_AIFeedBack.md` ✅ Applied
### Phase 2: 用户交互优化 (2025/07/06-2025/07/15)

#### 2.1 前端组件增强
- [x] 实现可拖拽Popover
  - 集成@dnd-kit/core
  - 实现位置记忆功能
  - 参考: `20250624_Update_AIFeedBack.md`的Draggable Popover Implementation

- [x] 优化时间范围选择
  - 实现动态宽度调整
  - 优化自定义日期范围显示
  - 参考: `20250608_DealWithTimeZone.md`

#### 2.2 反馈系统优化
- [ ] 实现内联编辑
  - 添加编辑按钮
  - 实现实时保存
  - 参考: `20250624_aifeedback_rag_futureFeature.md`

- [ ] RAG对话框
  - 实现深度分析触发器
  - 添加上下文感知讨论
  - 参考: `20250624_NEWRAGFeatureDataFlowBeforeInplementation.md`
### Phase 3: 系统集成与优化 (2025/07/16-2025/07/25)

#### 3.1 数据流优化
- [ ] 实现MongoDB存储优化
  - 配置TTL索引
  - 优化查询性能
  - 参考: `20250624_Update_AI_dataflow.md`

- [ ] API调用优化
  - 实现批量处理
  - 优化响应时间
  - 参考: `20250624_Update_AIFeedBack.md`

#### 3.2 监控与日志
- [ ] 实现性能监控
  - 添加API调用计数
  - 监控响应时间
  - 参考: `AIFeedBack_RAG.md`

- [ ] 错误处理优化
  - 实现优雅降级
  - 添加详细日志
  - 参考: `20250624_Update_AI_dataflow.md`
## 预期成果

### 1. 性能指标
- RAG响应时间 < 3秒
- 缓存命中率 > 80%
- API成本降低50%

### 2. 用户体验
- 更流畅的交互体验
- 更准确的AI反馈
- 更好的时区处理

### 3. 系统稳定性
- 降低错误率
- 提高系统可用性
- 优化资源使用

## 风险管理

### 1. 技术风险
- MongoDB向量搜索性能
- API响应时间
- 缓存策略效果

### 2. 用户体验风险
- 交互复杂度增加
- 学习曲线
- 时区处理问题
## 参考文档
- 数据流设计: `20250624_Update_AI_dataflow.md`
- RAG策略: `AIFeedBack_RAG.md`
- 时区处理: `20250608_DealWithTimeZone.md`
- 前端组件: `20250624_Update_AIFeedBack.md`
- 未来特性: `20250624_aifeedback_rag_futureFeature.md`

## 注意事项
1. 严格遵循时区处理规范
2. 保持代码质量和测试覆盖
3. 定期审查性能指标
4. 收集用户反馈
5. 保持文档更新"}