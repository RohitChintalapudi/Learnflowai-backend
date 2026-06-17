import fs from "node:fs/promises";
import path from "node:path";
import mammoth from "mammoth";
import { parseOfficeAsync } from "officeparser";
import { PDFParse } from "pdf-parse";

export interface ExtractResponse {
  text: string;
  totalPages: number;
  fileType: string;
}

export class DocumentParserService {
  /**
   * Automatically determines which extraction strategy to use based on file extension or mimetype.
   */
  async extractText(file: Express.Multer.File): Promise<ExtractResponse> {
    const filePath = file.path;
    const extension = path.extname(file.originalname).toLowerCase();
    
    let text = "";
    let totalPages = 1;
    let fileType = extension.replace(".", ""); // e.g. "pdf", "docx"

    try {
      if (extension === ".pdf") {
        const result = await this.parsePDF(filePath);
        text = result.text;
        totalPages = result.numpages;
      } else if (extension === ".docx" || extension === ".doc") {
        text = await this.parseDOCX(filePath);
        // Word documents don't naturally give us page count via mammoth easily
        totalPages = 1; 
      } else if (extension === ".pptx" || extension === ".ppt") {
        text = await this.parsePPTX(filePath);
        totalPages = 1; 
      } else {
        throw new Error(`Unsupported file extension: ${extension}`);
      }

      return {
        text: text.trim(),
        totalPages,
        fileType
      };
    } catch (error) {
      console.error(`Failed to parse document ${file.originalname}:`, error);
      throw new Error(`Document parsing failed: ${(error as Error).message}`);
    }
  }

  private async parsePDF(filePath: string): Promise<{ text: string, numpages: number }> {
    const dataBuffer = await fs.readFile(filePath);
    const parser = new PDFParse({ data: dataBuffer });
    try {
      const data = await parser.getText();
      return {
        text: data.text,
        numpages: data.pages?.length || 1 // pdf-parse 2.4.5 returns pages array
      };
    } finally {
      await parser.destroy();
    }
  }

  private async parseDOCX(filePath: string): Promise<string> {
    // mammoth works best with docx
    const result = await mammoth.extractRawText({ path: filePath });
    return result.value;
  }

  private async parsePPTX(filePath: string): Promise<string> {
    // officeparser can parse pptx, docx, xlsx etc.
    const text = await parseOfficeAsync(filePath);
    return text;
  }
}
