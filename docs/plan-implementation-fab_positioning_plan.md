# 🧭 FAB Positioning and Interaction Plan

## 🎯 目的
優化 Weekly Memo 畫面右下角 FAB 的使用體驗，使主操作按鈕與 Next Week Plan 功能能夠清楚區分並靈活呈現。

---

## ✅ 基本邏輯

| 元件 | 預設位置 | 顯示條件 | 備註 |
|------|------------|------------|------|
| 🎯 主 FAB | 固定在右下角 | 永遠顯示 | Weekly Memo 主功能 |
| 📋 Next Week Plan FAB | 主 FAB 左側 | hasNextWeekPlan 為 true 時顯示 | 位置未來可 DnD 調整 |

---

## ✅ 初步實作建議（React + MUI）

```jsx
const [planFabPosition, setPlanFabPosition] = useState("left");

<>
  {/* 🎯 主 FAB */}
  <Fab
    color="primary"
    sx={{ position: "fixed", bottom: 24, right: 24 }}
    onClick={handleMainClick}
  >
    🎯
  </Fab>

  {/* 📋 副 FAB：有計畫時顯示 */}
  {hasNextWeekPlan && (
    <Fab
      color="secondary"
      size="small"
      sx={{
        position: "fixed",
        bottom: 24,
        ...(planFabPosition === "left"
          ? { right: 88 }
          : { right: -40 })
      }}
      onClick={handleNextWeekClick}
    >
      📋
    </Fab>
  )}
</>
```

---

## 🧩 拖曳互動（DnD）構想

未來可使用 `react-draggable` 或 `react-beautiful-dnd` 增加拖曳功能：

- 拖曳後自動更新 `planFabPosition` 狀態
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
  ```js
  marginRight: 16px
  ```

---

## ✅ 小結
此設計兼顧使用者習慣與彈性需求，未來可根據 DnD 實作擴展動態位置調整邏輯，並確保畫面整潔且操作清晰。

