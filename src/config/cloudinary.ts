import { v2 as cloudinary } from "cloudinary";
import { env } from "./env"; // Assuming there is an env config. If not we just use process.env

// Assuming env has these, but let's safely fall back to process.env if it doesn't
cloudinary.config({
  cloud_name: process.env.CLOUDINARY_CLOUD_NAME || env?.CLOUDINARY_CLOUD_NAME,
  api_key: process.env.CLOUDINARY_API_KEY || env?.CLOUDINARY_API_KEY,
  api_secret: process.env.CLOUDINARY_API_SECRET || env?.CLOUDINARY_API_SECRET,
});

export default cloudinary;
