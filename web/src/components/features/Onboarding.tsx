'use client';

import { useState } from 'react';
import { cn } from '@/lib/utils';
import { useTelegram } from '@/hooks/useTelegram';
import Button from '@/components/ui/Button';
import Icon, { type IconName } from '@/components/ui/Icon';

interface Slide {
  image: string;
  title: string;
  text: string;
  steps?: { icon: IconName; text: string }[];
}

interface OnboardingProps {
  onFinish: () => void;
  /** Har slayd uchun taom rasmi (menyudan olinadi) */
  images: string[];
}

export function Onboarding({ onFinish, images }: OnboardingProps) {
  const { haptic } = useTelegram();
  const [index, setIndex] = useState(0);

  const slides: Slide[] = [
    {
      image: images[0],
      title: 'Uydan chiqmasdan — grildan to‘g‘ri qo‘lingizga',
      text: 'Burger, lavash, hot-dog… Sevimli fast foodingizni tez va issiqqina yetkazamiz.',
    },
    {
      image: images[1],
      title: 'Uch qadam — va ovqat yo‘lda',
      text: 'Hammasi shu yerning o‘zida, Telegramdan chiqmasdan.',
      steps: [
        { icon: 'search', text: 'Taomni tanlang' },
        { icon: 'pin', text: 'Manzilni kiriting' },
        { icon: 'truck', text: '20–30 daqiqada stolingizda' },
      ],
    },
    {
      image: images[2],
      title: '10,000+ mamnun mijozlarimizga qo‘shiling',
      text: 'Tushlikmi, kechki ovqatmi — burgeringiz yo‘lda. Endi navbat sizda!',
    },
  ];

  const slide = slides[index];
  const isLast = index === slides.length - 1;

  const next = () => {
    haptic(isLast ? 'success' : 'light');
    if (isLast) onFinish();
    else setIndex(index + 1);
  };

  return (
    <div className="mx-auto flex min-h-dvh max-w-lg flex-col bg-bg">
      <div className="relative h-[46vh] min-h-[280px] overflow-hidden">
        {slides.map((item, i) => (
          // eslint-disable-next-line @next/next/no-img-element
          <img
            key={i}
            src={item.image}
            alt=""
            className={cn(
              'absolute inset-0 h-full w-full object-cover transition-[opacity,transform] duration-700',
              i === index ? 'scale-100 opacity-100' : 'scale-105 opacity-0',
            )}
          />
        ))}
        <div className="absolute inset-x-0 bottom-0 h-24 bg-linear-to-t from-bg to-transparent" />
        {!isLast && (
          <button
            onClick={onFinish}
            className="absolute top-4 right-4 rounded-full bg-black/35 px-3.5 py-1.5 text-[13px] font-bold text-white backdrop-blur"
          >
            O‘tkazib yuborish
          </button>
        )}
      </div>

      <div key={index} className="flex flex-1 animate-rise flex-col px-6 pt-2">
        <h1 className="text-[28px] leading-[1.15] font-extrabold tracking-[-0.02em] text-balance">{slide.title}</h1>
        <p className="mt-3 text-[16px] leading-relaxed text-muted">{slide.text}</p>

        {slide.steps && (
          <ol className="stagger mt-5 space-y-2.5">
            {slide.steps.map((step, i) => (
              <li key={step.text} className="flex items-center gap-3.5">
                <span className="grid h-11 w-11 shrink-0 place-items-center rounded-2xl bg-action-soft text-action">
                  <Icon name={step.icon} size={22} />
                </span>
                <span className="text-[16px] font-bold">
                  <span className="text-muted">{i + 1}.</span> {step.text}
                </span>
              </li>
            ))}
          </ol>
        )}
      </div>

      <div className="px-6 pb-[calc(24px+var(--safe-bottom))]">
        <div className="mb-5 flex justify-center gap-2">
          {slides.map((item, i) => (
            <span
              key={item.title}
              className={cn('h-2 rounded-full transition-all duration-300', i === index ? 'w-7 bg-action' : 'w-2 bg-line')}
            />
          ))}
        </div>
        <Button block size="lg" onClick={next} className={cn(isLast && 'tracking-wide')}>
          {isLast ? 'BOSHLASH' : 'Davom etish'}
        </Button>
      </div>
    </div>
  );
}

export default Onboarding;
