import fs from "node:fs/promises";
import path from "node:path";

export class StorageService {
  /**
   * Uploads a file to a permanent storage location.
   * Currently, this is a local disk abstraction.
   * Can be replaced with S3, Cloudinary, etc., later.
   * 
   * @param file - The multer file object
   * @returns The public URL or path of the uploaded file
   */
  async uploadFile(file: Express.Multer.File): Promise<string> {
    // With multer disk storage, the file is already saved in the /uploads folder.
    // In a real cloud setup, we would read file.path, upload it to S3, and return the S3 URL.
    // For now, we return a local relative URL.
    return `/uploads/${file.filename}`;
  }

  /**
   * Deletes a file from storage.
   * 
   * @param fileUrl - The URL or path of the file to delete
   */
  async deleteFile(fileUrl: string): Promise<void> {
    try {
      if (fileUrl.startsWith("/uploads/")) {
        const filename = fileUrl.replace("/uploads/", "");
        const filePath = path.join(process.cwd(), "uploads", filename);
        await fs.unlink(filePath);
      }
    } catch (error) {
      console.error(`Failed to delete file from storage: ${fileUrl}`, error);
      // We might want to swallow the error if the file is already gone
    }
  }
}
