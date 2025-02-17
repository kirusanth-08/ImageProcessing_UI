import { Switch } from '@headlessui/react';
import { clsx } from 'clsx';

interface ToggleButtonProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}

const icons = {
  'Background': '🖼️',
  'Skin': '🧴',
  'Nose': '👃',
  'Eye General': '👁️',
  'Left Eye': '👁️‍🗨️',
  'Right Eye': '👁️‍🗨️',
  'Left Brow': '↖️',
  'Right Brow': '↗️',
  'Left Ear': '👂',
  'Right Ear': '👂',
  'Ear Ring': '💍',
  'Mouth': '👄',
  'Upper Lip': '⬆️',
  'Lower Lip': '⬇️',
  'Hair': '💇',
  'Hat': '🎩',
  'Neck': '🧣',
  'Neck Line': '➖',
  'Clothing': '👕',
};

export function ToggleButton({ enabled, onChange, label }: ToggleButtonProps) {
  return (
    <Switch.Group>
      <div className="flex items-center justify-between py-1.5">
        <div className="flex items-center gap-2">
          <span className="text-gray-400">
            {icons[label as keyof typeof icons]}
          </span>
          <Switch.Label className="text-sm font-medium text-gray-300">
            {label}
          </Switch.Label>
        </div>
        <Switch
          checked={enabled}
          onChange={onChange}
          className={clsx(
            'relative inline-flex h-5 w-9 items-center rounded-full transition-all duration-200',
            enabled ? 'bg-blue-600' : 'bg-gray-600'
          )}
        >
          <span className="sr-only">Enable {label}</span>
          <span
            className={clsx(
              'inline-block h-3 w-3 transform rounded-full bg-white transition-transform duration-200',
              enabled ? 'translate-x-5' : 'translate-x-1'
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
}