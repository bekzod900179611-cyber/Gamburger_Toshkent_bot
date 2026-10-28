'use client';

import { useEffect, useState } from 'react';
import { cn } from '@/lib/utils';
import { useTelegram, useBackButton } from '@/hooks/useTelegram';
import Icon from '@/components/ui/Icon';

export interface Story {
  id: string;
  label: string;
  title: string;
  text: string;
  image?: string;
  /** Bosilganda katalogdagi shu kategoriyani ochish */
  category?: string;
}

const STORAGE_KEY = 'gamburger-stories-seen';
const DURATION_MS = 5000;

function readSeen(): string[] {
  try {
    return JSON.parse(localStorage.getItem(STORAGE_KEY) || '[]');
  } catch {
    return [];
  }
}

function thumb(src: string, width: number) {
  return src.replace(/([?&])w=\d+/, `$1w=${width}`);
}

interface StoriesProps {
  items: Story[];
  onOpenCategory?: (category: string) => void;
}

export function Stories({ items, onOpenCategory }: StoriesProps) {
  const { haptic } = useTelegram();
  const [active, setActive] = useState<number | null>(null);
  const [seen, setSeen] = useState<string[]>([]);

  useEffect(() => setSeen(readSeen()), []);

  const markSeen = (id: string) => {
    setSeen((prev) => {
      if (prev.includes(id)) return prev;
      const next = [...prev, id];
      try {
        localStorage.setItem(STORAGE_KEY, JSON.stringify(next));
      } catch {
        // ignore
      }
      return next;
    });
  };

  return (
    <>
      <div className="no-scrollbar -mx-4 flex gap-3 overflow-x-auto px-4 py-3">
        {items.map((story, index) => {
          const isSeen = seen.includes(story.id);
          return (
            <button
              key={story.id}
              onClick={() => {
                haptic('light');
                setActive(index);
              }}
              className="flex w-[72px] shrink-0 flex-col items-center gap-1.5"
            >
              <span className={cn('rounded-full p-[2.5px]', isSeen ? 'bg-line' : 'bg-action')}>
                <span className="block rounded-full bg-white p-[2px]">
                  {/* eslint-disable-next-line @next/next/no-img-element */}
                  <img
                    src={story.image ? thumb(story.image, 160) : ''}
                    alt=""
                    className="h-[62px] w-[62px] rounded-full bg-surface object-cover"
                  />
                </span>
              </span>
              <span className={cn('w-full truncate text-center text-[11.5px] font-bold', isSeen && 'text-muted')}>
                {story.label}
              </span>
            </button>
          );
        })}
      </div>

      {active !== null && (
        <StoryViewer
          items={items}
          startIndex={active}
          onSeen={markSeen}
          onClose={() => setActive(null)}
          onOpenCategory={(category) => {
            setActive(null);
            onOpenCategory?.(category);
          }}
        />
      )}
    </>
  );
}

interface StoryViewerProps {
  items: Story[];
  startIndex: number;
  onSeen: (id: string) => void;
  onClose: () => void;
  onOpenCategory: (category: string) => void;
}

function StoryViewer({ items, startIndex, onSeen, onClose, onOpenCategory }: StoryViewerProps) {
  const [index, setIndex] = useState(startIndex);
  const [progress, setProgress] = useState(0);
  const story = items[index];

  useBackButton(true, onClose);

  useEffect(() => {
    onSeen(items[index].id);
    setProgress(0);
    const started = Date.now();

    const timer = window.setInterval(() => {
      const value = Math.min(100, ((Date.now() - started) / DURATION_MS) * 100);
      setProgress(value);
      if (value >= 100) {
        window.clearInterval(timer);
        if (index < items.length - 1) setIndex(index + 1);
        else onClose();
      }
    }, 50);

    return () => window.clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [index]);

  const prev = () => (index > 0 ? setIndex(index - 1) : onClose());
  const next = () => (index < items.length - 1 ? setIndex(index + 1) : onClose());

  return (
    <div className="fixed inset-0 z-[60] flex animate-fade-in flex-col bg-ink text-white">
      {story.image && (
        // eslint-disable-next-line @next/next/no-img-element
        <img
          key={story.id}
          src={thumb(story.image, 900)}
          alt=""
          className="absolute inset-0 h-full w-full animate-fade-in object-cover"
        />
      )}
      <div className="absolute inset-0 bg-linear-to-b from-black/45 via-transparent to-black/80" />

      <div className="relative flex gap-1 px-3 pt-3">
        {items.map((item, i) => (
          <div key={item.id} className="h-[3px] flex-1 overflow-hidden rounded-full bg-white/35">
            <div className="h-full bg-white" style={{ width: `${i < index ? 100 : i === index ? progress : 0}%` }} />
          </div>
        ))}
      </div>

      <div className="relative flex items-center justify-between px-4 pt-3">
        <span className="text-[14px] font-bold">{story.label}</span>
        <button onClick={onClose} aria-label="Yopish" className="grid h-10 w-10 place-items-center rounded-full bg-black/25">
          <Icon name="close" size={20} />
        </button>
      </div>

      <div className="relative flex-1">
        <div className="absolute inset-0 grid grid-cols-2">
          <button onClick={prev} aria-label="Oldingi" />
          <button onClick={next} aria-label="Keyingi" />
        </div>
      </div>

      <div key={story.id} className="relative animate-rise px-5 pb-[calc(20px+var(--safe-bottom))]">
        <h2 className="text-[30px] leading-[1.1] font-extrabold tracking-[-0.02em]">{story.title}</h2>
        <p className="mt-2 max-w-sm text-[16px] leading-relaxed text-white/90">{story.text}</p>
        {story.category && (
          <button
            onClick={() => onOpenCategory(story.category!)}
            className="mt-5 flex h-14 w-full items-center justify-center gap-2 rounded-2xl bg-white text-[16px] font-extrabold text-ink active:scale-[0.98]"
          >
            Menyuni ko‘rish <Icon name="chevronRight" size={18} />
          </button>
        )}
      </div>
    </div>
  );
}

export default Stories;
