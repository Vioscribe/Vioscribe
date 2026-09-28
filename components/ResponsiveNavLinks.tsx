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
