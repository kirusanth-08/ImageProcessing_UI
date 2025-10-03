export interface ImageProcessingOptions {
  skin: boolean;
  nose: boolean;
  eye_g: boolean;
  r_eye: boolean;
  l_eye: boolean;
  r_brow: boolean;
  l_brow: boolean;
  r_ear: boolean;
  l_ear: boolean;
  mouth: boolean;
  u_lip: boolean;
  l_lip: boolean;
  hair: boolean;
  hat: boolean;
  ear_r: boolean;
  neck_l: boolean;
  neck: boolean;
  cloth: boolean;
  background: boolean;
}

export interface ProcessingSettings {
  cfg: number;
  samplingSteps: number;
  denoise: number;
  loraStrengthModel: number;
  loraStrengthClip: number;
  confidence: number;
  detailMethod: 'VITMatte(local)' | 'GuidedFilter' | 'VITMatte' | 'PyMatting';
  detailErode: number;
  detailDilate: number;
  blackPoint: number;
  whitePoint: number;
  // positivePrompt: string;
  // negativePrompt: string;
}

export type JobStatus = 'queued' | 'pending' | 'processing' | 'done' | 'error' | 'cancelled'

export interface GenerateResponse {
  jobId: string
  status?: JobStatus
}

export interface StatusResponse {
  status: JobStatus
  progress?: number
  imageBase64?: string
  imageUrl?: string
  delayTime?: number
  executionTime?: number
  error?: string
  jobId?: string
}