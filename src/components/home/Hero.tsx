import React, { useState, useEffect, useCallback, useRef } from 'react';
import { Link } from 'react-router-dom';
import { CATALOG_IMAGE_PLACEHOLDER } from '../../utils/media';

const HERO_SLIDES = [
  {
    id: 1,
    image: '/hero/timeless-oversize-hero.png',
    title: 'Timeless Oversize Tee Collection',
    ctaText: 'EXPLORE COLLECTION',
    link: '/shop?category=women&sub=oversized-tee',
  },
  {
    id: 2,
    image: 'https://images.unsplash.com/photo-1490481651871-ab68de25d43d?q=80&w=1600&auto=format&fit=crop',
    title: 'New Season Menswear',
    ctaText: 'SHOP MEN',
    link: '/shop?category=men',
  },
  {
    id: 3,
    image: 'https://images.unsplash.com/photo-1515886657613-9f3515b0c78f?q=80&w=1600&auto=format&fit=crop',
    title: 'Festive Luxury Arrivals',
    ctaText: 'DISCOVER NOW',
    link: '/shop?category=women',
  },
];

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const [failedImages, setFailedImages] = useState<Set<number>>(new Set());
  const touchStartX = useRef(0);
  const touchEndX = useRef(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
    }, 3500);

    return () => clearInterval(timer);
  }, []);

  const handleImageError = useCallback((slideId: number) => {
    setFailedImages((prev) => {
      const next = new Set(prev);
      next.add(slideId);
      return next;
    });
  }, []);

  const handleTouchStart = (event: React.TouchEvent) => {
    touchStartX.current = event.touches[0].clientX;
  };

  const handleTouchMove = (event: React.TouchEvent) => {
    touchEndX.current = event.touches[0].clientX;
  };

  const handleTouchEnd = () => {
    const diff = touchStartX.current - touchEndX.current;
    if (Math.abs(diff) > 50) {
      if (diff > 0) {
        setCurrentIndex((prev) => (prev + 1) % HERO_SLIDES.length);
      } else {
        setCurrentIndex((prev) => (prev - 1 + HERO_SLIDES.length) % HERO_SLIDES.length);
      }
    }
  };

  return (
    <section className="relative w-full bg-[#f4f0eb] border-b border-neutral-200/60 overflow-hidden">
      <div className="max-w-7xl mx-auto px-0 sm:px-4 md:px-6">
        <div
          className="relative w-full h-[60vh] sm:h-[70vh] md:h-[75vh] max-h-[720px] overflow-hidden"
          onTouchStart={handleTouchStart}
          onTouchMove={handleTouchMove}
          onTouchEnd={handleTouchEnd}
        >
          {HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;
            const hasFailed = failedImages.has(slide.id);
            const src = hasFailed ? CATALOG_IMAGE_PLACEHOLDER : slide.image;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Link className="block relative w-full h-full group" to={slide.link}>
                  <img
                    src={src}
                    alt={slide.title}
                    className="h-full w-full object-cover object-center transition-transform duration-[3000ms] ease-out group-hover:scale-105"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                    onError={() => handleImageError(slide.id)}
                  />

                  <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-10 sm:left-10 sm:translate-x-0">
                    <span className="inline-flex items-center justify-center bg-neutral-900/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase px-5 py-2.5 sm:px-6 sm:py-3 shadow-xl hover:bg-black transition-all">
                      {slide.ctaText} &rarr;
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

          <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-8 z-30 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
            {HERO_SLIDES.map((_, dotIdx) => (
              <button
                key={dotIdx}
                onClick={() => setCurrentIndex(dotIdx)}
                className={`transition-all duration-300 rounded-full ${
                  dotIdx === currentIndex
                    ? 'w-6 h-1.5 bg-white'
                    : 'w-1.5 h-1.5 bg-white/50 hover:bg-white/80'
                }`}
                aria-label={`Go to slide ${dotIdx + 1}`}
              />
            ))}
          </div>
        </div>
      </div>
    </section>
  );
};
