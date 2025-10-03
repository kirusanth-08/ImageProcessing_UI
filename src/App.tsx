import React, { useState, useEffect, useRef } from "react";
import { fetchStatus, submitImage } from "./api";

import type {
  ImageProcessingOptions,
  ProcessingSettings,
  JobStatus
} from "./types";
import { InputContainer } from "./components/InputContainer";
import { ImageGrid } from "./components/ImageGrid";

const POLL_INTERVAL_MS = 2000;

function App() {
  const [inputImage, setInputImage] = useState<string>("");
  const [outputImage, setOutputImage] = useState<string | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);
  const [jobId, setJobId] = useState<string | null>(null);
  const [status, setStatus] = useState<JobStatus>("pending");
  // const [error, setError] = useState<string | null>(null);
  // const [imageBase64, setImageBase64] = useState<string | null>(null);
  // const [imageUrl, setImageUrl] = useState<string | null>(null);

  // Refs for tracking polling state
  const intervalRef = useRef<number | null>(null);
  const isPollingRef = useRef(false);
  const progressTimerRef = useRef<number | null>(null);

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
    whitePoint: 0.99
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

  // Cleanup function for all timers
  const clearProgressTimers = () => {
    if (progressTimerRef.current) {
      clearInterval(progressTimerRef.current);
      progressTimerRef.current = null;
    }
  };

  const clearProgress = () => {
    clearProgressTimers();
  };

  const startProgressTimer = () => {
    clearProgressTimers();
    
    // Start a progress timer that slowly increases progress
    progressTimerRef.current = window.setInterval(() => {
      setProgress((prev) => {
        // Slowly increase progress to 90% while waiting
        if (prev < 90) {
          return prev + 0.5;
        }
        return prev;
      });
    }, 200);
  };

  const startPolling = () => {
    if (isPollingRef.current) return;
    isPollingRef.current = true;

    // Immediately fetch status once, then set interval
    void pollOnce();
    intervalRef.current = window.setInterval(() => {
      void pollOnce();
    }, POLL_INTERVAL_MS);
  };

  const stopPolling = () => {
    if (intervalRef.current) {
      clearInterval(intervalRef.current);
      intervalRef.current = null;
    }
    isPollingRef.current = false;
  };

  const pollOnce = async () => {
    if (!jobId) return;
    try {
      const data = await fetchStatus(jobId);
      setStatus(data.status || "pending");
      
      if (data.status === "done") {
        // setImageBase64(data.imageBase64 ?? null);
        // setImageUrl(data.imageUrl ?? null);
        
        if (data.imageBase64) {
          setOutputImage(`data:image/png;base64,${data.imageBase64}`);
        } else if (data.imageUrl) {
          setOutputImage(data.imageUrl);
        }
        
        setProgress(100);
        setIsProcessing(false);
      } else if (data.status === "error" || data.status === "cancelled") {
        // setError(data.error || "Generation failed");
        setIsProcessing(false);
      }
    } catch (err: any) {
      // setError(err?.message || "Failed to fetch status");
      setStatus("error");
      setIsProcessing(false);
    }
  };

  // Accept isPro and pass it down to submitImage
  const processImage = async (imageToProcess: string, isPro: boolean) => {
    setIsProcessing(true);
    setProgress(0);
    // setError(null);
    setOutputImage(null);
    setJobId(null);
    setStatus("pending");

    try {
      const startResp = await submitImage(imageToProcess, options, settings, isPro);
      
      const newJobId = startResp.jobId;
      if (!newJobId) throw new Error("Failed to start job");
      
      setJobId(newJobId);
      setStatus(startResp.status || "queued");
      
      setTimeout(() => {
        if (status !== "done" && status !== "error" && status !== "cancelled") {
          startPolling();
        }
      }, 1000);
    } catch (error: any) {
      console.error(error);
      // setError(error?.message || "Failed to submit image");
      setIsProcessing(false);
      setStatus("error");
    }
  };

  // const handleCancel = async () => {
  //   if (jobId) {
  //     try {
  //       await cancelJob(jobId);
  //       setStatus("cancelled");
  //     } catch (error) {
  //       console.error("Failed to cancel job", error);
  //     }
  //   }
  // };

  // Handle submit receives isPro from InputContainer buttons
  const handleSubmit = async (e: React.FormEvent, isPro: boolean) => {
    e.preventDefault();
    if (!inputImage) return;
    await processImage(inputImage, isPro);
  };

  // Effect to manage polling lifecycle
  useEffect(() => {
    return () => {
      stopPolling();
      clearProgressTimers();
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  useEffect(() => {
    // Start polling when we have a jobId and not done/error
    if (!jobId) return;
    if (status === "done" || status === "error" || status === "cancelled") return;
    startPolling();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [jobId]);

  useEffect(() => {
    if (status === "queued" || status === "processing") {
      startProgressTimer();
    } else {
      clearProgress();
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [status]);

  useEffect(() => {
    // Stop polling when job completes, errors, or is cancelled
    if (status === "done" || status === "error" || status === "cancelled") {
      stopPolling();
    }
  }, [status]);

  // Clean up blob URLs
  useEffect(() => {
    return () => {
      if (outputImage?.startsWith("blob:")) {
        URL.revokeObjectURL(outputImage);
      }
    };
  }, [outputImage]);

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
          result={outputImage || ''}
          isProcessing={isProcessing}
          onImageSelect={setInputImage}
          onUrlChange={(e) => setInputImage(e.target.value)}
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
            // onCancel={handleCancel}
            // error={error}
          />
        </div>
      </div>
    </div>
  );
}

export default App;