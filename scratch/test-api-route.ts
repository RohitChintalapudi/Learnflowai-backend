import { DocumentController } from "../src/controllers/document.controller";
import { Request, Response } from "express";

async function main() {
  console.log("Testing DocumentController.uploadDocument directly...");
  const controller = new DocumentController();

  const fileContent = "%PDF-1.4\n1 0 obj\n<<\n/Title (Test PDF)\n>>\nendobj\ntrailer\n<<\n/Root 1 0 R\n>>\n%%EOF";
  const buffer = Buffer.from(fileContent, "utf-8");

  // Mock Multer File
  const mockFile = {
    fieldname: "file",
    originalname: "test-document.pdf",
    encoding: "7bit",
    mimetype: "application/pdf",
    size: buffer.length,
    buffer: buffer,
  } as Express.Multer.File;

  // Mock Request
  const req = {
    file: mockFile,
    user: { id: "test-user-id" }, // Mock user ID
  } as unknown as Request;

  // Mock Response
  let responseData: any;
  let responseStatus: number = 200;
  
  const res = {
    status: (code: number) => {
      responseStatus = code;
      return res;
    },
    json: (data: any) => {
      responseData = data;
      return res;
    }
  } as unknown as Response;

  try {
    await controller.uploadDocument(req, res);
    
    if (responseStatus === 200) {
      console.log("✅ Route logic test SUCCESS!");
      console.log("Response:", responseData);
      
      // Cleanup
      console.log(`\nCleaning up document ${responseData.documentId}...`);
      
      const delReq = {
        params: { documentId: responseData.documentId },
        user: { id: "test-user-id" }
      } as unknown as Request;
      
      let delStatus = 200;
      let delData: any;
      const delRes = {
        status: (code: number) => { delStatus = code; return delRes; },
        json: (data: any) => { delData = data; return delRes; }
      } as unknown as Response;
      
      await controller.deleteDocument(delReq, delRes);
      
      if (delStatus === 200) {
        console.log("✅ Cleanup SUCCESS:", delData);
      } else {
        console.error("❌ Cleanup failed:", delStatus, delData);
      }
      
    } else {
      console.error(`❌ Route logic test FAILED with status ${responseStatus}:`, responseData);
    }
  } catch (err) {
    console.error("❌ Request failed:", err);
  }
}

main();
