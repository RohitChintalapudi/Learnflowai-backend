import type { NextFunction, Request, Response } from "express";
import multer from "multer";
import { AppError } from "../utils/app-error";

export function errorHandler(err: Error, _req: Request, res: Response, _next: NextFunction) {
	if (err instanceof AppError) {
		return res.status(err.statusCode).json({
			success: false,
			message: err.message,
		});
	}

	if (err instanceof multer.MulterError) {
		return res.status(400).json({
			success: false,
			message: err.message,
		});
	}

	if (err.message?.includes("Invalid file type") || err.message?.includes("File too large")) {
		return res.status(400).json({
			success: false,
			message: err.message,
		});
	}

	console.error("Unhandled error:", err);

	return res.status(500).json({
		success: false,
		message: "Internal server error",
	});
}
