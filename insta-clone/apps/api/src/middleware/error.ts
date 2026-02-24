import { NextFunction, Request, Response } from "express";
import { HttpError } from "../utils/http";

export function notFound(_req: Request, _res: Response, next: NextFunction) {
  next(new HttpError(404, "Route not found"));
}

export function errorHandler(error: unknown, _req: Request, res: Response, _next: NextFunction) {
  if (error instanceof HttpError) {
    return res.status(error.status).json({ error: error.message });
  }

  console.error(error);
  res.status(500).json({ error: "Internal server error" });
}
