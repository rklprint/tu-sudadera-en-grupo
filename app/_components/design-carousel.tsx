"use client";

import { Children, type ReactNode, useCallback, useEffect, useState } from "react";
import useEmblaCarousel from "embla-carousel-react";
import { ArrowLeft, ArrowRight } from "lucide-react";

export function DesignCarousel({ children }: { children: ReactNode }) {
  const slides = Children.toArray(children);
  const [viewportRef, emblaApi] = useEmblaCarousel({
    align: "start",
    containScroll: "trimSnaps",
    slidesToScroll: 1,
  });
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [scrollSnaps, setScrollSnaps] = useState<number[]>([]);
  const [canScrollPrev, setCanScrollPrev] = useState(false);
  const [canScrollNext, setCanScrollNext] = useState(false);

  const updateState = useCallback(() => {
    if (!emblaApi) return;
    setScrollSnaps(emblaApi.scrollSnapList());
    setSelectedIndex(emblaApi.selectedScrollSnap());
    setCanScrollPrev(emblaApi.canScrollPrev());
    setCanScrollNext(emblaApi.canScrollNext());
  }, [emblaApi]);

  useEffect(() => {
    if (!emblaApi) return;
    const frame = window.requestAnimationFrame(updateState);
    emblaApi.on("select", updateState).on("reInit", updateState);
    return () => {
      window.cancelAnimationFrame(frame);
      emblaApi.off("select", updateState).off("reInit", updateState);
    };
  }, [emblaApi, updateState]);

  return (
    <div className="design-carousel" role="region" aria-roledescription="carrusel" aria-label="Diseños de ejemplo">
      <div className="design-carousel-toolbar">
        <p aria-live="polite">
          Diseño <strong>{String(selectedIndex + 1).padStart(2, "0")}</strong> de {String(slides.length).padStart(2, "0")}
        </p>
        <div>
          <button type="button" onClick={() => emblaApi?.scrollPrev()} disabled={!canScrollPrev} aria-label="Ver diseño anterior">
            <ArrowLeft aria-hidden="true" />
          </button>
          <button type="button" onClick={() => emblaApi?.scrollNext()} disabled={!canScrollNext} aria-label="Ver diseño siguiente">
            <ArrowRight aria-hidden="true" />
          </button>
        </div>
      </div>
      <div className="design-carousel-viewport" ref={viewportRef}>
        <div className="design-carousel-track">
          {slides.map((slide, index) => (
            <div
              className="design-carousel-slide"
              key={index}
              role="group"
              aria-roledescription="diapositiva"
              aria-label={`${index + 1} de ${slides.length}`}
            >
              {slide}
            </div>
          ))}
        </div>
      </div>
      <div className="design-carousel-dots" aria-label="Elegir diseño">
        {scrollSnaps.map((_, index) => (
          <button
            type="button"
            key={index}
            className={index === selectedIndex ? "active" : ""}
            onClick={() => emblaApi?.scrollTo(index)}
            aria-label={`Ir al diseño ${index + 1}`}
            aria-current={index === selectedIndex ? "true" : undefined}
          />
        ))}
      </div>
    </div>
  );
}
