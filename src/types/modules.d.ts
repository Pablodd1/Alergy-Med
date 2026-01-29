declare module 'pdf-parse' {
  interface PDFParseResult {
    text: string;
    numpages: number;
    numrender: number;
    info: any;
    metadata: any;
    version: string;
  }

  function pdfParse(dataBuffer: Buffer): Promise<PDFParseResult>;
  export = pdfParse;
}

declare module 'mammoth' {
  interface MammothResult {
    value: string;
    messages: any[];
  }

  export function extractRawText(options: { buffer: Buffer }): Promise<MammothResult>;
}