import React, { useState } from 'react';
import { ComfyDeploy } from 'comfydeploy';
import type { ImageProcessingOptions, ProcessingResult, ProcessingSettings } from './types';
import { InputContainer } from './components/InputContainer';
import { ImageGrid } from './components/ImageGrid';
import { PreviewContainer } from './components/PreviewContainer';

declare global {
  interface ImportMeta {
    env: {
      VITE_COMFY_DEPLOY_API_KEY: string;
    };
  }
}

function App() {
  const [imageUrl, setImageUrl] = useState('');
  const [options, setOptions] = useState<ImageProcessingOptions>({
    skin: false,
    nose: false,
    eye_g: false,
    r_eye: true,
    l_eye: true,
    r_brow: false,
    l_brow: false,
    r_ear: false,
    l_ear: false,
    mouth: true,
    u_lip: true,
    l_lip: true,
    hair: false,
    hat: false,
    ear_r: false,
    neck_l: false,
    neck: false,
    cloth: false,
    background: false,
  });

  const [settings, setSettings] = useState<ProcessingSettings>({
    cfg: 0.7,
    samplingSteps: 30,
    denoise: 0.3,
    loraStrengthModel: 1.0,
    loraStrengthClip: 1.0,
    confidence: 0.2,
    detailMethod: 'VITMatte(local)',
    detailErode: 6,
    detailDilate: 6,
    blackPoint: 0.1,
    whitePoint: 0.99,
    positivePrompt: '',
    negativePrompt: '',
  });

  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const cd = new ComfyDeploy({
    bearer: import.meta.env.VITE_COMFY_DEPLOY_API_KEY,
  });

  const handleOptionChange = (key: keyof ImageProcessingOptions, value: boolean) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingChange = (key: keyof ProcessingSettings, value: number | string) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setImageUrl('');
    setResult(null);
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setIsProcessing(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 1 : prev));
    }, 200);

    try {
      const response = await cd.run.deployment.queue({
        deploymentId: 'b8f6fd00-fe1c-4d7e-ba65-ef7bb8f6b497',
        inputs: {
          input_image: imageUrl,
          skin: options.skin,
          nose: options.nose,
          eye_g: options.eye_g,
          r_eye: options.r_eye,
          l_eye: options.l_eye,
          r_brow: options.r_brow,
          l_brow: options.l_brow,
          r_ear: options.r_ear,
          l_ear: options.l_ear,
          mouth: options.mouth,
          u_lip: options.u_lip,
          l_lip: options.l_lip,
          hair: options.hair,
          hat: options.hat,
          ear_r: options.ear_r,
          neck_l: options.neck_l,
          neck: options.neck,
          cloth: options.cloth,
          background: options.background,
          cfg: settings.cfg,
          sampling_steps: settings.samplingSteps,
          denoise: settings.denoise,
          lora_strength_model: settings.loraStrengthModel,
          lora_strength_clip: settings.loraStrengthClip,
          confidence: settings.confidence,
          detail_method: settings.detailMethod,
          detail_erode: settings.detailErode,
          detail_dilate: settings.detailDilate,
          black_point: settings.blackPoint,
          white_point: settings.whitePoint,
          positive_prompt: settings.positivePrompt,
          negative_prompt: settings.negativePrompt,
        },
      });

      const data = {
        runId: response.runId,
      };

      setResult({
        runId: data.runId,
        outputUrl: null,
        status: 'processing',
      });

      const pollInterval = setInterval(async () => {
        const runn = response.runId;
        const statusResponse = await cd.run.get({
          runId: runn,
        });

        if (
          statusResponse.status === 'success' &&
          statusResponse.outputs?.[0]?.data?.images?.[0]?.url
        ) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setProgress(100);
          setResult({
            runId: data.runId,
            outputUrl: statusResponse.outputs[0].data.images[0].url,
            status: 'completed',
          });
          setIsProcessing(false);
        } else if (statusResponse.status === 'error') {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setProgress(100);
          setResult({
            runId: data.runId,
            outputUrl: null,
            status: 'error',
            error: 'Processing failed',
          });
          setIsProcessing(false);
        }
      }, 4000);
    } catch (error) {
      clearInterval(progressInterval);
      setResult({
        runId: '',
        outputUrl: null,
        status: 'error',
        error: 'Failed to process image',
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            AI-Powered Skin Image Enhancement
          </h1>
          <p className="mt-3 text-lg text-gray-300">
           Transform and enhance skin images with cutting-edge Sirio technology!
          </p>
        </div>

        <ImageGrid
          imageUrl={imageUrl}
          result={result}
          isProcessing={isProcessing}
          onImageSelect={setImageUrl}
          onUrlChange={(e) => setImageUrl(e.target.value)}
          onReset={handleReset}
        />

        <div className="space-y-8">
          <InputContainer
            imageUrl={imageUrl}
            options={options}
            settings={settings}
            isProcessing={isProcessing}
            progress={progress}
            onSubmit={handleSubmit}
            onOptionChange={handleOptionChange}
            onSettingChange={handleSettingChange}
          />

          {imageUrl && (
            <PreviewContainer
              imageUrl={imageUrl}
              result={result}
            />
          )}
        </div>
      </div>
    </div>
  );
}

export default App;