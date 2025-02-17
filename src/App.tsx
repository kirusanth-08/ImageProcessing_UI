import React, { useState } from 'react';
import { ToggleButton } from './components/ToggleButton';
import { ComfyDeploy } from 'comfydeploy';
import type { ImageProcessingOptions, ProcessingResult } from './types';
import ImageComparisonSlider from './components/ImageComparisonSlider';

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
    nose: false,
    mouth: false,
    skin: false,
    hair: false,
    neck: false,
    eyes: false,
  });
  const [result, setResult] = useState<ProcessingResult | null>(null);
  const [isProcessing, setIsProcessing] = useState(false);
  const [progress, setProgress] = useState(0);

  const cd = new ComfyDeploy({
    bearer: import.meta.env.VITE_COMFY_DEPLOY_API_KEY,
  });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!imageUrl) return;
    setIsProcessing(true);
    setProgress(0);
    const progressInterval = setInterval(() => {
      // Increase progress by 1% every 200ms until 90%
      setProgress(prev => (prev < 90 ? prev + 1 : prev));
    }, 200);

    try {
      const response = await cd.run.deployment.queue({
        deploymentId: "b8f6fd00-fe1c-4d7e-ba65-ef7bb8f6b497",
        inputs: {
          "input_image": imageUrl,
          "nose": options.nose,
          "mouth": options.mouth,
          "skin": options.skin,
          "hair": options.hair,
          "neck": options.neck,
          "eyes": options.eyes,
        }
      });

      const data = {
        runId: response.runId
      };
      
      setResult({
        runId: data.runId,
        outputUrl: null,
        status: 'processing'
      });

      const pollInterval = setInterval(async () => {
        const runn = response.runId;
        const statusResponse = await cd.run.get({
          runId: runn
        });

        console.log(statusResponse);
        if (statusResponse.status === 'success' && statusResponse.outputs?.[0]?.data?.images?.[0]?.url) {
          clearInterval(pollInterval);
          clearInterval(progressInterval);
          setProgress(100);
          setResult({
            runId: data.runId,
            outputUrl: statusResponse.outputs[0].data.images[0].url,
            status: 'completed'
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
            error: 'Processing failed'
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
        error: 'Failed to process image'
      });
      setIsProcessing(false);
    }
  };

  return (
    <div className="min-h-screen bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-7xl mx-auto">
        <div className="text-center mb-12">
          <h1 className="text-3xl font-bold text-gray-900">Image Processing Interface</h1>
          <p className="mt-2 text-gray-600">Upload an image and customize processing options</p>
        </div>

        <div className="flex flex-col md:flex-row md:space-x-6">
          <div className="md:w-1/2 bg-white shadow rounded-lg p-6">
            <form onSubmit={handleSubmit} className="space-y-6">
              <div>
                <label htmlFor="imageUrl" className="block text-sm font-medium text-gray-700">
                  Image URL
                </label>
                <input
                  type="url"
                  id="imageUrl"
                  value={imageUrl}
                  onChange={(e) => setImageUrl(e.target.value)}
                  className="mt-1 block w-full rounded-md border-gray-300 shadow-sm focus:border-blue-500 focus:ring-blue-500"
                  placeholder="https://example.com/image.jpg"
                  required
                />
              </div>

              <div className="grid grid-cols-1 sm:grid-cols-2 md:grid-cols-3 gap-4">
                <ToggleButton
                  enabled={options.nose}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, nose: enabled }))}
                  label="Mask Nose"
                />
                <ToggleButton
                  enabled={options.mouth}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, mouth: enabled }))}
                  label="Mask Mouth"
                />
                <ToggleButton
                  enabled={options.skin}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, skin: enabled }))}
                  label="Mask Skin"
                />
                <ToggleButton
                  enabled={options.hair}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, hair: enabled }))}
                  label="Mask Hair"
                />
                <ToggleButton
                  enabled={options.neck}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, neck: enabled }))}
                  label="Mask Neck"
                />
                <ToggleButton
                  enabled={options.eyes}
                  onChange={(enabled) => setOptions(prev => ({ ...prev, eyes: enabled }))}
                  label="Mask Eyes"
                />
              </div>

              <div className="flex justify-center">
                <button
                  type="submit"
                  disabled={isProcessing || !imageUrl}
                  className={`relative overflow-hidden px-4 py-2 rounded-md text-white font-medium ${
                    isProcessing || !imageUrl
                      ? 'bg-gray-400 cursor-not-allowed'
                      : 'bg-blue-600 hover:bg-blue-700'
                  }`}
                >
                  {isProcessing ? 'Processing...' : 'Process Image'}
                  {isProcessing && (
                    <div
                      style={{ width: `${progress}%` }}
                      className="absolute bottom-0 left-0 h-1 bg-green-500 transition-all duration-200"
                    />
                  )}
                </button>
              </div>
            </form>
          </div>

          <div className="md:w-1/2">
            <div className="bg-white shadow rounded-lg p-6">
              {imageUrl && (
                result?.outputUrl ? (
                  <>
                    <h3 className="text-lg font-medium text-gray-900 mb-4">Preview Image</h3>
                    <ImageComparisonSlider before={imageUrl} after={result.outputUrl} />
                  </>
                ) : (
                  <div className="space-y-2">
                    <h3 className="text-lg font-medium text-gray-900">Original Image</h3>
                    <div className="border rounded-lg overflow-hidden">
                      <img
                        src={imageUrl}
                        alt="Original"
                        className="w-full h-auto object-contain"
                      />
                    </div>
                  </div>
                )
              )}

              {result?.status === 'error' && (
                <div className="mt-4 p-4 bg-red-50 rounded-md">
                  <p className="text-red-700">{result.error}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}

export default App;