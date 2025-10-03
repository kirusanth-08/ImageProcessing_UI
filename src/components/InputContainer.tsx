import React from 'react';
import { ToggleButton } from './ToggleButton';
import type { ImageProcessingOptions, ProcessingSettings } from '../types';

interface InputContainerProps {
  imageUrl: string;
  options: ImageProcessingOptions;
  settings: ProcessingSettings;
  isProcessing: boolean;
  progress: number;
  onSubmit: (e: React.FormEvent, isPro: boolean) => void;
  onOptionChange: (key: keyof ImageProcessingOptions, value: boolean) => void;
  onSettingChange: (key: keyof ProcessingSettings, value: number | string) => void;
  // onCancel: () => void;
}

const Slider = ({ 
  label, 
  icon, 
  value, 
  onChange, 
  min, 
  max, 
  step = 0.1,
  tooltip
}: { 
  label: string;
  icon: string;
  value: number;
  onChange: (value: number) => void;
  min: number;
  max: number;
  step?: number;
  tooltip?: string;
}) => (
  <div className="space-y-1">
    <div className="flex items-center justify-between">
      <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
        <span>{icon}</span>
        <span>{label}</span>
      </label>
      <span className="text-sm text-gray-400">{value.toFixed(1)}</span>
    </div>
    <input
      type="range"
      value={value}
      onChange={(e) => onChange(parseFloat(e.target.value))}
      min={min}
      max={max}
      step={step}
      className="w-full h-1.5 bg-gray-600 rounded-lg appearance-none cursor-pointer accent-blue-500"
      title={tooltip}
    />
  </div>
);

