import React, { useCallback, useRef, useState } from "react";
import { PreviewContainer } from "./PreviewContainer";

interface ImageGridProps {
  imageUrl: string;
  result: string;
  isProcessing: boolean;
  onImageSelect: (url: string) => void;
  onUrlChange: (e: React.ChangeEvent<HTMLInputElement>) => void;
}

export function ImageGrid({
  imageUrl,
  result,
  isProcessing,
  onImageSelect,
}: ImageGridProps) {
  const [isComparing, setIsComparing] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement | null>(null);

  const handleDownload = async (url: string) => {
    try {
      const response = await fetch(url);
      const blob = await response.blob();
      const blobUrl = window.URL.createObjectURL(blob);
      const link = document.createElement("a");
      link.href = blobUrl;
      link.download = "enhanced-image.jpg";
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      window.URL.revokeObjectURL(blobUrl);
    } catch (error) {
      console.error("Download failed:", error);
    }
  };

  // Convert a File to a base64 data URL and pass it to onImageSelect
  const fileToBase64 = (file: File): Promise<string> =>
    new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = () => resolve(String(reader.result));
      reader.onerror = reject;
      reader.readAsDataURL(file);
    });

  const handleFileUpload = useCallback(
    async (file: File) => {
      if (!file || !file.type.startsWith("image/")) return;
      setIsUploading(true);
      try {
        const dataUrl = await fileToBase64(file);
        onImageSelect(dataUrl); // This sets imageUrl in parent, which immediately shows the preview
        return dataUrl;
      } catch (error) {
        console.error("Failed to load image:", error);
        throw error;
      } finally {
        setIsUploading(false);
      }
    },
    [onImageSelect]
  );

  const handleDrop = useCallback(
    (e: React.DragEvent) => {
      e.preventDefault();
      const file = e.dataTransfer.files[0];
      if (file && file.type.startsWith("image/")) {
        void handleFileUpload(file);
      }
    },
    [handleFileUpload]
  );

  const handleDragOver = useCallback((e: React.DragEvent) => {
    e.preventDefault();
  }, []);

  const triggerFilePicker = () => {
    fileInputRef.current?.click();
  };

  if (isComparing && imageUrl && (result as any)?.outputUrl) {
    return (
      <div className="space-y-4">
        <PreviewContainer
          imageUrl={imageUrl}
          result={result as any}
          onBack={() => setIsComparing(false)}
        />
      </div>
    );
  }

  return (
    <div className="space-y-8">
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
        {/* Input Image Container */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-200">Input Image</h3>
            </div>

            {!imageUrl ? (
              <div className="justify-center">
                {/* Upload Area */}
                <div className="w-full h-full">
                  <label
                    onClick={triggerFilePicker}
                    onDrop={handleDrop}
                    onDragOver={handleDragOver}
                    className="relative block w-full h-48 rounded-xl overflow-hidden group cursor-pointer"
                  >
                    <input
                      ref={fileInputRef}
                      type="file"
                      className="hidden"
                      accept="image/*"
                      onChange={(e) => {
                        const file = e.currentTarget.files?.[0];
                        if (file) {
                          void handleFileUpload(file);
                          // Allow selecting the same file again
                          e.currentTarget.value = "";
                        }
                      }}
                    />
                    <div className="absolute inset-0 bg-gradient-to-br from-emerald-500/5 to-emerald-500/10 group-hover:from-emerald-500/10 group-hover:to-emerald-500/20 transition-all duration-300" />
                    <div className="absolute inset-1 border-2 border-dashed border-emerald-500/20 group-hover:border-emerald-500/40 rounded-lg transition-colors duration-300" />
                    <div className="absolute inset-0 flex flex-col items-center justify-center text-gray-400 group-hover:text-emerald-400 transition-colors duration-300">
                      {isUploading ? (
                        <>
                          <svg
                            className="animate-spin h-8 w-8 mb-2 opacity-75"
                            xmlns="http://www.w3.org/2000/svg"
                            fill="none"
                            viewBox="0 0 24 24"
                          >
                            <circle
                              className="opacity-25"
                              cx="12"
                              cy="12"
                              r="10"
                              stroke="currentColor"
                              strokeWidth="4"
                            ></circle>
                            <path
                              className="opacity-75"
                              fill="currentColor"
                              d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                            ></path>
                          </svg>
                          <p className="text-sm font-medium">Loading...</p>
                        </>
                      ) : (
                        <>
                          <svg
                            className="w-8 h-8 mb-2 opacity-50 group-hover:opacity-75 transition-opacity duration-300"
                            fill="none"
                            viewBox="0 0 24 24"
                            stroke="currentColor"
                          >
                            <path
                              strokeLinecap="round"
                              strokeLinejoin="round"
                              strokeWidth={1.5}
                              d="M7 16a4 4 0 01-.88-7.903A5 5 0 1115.9 6L16 6a5 5 0 011 9.9M15 13l-3-3m0 0l-3 3m3-3v12"
                            />
                          </svg>
                          <p className="text-sm font-medium">Drop image here</p>
                          <p className="text-xs opacity-75 mt-1">
                            or click to browse
                          </p>
                        </>
                      )}
                    </div>
                  </label>
                </div>
              </div>
            ) : (
              <div className="rounded-xl overflow-hidden shadow-lg aspect-square">
                <img
                  src={imageUrl}
                  alt="Input"
                  className="w-full h-full object-cover"
                />
              </div>
            )}
          </div>
        </div>

        {/* Output Image */}
        <div className="bg-gray-800 rounded-2xl shadow-xl p-8 transition-all duration-300 hover:shadow-2xl border border-gray-700">
          <div className="space-y-4">
            <div className="flex items-center justify-between">
              <h3 className="text-lg font-medium text-gray-200">
                Output Image
              </h3>
              <div className="flex items-center gap-3">
                {(result as any)?.outputUrl && <span />}
                <span className="px-3 py-1 text-sm font-medium text-indigo-400 bg-indigo-500/20 rounded-full">
                  AI Generated
                </span>
              </div>
            </div>
            <div className="relative rounded-xl overflow-hidden shadow-lg aspect-square">
              {(result as any)?.outputUrl ? (
                <>
                  <img
                    src={(result as any).outputUrl}
                    alt="Output"
                    className="w-full h-full object-cover"
                  />
                  <button
                    onClick={() => handleDownload((result as any).outputUrl!)}
                    className="absolute bottom-4 right-4 p-2 rounded-full bg-gray-800/50 hover:bg-gray-700/50 text-white transition-colors duration-200"
                    title="Download image"
                  >
                    <svg
                      className="w-5 h-5"
                      fill="none"
                      viewBox="0 0 24 24"
                      stroke="currentColor"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth={2}
                        d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4"
                      />
                    </svg>
                  </button>
                </>
              ) : (
                <div className="w-full h-full bg-gray-700/50 flex items-center justify-center">
                  {isProcessing ? (
                    <div className="text-center space-y-3">
                      <div className="relative">
                        <div className="w-12 h-12 border-4 border-indigo-400/30 rounded-full"></div>
                        <div className="absolute top-0 w-12 h-12 border-4 border-t-indigo-400 rounded-full animate-spin"></div>
                      </div>
                      <p className="text-gray-400">Processing image...</p>
                    </div>
                  ) : (
                    <div className="text-center text-gray-400">
                      <svg
                        className="w-12 h-12 mx-auto mb-3 opacity-50"
                        fill="none"
                        viewBox="0 0 24 24"
                        stroke="currentColor"
                      >
                        <path
                          strokeLinecap="round"
                          strokeLinejoin="round"
                          strokeWidth={1.5}
                          d="M9.813 15.904L9 18.75l-.813-2.846a4.5 4.5 0 00-3.09-3.09L2.25 12l2.846-.813a4.5 4.5 0 003.09-3.09L9 5.25l.813 2.846a4.5 4.5 0 003.09 3.09L15.75 12l-2.846.813a4.5 4.5 0 00-3.09 3.09zM18.259 8.715L18 9.75l-.259-1.035a3.375 3.375 0 00-2.455-2.456L14.25 6l1.036-.259a3.375 3.375 0 002.455-2.456L18 2.25l.259 1.035a3.375 3.375 0 002.456 2.456L21.75 6l-1.035.259a3.375 3.375 0 00-2.456 2.456zM16.894 20.567L16.5 21.75l-.394-1.183a2.25 2.25 0 00-1.423-1.423L13.5 18.75l1.183-.394a2.25 2.25 0 001.423-1.423l.394-1.183.394 1.183a2.25 2.25 0 001.423 1.423l1.183.394-1.183.394a2.25 2.25 0 00-1.423 1.423z"
                        />
                      </svg>
                      <p>AI generated image will appear here</p>
                    </div>
                  )}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
