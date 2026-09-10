"use client";

import { useEffect, useRef } from "react";

const revealSelector = [
  ".quick-benefits > article",
  ".audience-directory-heading > *",
  ".audience-directory-grid > a",
  ".customizer-section > .section-heading > *",
  ".customizer-shell",
  ".inspiration-section > .section-heading > *",
  ".design-showcase > .showcase-card",
  ".why-copy > *",
  ".phone-mockup",
  ".payment-copy > *",
  ".payment-gate",
  ".process-heading > *",
  ".process-timeline > article",
  ".price-copy > *",
  ".price-card",
  ".reviews-heading > *",
  ".review-grid > article",
  ".faq-heading > *",
  ".faq-list > details",
  ".final-cta > *",
  ".footer-top > *",
  ".footer-links > div",
  ".audience-hero-copy > *",
  ".audience-visual",
  ".audience-benefits > article",
  ".audience-explainer-visual",
  ".audience-explainer-copy > *",
  ".audience-ideas > header > *",
  ".audience-ideas > div > article",
  ".audience-process > header > *",
  ".audience-process > div > article",
  ".audience-faq > header > *",
  ".audience-faq details",
  ".audience-related a",
  ".audience-cta > *",
  ".flow-page > section",
  ".flow-page > .flow-steps",
].join(",");

const loadSelector = [
  ".hero-copy > *",
  ".audience-hero-copy > *",
].join(",");

export function SiteMotion() {
  const progressRef = useRef<HTMLElement>(null);

  useEffect(() => {
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      return;
    }

    const loadItems = Array.from(
      document.querySelectorAll<HTMLElement>(loadSelector),
    );
    loadItems.forEach((element, index) => {
      element.animate(
        [
          { opacity: 0, transform: "translateY(18px)" },
          { opacity: 1, transform: "translateY(0)" },
        ],
        {
          duration: 520,
          delay: Math.min(index, 5) * 85,
          easing: "cubic-bezier(.22,1,.36,1)",
          fill: "backwards",
        },
      );
    });

    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(revealSelector),
    );

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          const element = entry.target as HTMLElement;
          const siblings = element.parentElement
            ? Array.from(element.parentElement.children)
            : [];
          const siblingIndex = Math.max(0, siblings.indexOf(element));
          element.animate(
            [
              { opacity: 0, transform: "translateY(22px) scale(.992)" },
              { opacity: 1, transform: "translateY(0) scale(1)" },
            ],
            {
              duration: 560,
              delay: Math.min(siblingIndex % 4, 3) * 70,
              easing: "cubic-bezier(.22,1,.36,1)",
              fill: "backwards",
            },
          );
          observer.unobserve(entry.target);
        });
      },
      { threshold: 0.1, rootMargin: "0px 0px -7% 0px" },
    );

    revealItems.forEach((element) => observer.observe(element));

    let frame = 0;
    const updateScrollState = () => {
      const scrollable = Math.max(
        1,
        document.documentElement.scrollHeight - window.innerHeight,
      );
      const progress = Math.min(1, Math.max(0, window.scrollY / scrollable));
      if (progressRef.current) {
        progressRef.current.style.transform = `scaleX(${progress})`;
      }
      document.body.classList.toggle("has-scrolled", window.scrollY > 24);
      frame = 0;
    };

    const requestScrollUpdate = () => {
      if (frame) return;
      frame = window.requestAnimationFrame(updateScrollState);
    };

    const interactiveStages = Array.from(
      document.querySelectorAll<HTMLElement>(".hero-stage, .audience-visual"),
    );
    const pointerHandlers = interactiveStages.map((stage) => {
      const move = (event: PointerEvent) => {
        const bounds = stage.getBoundingClientRect();
        const x = (event.clientX - bounds.left) / bounds.width;
        const y = (event.clientY - bounds.top) / bounds.height;
        stage.style.setProperty("--stage-x", String((x - 0.5) * 2));
        stage.style.setProperty("--stage-y", String((y - 0.5) * 2));
        stage.style.setProperty("--pointer-x", `${x * 100}%`);
        stage.style.setProperty("--pointer-y", `${y * 100}%`);
      };
      const leave = () => {
        stage.style.setProperty("--stage-x", "0");
        stage.style.setProperty("--stage-y", "0");
        stage.style.setProperty("--pointer-x", "50%");
        stage.style.setProperty("--pointer-y", "50%");
      };
      stage.addEventListener("pointermove", move);
      stage.addEventListener("pointerleave", leave);
      return { stage, move, leave };
    });

    window.addEventListener("scroll", requestScrollUpdate, { passive: true });
    window.addEventListener("resize", requestScrollUpdate, { passive: true });
    updateScrollState();

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
      if (frame) window.cancelAnimationFrame(frame);
      pointerHandlers.forEach(({ stage, move, leave }) => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
      });
      document.body.classList.remove("has-scrolled");
    };
  }, []);

  return (
    <div className="site-scroll-progress" aria-hidden="true">
      <i ref={progressRef} />
    </div>
  );
}
