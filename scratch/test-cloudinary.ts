import { CloudinaryService } from "../src/lib/storage/cloudinary.service";

async function main() {
  console.log("Starting Cloudinary test...");
  const cloudinaryService = new CloudinaryService();
  console.log("Cloud Name:", process.env.CLOUDINARY_CLOUD_NAME);
  const buffer = Buffer.from("Hello Cloudinary! This is a test file.", "utf-8");
  
  try {
    console.log("Uploading buffer...");
    const result = await cloudinaryService.uploadBuffer(buffer, "test-file.txt", "raw");
    
    console.log("Upload Success!");
    console.log("Result:", result);
    
    // Verify deletion
    console.log(`\nDeleting file with publicId: ${result.publicId}`);
    await cloudinaryService.deleteFile(result.publicId);
    console.log("Delete command sent successfully.");
    
    process.exit(0);
  } catch (error) {
    console.error("Test failed:", error);
    process.exit(1);
  }
}

main();
