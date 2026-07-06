/**
 * API server
 */
import express, {
  type Request,
  type Response,
  type NextFunction,
} from "express";
import cors from "cors";
import dotenv from "dotenv";

import authRoutes from "";
import promptRoutes from "";
import favoriteRoutes from "";
import submissionRoutes from "";
import adminRoutes from "";
import projectRoutes from "";
import userRoutes from "";

dotenv.config();

const app: express.Application = express();

app.use(cors());
app.use(express.json({ limit: "10mb" }));
app.use(express.urlencoded({ extended: true, limit: "10mb" }));

app.use("/api/auth", authRoutes);
app.use("/api/prompts", promptRoutes);
app.use("/api/favorites", favoriteRoutes);
app.use("/api/submissions", submissionRoutes);
app.use("/api/subscriptions", submissionRoutes);
app.use("/api/admin", adminRoutes);
app.use("/api/projects", projectRoutes);
app.use("/api/user", userRoutes);

app.use("/api/health", (_req: Request, res: Response): void => {
  res.status(200).json({ success: true, message: "ok" });
});

// error handler
app.use((error: Error, _req: Request, res: Response, _next: NextFunction) => {
  console.error("[API error]", error);
  res.status(500).json({ success: false, error: "Server internal error" });
});

// 404
app.use((_req: Request, res: Response) => {
  res.status(404).json({ success: false, error: "API not found" });
});

export default app;
