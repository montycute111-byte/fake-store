import { NextFunction, Request, Response } from "express";
import { verifyAccessToken } from "../utils/jwt";
import { HttpError } from "../utils/http";

export function requireAuth(req: Request, _res: Response, next: NextFunction) {
  const header = req.headers.authorization;
  const token = header?.startsWith("Bearer ") ? header.slice(7) : null;

  if (!token) {
    return next(new HttpError(401, "Missing access token"));
  }

  try {
    req.user = verifyAccessToken(token);
    next();
  } catch {
    next(new HttpError(401, "Invalid or expired access token"));
  }
}
