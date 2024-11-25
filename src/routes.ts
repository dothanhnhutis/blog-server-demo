import { type Application } from "express";
import healthRouter from "@/routes/health";
import demoRouter from "@/routes/demo";

const BASE_PATH = "/api/v1";

export function appRoutes(app: Application) {
  app.use("", healthRouter);
  app.use("/api/v0.0.1", demoRouter);
}
