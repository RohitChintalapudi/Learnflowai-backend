import multer from "multer";

const storage = multer.memoryStorage();

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
