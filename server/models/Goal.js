import mongoose from "mongoose";

/**
 * Goal Schema - Defines the structure for goal documents in MongoDB
 *
 * Fields:
 * - userId: ID of the user who created this goal (ObjectId or tempId)
 * - title: Title of the goal
 * - description: Detailed description of the goal
 * - priority: Priority level (High, Medium, Low)
 * - status: Current status (active, completed, archived)
 * - motivation: Why the goal is important (moved from details)
 * - targetDate: Target completion date
 * - visionImageUrl: URL to an image related to the goal
 * - resources: Array of resources that can help achieve the goal (optional)
 * - dailyTasks: Array of daily tasks related to the goal (optional)
 * - rewards: Array of rewards for achieving progress or completion (optional)
 * - dailyCards: Array of daily task/reward snapshots
 * - declaration: Goal declaration and vision statement
 * - checkpoints: Array of milestones to track progress
 * - createdAt: Timestamp when the goal was created
 */
const GoalSchema = new mongoose.Schema(
  {
    userId: {
      type: String,  // Use String type to store user ID (ObjectId or tempId)
      required: true,
      index: true  // Normal non-unique index
    },
    title: {
      type: String,
      required: true,
      trim: true,
      maxlength: 100,
    },
    description: {
      type: String,
      required: true,
      maxlength: 500,
    },
    priority: {
      type: String,
      enum: ["High", "Medium", "Low"],
      default: "High",
    },
    status: {
      type: String,
      enum: ["active", "completed", "archived"],
      default: "active",
    },
    motivation: {
      type: String,
      maxlength: 500,
    },
    targetDate: {
      type: Date,
    },
    visionImageUrl: {
      type: String,
      default: null,
    },
    resources: {
      type: [String], // Change to string array
      default: [],
    },
    dailyTasks: {
      type: [String], // Change to string array
      default: [],
    },
    rewards: {
      type: [String], // Change to string array
      default: [],
    },
    dailyCards: [
      {
        date: {
          type: Date,
          default: Date.now,
        },
        dailyTask: {
          type: String,
        },
        dailyReward: {
          type: String,
        },
        completed: {
          dailyTask: {
            type: Boolean,
            default: false,
          },
          dailyReward: {
            type: Boolean,
            default: false,
          },
        },
        taskCompletions: {
          type: Object,
          default: {}
        },
        records: [
          {
            content: {
              type: String,
              required: true,
            },
            createdAt: {
              type: Date,
              default: Date.now,
            }
          }
        ],
        links: [
          {
            url: {
              type: String,
              required: true,
            },
            description: {
              type: String,
              default: "",
            },
          },
        ],
      },
    ],
    declaration: {
      content: {
        type: String,
        default: "",
      },
      updatedAt: {
        type: Date,
        default: Date.now,
      },
    },
    checkpoints: [
      {
        title: {
          type: String,
          required: true,
        },
        description: {
          type: String,
        },
        targetDate: {
          type: Date,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
        isDaily: {
          type: Boolean,
          default: false,
        },
      },
    ],
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "goals",
  }
);

// 确保没有唯一索引限制
// 完全移除userId和title的组合索引，仅保留单独的userId索引
GoalSchema.index({ userId: 1 }, { background: true });
// 明确指定title不是唯一的
GoalSchema.index({ title: 1 }, { unique: false, background: true });
// 显式禁用userId和title的联合唯一索引 
GoalSchema.index({ userId: 1, title: 1 }, { unique: false, dropDups: false, background: true });

// Create and export the Goal model
const Goal = mongoose.model("Goal", GoalSchema);
export default Goal;
