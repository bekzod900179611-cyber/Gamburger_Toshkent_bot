import type { InputHTMLAttributes, ReactNode, TextareaHTMLAttributes } from 'react';
import { cn } from '@/lib/utils';

const FIELD =
  'w-full rounded-2xl border border-transparent bg-surface px-4 text-[15px] text-ink placeholder:text-muted/80 outline-none transition focus:border-action focus:bg-white focus:ring-4 focus:ring-action/10';

interface FieldProps {
  label: string;
  hint?: ReactNode;
  action?: ReactNode;
}

export function Input({
  label,
  hint,
  action,
  className,
  id,
  ...rest
}: FieldProps & InputHTMLAttributes<HTMLInputElement>) {
  const inputId = id || `field-${label}`;
  return (
    <div className={cn('mb-3.5', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-bold text-muted">
          {label}
        </label>
        {action}
      </div>
      <input id={inputId} {...rest} className={cn(FIELD, 'h-12')} />
      {hint && <div className="mt-1.5 text-[12.5px] text-muted">{hint}</div>}
    </div>
  );
}

export function Textarea({
  label,
  hint,
  action,
  className,
  id,
  ...rest
}: FieldProps & TextareaHTMLAttributes<HTMLTextAreaElement>) {
  const inputId = id || `field-${label}`;
  return (
    <div className={cn('mb-3.5', className)}>
      <div className="mb-1.5 flex items-center justify-between gap-2">
        <label htmlFor={inputId} className="text-[13px] font-bold text-muted">
          {label}
        </label>
        {action}
      </div>
      <textarea id={inputId} rows={2} {...rest} className={cn(FIELD, 'resize-none py-3 leading-snug')} />
      {hint && <div className="mt-1.5 text-[12.5px] text-muted">{hint}</div>}
    </div>
  );
}

export default Input;
