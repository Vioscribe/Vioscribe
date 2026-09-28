"use client";

import Link from "next/link";
import { useEffect, useRef, useState } from "react";

const links = [
  { href: "/decks", label: "Decks" },
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
      const allLinksWidth = itemWidths.reduce((total, width) => total + width, 0);

      if (allLinksWidth + gap * (itemWidths.length - 1) <= availableWidth) {
        setVisibleCount(itemWidths.length);
        return;
      }

      let fitCount = 0;
      let usedWidth = 0;
      for (let count = 0; count < itemWidths.length; count += 1) {
        const requiredWidth = usedWidth + itemWidths[count] + gap * (count + 1) + moreWidth;
        if (requiredWidth > availableWidth) break;
        usedWidth += itemWidths[count];
        fitCount = count + 1;
      }
      setVisibleCount(fitCount);
    };

    measure();
    const observer = new ResizeObserver(measure);
    observer.observe(nav);
    window.addEventListener("resize", measure);
    document.fonts?.ready.then(measure);

    return () => {
      observer.disconnect();
      window.removeEventListener("resize", measure);
    };
  }, []);

  const shownCount = visibleCount ?? 3;
  const overflowLinks = links.slice(shownCount);
  const menuIsNeeded = visibleCount === null || overflowLinks.length > 0;

  return (
    <>
      <nav
        ref={navRef}
        className="site-nav-links"
        aria-label="Main navigation"
        onKeyDown={(event) => {
          if (event.key === "Escape" && isOpen) {
            setIsOpen(false);
            moreButtonRef.current?.focus();
          }
        }}
      >
        {links.slice(0, shownCount).map((link) => (
          <Link key={link.href} href={link.href} onClick={() => setIsOpen(false)}>
            {link.label}
          </Link>
        ))}
        {menuIsNeeded && (
          <div className="site-nav-more">
            <button
              ref={moreButtonRef}
              type="button"
              className="site-nav-more-trigger"
              aria-expanded={isOpen}
              aria-controls="site-nav-more-menu"
              aria-haspopup="menu"
              onClick={() => setIsOpen((open) => !open)}
            >
              More <span aria-hidden="true">▾</span>
            </button>
            {isOpen && (
              <div id="site-nav-more-menu" className="site-nav-more-menu" role="menu">
                {overflowLinks.map((link) => (
                  <Link
                    key={link.href}
                    href={link.href}
                    role="menuitem"
                    onClick={() => setIsOpen(false)}
                  >
                    {link.label}
                  </Link>
                ))}
              </div>
            )}
          </div>
        )}
      </nav>

      <div ref={measureRef} className="site-nav-measure" aria-hidden="true">
        {links.map((link) => <span key={link.href} data-nav-measure-item>{link.label}</span>)}
        <button ref={moreMeasureRef} type="button" className="site-nav-more-trigger">
          More <span aria-hidden="true">▾</span>
        </button>
      </div>
    </>
  );
}
