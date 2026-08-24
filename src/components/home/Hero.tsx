import React, { useState, useEffect } from 'react';
import { Link } from 'react-router-dom';

// ONLY verified local assets from public/hero/
const LOCAL_HERO_SLIDES = [
  {
    id: 'slide-1',
    image: '/hero/hero-soft-cotton-saree.webp',
    title: 'Soft Cotton Saree',
    ctaText: 'SHOP SAREE',
    link: '/women?sub=saree',
  },
  {
    id: 'slide-2',
    image: '/hero/hero-premium-casual-shirt.webp',
    title: 'Premium Casual Shirt',
    ctaText: 'SHOP SHIRTS',
    link: '/men?sub=shirts',
  },
  {
    id: 'slide-3',
    image: '/hero/hero-regular-fit-denim.webp',
    title: 'Regular Fit Denim',
    ctaText: 'SHOP DENIM',
    link: '/shop?category=men&sub=denim',
  },
  {
    id: 'slide-4',
    image: '/hero/timeless-oversize-hero.png',
    title: 'Timeless Oversize Tee Collection',
    ctaText: 'EXPLORE COLLECTION',
    link: '/shop?category=women&sub=oversized-tee',
  }
  // Add additional local images here when available in /public/hero/
];

export const Hero: React.FC = () => {
  const [currentIndex, setCurrentIndex] = useState(0);
  const hasMultipleSlides = LOCAL_HERO_SLIDES.length > 1;

  useEffect(() => {
    if (!hasMultipleSlides) return;

    const timer = setInterval(() => {
      setCurrentIndex((prev) => (prev + 1) % LOCAL_HERO_SLIDES.length);
    }, 4000);

    return () => clearInterval(timer);
  }, [hasMultipleSlides]);

  return (
    <section className="relative w-full bg-[#EAE5DF] overflow-hidden">
      <div className="w-full px-0 sm:px-4 md:px-6">
        <div className="relative w-full h-[60vh] sm:h-[70vh] md:h-[75vh] max-h-[720px] overflow-hidden">
          {LOCAL_HERO_SLIDES.map((slide, index) => {
            const isActive = index === currentIndex;

            return (
              <div
                key={slide.id}
                className={`absolute inset-0 w-full h-full transition-opacity duration-1000 ease-in-out ${
                  isActive ? 'opacity-100 z-10' : 'opacity-0 z-0 pointer-events-none'
                }`}
              >
                <Link className="block relative w-full h-full group" to={slide.link}>
                  <img
                    src={slide.image}
                    alt={slide.title}
                    className="w-full h-full object-cover object-[center_20%] md:object-center transition-transform duration-[3000ms] ease-out md:group-hover:scale-105"
                    loading={index === 0 ? 'eager' : 'lazy'}
                    decoding="async"
                  />

                  {/* CTA — consistently centered at bottom */}
                  <div className="absolute bottom-6 left-1/2 z-20 -translate-x-1/2 sm:bottom-10">
                    <span className="inline-flex items-center justify-center bg-neutral-900/90 backdrop-blur-md text-white text-[11px] sm:text-xs font-semibold tracking-[0.2em] uppercase px-6 py-3 shadow-xl hover:bg-black transition-all">
                      {slide.ctaText} &rarr;
                    </span>
                  </div>
                </Link>
              </div>
            );
          })}

          {hasMultipleSlides && (
            <div className="absolute bottom-3 sm:bottom-4 right-4 sm:right-8 z-30 flex items-center gap-2 bg-black/20 backdrop-blur-md px-3 py-1.5 rounded-full">
              {LOCAL_HERO_SLIDES.map((_, dotIdx) => (
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
          )}
        </div>
      </div>
    </section>
  );
};
