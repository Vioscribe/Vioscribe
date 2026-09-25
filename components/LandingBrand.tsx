"use client";

import Image from "next/image";
import { useEffect, useRef } from "react";

export default function LandingBrand() {
  const brandRef = useRef<HTMLButtonElement>(null);
  const timer = useRef<ReturnType<typeof setTimeout> | null>(null);

  useEffect(() => {
    const storageKey = "hasSeenIntro";
    const reducedMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    const brand = brandRef.current;
    if (!brand || reducedMotion) return;

    try {
      if (window.localStorage.getItem(storageKey)) return;
    } catch {
      // If storage is unavailable, still show the brief intro for this visit.
    }

    brand.classList.add("is-igniting");
    timer.current = setTimeout(() => {
      brand.classList.remove("is-igniting");
      try {
        window.localStorage.setItem(storageKey, "true");
      } catch {
        // The animation still completes if storage is unavailable.
      }
    }, 1550);
    return () => {
      if (timer.current) clearTimeout(timer.current);
      brand.classList.remove("is-igniting");
    };
  }, []);

  function skipIntro() {
    if (timer.current) clearTimeout(timer.current);
    brandRef.current?.classList.remove("is-igniting");
    window.dispatchEvent(new Event("vioscribe:skip-intro"));
    try {
      window.localStorage.setItem("hasSeenIntro", "true");
    } catch {
      // Skipping remains immediate if storage is unavailable.
    }
  }

  return (
    <button
      ref={brandRef}
      type="button"
      className="landing-brand"
      onClick={skipIntro}
      aria-label="Vioscribe logo. Click to skip the intro animation."
    >
      <Image
        className="landing-logo"
        src="/vioscribe-logo.png"
        alt="[ Vioscribe ]"
        width={194}
        height={60}
        priority
      />
      <span className="landing-skip" aria-hidden="true">SKIP</span>
      <span className="landing-embers" aria-hidden="true">
        <i /><i /><i /><i /><i /><i />
      </span>
    </button>
  );
}
