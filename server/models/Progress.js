import mongoose from "mongoose";

/**
 * Progress Schema - Defines the structure for progress tracking in MongoDB
 *
 * Fields:
 * - goalId: Reference to the goal this progress is for
 * - userId: Reference to the user who created this progress
 * - date: Date of the progress record
 * - records: Array of progress entries for the day
 * - checkpoints: Checkpoint status updates
 * - createdAt: Timestamp when the progress was recorded
 */
const ProgressSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    userId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "User",
      required: true,
    },
    date: {
      type: Date,
      default: Date.now,
      required: true,
    },
    records: [
      {
        activity: {
          type: String,
          required: true,
        },
        duration: {
          type: Number, // in minutes
          default: 0,
        },
        notes: {
          type: String,
          default: "",
        },
        images: [
          {
            url: String,
            caption: String,
          },
        ],
        createdAt: {
          type: Date,
          default: Date.now,
        },
      },
    ],
    checkpoints: [
      {
        checkpointId: {
          type: mongoose.Schema.Types.ObjectId,
          required: true,
        },
        title: {
          type: String,
        },
        isCompleted: {
          type: Boolean,
          default: false,
        },
        completedAt: {
          type: Date,
        },
      },
    ],
    summary: {
      type: String,
    },
    totalDuration: {
      type: Number,
      default: 0,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
  },
  {
    collection: "progresses",
  }
);

// Comment out this index to avoid creating the same index in the goals collection
// ProgressSchema.index({ userId: 1, goalId: 1, date: 1 }, { unique: true });

// Create and export the Progress model
const Progress = mongoose.model("Progress", ProgressSchema);
export default Progress;
