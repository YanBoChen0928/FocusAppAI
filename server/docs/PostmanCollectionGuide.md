# Postman Collection Guide for Focus App API

## User Models in Focus App

本应用有两种用户存储系统：

1. **User 模型** (users 集合)

   - 只包含正式註冊用戶
   - 正式註冊用戶：有 email/password 或 googleID，
   - 存儲在 users 集合
   - 可以創建最多 4 個目標(預設 3 個)：bonus 1
   - 正式用戶可以長期使用所有功能
   - 支持不同角色：'regular'（默認）, 'premium', 'admin'
   - 帳號密碼如果用 google API 認證就是需要一個轉換儲存的問題（這部分可能要用到 google 的 api)

2. **TempUser 模型** (temp_users 集合)
   - 完全獨立的臨時數據存儲
   - 只能創建一個目標
   - 21 天後自動過期
   - 用於前期體驗，可以轉換為正式用戶
   - 考慮使用 tempId 標識，目前只有可能前期體驗轉換成正式用戶需要（下面有 link temp user)

## API 端點詳細說明

### 1. User Management

#### Register User (註冊用戶)

- **端點**: `POST /api/auth/register`
- **目的**: 創建一個新的正式用戶賬戶
- **參數**:
  - username: 用戶名
  - email: 電子郵件（唯一）
  - password: 密碼（將被加密存儲）
  - tempId: (可選) 如要關聯 TempUser 數據
- **使用場景**: 創建新賬戶或從 TempUser 轉換為正式賬戶

#### Login User (用戶登錄) (ok)

- **端點**: `POST /api/auth/login`
- **目的**: 用戶登錄並獲取 JWT 認證令牌
- **參數**:
  - email: 電子郵件
  - password: 密碼
- **使用場景**: 已註冊用戶登錄系統

#### Get User Info (獲取用戶信息)

- **端點**: `GET /api/auth/me/:userId`
- **目的**: 獲取指定用戶的詳細信息
- **參數**:
  - userId: 用戶 ID（URL 參數）
- **使用場景**: 獲取已登錄或訪客用戶的信息

<!-- #### Link Temp User (關聯臨時用戶) consider to delete this coz the tempID can be dealt in register user

- **端點**: `POST /api/auth/link-temp`
- **目的**: 將臨時用戶(TempUser)數據關聯到正式用戶賬戶
- **參數**:
  - tempId: 臨時用戶 ID
  - userId: 正式用戶 ID
- **使用場景**: 當臨時用戶註冊正式賬戶時，保留其之前的數據 -->

### 2. TempUser API

#### Create Temp User (創建臨時用戶) (OK)

- **端點**: `POST /api/temp-users`
- **目的**: 創建一個新的臨時用戶記錄（存儲在 temp_users 集合）當點選 enter as Guest 時就創建。
- **參數**:
  - tempId: 臨時用戶唯一標識（可選，如不提供則自動生成）
- **使用場景**: 為首次使用應用的用戶提供 21 天，限制最多一個目標的體驗。

#### Get Temp User (獲取臨時用戶) (OK)

- **端點**: `GET /api/temp-users/:tempId`
- **目的**: 獲取指定臨時用戶的信息
- **參數**:
  - tempId: 臨時用戶 ID（URL 參數）
- **使用場景**: 查詢臨時用戶的基本信息和目標

#### Add Goal to Temp User (為臨時用戶添加目標) (OK)

- **端點**: `POST /api/temp-users/:tempId/goals`
- **目的**: 為臨時用戶創建一個目標（限一個）
- **參數**:
  - tempId: 臨時用戶 ID（URL 參數）
  - title: 目標標題
  - description: 目標描述
- **使用場景**: 臨時用戶希望設置一個簡單目標進行追蹤

### 3. User Profile Management

#### Get User Profile (獲取用戶個人資料)

- **端點**: `GET /api/users/profile`
- **目的**: 獲取登錄用戶的個人資料信息
- **使用場景**: 查看和管理用戶個人資料頁面

#### Update User Profile (更新用戶個人資料)

- **端點**: `PUT /api/users/profile`
- **目的**: 更新用戶的基本資料信息
- **參數**:
  - username: 新的用戶名（可選）
  - email: 新的電子郵件（可選）
