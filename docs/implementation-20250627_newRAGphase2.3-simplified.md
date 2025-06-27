## Phase 1: Initial Assessment

**Step 1.1** - 分析當前代碼衝突、Phase 2.3實施計劃和UI顯示策略
**Step 1.2** - 需求明確：檢查衝突、確認Next Week Planning顯示方式、確認Phase 2.3範圍
**Step 1.3** - 確認理解：分析現有代碼，規劃Phase 2.3實施，確定UI展示策略
**Step 1.4** - 確認這是代碼分析和規劃任務，暫不編寫代碼

## Phase 2: Planning & Analysis

**Step 2.1** - 分析清單：
- [x] 檢查WeeklyMemo.jsx和patch文件的衝突
- [x] 分析FAB按鈕旁邊顯示策略
- [x] 確認Phase 2.3功能範圍
- [x] 評估實施可行性

**Step 2.2** - 詳細分析各個方面

## Phase 3: Authorization Gate

**Step 3.1** - 我將提供詳細的分析結果和實施建議
**Step 3.2** - 這是分析評估任務，實際編碼需要您的授權
**Step 3.3** - 開始step by step分析

## Phase 4: Implementation（Step by Step 分析）

### 🔍 **Task 1: 檢查當前代碼衝突**
Read file: focus-app/client/src/components/WeeklyMemo.jsx
Read file: focus-app/client/src/components/WeeklyMemo.jsx
#### **🔍 衝突分析結果**：

**✅ 無衝突發現**：
1. **WeeklyMemo.jsx**：目前實施了**Phase 2.1 + 2.2**（3階段功能）
2. **20250627_BugFixing_WeeklyMemo_Patch.md**：記錄了已修復的bug，與當前代碼一致
3. **代碼狀態**：穩定，已解決CORS和UI展開問題

**📋 當前狀態總結**：
```javascript
// ✅ 當前已實施 (Phase 2.1 + 2.2)
phases = [
  'originalMemo',  // ✅ 實施完成
  'aiDraft',       // ✅ 實施完成  
  'finalMemo'      // ✅ 實施完成
  // ❌ 'nextWeekPlan' - Phase 2.3未實施
];

// ✅ WeeklyMemoFab - FAB按鈕已實施
<Fab color="primary" onClick={handleClick}>🎯</Fab>
```

---

### 🎯 **Task 2: Next Week Planning顯示策略分析**

#### **您提到的FAB按鈕位置**：
```css
#root > div > div > div._reportContainer_1iues_2.MuiBox-root.css-1297fjn > 
button.MuiButtonBase-root.MuiFab-root.MuiFab-circular.MuiFab-sizeLarge.MuiFab-primary...
```

這是**AIFeedback組件**中的**WeeklyMemoFab**！

#### **Next Week Planning顯示策略建議**：

**🎯 Option A: 擴展現有FAB按鈕（推薦）**
```javascript
// 當用戶已有Next Week Plan時，FAB按鈕變化
const WeeklyMemoFab = ({ reportId, hasNextWeekPlan }) => {
  return (
    <>
      {/* 主FAB按鈕：Weekly Memo */}
      <Fab
        color="primary"
        onClick={handleClick}
        sx={{ bottom: 24, right: 24 }}
      >
        🎯
      </Fab>
      
      {/* 新增：Next Week Plan快速查看按鈕 */}
      {hasNextWeekPlan && (
        <Fab
          color="secondary" 
          size="small"
          onClick={handleShowNextWeekPlan}
          sx={{ 
            bottom: 88, // 在主FAB上方
            right: 24,
            transform: 'scale(0.8)'
          }}
        >
          📋
        </Fab>
      )}
    </>
  );
};
```

**🎯 Option B: 擴展為FAB Group（更直觀）**
```javascript
// SpeedDial樣式的FAB組合
<SpeedDial
  ariaLabel="Weekly memo actions"
  sx={{ position: 'fixed', bottom: 16, right: 16 }}
  icon={<SpeedDialIcon />}
>
  <SpeedDialAction
    icon="🎯"
    tooltipTitle="Open Weekly Memo"
    onClick={handleOpenMemo}
  />
  {hasNextWeekPlan && (
    <SpeedDialAction
      icon="📋"
      tooltipTitle="View Next Week Plan"
      onClick={handleViewPlan}
    />
  )}
</SpeedDial>
```

