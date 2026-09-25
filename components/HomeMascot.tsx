"use client";

import { useEffect, useRef, useState, type CSSProperties } from "react";

type EmberPixel = { x: number; y: number; dx: number; dy: number; midX: string; arc: string; color: string };
type ClickSpark = { x: string; y: string; dx: string; dy: string; size: string; duration: string; rotation: string };

export default function HomeMascot() {
  const mascotRef = useRef<HTMLButtonElement>(null);
  const hoverTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const reactionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const explosionTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const clickCount = useRef(0);
  const [blinking, setBlinking] = useState(false);
  const [pleased, setPleased] = useState(false);
  const [annoyed, setAnnoyed] = useState(false);
  const [spark, setSpark] = useState(false);
  const [sparkParticles, setSparkParticles] = useState<ClickSpark[]>([]);
  const [tapSequence, setTapSequence] = useState(0);
  const [mood, setMood] = useState(0);
  const [exploding, setExploding] = useState(false);
  const [pixels, setPixels] = useState<EmberPixel[]>([]);

  useEffect(() => {
    const mascot = mascotRef.current;
    if (!mascot) return;

    function trackPointer(event: PointerEvent) {
      const bounds = mascot!.getBoundingClientRect();
      const dx = event.clientX - (bounds.left + bounds.width / 2);
      const dy = event.clientY - (bounds.top + bounds.height / 2);
      const distance = Math.hypot(dx, dy) || 1;
      const reach = Math.min(1.25, distance * 0.035);

      mascot!.style.setProperty("--look-x", `${((dx / distance) * reach).toFixed(2)}px`);
      mascot!.style.setProperty("--look-y", `${((dy / distance) * reach).toFixed(2)}px`);
    }

    window.addEventListener("pointermove", trackPointer, { passive: true });

    // Random delays keep the blink occasional rather than metronomic.
    let active = true;
    let blinkTimer: ReturnType<typeof setTimeout> | undefined;
    let blinkEnd: ReturnType<typeof setTimeout> | undefined;
    function scheduleBlink() {
      blinkTimer = setTimeout(() => {
        if (!active) return;
        setBlinking(true);
        blinkEnd = setTimeout(() => {
          setBlinking(false);
          scheduleBlink();
        }, 140);
      }, 2600 + Math.random() * 4400);
    }
    if (!window.matchMedia("(prefers-reduced-motion: reduce)").matches) scheduleBlink();

    return () => {
      active = false;
      window.removeEventListener("pointermove", trackPointer);
      if (blinkTimer) clearTimeout(blinkTimer);
      if (blinkEnd) clearTimeout(blinkEnd);
      if (hoverTimer.current) clearTimeout(hoverTimer.current);
      if (reactionTimer.current) clearTimeout(reactionTimer.current);
      if (explosionTimer.current) clearTimeout(explosionTimer.current);
    };
  }, []);

  function react() {
    if (exploding) return;
    clickCount.current += 1;
    setTapSequence((sequence) => sequence + 1);

    if (clickCount.current >= 20) {
      const bounds = mascotRef.current?.getBoundingClientRect();
      if (!bounds) return;

      // Scatter little square bits from a compact flame-and-logs pixel shape.
      const colors = ["#ffdf68", "#f9a825", "#f97316", "#d9480f", "#7c310e"];
      const shape = [
        "...##...",
        "..####..",
        ".######.",
        ".######.",
        "########",
        "########",
        "########",
        ".######.",
        "########",
        "########",
      ];
      const cellWidth = bounds.width / 8;
      const cellHeight = bounds.height / shape.length;
      const totalPixels = shape.reduce((total, row) => total + [...row].filter((cell) => cell === "#").length, 0);
      const nextPixels: EmberPixel[] = [];

      shape.forEach((row, rowIndex) => {
        [...row].forEach((cell, columnIndex) => {
          if (cell !== "#") return;
          // Even spacing keeps the landing line legible instead of clumping.
          const targetX = ((nextPixels.length + 0.5) / totalPixels) * window.innerWidth - 3.5;
          // Let every pixel land close to the bottom edge before it reforms.
          const targetY = Math.max(0, window.innerHeight - 5);
          const x = bounds.left + columnIndex * cellWidth;
          const y = bounds.top + rowIndex * cellHeight;
          const dx = targetX - x;
          const dy = targetY - y;
          nextPixels.push({
            x,
            y,
            dx,
            dy,
            midX: `${dx * 0.48}px`,
            arc: `${Math.min(-24, dy * 0.22 - 44)}px`,
            color: colors[Math.min(colors.length - 1, Math.floor(rowIndex / 2))],
          });
        });
      });

      clickCount.current = 0;
      setPixels(nextPixels);
      setExploding(true);
      setPleased(false);
      setAnnoyed(false);
      setMood(0);
      explosionTimer.current = setTimeout(() => {
        setPixels([]);
        setExploding(false);
      }, 3450);
      return;
    }

    const nextMood = Math.floor(clickCount.current / 5);
    setMood(nextMood);
    setAnnoyed(nextMood >= 3);
    setSparkParticles(Array.from({ length: 6 }, () => ({
      x: `${24 + Math.random() * 52}%`,
      y: `${23 + Math.random() * 42}%`,
      dx: `${-28 + Math.random() * 56}px`,
      dy: `${-48 + Math.random() * 36}px`,
      size: `${2 + Math.random() * 2}px`,
      duration: `${380 + Math.random() * 360}ms`,
      rotation: `${-150 + Math.random() * 300}deg`,
    })));
    setSpark(true);
    setPleased(true);
    if (reactionTimer.current) clearTimeout(reactionTimer.current);
    reactionTimer.current = setTimeout(() => {
      setSpark(false);
      setPleased(false);
    }, 850);
  }

  return (
    <>
      {exploding && (
        <span className="mascot-pixel-field" aria-hidden="true">
          {pixels.map((pixel, index) => {
            const style = {
              left: pixel.x,
              top: pixel.y,
              backgroundColor: pixel.color,
              "--pixel-dx": `${pixel.dx}px`,
              "--pixel-dy": `${pixel.dy}px`,
              "--pixel-mid-x": pixel.midX,
              "--pixel-arc": pixel.arc,
            } as CSSProperties;
            return <i key={index} className="mascot-pixel" style={style} />;
          })}
        </span>
      )}
      <button
        ref={mascotRef}
        type="button"
        disabled={exploding}
        className={`home-mascot mood-${mood} tap-${tapSequence % 2 ? "odd" : "even"}${pleased ? " is-pleased" : ""}${annoyed ? " is-annoyed" : ""}${spark ? " is-sparking" : ""}${exploding ? " is-exploding" : ""}`}
        aria-label="Wave to the little ember"
        onPointerEnter={() => {
          hoverTimer.current = setTimeout(() => setPleased(true), 450);
        }}
        onPointerLeave={() => {
          if (hoverTimer.current) clearTimeout(hoverTimer.current);
          setPleased(false);
        }}
        onClick={react}
      >
        {mood >= 2 && !exploding && (
          <span className="mascot-dialogue" aria-hidden="true">
            {mood >= 3 ? "ENOUGH!" : "STOP!"}
          </span>
        )}
        <span className="mascot-ambient-sparks" aria-hidden="true">
          <i /><i /><i /><i /><i /><i />
        </span>
        <svg
          className={`mascot-flame${blinking ? " is-blinking" : ""}`}
          viewBox="0 0 64 72"
          role="presentation"
        >
          <defs>
            <linearGradient id="emberShell" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#c33b0a" />
              <stop offset="0.5" stopColor="#ff7518" />
              <stop offset="1" stopColor="#ca3909" />
            </linearGradient>
            <linearGradient id="emberCore" x1="0" x2="1" y1="0" y2="0">
              <stop offset="0" stopColor="#ffad26" />
              <stop offset="0.5" stopColor="#fff07a" />
              <stop offset="1" stopColor="#ffc23a" />
            </linearGradient>
            <filter id="emberGlow" x="-40%" y="-40%" width="180%" height="180%">
              <feGaussianBlur stdDeviation="2.2" result="blur" />
              <feMerge><feMergeNode in="blur" /><feMergeNode in="SourceGraphic" /></feMerge>
            </filter>
          </defs>
          {/* Stepped flame outline echoes the pixel fire in the Vioscribe logo. */}
          <path
            d="M27 3h8v7h5v7h6v8h5v9h5v13h-5v7h-5v5h-7v4H18v-4h-7v-5H6v-8H3V34h5v-9h5v-8h6v-7h8z"
            fill="url(#emberShell)"
            filter="url(#emberGlow)"
          />
          <path d="M28 10h7v7h5v7h6v9h5v12h-5v7h-7v5H19v-5h-6v-7H9V34h5v-9h5v-8h9z" fill="#f05b0b" />
          <path
            className="mascot-inner-flame"
            d="M29 17h6v7h5v7h5v8h4v9h-5v5H20v-5h-5v-7h4v-8h5v-8h5z"
            fill="url(#emberCore)"
          />
          <path d="M29 26h6v8h5v9h-5v7H27v-7h-5v-7h5v-6h2z" fill="#fff4a6" opacity="0.86" />

          {/* Bright square eyes and tiny pupils stay crisp at any display size. */}
          <g className="mascot-eye">
            <rect className="mascot-eye-base" x="17" y="34" width="11" height="10" fill="#ffdc59" />
            <rect className="mascot-pupil" x="20.5" y="36" width="4" height="6" fill="#54210d" />
          </g>
          <g className="mascot-eye">
            <rect className="mascot-eye-base" x="36" y="34" width="11" height="10" fill="#ffdc59" />
            <rect className="mascot-pupil" x="39.5" y="36" width="4" height="6" fill="#54210d" />
          </g>
          <path className="mascot-mouth" d="M28 48h3v2h3v-2h3v3h-3v2h-3v-2h-3z" fill="#fff0bd" />

          {/* Three chunky logs make the creature read as a campfire. */}
          <path d="M8 55h15v5h-4v5H8z" fill="#713417" />
          <path d="M22 57h20v6H22z" fill="#a64c16" />
          <path d="M42 55h14v10H45v-5h-3z" fill="#713417" />
          <path d="M7 64h50v5H7z" fill="#4c2414" />
          <path d="M11 57h6v3h-6zm34 0h6v3h-6z" fill="#d57925" />
          <path d="M27 59h4v2h-4zm7 1h5v2h-5z" fill="#e98b2e" />
          <path d="M1 29h3v3H1zm55-8h3v3h-3zm-4-12h3v3h-3z" fill="#ffd45c" />
        </svg>
        {spark && (
          <span key={tapSequence} className="mascot-sparks" aria-hidden="true">
            {sparkParticles.map((particle, index) => {
              const style = {
                "--spark-start-x": particle.x,
                "--spark-start-y": particle.y,
                "--spark-x": particle.dx,
                "--spark-y": particle.dy,
                "--spark-size": particle.size,
                "--spark-duration": particle.duration,
                "--spark-rotation": particle.rotation,
              } as CSSProperties;
              return <i key={index} style={style} />;
            })}
          </span>
        )}
      </button>
    </>
  );
}
