Phase 2.1: 实现3阶段功能 + 完整Schema
✅ Schema: 支持4阶段（为未来做准备）
✅ 功能: 只实现前3阶段的UI和API
✅ 数据: 可以存储nextWeekPlan，但UI暂不显示
Phase 2.2: UI/UX优化
✅ 保持: 3阶段功能不变
✅ 优化: 用户体验提升
Phase 2.3: 激活第4阶段
✅ 新增: Next Week Planning UI和功能
✅ 激活: 已存在的nextWeekPlan支持
✅ 完整: 4阶段工作流


// Phase 2.1 - 后端支持4阶段，前端只显示3阶段
const WeeklyMemo = ({ reportId }) => {
  const [currentPhase, setCurrentPhase] = useState('originalMemo');
  const [memoContent, setMemoContent] = useState({
    originalMemo: '',
    aiDraft: '',
    finalMemo: '',
    // nextWeekPlan: '' // Schema支持，但UI暂不使用
  });
  
  // 只显示前3阶段
  return (
    <div className="weekly-memo-container">
      <OriginalMemoSection />
      <AIDraftSection />
      <FinalMemoSection />
      {/* <NextWeekPlanningSection /> 暂不显示 */}
    </div>
  );
};

// Phase 2.3 - 激活第4阶段UI
const WeeklyMemo = ({ reportId }) => {
  // 相同的Schema，但UI支持4阶段
  const [memoContent, setMemoContent] = useState({
    originalMemo: '',
    aiDraft: '',
    finalMemo: '',
    nextWeekPlan: '' // 现在UI也支持
  });
  
  return (
    <div className="weekly-memo-container">
      <OriginalMemoSection />
      <AIDraftSection />
      <FinalMemoSection />
      <NextWeekPlanningSection /> {/* Phase 2.3 激活 */}
    </div>
  );
};