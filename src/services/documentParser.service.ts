import path from "node:path";
import mammoth from "mammoth";
import { parseOffice } from "officeparser";
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
		if (!file.buffer) {
			throw new Error("File buffer is missing. Ensure memoryStorage is used.");
		}

		const extension = path.extname(file.originalname).toLowerCase();

		let text = "";
		let totalPages = 1;
		let fileType = extension.replace(".", ""); // e.g. "pdf", "docx"

		try {
			if (extension === ".pdf") {
				const result = await this.parsePDF(file.buffer);
				text = result.text;
				totalPages = result.numpages;
			} else if (extension === ".docx" || extension === ".doc") {
				text = await this.parseDOCX(file.buffer);
				totalPages = 1;
			} else if (extension === ".pptx" || extension === ".ppt") {
				text = await this.parsePPTX(file.buffer);
				totalPages = 1;
			} else if (extension === ".txt" || file.mimetype === "text/plain") {
				text = file.buffer.toString("utf-8");
				fileType = "txt";
				totalPages = 1;
			} else {
				throw new Error(`Unsupported file extension: ${extension}`);
			}

			return {
				text: text.trim(),
				totalPages,
				fileType,
			};
		} catch (error) {
			console.error(`Failed to parse document ${file.originalname}:`, error);
			throw new Error(`Document parsing failed: ${(error as Error).message}`);
		}
	}

	private async parsePDF(buffer: Buffer): Promise<{ text: string; numpages: number }> {
		const parser = new PDFParse({ data: buffer });
		try {
			const data = await parser.getText();
			return {
				text: data.text,
				numpages: data.pages?.length || 1,
			};
		} finally {
			await parser.destroy();
		}
	}

	private async parseDOCX(buffer: Buffer): Promise<string> {
		const result = await mammoth.extractRawText({ buffer });
		return result.value;
	}

	private async parsePPTX(buffer: Buffer): Promise<string> {
		const ast = await parseOffice(buffer);
		return ast.toText();
	}
}
