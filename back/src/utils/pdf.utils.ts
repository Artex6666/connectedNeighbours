import fs from 'fs';
import crypto from 'crypto';
import { PDFDocument, StandardFonts, rgb } from 'pdf-lib';

/** sha256 of a file's bytes (hex). */
export function hashFile(filePath: string): string {
  const buf = fs.readFileSync(filePath);
  return crypto.createHash('sha256').update(buf).digest('hex');
}

export interface ZoneToStamp {
  signerId: string;
  page: number;
  x: number; // fractions 0..1, origin top-left
  y: number;
  width: number;
  height: number;
}

export interface StampSignature {
  name: string;
  date: string;
}

/**
 * Draw each signatory's typed signature inside their zone, producing a flattened
 * "signed" PDF. Zone coordinates are page fractions (origin top-left); pdf-lib
 * uses a bottom-left origin so we convert.
 */
export async function stampSignatures(
  originalPath: string,
  outputPath: string,
  zones: ZoneToStamp[],
  signatures: Map<string, StampSignature>,
): Promise<void> {
  const pdf = await PDFDocument.load(fs.readFileSync(originalPath));
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const pages = pdf.getPages();

  for (const zone of zones) {
    const sig = signatures.get(zone.signerId);
    if (!sig) continue;
    const page = pages[Math.min(zone.page ?? 0, pages.length - 1)];
    const { width: pw, height: ph } = page.getSize();
    const w = zone.width * pw;
    const h = zone.height * ph;
    const x = zone.x * pw;
    const y = ph - zone.y * ph - h; // top-left fraction → bottom-left points

    page.drawRectangle({
      x,
      y,
      width: w,
      height: h,
      borderColor: rgb(0.15, 0.39, 0.92),
      borderWidth: 1,
      color: rgb(0.93, 0.96, 1),
      opacity: 0.5,
    });
    page.drawText(sig.name, { x: x + 4, y: y + h * 0.45, size: 11, font, color: rgb(0.08, 0.1, 0.2) });
    page.drawText(`Signe le ${sig.date}`, { x: x + 4, y: y + 4, size: 7, font, color: rgb(0.4, 0.4, 0.45) });
  }

  fs.writeFileSync(outputPath, await pdf.save());
}

function wrap(text: string, max: number): string[] {
  const words = (text ?? '').split(/\s+/);
  const lines: string[] = [];
  let line = '';
  for (const w of words) {
    if ((line + ' ' + w).trim().length > max) {
      if (line) lines.push(line);
      line = w;
    } else {
      line = (line + ' ' + w).trim();
    }
  }
  if (line) lines.push(line);
  return lines.length ? lines : [''];
}

export interface ContractData {
  offerer: string;
  requester: string;
  serviceTitle: string;
  serviceDescription: string;
  points: number;
  date: string;
}

/** Generate a service contract PDF from scratch (paid services). */
export async function generateContractPdf(outputPath: string, data: ContractData): Promise<void> {
  const pdf = await PDFDocument.create();
  const page = pdf.addPage([595, 842]); // A4
  const font = await pdf.embedFont(StandardFonts.Helvetica);
  const bold = await pdf.embedFont(StandardFonts.HelveticaBold);

  let y = 790;
  const draw = (text: string, size = 11, f = font, color = rgb(0.1, 0.1, 0.15)) => {
    page.drawText(text, { x: 50, y, size, font: f, color });
    y -= size + 8;
  };

  draw('CONTRAT DE SERVICE - BobConnect', 18, bold, rgb(0.15, 0.39, 0.92));
  y -= 8;
  draw(`Date : ${data.date}`);
  y -= 6;
  draw('Offreur', 12, bold);
  draw(data.offerer);
  y -= 4;
  draw('Demandeur', 12, bold);
  draw(data.requester);
  y -= 10;
  draw('Service', 12, bold);
  draw(data.serviceTitle);
  y -= 4;
  draw('Description', 12, bold);
  for (const line of wrap(data.serviceDescription, 95)) draw(line, 10);
  y -= 8;
  draw(`Remuneration : ${data.points} points BobConnect (non convertibles en argent reel)`, 11, bold);
  y -= 24;
  draw("Les deux parties s'engagent a signer ce contrat dans l'application avant le debut de la prestation.", 9, font, rgb(0.4, 0.4, 0.45));

  fs.writeFileSync(outputPath, await pdf.save());
}