- **使用場景**: 用戶修改其個人資料信息

#### Change Password (更改密碼)

- **端點**: `PUT /api/users/password`
- **目的**: 更改用戶登錄密碼
- **參數**:
  - currentPassword: 當前密碼
  - newPassword: 新密碼
- **使用場景**: 用戶需要更改其登錄密碼

#### Delete Account (刪除賬戶)

- **端點**: `DELETE /api/users/account`
- **目的**: 永久刪除用戶賬戶及相關數據
- **使用場景**: 用戶希望完全刪除其賬戶

### 4. Goal Management

#### Create Goal (創建目標) (OK)

- **端點**: `POST /api/goals`
- **目的**: 為用戶創建一個新目標
- **參數**:
  - userId: 用戶 ID
  - title: 目標標題
  - description: 目標描述
  - priority: 優先級（可選）
  - deadline: 截止日期（可選）
- **使用場景**: 用戶希望創建一個新的目標進行追蹤

#### Get User Goals (獲取ㄋ用戶目標) (OK)

- **端點**: `GET /api/goals/user/:userId`
- **目的**: 獲取指定用戶的所有目標
- **參數**:
  - userId: 用戶 ID（URL 參數）
- **使用場景**: 查看用戶創建的所有目標列表

#### Get Goal Details (獲取目標詳情)(suggest skip detail)

- **端點**: `GET /api/goals/detail/:id`
- **目的**: 獲取特定目標的詳細信息
- **參數**:
  - id: 目標 ID（URL 參數）
- **使用場景**: 查看單個目標的完整信息

#### Update Goal (更新目標)

- **端點**: `PUT /api/goals/:id`
- **目的**: 更新現有目標的基本信息
- **參數**:
  - id: 目標 ID（URL 參數）
  - title: 新目標標題（可選）
  - description: 新目標描述（可選）
  - priority: 新優先級（可選）
- **使用場景**: 修改目標的基本信息

#### Update Goal Status (更新目標狀態)

- **端點**: `PUT /api/goals/:id/status`
- **目的**: 更新目標的狀態（如進行中、已完成）
- **參數**:
  - id: 目標 ID（URL 參數）
  - status: 新狀態值
- **使用場景**: 標記目標的完成狀態

#### Add Goal Checkpoint (添加目標檢查點)

- **端點**: `POST /api/goals/:id/checkpoints`
- **目的**: 為目標添加一個里程碑或檢查點
- **參數**:
  - id: 目標 ID（URL 參數）
  - title: 檢查點標題
  - description: 檢查點描述（可選）
  - targetDate: 目標完成日期（可選）
- **使用場景**: 將目標分解為可管理的小步驟

#### Update Goal Declaration (更新目標宣言)

- **端點**: `PUT /api/goals/:id/declaration`
- **目的**: 更新目標的宣言或願景聲明
- **參數**:
  - id: 目標 ID（URL 參數）
  - content: 宣言內容
  - vision: 願景描述（可選）
- **使用場景**: 幫助用戶明確目標的意義和動機

#### Delete Goal (刪除目標)

- **端點**: `DELETE /api/goals/:id`
- **目的**: 永久刪除一個目標
- **參數**:
  - id: 目標 ID（URL 參數）
- **使用場景**: 用戶需要移除不再需要的目標

### 5. Progress Tracking

#### Create Progress Record (創建進度記錄)

- **端點**: `POST /api/progress`
- **目的**: 創建一條新的目標進度記錄
- **參數**:
  - goalId: 目標 ID
  - userId: 用戶 ID
  - records: 進度記錄數組（包含 content, duration, mood 等）
- **使用場景**: 記錄用戶在目標上的進展

#### Get Goal Progress (獲取目標進度)

- **端點**: `GET /api/progress?goalId=X`
- **目的**: 獲取特定目標的所有進度記錄
- **參數**:
  - goalId: 目標 ID（查詢參數）
- **使用場景**: 查看目標的所有歷史進度記錄

#### Update Progress Record (更新進度記錄)

- **端點**: `PUT /api/progress/:id`
- **目的**: 更新現有的進度記錄
- **參數**:
  - id: 進度記錄 ID（URL 參數）
  - records: 更新的記錄數組（可選）
  - summary: 進度總結（可選）
