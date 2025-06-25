# AI Feedback RAG Feature Data Flow Documentation

Related Files:
- `server/services/RAGService.js`
- `server/services/ReportService.js`
- `client/src/components/ProgressReport/AIFeedback.jsx`
- `server/models/Report.js`
- `focus-app/docs/20250624aifeedback_rag_futureFeature.md`
- `focus-app/docs/20250624Update_AI_dataflow.md`

## 1. AI Report Generation and Storage Flow

```
┌──────────────┐     1      ┌──────────────┐     2      ┌──────────────┐
│    Goal &    │────────────►              │────────────►              │
│   Progress   │            │ ReportService │            │   OpenAI     │
│    Data      │            │              │            │     API      │
└──────────────┘            └──────────────┘            └──────────────┘
                                   │                           │
                                   │                           │
                                   │                           │
                                   │         3                 ▼
                                   │                    ┌──────────────┐
                                   │                    │  Generated   │
                                   │                    │ AI Analysis  │
                                   │                    └──────────────┘
                                   │                           │
                                   │                           │
                                   ▼           4              ▼
                            ┌──────────────┐          ┌──────────────┐
                            │   Original   │          │   Vector     │
                            │   Content    │──────────►  Embedding   │
                            │  (MongoDB)   │    5     │  (MongoDB)   │
                            └──────────────┘          └──────────────┘
```

Flow Description:
1. System retrieves Goal and Progress data from MongoDB
2. ReportService calls OpenAI API to generate AI analysis report
3. OpenAI returns the generated AI analysis content
4. Store original AI analysis content in MongoDB's content field
5. Simultaneously generate vector using text-embedding-ada-002 model and store in vectorEmbedding field

## 2. RAG Deep Analysis Flow

```
┌──────────────┐     1      ┌──────────────┐     2      ┌──────────────┐
│    User      │────────────►              │────────────►              │
│   Query      │            │ RAGService   │            │   OpenAI     │
│              │            │              │            │ Embeddings   │
└──────────────┘            └──────────────┘            └──────────────┘
                                   │                           │
                                   │         3                 │
                                   ▼                          ▼
                            ┌──────────────┐          ┌──────────────┐
                            │   Vector     │◄─────────┘   Query      │
                            │   Search     │             Embedding   │
                            │  (MongoDB)   │                         │
                            └──────────────┘                         │
                                   │                                 │
                                   │         4                       │
                                   ▼                                 │
                            ┌──────────────┐                        │
                            │  Similar     │                        │
                            │  Reports     │                        │
                            └──────────────┘                        │
                                   │                                │
                                   │         5                      │
                                   ▼                                │
                            ┌──────────────┐            6          │
                            │  Enhanced    │◄───────────────────────┘
                            │   Prompt     │
                            └──────────────┘
                                   │
                                   │         7
                                   ▼
                            ┌──────────────┐
                            │    Final     │
                            │  Response    │
                            └──────────────┘
```

Flow Description:
1. User initiates deep analysis query
2. RAGService calls OpenAI to generate query vector embedding
3. Perform vector search in MongoDB
4. Retrieve similar historical reports
5. Generate enhanced prompt
6. Combine query vector with historical context
7. Generate final deep analysis response

## Data Storage Structure

### MongoDB Report Schema
```javascript
{
  _id: ObjectId,
  goalId: ObjectId,
  content: String,        // Original AI analysis content
  vectorEmbedding: Array, // 1536-dimensional vector
  analysis: {
    totalRecords: Number,
    completedTasks: Number,
    completionRate: Number,
    lastUpdate: Date
  },
  period: {
    startDate: Date,
    endDate: Date
  },
  createdAt: Date
}
```

### Vector Store Configuration
```javascript
{
  name: "reportEmbeddings",
  type: "vectorSearch",
  fields: [{
    numDimensions: 1536,
    path: "embedding",
    similarity: "cosine",
    type: "vector"
  }]
}
```

## Key Timing Points

1. **Vector Generation and Storage Timing**:
   - Occurs immediately after AI report generation
   - Stored simultaneously with original content in MongoDB
   - No need to wait for user to trigger RAG dialogue

2. **Vector Retrieval Timing**:
   - Only performed when user requests RAG deep analysis
   - No vector operations involved during normal report viewing

3. **Data Update Timing**:
   - Vector automatically updated when original content is updated
   - RAG dialogue does not modify stored vectors


## Plan to implement
下面是一個「文字圖＋設計建議」，展示了針對 AI-feedback 中「週記備忘」功能的資料流程與結構：

