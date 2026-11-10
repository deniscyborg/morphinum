"use client";

import Link from "next/link";
import { useCallback, useEffect, useRef, useState } from "react";
import type { Slide } from "@/config/slides";

const INTERVAL_MS = 6000;

/**
 * Большой баннер на главной: автопрокрутка с паузой при наведении и фокусе,
 * стрелки, точки, свайп и клавиатура. Неактивные слайды скрыты от экранных дикторов и фокуса.
 */
export function HeroSlider({ slides }: { slides: Slide[] }) {
  const [index, setIndex] = useState(0);
  const [paused, setPaused] = useState(false);
  const [reducedMotion, setReducedMotion] = useState(false);
  const touchX = useRef<number | null>(null);
  const count = slides.length;

  const go = useCallback((next: number) => setIndex(((next % count) + count) % count), [count]);

  useEffect(() => {
    const media = window.matchMedia("(prefers-reduced-motion: reduce)");
    const update = () => setReducedMotion(media.matches);
    update();
    media.addEventListener("change", update);
    return () => media.removeEventListener("change", update);
  }, []);

  // Автопрокрутка: выключена при наведении/фокусе и для тех, кто отключил анимацию в системе
  useEffect(() => {
    if (paused || reducedMotion || count < 2) return;
    const timer = window.setTimeout(() => go(index + 1), INTERVAL_MS);
    return () => window.clearTimeout(timer);
  }, [index, paused, reducedMotion, count, go]);

  return (
    <section
      aria-roledescription="carousel"
      aria-label="Главные предложения"
      className="relative -mx-4 overflow-hidden sm:-mx-6 md:mx-0 md:mt-6 md:rounded-3xl"
      onMouseEnter={() => setPaused(true)}
      onMouseLeave={() => setPaused(false)}
      onFocus={() => setPaused(true)}
      onBlur={(e) => {
        if (!e.currentTarget.contains(e.relatedTarget as Node | null)) setPaused(false);
      }}
      onKeyDown={(e) => {
        if (e.key === "ArrowRight") go(index + 1);
        if (e.key === "ArrowLeft") go(index - 1);
      }}
      onTouchStart={(e) => (touchX.current = e.touches[0].clientX)}
      onTouchEnd={(e) => {
        if (touchX.current === null) return;
        const dx = e.changedTouches[0].clientX - touchX.current;
        if (Math.abs(dx) > 40) go(index + (dx < 0 ? 1 : -1));
        touchX.current = null;
      }}
    >
      <div className="relative h-[32rem] sm:h-[36rem] lg:h-[38rem]">
        {slides.map((slide, i) => {
          const active = i === index;
          return (
            <div
              key={slide.id}
              role="group"
              aria-roledescription="slide"
              aria-label={`${i + 1} из ${count}`}
              aria-hidden={!active}
              inert={!active}
              className={`absolute inset-0 transition-opacity duration-700 motion-reduce:transition-none ${
                active ? "z-10 opacity-100" : "z-0 opacity-0"
              }`}
              style={{
                background: slide.image
                  ? `linear-gradient(90deg, rgb(0 0 0 / 0.65), rgb(0 0 0 / 0.15)), url(${slide.image}) center / cover`
                  : `radial-gradient(120% 90% at 85% 20%, color-mix(in srgb, ${slide.colors[0]} 70%, white), transparent 60%), linear-gradient(135deg, ${slide.colors[0]}, ${slide.colors[1]})`,
              }}
            >
              {!slide.image && <Decor />}
              <div className="relative mx-auto flex h-full max-w-6xl flex-col justify-center px-6 pt-10 pb-20 text-white sm:px-10 md:px-24">
                <p className="text-sm tracking-[0.25em] text-white/75 uppercase">{slide.eyebrow}</p>
                <h2 className="mt-4 max-w-xl font-serif text-4xl leading-[1.08] font-semibold sm:text-5xl lg:max-w-[52%] lg:text-6xl">
                  {slide.title}
                </h2>
                <p className="mt-5 max-w-xl text-base leading-relaxed text-white/80 sm:text-lg lg:max-w-[48%]">{slide.text}</p>
                <div className="mt-9">
                  <Link
                    href={slide.cta.href}
                    className="inline-flex items-center rounded-md bg-white px-6 py-3 text-sm font-medium text-[#1c1917] transition-colors hover:bg-white/85"
                  >
                    {slide.cta.label}
                  </Link>
                </div>
              </div>
            </div>
          );
        })}
      </div>

      {count > 1 && (
        <>
          <div className="absolute inset-x-0 bottom-6 z-20 flex justify-center gap-2">
            {slides.map((slide, i) => (
              <button
                key={slide.id}
                type="button"
                onClick={() => go(i)}
                aria-label={`Слайд ${i + 1}: ${slide.eyebrow}`}
                aria-current={i === index}
                className="group flex h-6 items-center px-1"
              >
                <span
                  className={`block h-1.5 rounded-full transition-all ${
                    i === index ? "w-8 bg-white" : "w-3 bg-white/45 group-hover:bg-white/75"
                  }`}
                />
              </button>
            ))}
          </div>
          <Arrow direction="prev" onClick={() => go(index - 1)} />
          <Arrow direction="next" onClick={() => go(index + 1)} />
        </>
      )}
    </section>
  );
}

function Arrow({ direction, onClick }: { direction: "prev" | "next"; onClick: () => void }) {
  const prev = direction === "prev";
  return (
    <button
      type="button"
      onClick={onClick}
      aria-label={prev ? "Предыдущий слайд" : "Следующий слайд"}
      className={`absolute top-1/2 z-20 hidden h-12 w-12 -translate-y-1/2 items-center justify-center rounded-full bg-white/15 text-white backdrop-blur transition-colors hover:bg-white/30 md:flex ${
        prev ? "left-4" : "right-4"
      }`}
    >
      <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" stroke="currentColor" strokeWidth="2" aria-hidden="true">
        <path d={prev ? "M15 5l-7 7 7 7" : "M9 5l7 7-7 7"} strokeLinecap="round" strokeLinejoin="round" />
      </svg>
    </button>
  );
}

/** Декоративные «вешалки с вещами», пока на слайде нет фото */
function Decor() {
  return (
    <div className="pointer-events-none absolute inset-y-0 right-0 hidden w-[42%] items-center justify-center lg:flex" aria-hidden="true">
      <div className="relative h-80 w-80">
        <div className="absolute top-0 left-6 h-72 w-44 rounded-[2rem] bg-white/12 ring-1 ring-white/20" />
        <div className="absolute top-10 left-32 h-72 w-44 rounded-[2rem] bg-black/15 ring-1 ring-white/15" />
        <div className="absolute -top-6 left-12 h-1 w-52 rounded-full bg-white/30" />
      </div>
    </div>
  );
}
