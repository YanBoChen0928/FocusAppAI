import mongoose from "mongoose";
const Schema = mongoose.Schema;

/**
 * TempUser Schema - For storing temporary user data before they register
 * These documents will expire automatically after 14 days
 */
const TempUserSchema = new Schema(
  {
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
      // Default to 14 days after creation
      default: function () {
        return new Date(Date.now() + 14 * 24 * 60 * 60 * 1000);
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
  },
  {
    collection: "temp_users",
  }
);

// Create only necessary index for TTL expiration
// The unique: true in the tempId field already creates an index
TempUserSchema.index({ expiresAt: 1 }, { expireAfterSeconds: 0 });

const TempUser = mongoose.model("TempUser", TempUserSchema);
export default TempUser;