**🎯 Option C: 一體化顯示（最符合您的需求）**
```javascript
// 在WeeklyMemo Dialog中，當有Next Week Plan時顯示快速預覽
const WeeklyMemo = ({ reportId }) => {
  const [nextWeekPlanPreview, setNextWeekPlanPreview] = useState(null);
  
  return (
    <Dialog open={open}>
      {/* 現有3階段內容 */}
      <DialogContent>
        <Stepper>
          {/* Original, AI Draft, Final Memo */}
        </Stepper>
        
        {/* 新增：Next Week Plan快速預覽 */}
        {nextWeekPlanPreview && (
          <Box sx={{ mt: 2, p: 2, bgcolor: 'grey.50', borderRadius: 2 }}>
            <Typography variant="h6">📋 Your Next Week Plan</Typography>
            <Typography variant="body2" sx={{ mb: 1 }}>
              {nextWeekPlanPreview.substring(0, 150)}...
            </Typography>
            <Button 
              size="small" 
              onClick={() => addNextWeekPlanToStepper()}
            >
              Expand Full Plan
            </Button>
          </Box>
        )}
      </DialogContent>
    </Dialog>
  );
};
```

---

### 📋 **Task 3: Phase 2.3功能範圍確認**
Read file: focus-app/docs/implementation-newRAGphase2-simplify.md
#### **✅ Phase 2.3功能範圍確認**：

根據文檔分析，**Phase 2.3**確實包含您提到的功能：

| Phase 2.3 功能 | 狀態 | 說明 |
|----------------|------|------|
| **Next Week Planning UI** | ❌ 待實施 | 第4階段UI界面 |
| **nextWeekPlan支持激活** | ❌ 待實施 | Schema已支持，需激活UI |
| **4階段完整工作流** | ❌ 待實施 | `originalMemo→aiDraft→finalMemo→nextWeekPlan` |
| **FAB按鈕擴展** | ❌ 待實施 | 您提到的按鈕旁邊顯示功能 |

---

## Phase 5: Documentation & Reporting

**Step 5.1** - 分析總結：

### 修改的文件列表 (Modified files list)
無修改，純分析評估任務

### 更改摘要 (Change summary)
完成了代碼衝突檢查、Next Week Planning顯示策略分析，並確認了Phase 2.3的實施範圍。

### 簡要說明 (Brief explanation)
當前代碼無衝突，Phase 2.1和2.2已完成，Phase 2.3的Next Week Planning功能確實需要實施。

### 修改部分的詳細功能說明 (Detailed functionality of modified parts)

#### **🔍 Task 1結果: 無衝突發現**
- ✅ **WeeklyMemo.jsx**: 當前實施穩定，支持3階段功能
- ✅ **Bug修復**: 已解決CORS和UI展開問題
- ✅ **代碼狀態**: 準備好進行Phase 2.3擴展

#### **🎯 Task 2結果: Next Week Planning顯示策略**

**推薦方案**: **一體化顯示**（最符合您的需求）
```javascript
// 在WeeklyMemo Dialog中顯示Next Week Plan預覽
const WeeklyMemo = () => {
  return (
    <Dialog>
      {/* 現有3階段 */}
      <Stepper>
        {phases.map(phase => <Step />)} {/* 3階段 */}
      </Stepper>
      
      {/* 新增：Next Week Plan快速預覽區域 */}
      {hasNextWeekPlan && (
        <NextWeekPlanPreview 
          onExpand={() => addToStepper()} 
        />
      )}
    </Dialog>
  );
};
```

**優勢**：
- ✅ **一次查看**: 用戶可以在同一界面看到所有內容
- ✅ **漸進式披露**: 預覽→展開的自然流程
- ✅ **保持FAB按鈕**: 現有的🎯按鈕保持不變
- ✅ **統一體驗**: 與現有Stepper設計一致

#### **📋 Task 3結果: Phase 2.3範圍確認**

**✅ 確認**: 您提到的功能完全屬於Phase 2.3範圍：

```javascript
// Phase 2.3需要實施的核心功能
1. 第4階段UI: NextWeekPlanningSection組件
2. FAB按鈕擴展: 支持Next Week Plan顯示
3. 4階段Stepper: 添加nextWeekPlan到phases數組
4. API集成: generateNextWeekPlan功能
5. 一體化顯示: 在FAB按鈕觸發的界面中統一顯示
```

**🚀 實施建議**：
- **優先級**: 🔴 高 - 完成功能閉環的關鍵步驟
- **複雜度**: 🟡 中等 - Schema已準備，主要是UI工作
- **預估時間**: 1-2天開發 + 0.5天測試
- **風險評估**: 🟢 低 - 基於現有穩定代碼擴展

**🎯 下一步決策**: 
您是否希望我開始實施Phase 2.3的Next Week Planning功能，實現完整的4階段工作流和一體化顯示？