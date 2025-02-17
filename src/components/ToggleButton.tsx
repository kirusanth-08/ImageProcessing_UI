import { Switch } from '@headlessui/react';
import { clsx } from 'clsx';

interface ToggleButtonProps {
  enabled: boolean;
  onChange: (enabled: boolean) => void;
  label: string;
}

export function ToggleButton({ enabled, onChange, label }: ToggleButtonProps) {
  return (
    <Switch.Group>
      <div className="flex items-center space-x-4">
        <Switch.Label className="text-sm font-medium text-gray-700">{label}</Switch.Label>
        <Switch
          checked={enabled}
          onChange={onChange}
          className={clsx(
            enabled ? 'bg-blue-600' : 'bg-gray-200',
            'relative inline-flex h-6 w-11 items-center rounded-full transition-colors focus:outline-none focus:ring-2 focus:ring-blue-500 focus:ring-offset-2'
          )}
        >
          <span
            className={clsx(
              enabled ? 'translate-x-6' : 'translate-x-1',
              'inline-block h-4 w-4 transform rounded-full bg-white transition-transform'
            )}
          />
        </Switch>
      </div>
    </Switch.Group>
  );
}