import type { Request, Response } from "express";
import { ProfileService } from "./profile.service";
import { updateProfileSchema } from "./profile.validator";

export class ProfileController {
	private profileService: ProfileService;

	constructor() {
		this.profileService = new ProfileService();
	}

	public getProfile = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const profile = await this.profileService.getProfile(user.id);
			res.status(200).json({ success: true, profile });
		} catch (error: any) {
			console.error("Error in getProfile:", error);
			res.status(404).json({ success: false, message: error.message || "Profile not found" });
		}
	};

	public updateProfile = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const parsedBody = updateProfileSchema.safeParse(req.body);
			if (!parsedBody.success) {
				res.status(400).json({
					success: false,
					message: "Validation failed",
					errors: parsedBody.error.flatten().fieldErrors,
				});
				return;
			}

			const updatedProfile = await this.profileService.updateProfile(user.id, parsedBody.data);
			res.status(200).json({ success: true, profile: updatedProfile });
		} catch (error: any) {
			console.error("Error in updateProfile:", error);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	};

	public uploadAvatar = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			if (!req.file) {
				res.status(400).json({ success: false, message: "No avatar file uploaded" });
				return;
			}

			const avatarUrl = await this.profileService.uploadAvatar(user.id, req.file.filename);
			res.status(200).json({ success: true, profileImage: avatarUrl });
		} catch (error: any) {
			console.error("Error in uploadAvatar:", error);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	};

	public deleteAvatar = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			await this.profileService.deleteAvatar(user.id);
			res.status(200).json({ success: true, message: "Avatar deleted successfully" });
		} catch (error: any) {
			console.error("Error in deleteAvatar:", error);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	};

	public getStats = async (req: Request, res: Response): Promise<void> => {
		try {
			const user = req.user;
			if (!user) {
				res.status(401).json({ success: false, message: "Unauthorized" });
				return;
			}

			const stats = await this.profileService.getStats(user.id);
			res.status(200).json({ success: true, ...stats });
		} catch (error: any) {
			console.error("Error in getStats:", error);
			res.status(500).json({ success: false, message: "Internal server error" });
		}
	};
}
