# Focus API 端點設計

以下是 Focus 應用的 API 端點設計，根據功能模塊進行分類。

## 用戶相關 API

### 認證 API

```
POST /api/auth/register            - 註冊新用戶
POST /api/auth/login               - 用戶登入（本地賬戶）
POST /api/auth/google              - Google OAuth登入
GET  /api/auth/logout              - 用戶登出
GET  /api/auth/me                  - 獲取當前用戶信息
POST /api/auth/guest               - 創建訪客賬戶
PUT  /api/auth/convert             - 將訪客賬戶轉換為正式賬戶
```

### 用戶管理 API

```
GET  /api/users/profile            - 獲取用戶個人資料
PUT  /api/users/profile            - 更新用戶個人資料
PUT  /api/users/preferences        - 更新用戶偏好設置
DELETE /api/users/account          - 刪除用戶賬戶
```

## 目標相關 API

### 基本目標 API

```
GET    /api/goals                  - 獲取用戶所有目標
POST   /api/goals                  - 創建新目標
GET    /api/goals/:id              - 獲取特定目標詳情
PUT    /api/goals/:id              - 更新目標信息
DELETE /api/goals/:id              - 刪除目標
PUT    /api/goals/:id/status       - 更新目標狀態（活躍/完成/歸檔）
PUT    /api/goals/:id/priority     - 更新目標優先級
```

### 目標宣言 API

```
GET    /api/goals/:id/declaration   - 獲取目標宣言
PUT    /api/goals/:id/declaration   - 更新目標宣言
GET    /api/goals/:id/declaration/versions - 獲取宣言歷史版本
```

### 檢查點 API

```
GET    /api/goals/:id/checkpoints   - 獲取目標檢查點
POST   /api/goals/:id/checkpoints   - 添加目標檢查點
PUT    /api/goals/:id/checkpoints/:checkpointId - 更新檢查點
DELETE /api/goals/:id/checkpoints/:checkpointId - 刪除檢查點
```

## 進度相關 API

### 進度記錄 API

```
GET    /api/progress?goalId=:goalId&date=:date - 獲取進度記錄
POST   /api/progress                 - 創建新進度記錄
PUT    /api/progress/:id             - 更新進度記錄
DELETE /api/progress/:id             - 刪除進度記錄
```

### 進度記錄詳情 API

```
POST   /api/progress/:id/records     - 添加記錄項
PUT    /api/progress/:id/records/:recordId - 更新記錄項
DELETE /api/progress/:id/records/:recordId - 刪除記錄項
```

### 檢查點完成 API

```
PUT    /api/progress/:id/checkpoints/:checkpointId - 更新檢查點完成狀態
GET    /api/progress/summary?goalId=:goalId&startDate=:startDate&endDate=:endDate - 獲取日期範圍內的進度摘要
```

## 報告相關 API

```
GET    /api/reports?goalId=:goalId   - 獲取目標的所有報告
GET    /api/reports/:id              - 獲取特定報告詳情
POST   /api/reports/generate         - 生成新報告（觸發 AI 生成）
DELETE /api/reports/:id              - 刪除報告
```

## 搜索 API

```
GET    /api/search?q=:query          - 全局搜索（目標、進度、報告）
GET    /api/search/goals?q=:query    - 搜索目標
GET    /api/search/progress?q=:query - 搜索進度記錄
```

## AI 相關 API

```
POST   /api/ai/analyze               - 分析進度數據並提供反饋
POST   /api/ai/suggest               - 獲取目標改進建議
POST   /api/ai/summarize             - 概括一段時間內的進度
```

## 數據匯出 API

```
GET    /api/export/goals/:id          - 導出特定目標數據
GET    /api/export/reports/:id/pdf    - 導出報告為 PDF
GET    /api/export/user-data          - 導出所有用戶數據
```

## API 響應格式

所有 API 響應將遵循以下標準格式：

### 成功響應

```json
{
  "success": true,
  "data": {
    // 響應數據
  },
  "message": "操作成功信息" // 可選
}
```

### 錯誤響應

```json
{
  "success": false,
  "error": {
    "code": "ERROR_CODE",
    "message": "錯誤信息",
    "details": {} // 可選，詳細錯誤信息
  }
}
```

## 分頁格式

支持分頁的 API 將接受以下查詢參數：

- `page`: 頁碼（默認為 1）
- `limit`: 每頁項目數（默認為 10，最大為 100）

分頁響應格式：

```json
{
  "success": true,
  "data": {
    "items": [
      // 項目列表
    ],
    "pagination": {
      "total": 100,       // 總項目數
      "totalPages": 10,   // 總頁數
      "currentPage": 1,   // 當前頁碼
      "limit": 10         // 每頁項目數
    }
  }
}
```

## 篩選和排序

許多列表 API 支持以下查詢參數：

- `sort`: 排序字段，例如 `createdAt:desc`
- `status`: 按狀態篩選，例如 `status=active`
- `startDate` / `endDate`: 按日期範圍篩選

## 迭代 1 必須實現的端點

在迭代 1 中，必須優先實現以下核心端點：

1. `POST /api/auth/register` - 用戶註冊
2. `POST /api/auth/login` - 用戶登入
3. `GET /api/auth/me` - 獲取當前用戶
4. `GET /api/goals` - 獲取用戶目標列表
5. `POST /api/goals` - 創建新目標
6. `GET /api/goals/:id` - 獲取目標詳情
7. `PUT /api/goals/:id` - 更新目標
8. `DELETE /api/goals/:id` - 刪除目標
9. `POST /api/progress` - 創建進度記錄
10. `GET /api/progress?goalId=:goalId` - 獲取目標進度

## 迭代 2 必須實現的端點

在迭代 2 中，應優先實現以下端點：

1. `POST /api/auth/google` - Google OAuth 登入
2. `PUT /api/goals/:id/status` - 更新目標狀態
3. `PUT /api/goals/:id/declaration` - 更新目標宣言
4. `POST /api/goals/:id/checkpoints` - 添加目標檢查點
5. `PUT /api/progress/:id/checkpoints/:checkpointId` - 更新檢查點完成狀態
6. `GET /api/search?q=:query` - 搜索功能
7. `POST /api/ai/analyze` - 基本 AI 分析功能

## 迭代 3 必須實現的端點

在迭代 3 中，應優先實現以下端點：

1. `PUT /api/users/profile` - 更新用戶資料
2. `PUT /api/users/preferences` - 更新用戶偏好
3. `POST /api/reports/generate` - 生成 AI 報告
4. `GET /api/reports/:id` - 獲取報告詳情
5. `GET /api/progress/summary` - 獲取進度摘要
6. `GET /api/export/reports/:id/pdf` - 導出報告為 PDF 