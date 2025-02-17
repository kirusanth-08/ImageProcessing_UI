export interface ImageProcessingOptions {
  nose: boolean;
  mouth: boolean;
  skin: boolean;
  hair: boolean;
  neck: boolean;
  eyes: boolean;
}

export interface ProcessingResult {
  runId: string;
  outputUrl: string | null;
  status: 'processing' | 'completed' | 'error';
  error?: string;
}