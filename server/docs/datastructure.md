# Focus 數據模型設計

以下是 Focus 應用的核心數據模型設計，包含四個主要集合：users、goals、progress 和 reports。

## 1. 用戶集合 (users)

```javascript
// User.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const UserSchema = new Schema(
  {
    email: {
      type: String,
      required: true,
      unique: true,
      trim: true,
      lowercase: true,
    },
    googleId: {
      type: String,
      sparse: true,
    },
    username: {
      type: String,
      required: true,
      trim: true,
    },
    isGuest: {
      type: Boolean,
      default: false,
    },
    tempId: {
      type: String,
      sparse: true,
    },
    // 添加 goals 數組來存儲用戶的所有目標 ID，便於快速查詢
    goals: [
      {
        type: Schema.Types.ObjectId,
        ref: "Goal",
      },
    ],
    preferences: {
      language: {
        type: String,
        default: "zh-TW",
      },
      timezone: {
        type: String,
        default: "Asia/Taipei",
      },
      notifications: {
        email: {
          type: Boolean,
          default: true,
        },
        web: {
          type: Boolean,
          default: true,
        },
      },
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    lastLogin: {
      type: Date,
      default: Date.now,
    },
  },
  { timestamps: true }
);

// 創建索引
UserSchema.index({ email: 1 }, { unique: true });
UserSchema.index({ googleId: 1 }, { sparse: true });
UserSchema.index({ tempId: 1 }, { sparse: true });

module.exports = mongoose.model("User", UserSchema);
```

## 2. 目標集合 (goals)

```javascript
// Goal.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const GoalSchema = new Schema(
  {
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    title: {
      type: String,
      required: true,
      trim: true,
    },
    description: {
      type: String,
      trim: true,
    },
    priority: {
      type: Number,
      default: 3,
      min: 1,
      max: 3,
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    order: {
      type: Number,
      default: 0,
    },
    targetDate: {
      type: Date,
    },
    // 添加 progress 數組來存儲目標的所有進度記錄 ID
    progress: [
      {
        type: Schema.Types.ObjectId,
        ref: "Progress",
      },
    ],
    // 添加 reports 數組來存儲目標的所有報告 ID
    reports: [
      {
        type: Schema.Types.ObjectId,
        ref: "Report",
      },
    ],
    declaration: {
      content: {
        type: String,
        trim: true,
      },
      vision: {
        type: String,
        trim: true,
      },
      importance: {
        type: String,
        trim: true,
      },
      checkpoints: [
        {
          description: {
            type: String,
            required: true,
          },
          frequency: {
            type: String,
            enum: ["daily", "weekly"],
            default: "daily",
          },
          target: {
            type: String,
          },
        },
      ],
      versions: [
        {
          content: {
            type: String,
          },
          updatedAt: {
            type: Date,
            default: Date.now,
          },
        },
      ],
    },
  },
  { timestamps: true }
);

// 創建索引
GoalSchema.index({ userId: 1 });
GoalSchema.index({ status: 1 });
GoalSchema.index({ userId: 1, status: 1 });

module.exports = mongoose.model("Goal", GoalSchema);
```

## 3. 進度集合 (progress)

```javascript
// Progress.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ProgressSchema = new Schema(
  {
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      required: true,
      default: Date.now,
    },
    records: [
      {
        timestamp: {
          type: Date,
          default: Date.now,
        },
        content: {
          type: String,
          trim: true,
        },
        duration: {
          type: Number,
          min: 0,
        },
        mood: {
          type: String,
          enum: ["great", "good", "neutral", "bad", "terrible"],
          default: "neutral",
        },
        images: [
          {
            type: String,
          },
        ],
      },
    ],
    checkpoints: [
      {
        description: {
          type: String,
          required: true,
        },
        completed: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
      },
    ],
  },
  { timestamps: true }
);

// 創建索引
ProgressSchema.index({ goalId: 1, date: -1 });
ProgressSchema.index({ userId: 1, date: -1 });

module.exports = mongoose.model("Progress", ProgressSchema);
```

## 4. 報告集合 (reports)

```javascript
// Report.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const ReportSchema = new Schema(
  {
    goalId: {
      type: Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    userId: {
      type: Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    type: {
      type: String,
      enum: ["weekly", "monthly", "custom"],
      default: "weekly",
    },
    timeRange: {
      start: {
        type: Date,
        required: true,
      },
      end: {
        type: Date,
        required: true,
      },
    },
    content: {
      summary: {
        type: String,
        trim: true,
      },
      achievements: [
        {
          date: {
            type: Date,
          },
          description: {
            type: String,
          },
          isHighlight: {
            type: Boolean,
            default: false,
          },
        },
      ],
      feedback: {
        challenges: [
          {
            type: String,
          },
        ],
        improvements: [
          {
            type: String,
          },
        ],
        rewards: [
          {
            type: String,
          },
        ],
      },
      nextPeriodPlan: {
        type: String,
        trim: true,
      },
    },
    generatedAt: {
      type: Date,
      default: Date.now,
    },
    pdfUrl: {
      type: String,
    },
  },
  { timestamps: true }
);

// 創建索引
ReportSchema.index({ goalId: 1, generatedAt: -1 });
ReportSchema.index({ userId: 1, type: 1, generatedAt: -1 });

module.exports = mongoose.model("Report", ReportSchema);
```

