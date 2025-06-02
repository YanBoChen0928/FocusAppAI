import mongoose from 'mongoose';

/**
 * Report Schema - Defines the structure for AI-generated reports in MongoDB
 *
 * Fields:
 * - goalId: Reference to the goal this report is about
 * - userId: Reference to the user who owns this report
 * - type: Type of report (daily, weekly, monthly)
 * - period: Time period the report covers
 * - content: Main report content
 * - insights: AI-generated insights
 * - recommendations: AI-generated recommendations
 * - createdAt: Timestamp when the report was created
 */
const ReportSchema = new mongoose.Schema(
  {
    goalId: {
      type: mongoose.Schema.Types.ObjectId,
      ref: "Goal",
      required: true,
    },
    userId: {
      type: String,
      // required: true,
    },
    period: {
      startDate: {
        type: Date,
        required: true,
      },
      endDate: {
        type: Date,
        required: true,
      },
    },
    content: {
      type: String,
      required: true,
    },
    insights: [
      {
        type: String,
      },
    ],
    recommendations: [
      {
        type: String,
      },
    ],
    metrics: {
      totalDuration: {
        type: Number,
        default: 0,
      },
      completedCheckpoints: {
        type: Number,
        default: 0,
      },
      totalSessions: {
        type: Number,
        default: 0,
      },
    },
    isGenerated: {
      type: Boolean,
      default: true,
    },
    createdAt: {
      type: Date,
      default: Date.now,
    },
    analysis: {
      type: Object,
      default: {},
    },
    type: {
      type: String,
      enum: ['daily', 'weekly', 'monthly'],
      default: 'daily',
    },
    timeRange: {
      start: Date,
      end: Date,
    },
  },
  {
    collection: "reports",
  }
);

// Create and export the Report model
const Report = mongoose.model("Report", ReportSchema);

export default Report;
