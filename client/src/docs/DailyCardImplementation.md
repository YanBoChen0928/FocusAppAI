# 每日卡片詳情視圖實現方案

## 概述

每日卡片詳情視圖是一個彈出對話框，用戶可以查看和更新特定日期的任務完成情況、獎勵領取狀態以及進度記錄。這個功能增強了用戶管理日常進度的體驗，提供了更詳細的信息和互動選項。

## 組件結構

實現方案涉及以下幾個關鍵組件：

1. **DailyCard** - 顯示卡片基本信息，點擊打開詳情視圖
2. **DailyCardRecord** - 詳情視圖主組件，管理任務、獎勵和記錄
3. **DailyTasks** - 顯示和管理每日任務
4. **DailyReward** - 顯示和管理每日獎勵
5. **WeeklyDailyCards** - 管理一周內的所有卡片

## 功能特點

### 1. 卡片基本信息顯示

- 顯示日期和星期
- 標記今天的卡片（高亮顯示）
- 顯示任務完成狀態指示器
- 顯示記錄數量

### 2. 詳情視圖功能

- 查看和更新每日任務完成狀態
- 查看和更新每日獎勵領取狀態
- 添加、查看和刪除進度記錄
- 查看目標宣言按鈕
- 保存更改按鈕

### 3. 數據管理

- 本地狀態管理與 API 同步
- 錯誤處理和加載狀態
- 通過回調函數更新父組件狀態

## 技術實現

### DailyCard 組件

```jsx
// 顯示卡片基本信息，點擊打開詳情
import { useState } from "react";
import { Box, Typography, Paper, Badge } from "@mui/material";
import AssignmentIcon from "@mui/icons-material/Assignment";
import styles from "./DailyCard.module.css";
import DailyCardRecord from "./DailyCardRecord";

export default function DailyCard({ card, goal, isToday, onUpdate }) {
  const [detailsOpen, setDetailsOpen] = useState(false);

  // 處理卡片點擊，打開詳情視圖
  const handleCardClick = () => {
    setDetailsOpen(true);
  };

  return (
    <>
      <Paper
        className={`${styles.card} ${isToday ? styles.today : ""}`}
        onClick={handleCardClick}
        elevation={isToday ? 3 : 1}
      >
        {/* 日期信息 */}
        <Box className={styles.dateInfo}>
          <Typography variant="caption" className={styles.day}>
            {formatDay(card.date)}
          </Typography>
          <Typography variant="h6" className={styles.date}>
            {formatDate(card.date)}
          </Typography>
          {isToday && (
            <Typography variant="caption" className={styles.todayLabel}>
              Today
            </Typography>
          )}
        </Box>

        {/* 狀態信息 */}
        <Box className={styles.statusInfo}>
          <Badge
            color="success"
            variant={hasCompletedTasks ? "dot" : "standard"}
            invisible={!hasCompletedTasks}
          >
            <AssignmentIcon
              color={hasCompletedTasks ? "primary" : "action"}
              fontSize="small"
            />
          </Badge>
          {hasRecords && (
            <Typography variant="caption" className={styles.recordsCount}>
              {card.records.length}{" "}
              {card.records.length === 1 ? "record" : "records"}
            </Typography>
          )}
        </Box>
      </Paper>

      {/* 詳情視圖對話框 */}
      <DailyCardRecord
        goal={goal}
        date={card.date}
        open={detailsOpen}
        onClose={() => setDetailsOpen(false)}
        onSave={handleSaveCard}
        onDeclarationView={handleViewDeclaration}
      />
    </>
  );
}
```

### DailyCardRecord 組件

