import fs from "node:fs";
import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "ddzy94wlk",
  api_key: "824113532559151",
  api_secret: "rBCrh7mL6hugX5MUmSBp-umfydQ",
});

async function main() {
  try {
    console.log("Checking Admin API...");
    const usage = await cloudinary.api.usage();
    console.log("Usage stats:", usage);
  } catch (err) {
    console.error("Admin API failed:", err);
  }
}

main();