- **使用場景**: 修改之前創建的進度記錄

#### Add Record Item (添加記錄項)

- **端點**: `POST /api/progress/:id/records`
- **目的**: 向現有進度記錄添加新項目
- **參數**:
  - id: 進度記錄 ID（URL 參數）
  - content: 記錄內容
  - duration: 持續時間（分鐘）
  - mood: 情緒狀態（可選）
- **使用場景**: 在不創建新進度記錄的情況下添加記錄

#### Update Checkpoint Status (更新檢查點狀態)

- **端點**: `PUT /api/progress/:id/checkpoints/:checkpointId`
- **目的**: 更新檢查點的完成狀態
- **參數**:
  - id: 進度記錄 ID（URL 參數）
  - checkpointId: 檢查點 ID（URL 參數）
  - isCompleted: 完成狀態（布爾值）
- **使用場景**: 標記目標檢查點的完成情況

#### Get Progress Summary (獲取進度摘要)

- **端點**: `GET /api/progress/summary`
- **目的**: 獲取特定時間段內的目標進度摘要
- **參數**:
  - goalId: 目標 ID（查詢參數）
  - startDate: 開始日期（查詢參數）
  - endDate: 結束日期（查詢參數）
- **使用場景**: 查看目標進度的統計和趨勢分析

### 6. Report Management

#### Generate Report (生成報告)

- **端點**: `POST /api/reports/generate`
- **目的**: 根據進度記錄生成目標報告
- **參數**:
  - goalId: 目標 ID
  - userId: 用戶 ID
  - type: 報告類型（如 weekly, monthly）
  - period: 報告時間段（包含 startDate 和 endDate）
- **使用場景**: 創建目標進度的總結報告

#### Get Reports for Goal (獲取目標報告)

- **端點**: `GET /api/reports?goalId=X`
- **目的**: 獲取特定目標的所有報告
- **參數**:
  - goalId: 目標 ID（查詢參數）
- **使用場景**: 查看目標的歷史報告

#### Get Report Details (獲取報告詳情)

- **端點**: `GET /api/reports/:id`
- **目的**: 獲取特定報告的詳細內容
- **參數**:
  - id: 報告 ID（URL 參數）
- **使用場景**: 查看單個報告的完整信息

#### Update Report Content (更新報告內容)

- **端點**: `PUT /api/reports/:id`
- **目的**: 更新現有報告的內容
- **參數**:
  - id: 報告 ID（URL 參數）
  - content: 報告內容
  - insights: 洞察數組（可選）
  - recommendations: 建議數組（可選）
- **使用場景**: 修改或豐富自動生成的報告

#### Delete Report (刪除報告)

- **端點**: `DELETE /api/reports/:id`
- **目的**: 永久刪除一個報告
- **參數**:
  - id: 報告 ID（URL 參數）
- **使用場景**: 移除不再需要的報告

#### Export Report as PDF (導出報告為 PDF)

- **端點**: `GET /api/export/reports/:id/pdf`
- **目的**: 將報告導出為 PDF 格式
- **參數**:
  - id: 報告 ID（URL 參數）
- **使用場景**: 以可打印格式保存或分享報告

## User 與 TempUser 的區別與轉換

### 關鍵區別

- **User (所有透過帳號密碼註冊/或者 googelAPI 認證的用戶）**:

  - 存儲在 users 集合
  - 可以創建最多 4 個目標(預設 3 個)：bonus 1
  - 正式用戶可以長期使用所有功能
  - 支持用戶角色管理：'regular'（默認）, 'premium', 'admin'
  - 帳號密碼如果用 google API 認證就是需要一個轉換儲存的問題（這部分可能要用到 google 的 api)

- **TempUser**:
  - 存儲在 temp_users 集合
  - 只能創建一個目標
  - 21 天後自動刪除
  - 沒有角色區分，按基本限制運行

### 數據轉換流程

1. TempUser 用戶決定註冊時，先創建正式 User
2. 使用 link-temp API 關聯 TempUser 和新創建的 User
3. 系統遷移 TempUser 的目標數據到 User
4. TempUser 數據最終被系統自動刪除

#### 數據轉換示例代碼

