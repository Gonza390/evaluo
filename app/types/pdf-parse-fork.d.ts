declare module 'pdf-parse-fork' {
  interface PdfParseOptions {
    max?: number;
    min?: number;
  }

  interface PdfParseResult {
    numpages: number;
    numrender: number;
    info: Record<string, unknown>;
    metadata: Record<string, unknown>;
    text: string;
    version: string;
  }

  function pdfparse(
    dataBuffer: Buffer,
    options?: PdfParseOptions
  ): Promise<PdfParseResult>;

  export default pdfparse;
}