export function InputContainer({
  imageUrl,
  options,
  settings,
  isProcessing,
  progress,
  onSubmit,
  onOptionChange,
  onSettingChange,
  // onCancel
}: InputContainerProps) {
  return (
    <div className="bg-gray-800 rounded-2xl shadow-xl p-6 transition-all duration-300 hover:shadow-2xl border border-gray-700">
      <form className="space-y-6">
        {/* Text-Based Prompts */}
        {/* <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Text Prompts</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <span>🎯</span>
                <span>Positive Prompt</span>
              </label>
              <textarea
                value={settings.positivePrompt}
                onChange={(e) => onSettingChange('positivePrompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 min-h-[80px] resize-y"
                placeholder="Enter positive prompts..."
              />
            </div>
            <div className="space-y-2">
              <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                <span>🚫</span>
                <span>Negative Prompt</span>
              </label>
              <textarea
                value={settings.negativePrompt}
                onChange={(e) => onSettingChange('negativePrompt', e.target.value)}
                className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500 min-h-[80px] resize-y"
                placeholder="Enter negative prompts..."
              />
            </div>
          </div>
        </div> */}

        {/* General Settings */}
        <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">General Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            {/* <Slider
              label="CFG"
              icon="⚙️"
              value={settings.cfg}
              onChange={(value) => onSettingChange('cfg', value)}
              min={0}
              max={5}
              tooltip="Configuration scale factor"
            /> */}
            <Slider
              label="Sampling Steps"
              icon="🔄"
              value={settings.samplingSteps}
              onChange={(value) => onSettingChange('samplingSteps', value)}
              min={1}
              max={100}
              step={1}
              tooltip="Number of sampling steps"
            />
            <Slider
              label="Denoise"
              icon="🛠️"
              value={settings.denoise}
              onChange={(value) => onSettingChange('denoise', value)}
              min={0}
              max={1}
              tooltip="Denoising strength"
            />
            <Slider
              label="CFG"
              icon="💪"
              value={settings.cfg}
              onChange={(value) => onSettingChange('cfg', value)}
              min={0}
              max={5}
              tooltip="LoRA model strength"
            />
          </div>
        </div>

        {/* LoRA Settings */}
        {/* <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">LoRA Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <Slider
              label="LoRA Strength Model"
              icon="💪"
              value={settings.loraStrengthModel}
              onChange={(value) => onSettingChange('loraStrengthModel', value)}
              min={0}
              max={5}
              tooltip="LoRA model strength"
            />
            <Slider
              label="LoRA Strength Clip"
              icon="🎛️"
              value={settings.loraStrengthClip}
              onChange={(value) => onSettingChange('loraStrengthClip', value)}
              min={0}
              max={5}
              tooltip="LoRA clip strength"
            />
          </div>
        </div> */}

        {/* Detail Settings */}
        {/* <div className="space-y-4">
          <h3 className="text-lg font-medium text-gray-200">Detail Settings</h3>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            <div className="space-y-4">
              <Slider
                label="Confidence"
                icon="🔍"
                value={settings.confidence}
                onChange={(value) => onSettingChange('confidence', value)}
                min={0}
                max={1}
                tooltip="Confidence threshold"
              />
              <div className="space-y-1">
                <label className="flex items-center gap-2 text-sm font-medium text-gray-300">
                  <span>🧠</span>
                  <span>Detail Method</span>
                </label>
                <select
                  value={settings.detailMethod}
                  onChange={(e) => onSettingChange('detailMethod', e.target.value)}
                  className="w-full px-3 py-2 bg-gray-700 border border-gray-600 rounded-lg text-gray-200 text-sm focus:border-blue-500 focus:ring-blue-500"
                >
                  <option value="VITMatte(local)">VITMatte (local)</option>
                  <option value="GuidedFilter">Guided Filter</option>
                  <option value="VITMatte">VITMatte</option>
                  <option value="PyMatting">PyMatting</option>
                </select>
              </div>
            </div>
            <div className="grid grid-cols-2 gap-4">
              <Slider
                label="Detail Erode"
                icon="⬇️"
                value={settings.detailErode}
                onChange={(value) => onSettingChange('detailErode', value)}
                min={0}
                max={20}
                step={1}
                tooltip="Erosion amount"
              />
              <Slider
                label="Detail Dilate"
                icon="⬆️"
                value={settings.detailDilate}
                onChange={(value) => onSettingChange('detailDilate', value)}
                min={0}
                max={20}
                step={1}
                tooltip="Dilation amount"
              />
              <Slider
                label="Black Point"
                icon="⚫"
                value={settings.blackPoint}
                onChange={(value) => onSettingChange('blackPoint', value)}
                min={0}
                max={1}
                tooltip="Black point intensity"
              />
              <Slider
                label="White Point"
                icon="⚪"
                value={settings.whitePoint}
                onChange={(value) => onSettingChange('whitePoint', value)}
                min={0}
                max={1}
                tooltip="White point intensity"
              />
            </div>
          </div>
        </div> */}

        {/* Masking Features */}
        <div>
          <div className="flex items-center justify-between mb-4">
            <h3 className="text-lg font-medium text-gray-200">Masking</h3>
            <button
              type="button"
              onClick={() => {
                Object.keys(options).forEach((key) => {
                  onOptionChange(key as keyof ImageProcessingOptions, false);
                });
              }}
              className="text-xs text-gray-400 hover:text-gray-300 transition-colors duration-200"
            >
              Reset all
            </button>
          </div>
          <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-6 gap-x-8 gap-y-2 px-2">
            <ToggleButton
              enabled={options.background}
              onChange={(enabled) => onOptionChange('background', enabled)}
              label="Background"
            />
            <ToggleButton
              enabled={options.skin}
              onChange={(enabled) => onOptionChange('skin', enabled)}
              label="Skin"
            />
            <ToggleButton
              enabled={options.nose}
              onChange={(enabled) => onOptionChange('nose', enabled)}
              label="Nose"
            />
            <ToggleButton
              enabled={options.eye_g}
              onChange={(enabled) => onOptionChange('eye_g', enabled)}
              label="Eye General"
            />
            <ToggleButton
              enabled={options.l_eye}
              onChange={(enabled) => onOptionChange('l_eye', enabled)}
              label="Left Eye"
            />
            <ToggleButton
              enabled={options.r_eye}
              onChange={(enabled) => onOptionChange('r_eye', enabled)}
              label="Right Eye"
            />
            <ToggleButton
              enabled={options.l_brow}
              onChange={(enabled) => onOptionChange('l_brow', enabled)}
              label="Left Brow"
            />
            <ToggleButton
              enabled={options.r_brow}
              onChange={(enabled) => onOptionChange('r_brow', enabled)}
              label="Right Brow"
            />
            <ToggleButton
              enabled={options.l_ear}
              onChange={(enabled) => onOptionChange('l_ear', enabled)}
              label="Left Ear"
            />
            <ToggleButton
              enabled={options.r_ear}
              onChange={(enabled) => onOptionChange('r_ear', enabled)}
              label="Right Ear"
            />
            <ToggleButton
              enabled={options.ear_r}
              onChange={(enabled) => onOptionChange('ear_r', enabled)}
              label="Ear Ring"
            />
            <ToggleButton
              enabled={options.mouth}
              onChange={(enabled) => onOptionChange('mouth', enabled)}
              label="Mouth"
            />
            <ToggleButton
              enabled={options.u_lip}
              onChange={(enabled) => onOptionChange('u_lip', enabled)}
              label="Upper Lip"
            />
            <ToggleButton
              enabled={options.l_lip}
              onChange={(enabled) => onOptionChange('l_lip', enabled)}
              label="Lower Lip"
            />
            <ToggleButton
              enabled={options.hair}
              onChange={(enabled) => onOptionChange('hair', enabled)}
              label="Hair"
            />
            <ToggleButton
              enabled={options.hat}
              onChange={(enabled) => onOptionChange('hat', enabled)}
              label="Hat"
            />
            <ToggleButton
              enabled={options.neck}
              onChange={(enabled) => onOptionChange('neck', enabled)}
              label="Neck"
            />
            <ToggleButton
              enabled={options.neck_l}
              onChange={(enabled) => onOptionChange('neck_l', enabled)}
              label="Neck Line"
            />
            <ToggleButton
              enabled={options.cloth}
              onChange={(enabled) => onOptionChange('cloth', enabled)}
              label="Clothing"
            />
          </div>
        </div>

        <div className="flex justify-end pt-2">
          <button
            onClick={(e) => onSubmit(e as React.FormEvent, true)}
            disabled={isProcessing || !imageUrl}
            className={`relative overflow-hidden px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 mx-3 ${
              isProcessing || !imageUrl
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            <span className="relative flex items-center justify-center gap-2">
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span>Pro</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </span>
            
            {isProcessing && (
              <div
                style={{ width: `${progress}%` }}
                className="absolute bottom-0 left-0 h-0.5 bg-violet-400/50 transition-all duration-200"
              />
            )}
          </button>
          <button
            onClick={(e) => onSubmit(e as React.FormEvent, false)}
            type="button"
            disabled={isProcessing || !imageUrl}
            className={`relative overflow-hidden px-6 py-2 rounded-lg text-white font-medium transition-all duration-300 ${
              isProcessing || !imageUrl
                ? 'bg-gray-600 cursor-not-allowed'
                : 'bg-gradient-to-r from-violet-600 to-indigo-600 hover:from-violet-500 hover:to-indigo-500 hover:shadow-lg hover:shadow-indigo-500/25 transform hover:-translate-y-0.5'
            }`}
          >
            <span className="relative flex items-center justify-center gap-2">
              {isProcessing ? (
                <>
                  <svg className="animate-spin h-4 w-4" xmlns="http://www.w3.org/2000/svg" fill="none" viewBox="0 0 24 24">
                    <circle className="opacity-25" cx="12" cy="12" r="10" stroke="currentColor" strokeWidth="4"></circle>
                    <path className="opacity-75" fill="currentColor" d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"></path>
                  </svg>
                  Processing...
                </>
              ) : (
                <>
                  <span>Generate</span>
                  <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                  </svg>
                </>
              )}
            </span>
            
            {isProcessing && (
              <div
                style={{ width: `${progress}%` }}
                className="absolute bottom-0 left-0 h-0.5 bg-violet-400/50 transition-all duration-200"
              />
            )}
          </button>
        </div>
      </form>
    </div>
  );
}