import { cn } from '@/lib/utils';
import Icon from './Icon';

interface StepperProps {
  value: number;
  onChange: (value: number) => void;
  min?: number;
  max?: number;
  size?: 'sm' | 'md';
  tone?: 'surface' | 'action';
  /** To'liq kenglikda (kartochka tugmasi o'rnida) */
  block?: boolean;
}

export function Stepper({ value, onChange, min = 0, max = 50, size = 'md', tone = 'surface', block }: StepperProps) {
  const dim = size === 'sm' ? 'h-8 w-8' : 'h-10 w-10';
  const button = cn(
    'grid place-items-center rounded-full transition active:scale-90 disabled:opacity-35',
    dim,
    tone === 'action' ? 'text-white' : 'text-ink',
  );

  return (
    <div
      className={cn(
        'items-center',
        block ? 'flex h-10 w-full justify-between rounded-2xl px-0.5' : 'inline-flex rounded-full',
        tone === 'action' ? 'bg-action text-white' : 'bg-surface',
      )}
    >
      <button className={button} onClick={() => onChange(value - 1)} disabled={value <= min} aria-label="Kamaytirish">
        <Icon name="minus" size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />
      </button>
      <span
        key={value}
        className={cn('tabular min-w-6 animate-pop text-center font-extrabold', size === 'sm' ? 'text-[14px]' : 'text-[16px]')}
      >
        {value}
      </span>
      <button className={button} onClick={() => onChange(value + 1)} disabled={value >= max} aria-label="Ko‘paytirish">
        <Icon name="plus" size={size === 'sm' ? 16 : 18} strokeWidth={2.5} />
      </button>
    </div>
  );
}

export default Stepper;
