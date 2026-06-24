import { type UploadApiOptions, UploadApiResponse } from "cloudinary";
import streamifier from "streamifier";
import cloudinary from "../../config/cloudinary";

export interface CloudinaryUploadResult {
	publicId: string;
	secureUrl: string;
	originalFilename: string;
	resourceType: string;
	bytes: number;
}

export class CloudinaryService {
	/**
	 * Uploads a file directly from a memory buffer to Cloudinary using streams.
	 *
	 * @param buffer - The file buffer
	 * @param originalFilename - Original name of the file
	 * @param resourceType - Cloudinary resource type (e.g. "raw", "image", "video", "auto")
	 * @returns CloudinaryUploadResult with metadata
	 */
	async uploadBuffer(
		buffer: Buffer,
		originalFilename: string,
		resourceType: "raw" | "auto" | "image" | "video" = "auto",
	): Promise<CloudinaryUploadResult> {
		return new Promise((resolve, reject) => {
			const options: UploadApiOptions = {
				resource_type: resourceType,
				public_id: `${Date.now()}-${originalFilename.replace(/[^a-zA-Z0-9.-]/g, "_")}`,
				use_filename: true,
				unique_filename: true,
			};

			const stream = cloudinary.uploader.upload_stream(options, (error, result) => {
				if (error || !result) {
					console.error("Cloudinary upload error:", error);
					return reject(error || new Error("Failed to upload to Cloudinary"));
				}

				resolve({
					publicId: result.public_id,
					secureUrl: result.secure_url,
					originalFilename,
					resourceType: result.resource_type,
					bytes: result.bytes,
				});
			});

			streamifier.createReadStream(buffer).pipe(stream);
		});
	}

	/**
	 * Deletes a file from Cloudinary using its public ID.
	 *
	 * @param publicId - The Cloudinary public ID
	 */
	async deleteFile(publicId: string): Promise<void> {
		try {
			if (!publicId) return;

			// Determine resource type if possible, usually for non-images we must specify "raw" or "video".
			// By default, cloudinary uses "image", which might fail for raw documents.
			// A better approach is to try deleting as raw, then auto/image.
			// For safety, let's try raw first since most documents are raw.
			let result = await cloudinary.uploader.destroy(publicId, { resource_type: "raw" });

			// If it wasn't raw, try image (default)
			if (result.result === "not found") {
				result = await cloudinary.uploader.destroy(publicId, { resource_type: "image" });
			}

			if (result.result !== "ok" && result.result !== "not found") {
				console.warn(`Failed to delete Cloudinary asset ${publicId}:`, result);
			}
		} catch (error) {
			console.error(`Error deleting Cloudinary asset ${publicId}:`, error);
		}
	}
}
