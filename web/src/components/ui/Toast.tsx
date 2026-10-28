'use client';

import { useEffect } from 'react';

export function Toast({ message, onDone }: { message: string; onDone: () => void }) {
  useEffect(() => {
    if (!message) return;
    const timer = window.setTimeout(onDone, 2200);
    return () => window.clearTimeout(timer);
  }, [message, onDone]);

  if (!message) return null;

  return (
    <div
      role="status"
      className="fixed inset-x-0 bottom-[calc(var(--nav-height)+var(--safe-bottom)+16px)] z-[70] flex justify-center px-4"
    >
      <div className="animate-pop rounded-full bg-ink px-5 py-3 text-sm font-semibold text-white shadow-lg">{message}</div>
    </div>
  );
}

export default Toast;
