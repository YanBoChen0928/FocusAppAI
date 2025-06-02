// Initiate connection to MongoDB database:
// if server.js is the door to the restaurant, this is the kitchen
import mongoose from "mongoose";

const connectDB = async () => {
  try {
    const conn = await mongoose.connect(process.env.MONGODB_URI);
    console.log(`🔥 MongoDB Connected: ${conn.connection.host}`);
  } catch (error) {
    console.error(`❌ MongoDB Connection Error: ${error.message}`);
    process.exit(1); // when connection failed, exit the application
  }
};

export default connectDB;
