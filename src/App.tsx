import React, { useState, useEffect } from "react";
import { Client } from "@gradio/client";
import { Cloudinary } from "@cloudinary/url-gen";
import { auto } from "@cloudinary/url-gen/actions/resize";
import { autoGravity } from "@cloudinary/url-gen/qualifiers/gravity";

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
      VITE_CLOUDINARY_PRESET: string;
      VITE_CLOUDINARY_CLOUD_NAME: string;
    };
  }
}

// Initialize Cloudinary
const cld = new Cloudinary({
  cloud: {
    cloudName: "dwvo85oaa",
    apiKey: "433595794257618",
    apiSecret: "J6_l-hxy3afInfLSqOdpwNvjoQQ",
  },
});

// Add this type at the top with other imports
type GradioResponse = {
  data: Array<{ url: string }>;
};

function App() {
  const [inputImage, setInputImage] = useState<string>("");
  const [firstOutputImage, setFirstOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

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

  // Create a result object based on the current state
  const result: ProcessingResult | null = firstOutputImage
    ? {
        runId: Date.now().toString(),
        outputUrl: firstOutputImage,
        status: "completed",
      }
    : null;

  const processImage = async (imageToProcess: string) => {
    setIsProcessing(true);
    setProgress(0);

    const progressInterval = setInterval(() => {
      setProgress((prev) => (prev < 90 ? prev + 1 : prev));
    }, 200);

    try {
      const app = await Client.connect("alexShangeeth/skin_06", {
        hf_token: `hf_${import.meta.env.VITE_HUGGING_FACE_TOKEN}`,
      });

      const response_0 = await fetch(imageToProcess);
      const imageBlob = await response_0.blob();

      const result = await app.predict("/addition", [
        imageBlob,
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
          Authorization: `Bearer hf_${import.meta.env.VITE_HUGGING_FACE_TOKEN}`,
        },
      });

      if (!imageResponse.ok) {
        throw new Error("Failed to fetch output image");
      }

      const outputImageBlob = await imageResponse.blob();

      // Upload to Cloudinary
      const cloudinaryImageUrl = await uploadToCloudinary(outputImageBlob);
      setFirstOutputImage(cloudinaryImageUrl);

      clearInterval(progressInterval);
      setProgress(100);
      setIsProcessing(false);
    } catch (error) {
      console.error(error);
      clearInterval(progressInterval);
      setFirstOutputImage(null);
      setIsProcessing(false);
      throw error;
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!inputImage) return;
    await processImage(inputImage);
  };

  const handleEnhance = async () => {
    if (!firstOutputImage) return;
    await processImage(firstOutputImage);
  };

  const handleReset = () => {
    setInputImage("");
    setFirstOutputImage(null);
  };

  const uploadToCloudinary = async (blob: Blob): Promise<string> => {
    const formData = new FormData();
    formData.append("file", blob);
    formData.append("upload_preset", `${import.meta.env.VITE_CLOUDINARY_PRESET}`);

    try {
      const response = await fetch(
        `https://api.cloudinary.com/v1_1/${
          import.meta.env.VITE_CLOUDINARY_CLOUD_NAME
        }/image/upload`,
        {
          method: "POST",
          body: formData,
        }
      );

      const data = await response.json();
      if (!response.ok) {
        throw new Error(data.error?.message || "Upload failed");
      }

      return data.secure_url;
    } catch (error) {
      console.error("Cloudinary upload failed:", error);
      throw error;
    }
  };

  useEffect(() => {
    return () => {
      // Cleanup any blob URLs when component unmounts
      if (firstOutputImage?.startsWith("blob:")) {
        URL.revokeObjectURL(firstOutputImage);
      }
    };
  }, [firstOutputImage]);

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
          imageUrl={inputImage}
          result={result}
          isProcessing={isProcessing}
          onImageSelect={setInputImage}
          onUrlChange={(e) => setInputImage(e.target.value)}
          onReset={handleReset}
          onEnhance={handleEnhance}
        />

        <div className="space-y-8">
          <InputContainer
            imageUrl={inputImage}
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