'use client';

import { useEffect, type ReactNode } from 'react';
import { useBackButton } from '@/hooks/useTelegram';
import Icon from './Icon';

interface BottomSheetProps {
  open: boolean;
  onClose: () => void;
  children: ReactNode;
  /** Pastga yopishtirilgan tugma (Sticky CTA) */
  footer?: ReactNode;
  title?: string;
  /** Kontent yuqori chetgacha (rasm uchun) — sarlavha va ichki chekka yo'q */
  bleed?: boolean;
}

export function BottomSheet({ open, onClose, children, footer, title, bleed }: BottomSheetProps) {
  useBackButton(open, onClose);

  useEffect(() => {
    if (!open) return;
    const previous = document.body.style.overflow;
    document.body.style.overflow = 'hidden';

    const onKey = (event: KeyboardEvent) => event.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);

    return () => {
      document.body.style.overflow = previous;
      window.removeEventListener('keydown', onKey);
    };
  }, [open, onClose]);

  if (!open) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={title}>
      <div className="absolute inset-0 animate-fade-in bg-ink/50" onClick={onClose} />

      <div className="absolute inset-x-0 bottom-0 mx-auto flex max-h-[94vh] max-w-lg animate-sheet-up flex-col overflow-hidden rounded-t-[28px] bg-bg">
        {bleed ? (
          <button
            onClick={onClose}
            aria-label="Yopish"
            className="absolute top-3 right-3 z-10 grid h-10 w-10 place-items-center rounded-full bg-white/90 text-ink shadow-[var(--shadow-card)] backdrop-blur"
          >
            <Icon name="close" size={20} />
          </button>
        ) : (
          <>
            <div className="flex justify-center pt-2.5 pb-1">
              <span className="h-1.5 w-10 rounded-full bg-line" />
            </div>
            {title && (
              <div className="flex items-center justify-between px-5 pt-1 pb-2">
                <h2 className="text-[19px] font-extrabold tracking-tight">{title}</h2>
                <button
                  onClick={onClose}
                  aria-label="Yopish"
                  className="grid h-9 w-9 place-items-center rounded-full bg-surface text-muted"
                >
                  <Icon name="close" size={18} />
                </button>
              </div>
            )}
          </>
        )}

        <div className={bleed ? 'no-scrollbar flex-1 overflow-y-auto pb-4' : 'no-scrollbar flex-1 overflow-y-auto px-5 pb-4'}>
          {children}
        </div>

        {footer && (
          <div className="border-t border-line bg-bg px-5 pt-3 pb-[calc(12px+var(--safe-bottom))]">{footer}</div>
        )}
      </div>
    </div>
  );
}

export default BottomSheet;