```jsx
// 詳情視圖主組件
import React, { useState, useEffect } from "react";
import {
  Dialog,
  DialogTitle,
  // ... 其他導入
} from "@mui/material";

export default function DailyCardRecord({
  goal,
  date,
  open,
  onClose,
  onSave,
  onViewDeclaration,
}) {
  // 卡片數據狀態
  const [cardData, setCardData] = useState({
    date: date,
    dailyTask: "",
    dailyReward: "",
    completed: {
      dailyTask: false,
      dailyReward: false,
    },
    records: [],
  });

  // 加載卡片數據
  useEffect(() => {
    if (!goal || !date) return;

    // 查找現有卡片或創建新卡片
    const existingCard =
      goal.dailyCards && goal.dailyCards.find((card) => card.date === date);

    if (existingCard) {
      setCardData(existingCard);
    } else {
      // 創建新卡片
      setCardData({
        date: date,
        dailyTask: goal.currentSettings?.dailyTask || "",
        dailyReward: goal.currentSettings?.dailyReward || "",
        completed: {
          dailyTask: false,
          dailyReward: false,
        },
        records: [],
      });
    }
  }, [goal, date, open]);

  // 處理任務狀態更改
  const handleTaskStatusChange = (completed) => {
    setCardData((prev) => ({
      ...prev,
      completed: {
        ...prev.completed,
        dailyTask: completed,
      },
    }));
  };

  // 處理獎勵狀態更改
  const handleRewardStatusChange = (claimed) => {
    setCardData((prev) => ({
      ...prev,
      completed: {
        ...prev.completed,
        dailyReward: claimed,
      },
    }));
  };

  // 處理添加記錄
  const handleAddRecord = (e) => {
    if (e.key === "Enter" && newRecord.trim()) {
      setCardData((prev) => ({
        ...prev,
        records: [
          ...prev.records,
          {
            content: newRecord.trim(),
            createdAt: new Date().toISOString(),
          },
        ],
      }));
      setNewRecord("");
    }
  };

  // 保存更改
  const handleSave = async () => {
    try {
      // 保存到API
      const response = await apiService.goals.addOrUpdateDailyCard(
        goalId,
        updatedCard
      );

      // 調用回調函數
      if (onSave) {
        onSave(response.data);
      }
    } catch (error) {
      console.error("Failed to save daily card:", error);
      setError("Failed to save changes. Please try again.");
    } finally {
      setIsSaving(false);
    }
  };

  return (
    <Dialog open={open} onClose={onClose} maxWidth="md" fullWidth>
      {/* 對話框標題 */}
      <DialogTitle>{/* 標題內容 */}</DialogTitle>

      {/* 對話框內容 */}
      <DialogContent>
        {/* 任務區域 */}
        <DailyTasks
          tasks={tasksForComponent}
          onTaskStatusChange={(taskId, completed) =>
            handleTaskStatusChange(completed)
          }
        />

        {/* 獎勵區域 */}
        <DailyReward
          reward={cardData.dailyReward}
          claimed={cardData.completed.dailyReward}
          onClaimedChange={handleRewardStatusChange}
          disabled={!cardData.completed.dailyTask}
        />

        {/* 進度記錄區域 */}
        <Box>
          <Typography variant="h6">Today's Progress:</Typography>

          {/* 進度記錄列表 */}
          {/* 添加新記錄 */}
        </Box>
      </DialogContent>

      {/* 底部按鈕 */}
      <DialogActions>
        <Button variant="contained" onClick={handleSave}>
          Save Changes
        </Button>
      </DialogActions>
    </Dialog>
  );
}
```

## 樣式設計

### DailyCard.module.css

```css
.card {
  display: flex;
  flex-direction: column;
  align-items: center;
  justify-content: space-between;
  padding: 12px;
  height: 100px;
  cursor: pointer;
  transition: all 0.2s ease-in-out;
  border-radius: 8px;
}

.today {
  border: 2px solid #3f51b5;
  background-color: rgba(63, 81, 181, 0.05);
}

.dateInfo {
  display: flex;
  flex-direction: column;
  align-items: center;
  width: 100%;
}

.statusInfo {
  display: flex;
  align-items: center;
  justify-content: center;
  width: 100%;
  margin-top: 8px;
  gap: 8px;
}

/* 響應式樣式 */
@media (max-width: 600px) {
  .card {
    width: 50px;
    height: 75px;
  }
}
```

## 數據流程

1. 用戶點擊每日卡片
2. 打開詳情視圖對話框
3. 加載現有數據或創建新卡片
4. 用戶進行任務/獎勵狀態更改或添加/刪除記錄
5. 用戶點擊保存按鈕
6. 數據保存到 API 並更新本地狀態
7. 更新父組件狀態

## 改進方向

1. 離線支持 - 在網絡不可用時本地保存更改
2. 數據同步 - 在多設備之間同步數據
3. 豐富交互 - 添加動畫和提示
4. 統計分析 - 顯示完成率和趨勢
5. 自定義主題 - 允許用戶自定義卡片外觀

## 實現步驟與工作流程

1. 創建基本組件結構
2. 實現數據模型和 API 服務
3. 設計 UI/UX 和樣式
4. 添加交互功能
5. 測試和優化
6. 部署和監控

這個實現方案提供了一個直觀、易用的用戶界面，用戶可以有效地管理他們的每日任務和進度。

## 實現總結

### 已完成的組件創建和修改

1. **新建組件**:

   - **DailyReward.jsx**: 創建了新組件用於顯示和管理每日獎勵，使用複選框實現獎勵領取狀態的切換。
   - **DailyCardRecord.jsx**: 實現了每日卡片詳情視圖，包含任務管理、獎勵管理和進度記錄功能，使用對話框展示。

2. **修改組件**:

   - **DailyCard.jsx**: 更新了卡片基本顯示，添加點擊事件打開詳情視圖，優化了日期和狀態顯示。
   - **TaskItem.jsx**: 增加回調函數支持，使其能夠與 DailyCardRecord 組件交互。
   - **DailyTasks.jsx**: 添加任務狀態變更回調支持，增強組件復用性。
   - **WeeklyDailyCards.jsx**: 更新以傳遞目標數據給 DailyCard 組件，並改進卡片顯示邏輯。

3. **樣式文件**:

   - **DailyCard.module.css**: 創建卡片樣式，實現響應式設計。
   - **WeeklyDailyCards.module.css**: 更新網格佈局，以改進卡片顯示。

4. **功能優化**:

   - 所有界面文本已由中文更改為英文。
   - 添加了錯誤處理和加載狀態。
   - 實現了數據狀態同步。
   - 優化了移動設備上的顯示效果。

5. **數據流程**:
   - 實現了從卡片點擊到詳情展示再到數據保存的完整流程。
   - 添加了 API 調用以保存和獲取數據。
   - 確保了用戶界面與數據狀態保持同步。

這些修改和新增組件一起構成了一個完整的每日卡片詳情視圖系統，用戶可以輕鬆管理他們的每日任務、獎勵和進度記錄。界面設計保持一致性，操作流程直觀，數據管理可靠。
