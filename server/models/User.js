import mongoose from "mongoose";
import bcrypt from "bcryptjs";

/**
 * User Schema - Defines the structure for user documents in MongoDB
 *
 * Fields:
 * - email: User's email address (required for registered users)
 * - password: User's password (hashed, required for registered users)
 * - username: User's display name
 * - googleId: Google OAuth ID for users who sign in with Google
 * - tempId: Temporary ID for linking guest data when converting to registered user
 * - createdAt: Timestamp when the user was created
 * - role: User's role in the system (regular, admin, premium)
 * - avatarUrl: URL to user's profile image (can be null)
 */
const UserSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    trim: true,
    lowercase: true,
    unique: true,
  },
  password: {
    type: String,
    required: function () {
      // Password is required only if not using Google login
      return !this.googleId;
    },
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
  tempId: {
    type: String,
    sparse: true,
  },
  avatarUrl: {
    type: String,
    default: null,
  },
  role: {
    type: String,
    enum: ['regular', 'premium', 'admin'],
    default: 'regular'
  },
  createdAt: {
    type: Date,
    default: Date.now,
  },
  lastLogin: {
    type: Date,
    default: Date.now,
  }
});

// Password hash middleware
UserSchema.pre(
  "save",
  async function (next) {
    // Only hash the password if it's modified (or new)
    if (!this.isModified("password")) return next();

    try {
      const salt = await bcrypt.genSalt(10);
      this.password = await bcrypt.hash(this.password, salt);
      next();
    } catch (error) {
      next(error);
    }
  },
  {
    collection: "users",
  }
);

// Method to compare passwords
UserSchema.methods.comparePassword = async function (candidatePassword) {
  return bcrypt.compare(candidatePassword, this.password);
};

// Note: We removed duplicate index definitions to resolve warnings
// The unique: true and sparse: true in the schema fields already create indexes

// Create and export the User model
const User = mongoose.model("User", UserSchema);
export default User;
