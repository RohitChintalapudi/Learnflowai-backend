import fs from "node:fs";
import path from "node:path";
import { env } from "../../config/env";
import { prisma } from "../../database/prisma";
import { AnalyticsEventType, AnalyticsTracker } from "../analytics/analytics.tracker";
import type { UpdateProfileRequest, UserStats } from "./profile.types";

export class ProfileService {
	public async getProfile(userId: string) {
		const user = await prisma.user.findUnique({
			where: { id: userId },
			select: {
				id: true,
				name: true,
				email: true,
				profileImage: true,
				image: true,
				bio: true,
				learningGoals: true,
				createdAt: true,
			},
		});

		if (!user) {
			throw new Error("User not found");
		}

		// Prefer profileImage if set, otherwise fallback to better-auth image
		return {
			...user,
			profileImage: user.profileImage || user.image || null,
		};
	}

	public async updateProfile(userId: string, data: UpdateProfileRequest) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error("User not found");
		}

		const updatedUser = await prisma.user.update({
			where: { id: userId },
			data: {
				name: data.name !== undefined ? data.name : undefined,
				bio: data.bio !== undefined ? data.bio : undefined,
				learningGoals: data.learningGoals !== undefined ? data.learningGoals : undefined,
			},
			select: {
				id: true,
				name: true,
				email: true,
				profileImage: true,
				image: true,
				bio: true,
				learningGoals: true,
				createdAt: true,
			},
		});

		// Analytics Tracking
		await AnalyticsTracker.trackEvent(userId, AnalyticsEventType.PROFILE_UPDATED, {
			fields: Object.keys(data),
		});

		return {
			...updatedUser,
			profileImage: updatedUser.profileImage || updatedUser.image || null,
		};
	}

	public async uploadAvatar(userId: string, fileFilename: string) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error("User not found");
		}

		const fileUrl = `${process.env.BACKEND_URL || "http://localhost:3000"}/uploads/avatars/${fileFilename}`;

		await prisma.user.update({
			where: { id: userId },
			data: {
				profileImage: fileUrl,
			},
		});

		// Delete old avatar if it's a local upload
		if (user.profileImage && user.profileImage.includes("/uploads/avatars/")) {
			const oldFilename = user.profileImage.split("/").pop();
			if (oldFilename) {
				const oldFilePath = path.join(process.cwd(), "uploads", "avatars", oldFilename);
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			}
		}

		// Analytics Tracking
		await AnalyticsTracker.trackEvent(userId, "PROFILE_AVATAR_UPLOADED");

		return fileUrl;
	}

	public async deleteAvatar(userId: string) {
		const user = await prisma.user.findUnique({ where: { id: userId } });
		if (!user) {
			throw new Error("User not found");
		}

		// Delete old avatar if it's a local upload
		if (user.profileImage && user.profileImage.includes("/uploads/avatars/")) {
			const oldFilename = user.profileImage.split("/").pop();
			if (oldFilename) {
				const oldFilePath = path.join(process.cwd(), "uploads", "avatars", oldFilename);
				if (fs.existsSync(oldFilePath)) {
					fs.unlinkSync(oldFilePath);
				}
			}
		}

		await prisma.user.update({
			where: { id: userId },
			data: {
				profileImage: null,
			},
		});

		// Analytics Tracking
		await AnalyticsTracker.trackEvent(userId, "PROFILE_AVATAR_DELETED");

		return true;
	}

	public async getStats(userId: string): Promise<UserStats> {
		const [documentsCount, notesCount, quizzesCount, interviewQuestionsCount, explanationsCount] =
			await Promise.all([
				prisma.document.count({ where: { uploadedBy: userId } }),
				prisma.generatedNote.count({ where: { userId } }),
				prisma.generatedQuiz.count({ where: { userId } }),
				prisma.interviewQuestionSet.count({ where: { userId } }),
				prisma.explanation.count({ where: { userId } }),
			]);

		return {
			documentsCount,
			notesCount,
			quizzesCount,
			interviewQuestionsCount,
			explanationsCount,
		};
	}
}
