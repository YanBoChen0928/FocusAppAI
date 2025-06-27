# 🧭 FAB Positioning and Interaction Plan

## 🎯 目的
優化 Weekly Memo 畫面右下角 FAB 的使用體驗，使主操作按鈕與 Next Week Plan 功能能夠清楚區分並靈活呈現。

---

## ✅ 基本邏輯

| 元件 | 預設位置 | 顯示條件 | 備註 |
|------|------------|------------|------|
| 🎯 主 FAB | 固定在右下角 | 永遠顯示 | Weekly Memo 主功能 |
| 📋 Next Week Plan FAB | 主 FAB 左側 | hasNextWeekPlan 為 true 時顯示 | 動態展開/收縮，位置未來可 DnD 調整 |

---

## ✅ 動態展開邏輯 (Updated Implementation)

### 狀態管理
```jsx
const [expanded, setExpanded] = useState(false);
const [nextWeekContent, setNextWeekContent] = useState('');

// 自動根據內容決定展開狀態
useEffect(() => {
  if (nextWeekContent && nextWeekContent.trim()) {
    setExpanded(true);  // 有內容時自動展開
  } else {
    setExpanded(false); // 無內容時顯示 icon
  }
}, [nextWeekContent]);
```

### 展示邏輯
- **有 Next Week Planning 內容**: 自動展開為圓角文字框，顯示實際內容
- **沒有內容**: 顯示收縮的 📋 icon
- **點擊交互**: 
  - 展開狀態 → 點擊打開 WeeklyMemo 對話框
  - 收縮狀態 → 點擊切換到展開狀態

---

## ✅ 實作建議（React + MUI - Updated）

```jsx
// FAB Container with unified structure
<Box sx={{
  position: 'fixed',
  bottom: 24,
  right: 24,
  zIndex: 1000,
  display: 'flex',
  alignItems: 'center',
  gap: 1
}}>
  {/* Secondary FAB - Dynamic Next Week Plan */}
  {hasNextWeekPlan && (
    <Box sx={{ display: 'flex', alignItems: 'center' }}>
      {expanded ? (
        // Expanded text box
        <Box
          onClick={handleToggleExpanded}
          sx={{
            backgroundColor: 'secondary.main',
            color: 'white',
            borderRadius: '16px',
            padding: '12px 16px',
            maxWidth: '280px',
            cursor: 'pointer',
            boxShadow: '0 4px 12px rgba(0,0,0,0.15)'
          }}
        >
          <Typography variant="body2">
            {nextWeekContent}
          </Typography>
        </Box>
      ) : (
        // Collapsed icon
        <Fab color="secondary" size="small">📋</Fab>
      )}
    </Box>
  )}
  
  {/* Main FAB */}
  <Fab color="primary" onClick={handleMainClick}>🎯</Fab>
</Box>
```

---

## 🎨 設計原則 (Updated)

### 統一的圓角方框
- 兩個 FAB 都使用相同的圓角設計語言 (16px borderRadius)
- 展開的文字框也使用相同的圓角風格

### 層次清晰
- 主 FAB 保持標準大小，副 FAB 稍小 (scale 0.8)
- 展開時文字框與主 FAB 形成視覺連貫性

### 文字简洁
- 展開時顯示 Next Week Planning 的實際內容
- 使用 ellipsis 處理過長文字

### 動畫一致
- 所有元件都有相同的 hover 和 transition 效果
- 展開/收縮有平滑的動畫過渡

### 顏色區分
- 主 FAB 用 primary 色，副 FAB 用 secondary 色
- 展開的文字框使用 secondary 主題色

---

## 🧩 拖曳互動（DnD）構想

未來可使用 `react-draggable` 或 `react-beautiful-dnd` 增加拖曳功能：

- 拖曳後自動更新容器位置
- 使用 `localStorage` 儲存 FAB 的位置偏好
- 初次載入時讀取並呈現相對應位置

---

## 🔧 UX 補充建議

- 為 FAB 加入 `Tooltip` 提示：
  ```jsx
  <Tooltip title="View Next Week Plan">
    <Fab>📋</Fab>
  </Tooltip>
  ```
- 為 FAB 預留適當邊距（避免被畫面邊緣或系統 UI 遮擋）
- 展開的文字框限制最大寬度，避免影響主要內容區域

---

## ✅ 技術實現要點

### 內容獲取
```jsx
const fetchNextWeekContent = async () => {
  const response = await apiService.reports.memos.list(reportId);
  const nextWeekPlan = response.data.data.memos.find(memo => 
    memo.phase === 'nextWeekPlan'
  );
  setNextWeekContent(nextWeekPlan?.content || '');
};
```

### 自動狀態管理
- 根據 `nextWeekContent` 自動決定展開狀態
- 無需手動控制展開/收縮邏輯
- 內容更新時自動響應狀態變化

---

## ✅ 小結
此設計實現了動態的 FAB 系統，能夠根據 Next Week Planning 內容智能展示，兼顧使用者習慣與彈性需求。未來可根據 DnD 實作擴展動態位置調整邏輯，並確保畫面整潔且操作清晰。

