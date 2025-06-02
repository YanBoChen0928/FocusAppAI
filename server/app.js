import authRoutes from "./routes/auth.js";
import userRoutes from "./routes/userRoutes.js";
import goalRoutes from "./routes/goals.js";
import progressRoutes from "./routes/progress.js";
import tempUserRoutes from "./routes/tempUserRoutes.js";
import uploadRoutes from "./routes/uploads.js";
import reportsRoutes from "./routes/reports.js";

// Routes
app.use("/api/auth", authRoutes);
app.use("/api/users", userRoutes);
app.use("/api/goals", goalRoutes);
app.use("/api/progress", progressRoutes);
app.use("/api/temp-users", tempUserRoutes);
app.use("/api/uploads", uploadRoutes);
app.use("/api/reports", reportsRoutes); 