```
┌───────────────────────────────┐
│           使用者（前端）           │
└───────────────────────────────┘
    │
    │ 1. 輸入備忘（originalMemo）
    │
┌───▼───────────────────────────────┐
│           備忘編輯元件             │
│  • 文本框（originalMemo）        │
│  • 「AI 建議」按鈕                │
│  • 顯示 AI 初稿（aiDraft）       │
│  • 編輯/確認（finalMemo）        │
└───┬───────────────────────────────┘
    │
    │ 2a. 送 originalMemo → API  
    │
    │ 2b. 點「AI 建議」 → /api/memos/:feedbackId/suggest
    │
┌───▼───────────────────────────────┐
│         Backend (Node.js)         │
│  • 存 originalMemo                │
│  • RAGService.enhancePrompt({     │
│      context: AI_feedback.content,│
│      userMemo: originalMemo       │
│    }) → enhancedPrompt            │
│  • 呼叫 OpenAI (gpt-o4-mini)      │
│    得到 aiDraft                   │
│  • 存 aiDraft (+ embedding?)      │
└───┬───────────────────────────────┘
    │
    │ 3. 回傳 aiDraft → 前端顯示
    │
    │ 4. 使用者微調 aiDraft → finalMemo
    │
┌───▼───────────────────────────────┐
│         Backend (Node.js)         │
│  • 存 finalMemo                   │
│  • （可選）產生 finalMemo embedding│
└───┬───────────────────────────────┘
    │
    │ 5. 前端確認完成，備忘歸檔
    │
┌───▼───────────────────────────────┐
│          MongoDB (Reports)        │
│  {
│    _id: …,
│    feedbackId: …,
│    aiFeedback: “…”,               │
│    memos: [                       │
│      {                             │
│        phase: "user",             │
│        content: originalMemo,     │
│        timestamp: …               │
│      },                            │
│      {                             │
│        phase: "aiDraft",          │
│        content: aiDraft,          │
│        embedding: […],            │
│        timestamp: …               │
│      },                            │
│      {                             │
│        phase: "userFinal",        │
│        content: finalMemo,        │
│        timestamp: …               │
│      }                             │
│    ]                              │
│  }
└───────────────────────────────────┘
```

---

## 設計說明

1. **前端元件（ProgressReport/AIFeedback.jsx）**

   * **originalMemo**：普通 `<textarea>`，讓使用者自由輸入本週待辦或感想。
   * **AI 建議按鈕**：觸發 `/api/memos/:feedbackId/suggest`，送出 `{ feedbackId, originalMemo }`。
   * **aiDraft 區**：顯示 RAG 生成的初稿，並允許使用者在此微調。
   * **finalMemo**：使用者確認後，再送一次 PATCH `/api/memos/:feedbackId`，標記為最終備忘。

2. **後端流程（ReportService + RAGService）**

   * **存 originalMemo**：先在 Report document 裡 append 一筆 `{ phase:"user", content, timestamp }`。

   * **生成 aiDraft**：

     1. RAGService 收到原始 AI feedback (`aiFeedback.content`) 和 `originalMemo`。
     2. 建立 enhanced prompt，內容可包含：

        ```
        AI 建議範例：
        ${aiFeedback.content}

        使用者備忘草稿：
        ${originalMemo}

        請根據上述內容，生成一份更完整、可操作的週提醒備忘。
        ```
     3. 呼叫 OpenAI (gpt-o4-mini)，得到 aiDraft。
     4. 存入 `{ phase:"aiDraft", content: aiDraft, embedding: [...], timestamp }`。

   * **存 finalMemo**：使用者完成微調後，再存 `{ phase:"userFinal", content: finalMemo, timestamp }`。
     （可選：對 `finalMemo` 也做 embedding，方便日後檢索或進一步 RAG。）

3. **資料庫結構（MongoDB）**

   * 在原有 `Report` model 裡新增 `memos` 陣列欄位，每筆紀錄標示 `phase`、`content`、`timestamp`，以及（對 aiDraft）`embedding`。
   * 若要拆分專門的 collection，也可另闢 `Memos` collection，並以 `reportId` 或 `feedbackId` 關聯。

4. **搜尋與擴充（RAG）**

   * **舊備忘檢索**：若用 embedding，可以用向量搜尋找出「過去類似週備忘」做二次 RAG，進一步生成更貼近歷史慣例的提醒。
   * **動態提示**：在 prompt 裡加上「過去 X 周最常忘記做的事」或「上次週記的 AI 建議」，提升生成品質。

5. **UI/UX 建議**

   * **時間軸展示**：在備忘區下方，以 timeline 展示三個階段（User→AI→UserFinal）的歷史版本、時間戳，方便比較。
   * **快速接受**：在 aiDraft 區塊邊加「一鍵接受」按鈕，自動把 aiDraft 內容覆蓋到 finalMemo，快速存檔。
   * **手動覆蓋**：保留 textarea 讓使用者隨時改寫，並且自動保存草稿。

---

**這樣的設計**兼顧了

* 使用者主動輸入（originalMemo）
* AI 協助草擬（aiDraft + RAG）
* 最終人工微調（finalMemo）

並且在資料庫裡清楚紀錄每個階段，有利日後追蹤、檢索和二次 RAG 擴充。
