import express from "express";
import cors from "cors";
import dotenv from "dotenv";
import apiRouter from "./routes";

// Load environment variables from .env file
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;

// Enable CORS (Cross-Origin Resource Sharing) so our React app can call this API
app.use(cors());

// Express middleware to parse incoming JSON payloads
app.use(express.json());

// Register all API routes under /api
app.use("/api", apiRouter);

// Basic health check route
app.get("/api/health", (req, res) => {
  res.json({
    status: "healthy",
    timestamp: new Date().toISOString(),
    message: "AI Realty Backend API is running smoothly!"
  });
});

// Start listening for HTTP requests
app.listen(PORT, () => {
  console.log(`[server] Server is running at http://localhost:${PORT}`);
  console.log(`[server] Health check: http://localhost:${PORT}/api/health`);
});
