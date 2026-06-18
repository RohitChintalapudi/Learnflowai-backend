import { NextFunction, Request, Response } from "express";
import { auth } from "../auth/auth";

export const authMiddleware = async (
  req: Request,
  res: Response,
  next: NextFunction
) => {
  try {
    const session = await auth.api.getSession({
      headers: req.headers,
    });

    if (!session || !session.user) {
      res.status(401).json({ success: false, message: "Unauthorized" });
      return;
    }

    req.user = session.user as any;
    req.session = session.session as any;

    next();
  } catch (error) {
    console.error("Auth middleware error:", error);
    res.status(500).json({ success: false, message: "Internal server error during authentication" });
  }
};
