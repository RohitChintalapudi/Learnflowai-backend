import { v2 as cloudinary } from "cloudinary";

cloudinary.config({
  cloud_name: "ddzy94wlk",
  api_key: "469243245473395",
  api_secret: "9Ux0qhLL2Zuvppi_OIwnf4dNsFA",
});

async function main() {
  try {
    const result = await cloudinary.uploader.upload("data:text/plain;base64,SGVsbG8gV29ybGQ=", { resource_type: "raw" });
    console.log("Uploaded text:", result.secure_url);
    const res = await fetch(result.secure_url);
    const text = await res.text();
    console.log(`Status: ${res.status}`);
    console.log("Body:", text);
    
    // Test a PDF upload too
    const pdfBase64 = "data:application/pdf;base64,JVBERi0xLjQKMSAwIG9iago8PAovVGl0bGUgKFRlc3QgUERGKQo+PgplbmRvYmoKdHJhaWxlcgo8PAovUm9vdCAxIDAgUgo+PgolJUVPRg==";
    const pdfResult = await cloudinary.uploader.upload(pdfBase64, { resource_type: "raw", public_id: "test_delivery.pdf" });
    console.log("Uploaded PDF:", pdfResult.secure_url);
    const pdfRes = await fetch(pdfResult.secure_url);
    console.log(`PDF Status: ${pdfRes.status}`);
    
  } catch (err) {
    console.error("Failed:", err);
  }
}
main();
