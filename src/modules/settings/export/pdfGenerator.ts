import PDFDocument from 'pdfkit';

export async function generatePdfBuffer(title: string, data: any): Promise<Buffer> {
	return new Promise((resolve, reject) => {
		const doc = new PDFDocument({ margin: 50 });
		const buffers: Buffer[] = [];
		
		doc.on('data', buffers.push.bind(buffers));
		doc.on('end', () => {
			resolve(Buffer.concat(buffers));
		});
		doc.on('error', reject);

		// Document Title
		doc.fontSize(24).font('Helvetica-Bold').text(title, { align: 'center' });
		doc.moveDown();
		doc.fontSize(12).font('Helvetica').text(`Generated on: ${new Date().toLocaleString()}`, { align: 'center' });
		doc.moveDown(2);

		// Check for empty data
		if (
			data === null || 
			data === undefined || 
			(Array.isArray(data) && data.length === 0) || 
			(typeof data === 'object' && Object.keys(data).length === 0)
		) {
			doc.fontSize(14).font('Helvetica-Oblique').text("No data available.", { align: 'center' });
		} else {
			doc.fontSize(10).font('Helvetica');
			
			if (Array.isArray(data)) {
				data.forEach((item, index) => {
					// Add a new page if getting too close to bottom
					if (doc.y > 700) doc.addPage();

					doc.font('Helvetica-Bold').fontSize(14).text(`Item ${index + 1}`);
					doc.moveDown(0.5);
					doc.font('Helvetica').fontSize(10);
					writeNestedObject(doc, item, 0);
					doc.moveDown();
					
					// Separator
					doc.moveTo(50, doc.y).lineTo(550, doc.y).strokeColor('#cccccc').stroke();
					doc.moveDown();
					// Reset color just in case
					doc.fillColor('#000000');
				});
			} else {
				writeNestedObject(doc, data, 0);
			}
		}

		doc.end();
	});
}

function writeNestedObject(doc: PDFKit.PDFDocument, obj: any, indent: number) {
	const indentation = ' '.repeat(indent * 4);
	
	if (!obj) return;

	for (const [key, value] of Object.entries(obj)) {
		// Prevent overflow by checking page bottom
		if (doc.y > 720) {
			doc.addPage();
		}

		const formattedKey = key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase());

		if (value === null || value === undefined) {
			doc.font('Helvetica-Bold').text(`${indentation}${formattedKey}: `, { continued: true });
			doc.font('Helvetica').text('N/A');
		} else if (typeof value === 'object' && !Array.isArray(value)) {
			doc.font('Helvetica-Bold').text(`${indentation}${formattedKey}:`);
			doc.font('Helvetica');
			writeNestedObject(doc, value, indent + 1);
		} else if (Array.isArray(value)) {
			doc.font('Helvetica-Bold').text(`${indentation}${formattedKey}:`);
			doc.font('Helvetica');
			if (value.length === 0) {
				doc.text(`${indentation}    (Empty)`);
			} else {
				value.forEach((v, i) => {
					if (doc.y > 720) doc.addPage();
					if (typeof v === 'object' && v !== null) {
						doc.text(`${indentation}    - [Item ${i + 1}]`);
						writeNestedObject(doc, v, indent + 2);
					} else {
						doc.text(`${indentation}    - ${v}`);
					}
				});
			}
		} else {
			let displayValue = String(value);
			if (displayValue.match(/^\d{4}-\d{2}-\d{2}T\d{2}:\d{2}:\d{2}/)) {
				displayValue = new Date(displayValue).toLocaleString();
			}
			// If text is very long, don't use continued
			if (displayValue.length > 50) {
				doc.font('Helvetica-Bold').text(`${indentation}${formattedKey}:`);
				doc.font('Helvetica').text(`${indentation}    ${displayValue}`);
			} else {
				doc.font('Helvetica-Bold').text(`${indentation}${formattedKey}: `, { continued: true });
				doc.font('Helvetica').text(displayValue);
			}
		}
	}
}
