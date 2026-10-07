"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/decks", label: "Decks" },
  { href: "/planner", label: "Study planner" },
  { href: "/notes", label: "Notes" },
  { href: "/files", label: "Filing Room" },
  { href: "/streak", label: "Streak" },
  { href: "/friends", label: "Friends" },
  { href: "/rooms", label: "Rooms" },
  { href: "/heatmap", label: "Activity" },
  { href: "/profile", label: "Profile" },
];

export default function ResponsiveNavLinks() {
  const navRef = useRef<HTMLElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const moreMeasureRef = useRef<HTMLButtonElement>(null);
  const moreButtonRef = useRef<HTMLButtonElement>(null);
  const [visibleCount, setVisibleCount] = useState<number | null>(null);
  const [isOpen, setIsOpen] = useState(false);

  useEffect(() => {
    const nav = navRef.current;
    const measurement = measureRef.current;
    const moreMeasure = moreMeasureRef.current;
    if (!nav || !measurement || !moreMeasure) return;

    const measure = () => {
      const availableWidth = nav.clientWidth;
      const itemWidths = Array.from(
        measurement.querySelectorAll<HTMLElement>("[data-nav-measure-item]"),
      ).map((item) => item.getBoundingClientRect().width);
      const styles = window.getComputedStyle(measurement);
      const gap = Number.parseFloat(styles.columnGap) || 0;
      const moreWidth = moreMeasure.getBoundingClientRect().width;
      const fits = (count: number, withMore: boolean) => {
        const countIncludingMore = count + Number(withMore);
        const width = itemWidths.slice(0, count).reduce((sum, itemWidth) => sum + itemWidth, 0)
          + (withMore ? moreWidth : 0) + Math.max(0, countIncludingMore - 1) * gap;
        return width <= availableWidth;
      };

      let count = links.length;
      if (!fits(count, false)) {
        while (count > 0 && !fits(count, true)) count -= 1;
      }
      setVisibleCount(count);
      if (count === links.length) setIsOpen(false);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    observer.observe(measurement);
    window.addEventListener("resize", measure);
    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  useEffect(() => {
    if (!isOpen) return;
    const onPointerDown = (event: PointerEvent) => {
      if (event.target instanceof Node && !navRef.current?.contains(event.target)) setIsOpen(false);
    };
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === "Escape") {
        setIsOpen(false);
        moreButtonRef.current?.focus();
      }
    };
    document.addEventListener("pointerdown", onPointerDown);
    document.addEventListener("keydown", onKeyDown);
    return () => {
      document.removeEventListener("pointerdown", onPointerDown);
      document.removeEventListener("keydown", onKeyDown);
    };
  }, [isOpen]);

  const shownCount = visibleCount ?? links.length;
  const hasMore = shownCount < links.length;

  return (
    <>
      <nav ref={navRef} className="site-nav-links" aria-label="Main navigation">
        {links.slice(0, shownCount).map((link) => (
          <Link key={link.href} href={link.href}>{link.label}</Link>
        ))}
        {hasMore && (
          <div className="site-nav-more">
            <button
              ref={moreButtonRef}
              type="button"
              className="site-nav-more-trigger"
              aria-expanded={isOpen}
              aria-haspopup="true"
              aria-controls="site-nav-more-menu"
              onClick={() => setIsOpen((open) => !open)}
            >More <span aria-hidden="true">▾</span></button>
            {isOpen && (
              <div id="site-nav-more-menu" className="site-nav-more-menu" role="menu">
                {links.slice(shownCount).map((link) => (
                  <Link key={link.href} href={link.href} role="menuitem" onClick={() => setIsOpen(false)}>{link.label}</Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>
      <div ref={measureRef} className="site-nav-measure" aria-hidden="true">
        {links.map((link) => <span key={link.href} data-nav-measure-item>{link.label}</span>)}
        <button ref={moreMeasureRef} type="button" className="site-nav-more-trigger">More <span aria-hidden="true">▾</span></button>
      </div>
    </>
  );
}
