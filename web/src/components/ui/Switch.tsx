import { cn } from '@/lib/utils';

interface SwitchProps {
  checked: boolean;
  onChange: (checked: boolean) => void;
  label: string;
}

export function Switch({ checked, onChange, label }: SwitchProps) {
  return (
    <button
      role="switch"
      aria-checked={checked}
      aria-label={label}
      onClick={() => onChange(!checked)}
      className={cn(
        'relative h-8 w-[52px] shrink-0 rounded-full transition-colors duration-200',
        checked ? 'bg-action' : 'bg-line',
      )}
    >
      <span
        className={cn(
          'absolute top-1 left-1 h-6 w-6 rounded-full bg-white shadow transition-transform duration-300 ease-[var(--ease-out-expo)]',
          checked && 'translate-x-5',
        )}
      />
    </button>
  );
}

export default Switch;
