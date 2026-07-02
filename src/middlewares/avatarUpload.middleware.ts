import multer from "multer";
import path from "node:path";
import fs from "node:fs";

const storage = multer.diskStorage({
	destination: (req, file, cb) => {
		const uploadDir = path.join(process.cwd(), "uploads", "avatars");
		if (!fs.existsSync(uploadDir)) {
			fs.mkdirSync(uploadDir, { recursive: true });
		}
		cb(null, uploadDir);
	},
	filename: (req, file, cb) => {
		const uniqueSuffix = `${Date.now()}-${Math.round(Math.random() * 1e9)}`;
		const extension = path.extname(file.originalname);
		cb(null, `avatar-${uniqueSuffix}${extension}`);
	},
});

const fileFilter = (
	req: Express.Request,
	file: Express.Multer.File,
	cb: multer.FileFilterCallback,
) => {
	const allowedMimeTypes = ["image/jpeg", "image/png", "image/webp", "image/jpg"];

	if (allowedMimeTypes.includes(file.mimetype)) {
		cb(null, true);
	} else {
		cb(new Error("Invalid file type. Only JPEG, PNG, JPG, and WebP are allowed."));
	}
};

export const avatarUploadMiddleware = multer({
	storage,
	fileFilter,
	limits: {
		fileSize: 5 * 1024 * 1024, // 5 MB limit for avatars
	},
});