1. **整合到註冊流程中**

   - 在 `POST /api/auth/register` 端點中已經包含了可選的 `tempId` 參數
   - 當用戶註冊時，後端可直接檢查是否提供了 `tempId`，如果有，就自動處理數據轉移

2. **簡化用戶體驗**

   - 用戶不需要在註冊後再執行一個單獨的「關聯」操作
   - 整個流程對用戶來說更流暢，減少了操作步驟

3. **前端實現**
   - 前端可以在臨時用戶使用期間將其 `tempId` 存儲在 localStorage 或 cookie 中
   - 當用戶決定註冊時，自動從本地存儲中獲取 `tempId` 並包含在註冊請求中

### 建議的實現方式

```javascript
// 註冊端點已足夠處理數據轉移
POST /api/auth/register
{
  username: "用戶名",
  email: "郵箱",
  password: "密碼",
  tempId: "temp_12345" // 從本地存儲中獲取，如果存在的話
}
```

後端處理邏輯：

1. 創建新用戶
2. 檢查是否提供了 `tempId`
3. 如果有，查找對應的臨時用戶數據
4. 將臨時用戶的數據轉移到新創建的用戶
5. 刪除或標記臨時用戶數據為已轉移

這樣的設計更簡潔，減少了 API 端點數量，並簡化了整個用戶體驗流程。除非您有特殊需求（如在用戶註冊後的某個時間點才需要關聯臨時數據），否則單獨的 `link-temp` 端點可能是多餘的。

## 應用安全測試指南

為了驗證應用程序的安全性，請執行以下測試：

### 1. API 認證測試

**目的**：確保受保護的路由只能由經過驗證的用戶訪問。

**步驟**：
1. 使用 Postman 在未登錄狀態下訪問受保護路由（如 `/api/progress` 或 `/api/users/profile`）
2. 確認收到 401 未認證錯誤響應
3. 使用臨時用戶或註冊用戶登錄後再次嘗試訪問同一路由
4. 確認成功訪問並接收到預期的數據

**驗證**：
- 未登錄時返回 401 狀態碼
- 登錄後返回 200 狀態碼和請求的數據

### 2. 資源所有權測試

**目的**：確保用戶只能訪問和修改屬於自己的資源。

**步驟**：
1. 創建兩個不同的用戶（可以是臨時用戶或註冊用戶）
2. 讓用戶 A 創建目標或進度記錄
3. 使用用戶 B 的認證嘗試訪問或修改用戶 A 的資源
4. 確認收到 403 拒絕訪問錯誤

**驗證**：
- 用戶嘗試訪問不屬於自己的資源時返回 403 狀態碼
- 錯誤消息明確表明權限被拒絕

### 3. 頻率限制測試

**目的**：確保 API 受到保護，防止濫用和拒絕服務攻擊。

**步驟**：
1. 短時間內多次重複同一請求（例如登錄嘗試或臨時用戶創建）
2. 繼續發送請求直到超過配置的限制
3. 觀察響應頭和錯誤消息

**驗證**：
- 超過限制後返回 429 狀態碼（請求過多）
- 響應頭中包含 `X-RateLimit-Limit`，`X-RateLimit-Remaining` 和 `X-RateLimit-Reset` 信息
- 錯誤消息提供何時可以再次嘗試的信息

### 4. 錯誤處理測試

**目的**：確保應用以一致和安全的方式處理錯誤。

**步驟**：
1. 發送缺少必要字段的請求（例如沒有密碼的註冊請求）
2. 發送格式不正確的數據（例如無效的日期格式）
3. 嘗試訪問不存在的路由（如 `/api/non-existent-route`）

**驗證**：
- 缺少字段或格式錯誤時返回 400 狀態碼
- 路由不存在時返回 404 狀態碼
- 錯誤響應使用標準格式：
  ```json
  {
    "success": false,
    "error": {
      "message": "具體錯誤信息"
    }
  }
  ```

## 使用說明

1. 對於一般用例，首先測試正式用戶註冊和臨時用戶功能
2. 使用 TempUser API 進行測試，特別是用戶從臨時到正式的轉換流程
3. 按照集合中的順序測試，先創建用戶，再創建目標
4. 使用變量存儲返回的 ID，以便後續請求使用
5. 完成基本功能測試後，執行安全測試章節中的測試用例
