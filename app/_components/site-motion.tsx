"use client";

import { useEffect } from "react";

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
  useEffect(() => {
    const root = document.documentElement;
    const prefersReducedMotion = window.matchMedia(
      "(prefers-reduced-motion: reduce)",
    ).matches;

    if (prefersReducedMotion) {
      root.classList.add("motion-reduced");
      return () => root.classList.remove("motion-reduced");
    }

    root.classList.add("motion-enabled");

    const loadItems = Array.from(
      document.querySelectorAll<HTMLElement>(loadSelector),
    );
    loadItems.forEach((element, index) => {
      element.classList.add("motion-load-item");
      element.style.setProperty(
        "--motion-load-delay",
        `${Math.min(index, 5) * 85}ms`,
      );
    });

    const revealItems = Array.from(
      document.querySelectorAll<HTMLElement>(revealSelector),
    );
    revealItems.forEach((element) => {
      element.classList.add("reveal-item");
      const siblings = element.parentElement
        ? Array.from(element.parentElement.children)
        : [];
      const siblingIndex = Math.max(0, siblings.indexOf(element));
      element.style.setProperty(
        "--reveal-delay",
        `${Math.min(siblingIndex % 4, 3) * 70}ms`,
      );
    });

    const observer = new IntersectionObserver(
      (entries) => {
        entries.forEach((entry) => {
          if (!entry.isIntersecting) return;
          entry.target.classList.add("is-visible");
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
      root.style.setProperty("--page-progress", String(progress));
      root.style.setProperty(
        "--parallax-y",
        `${Math.min(window.scrollY * 0.055, 46)}px`,
      );
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
    const loadFrame = window.requestAnimationFrame(() =>
      root.classList.add("motion-loaded"),
    );

    return () => {
      observer.disconnect();
      window.removeEventListener("scroll", requestScrollUpdate);
      window.removeEventListener("resize", requestScrollUpdate);
      window.cancelAnimationFrame(loadFrame);
      if (frame) window.cancelAnimationFrame(frame);
      pointerHandlers.forEach(({ stage, move, leave }) => {
        stage.removeEventListener("pointermove", move);
        stage.removeEventListener("pointerleave", leave);
      });
      root.classList.remove("motion-enabled", "motion-loaded");
      root.style.removeProperty("--page-progress");
      root.style.removeProperty("--parallax-y");
      document.body.classList.remove("has-scrolled");
    };
  }, []);

  return (
    <div className="site-scroll-progress" aria-hidden="true">
      <i />
    </div>
  );
}
