"use client";

import { useEffect, useState } from "react";
import SloganHighlight from "@/components/SloganHighlight";

const LEAD_IN = "Pace your studies, protect your mind — ";
const HIGHLIGHT = "Don't burn out.";
const FULL_SLOGAN = LEAD_IN + HIGHLIGHT;
const LETTER_DELAY_MS = 24;

export default function LandingSlogan() {
  const [visibleCharacters, setVisibleCharacters] = useState(FULL_SLOGAN.length);

  useEffect(() => {
    if (window.matchMedia("(prefers-reduced-motion: reduce)").matches) return;

    try {
      if (window.localStorage.getItem("hasSeenIntro")) return;
    } catch {
      // Play the intro for this visit when browser storage is unavailable.
    }

    let count = 0;
    let interval: number | null = null;
    let finished = false;
    const startTimer = window.setTimeout(() => {
      if (finished) return;
      setVisibleCharacters(0);
      interval = window.setInterval(() => {
        count += 1;
        setVisibleCharacters(count);
        if (count >= FULL_SLOGAN.length && interval !== null) {
          window.clearInterval(interval);
        }
      }, LETTER_DELAY_MS);
    }, 0);

    function finishTyping() {
      finished = true;
      window.clearTimeout(startTimer);
      if (interval !== null) window.clearInterval(interval);
      setVisibleCharacters(FULL_SLOGAN.length);
    }

    window.addEventListener("vioscribe:skip-intro", finishTyping);
    return () => {
      window.clearTimeout(startTimer);
      if (interval !== null) window.clearInterval(interval);
      window.removeEventListener("vioscribe:skip-intro", finishTyping);
    };
  }, []);

  const leadIn = LEAD_IN.slice(0, visibleCharacters);
  const highlightCharacters = Math.max(0, visibleCharacters - LEAD_IN.length);
  const highlight = HIGHLIGHT.slice(0, highlightCharacters);
  const isTyping = visibleCharacters < FULL_SLOGAN.length;

  return (
    <h1 aria-label={FULL_SLOGAN}>
      <span aria-hidden="true">{leadIn}</span>
      <SloganHighlight text={highlight} />
      {isTyping && <span className="landing-type-caret" aria-hidden="true" />}
    </h1>
  );
}