## 5. 臨時用戶集合 (temp_users)

```javascript
// TempUser.js
const mongoose = require("mongoose");
const Schema = mongoose.Schema;

const TempUserSchema = new Schema({
  tempId: {
    type: String,
    required: true,
    unique: true,
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  expiresAt: {
    type: Date,
    required: true,
    // 默認21天後過期
    default: function () {
      return new Date(Date.now() + 21 * 24 * 60 * 60 * 1000);
    },
  },
  goals: [
    {
      title: {
        type: String,
        required: true,
      },
      description: {
        type: String,
      },
      progress: [
        {
          date: {
            type: Date,
            default: Date.now,
          },
          content: {
            type: String,
          },
        },
      ],
    },
  ],
});

// 創建索引並設置TTL索引使文檔自動過期
TempUserSchema.index({ tempId: 1 }, { unique: true });
TempUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

module.exports = mongoose.model("TempUser", TempUserSchema);
```

## 集合關係圖

```
users (1) ---> (n) goals  (一個用戶可以有多個目標)
users.goals [] <--- goal._id (雙向引用，便於快速查詢)

goals  (1) ---> (n) progress  (一個目標可以有多個進度記錄)
goals.progress [] <--- progress._id (雙向引用，便於快速查詢)

goals  (1) ---> (n) reports  (一個目標可以有多個報告)
goals.reports [] <--- report._id (雙向引用，便於快速查詢)

users  (1) ---> (n) progress  (一個用戶可以有多個進度記錄)
users  (1) ---> (n) reports  (一個用戶可以有多個報告)
```

## 索引策略

以下索引已經在各個 Schema 中定義：

1. **users 集合：**

   - `email`: 確保用戶郵箱唯一性
   - `googleId`: 用於 Google OAuth 登入
   - `tempId`: 用於臨時用戶識別

2. **goals 集合：**

   - `userId`: 快速查找用戶的所有目標
   - `status`: 按狀態篩選目標
   - `userId + status`: 查找用戶特定狀態的目標

3. **progress 集合：**

   - `goalId + date`: 按日期查找目標的進度
   - `userId + date`: 查找用戶在特定日期的所有進度

4. **reports 集合：**

   - `goalId + generatedAt`: 查找目標的報告歷史
   - `userId + type + generatedAt`: 查找用戶的特定類型報告

5. **temp_users 集合：**
   - `tempId`: 臨時用戶 ID
   - `expiresAt`: TTL 索引，自動刪除過期的臨時用戶

## 數據一致性管理

為了維護數據的一致性，在執行 CRUD 操作時需要注意以下幾點：

1. **創建目標時**：同時更新 User.goals 數組

```javascript
// 創建目標同時更新用戶文檔
const newGoal = await Goal.create({
  userId: user._id,
  title: "每天學習英語",
  description: "提高英語聽說讀寫能力",
  // ...其他屬性
});

// 將新目標ID添加到用戶的goals數組中
await User.findByIdAndUpdate(user._id, { $push: { goals: newGoal._id } });
```

2. **創建進度記錄時**：同時更新 Goal.progress 數組

```javascript
// 創建進度記錄
const newProgress = await Progress.create({
  goalId: goal._id,
  userId: user._id,
  date: new Date(),
  // ...其他屬性
});

// 將新進度ID添加到目標的progress數組中
await Goal.findByIdAndUpdate(goal._id, {
  $push: { progress: newProgress._id },
});
```

3. **創建報告時**：同時更新 Goal.reports 數組

```javascript
// 創建報告
const newReport = await Report.create({
  goalId: goal._id,
  userId: user._id,
  type: "weekly",
  // ...其他屬性
});

// 將新報告ID添加到目標的reports數組中
await Goal.findByIdAndUpdate(goal._id, { $push: { reports: newReport._id } });
```

4. **刪除操作時**：需要同步更新引用數組

```javascript
// 刪除目標時，同時從用戶文檔中移除引用
await Goal.findByIdAndDelete(goalId);
await User.findByIdAndUpdate(userId, { $pull: { goals: goalId } });

// 還應考慮級聯刪除相關的進度和報告，或者在應用層面處理這些關係
```

## 使用示例

### 查詢用戶的所有目標

```javascript
// 使用引用數組快速查詢
const user = await User.findById(userId).populate("goals");
const goals = user.goals;

// 或者直接通過 userId 查詢
const goals = await Goal.find({ userId: userId });
```

### 查詢目標的所有進度記錄

```javascript
// 使用引用數組快速查詢
const goal = await Goal.findById(goalId).populate("progress");
const progressRecords = goal.progress;

// 或者直接通過 goalId 查詢
const progressRecords = await Progress.find({ goalId: goalId });
```

### 查詢目標的所有報告

```javascript
// 使用引用數組快速查詢
const goal = await Goal.findById(goalId).populate("reports");
const reports = goal.reports;

// 或者直接通過 goalId 查詢
const reports = await Report.find({ goalId: goalId });
```
