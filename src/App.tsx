import React, { useState, useEffect } from "react";
import { Client } from "@gradio/client";
import { Cloudinary } from '@cloudinary/url-gen';
import { auto } from '@cloudinary/url-gen/actions/resize';
import { autoGravity } from '@cloudinary/url-gen/qualifiers/gravity';

import type {
  ImageProcessingOptions,
  ProcessingResult,
  ProcessingSettings,
} from "./types";
import { InputContainer } from "./components/InputContainer";
import { ImageGrid } from "./components/ImageGrid";

declare global {
  interface ImportMeta {
    env: {
      VITE_HUGGING_FACE_TOKEN: string;
    };
  }
}

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: 'dwvo85oaa',
    apiKey: '433595794257618',
    apiSecret: 'J6_l-hxy3afInfLSqOdpwNvjoQQ'
  }
});

// Add this type at the top with other imports
type GradioResponse = {
  data: Array<{ url: string }>;
};

function App() {
  const [imageUrl, setImageUrl] = useState("");
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
    detailMethod: "VITMatte(local)",
    detailErode: 6,
    detailDilate: 6,
    blackPoint: 0.1,
    whitePoint: 0.99,
    positivePrompt: "",
    negativePrompt: "",
  });

  const [result, setResult] = useState<ProcessingResult | null>(null);

  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [cloudinaryUrl, setCloudinaryUrl] = useState<string | null>(null);

  const handleOptionChange = (
    key: keyof ImageProcessingOptions,
    value: boolean
  ) => {
    setOptions((prev) => ({ ...prev, [key]: value }));
  };

  const handleSettingChange = (
    key: keyof ProcessingSettings,
    value: number | string
  ) => {
    setSettings((prev) => ({ ...prev, [key]: value }));
  };

  const handleReset = () => {
    setImageUrl("");
    setResult(null);
  };

  // Update the uploadToCloudinary function
  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append('file', blob);
    formData.append('upload_preset', 'sirio_preset'); // Use a custom preset name
    formData.append('cloud_name', 'dwvo85oaa');

    try {
      const response = await fetch(
        'https://api.cloudinary.com/v1_1/dwvo85oaa/image/upload',
        {
          method: 'POST',
          body: formData
        }
      );

      const data = await response.json();
      console.log('Cloudinary response:', data);
      return data.secure_url;
    } catch (error) {
      console.error('Cloudinary upload failed:', error);
      throw error;
    }
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
      const app = await Client.connect("alexShangeeth/skin_06", {
        hf_token: `hf_${import.meta.env.VITE_HUGGING_FACE_TOKEN}`,
      });

      const response_0 = await fetch(imageUrl);
      const inputImage = await response_0.blob();

      const result = await app.predict("/addition", [
        inputImage,
        settings.positivePrompt,
        settings.negativePrompt,
        settings.cfg,
        settings.samplingSteps,
        settings.denoise,
        settings.loraStrengthModel,
        settings.loraStrengthClip,
        settings.confidence,
        settings.detailMethod,
        settings.detailErode,
        settings.detailDilate,
        settings.blackPoint,
        settings.whitePoint,
        options.background,
        options.skin,
        options.nose,
        options.eye_g,
        options.r_eye,
        options.l_eye,
        options.r_brow,
        options.l_brow,
        options.r_ear,
        options.l_ear,
        options.mouth,
        options.u_lip,
        options.l_lip,
        options.hair,
        options.hat,
        options.ear_r,
        options.neck_l,
        options.neck,
        options.cloth,
      ]) as GradioResponse;

      const imageResponse = await fetch(result.data[0].url, {
        headers: {
          Authorization: `Bearer hf_${import.meta.env.VITE_HUGGING_FACE_TOKEN}`
        }
      });

      if (!imageResponse.ok) {
        throw new Error('Failed to fetch output image');
      }

      const imageBlob = await imageResponse.blob();
      console.log(imageBlob)
      
      // Upload to Cloudinary
      const cloudinaryImageUrl = await uploadToCloudinary(imageBlob);
      setCloudinaryUrl(cloudinaryImageUrl);

      // Create temporary blob URL for immediate display
      const imageObjectUrl = URL.createObjectURL(imageBlob);

      clearInterval(progressInterval);
      setProgress(100);
      setResult({
        runId: Date.now().toString(),
        outputUrl: imageObjectUrl, // You might want to use cloudinaryImageUrl here instead
        status: 'completed'
      });
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setResult({
        runId: "",
        outputUrl: null,
        status: "error",
        error: "Failed to process image",
      });
      setIsProcessing(false);
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup blob URL when component unmounts
      if (result?.outputUrl && result.outputUrl.startsWith('blob:')) {
        URL.revokeObjectURL(result.outputUrl);
      }
    };
  }, [result?.outputUrl]);

  return (
    <div className="min-h-screen bg-gradient-to-br from-gray-900 to-gray-800 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto space-y-8">
        <div className="text-center">
          <h1 className="text-4xl font-bold text-white tracking-tight">
            AI-Powered Skin Image Enhancement
          </h1>
          <p className="mt-3 text-lg text-gray-300">
            Transform and enhance skin images with cutting-edge Sirio
            technology!
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
        </div>
      </div>
    </div>
  );
}

export default App;
