"use client";

import { useEffect } from "react";

/**
 * Marks [data-reveal] elements as shown when they scroll into view, including elements that
 * arrive later through client navigation or streaming. Elements are only hidden while
 * html[data-motion="on"], so without this script (or with reduced motion) all content shows.
 */
export function Reveal() {
  useEffect(() => {
    const show = (el: Element) => ((el as HTMLElement).dataset.shown = "");
    if (!("IntersectionObserver" in window)) {
      document.querySelectorAll("[data-reveal]").forEach(show);
      return;
    }
    const io = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (!entry.isIntersecting) continue;
          show(entry.target);
          io.unobserve(entry.target);
        }
      },
      { rootMargin: "0px 0px -8% 0px", threshold: 0.1 },
    );
    const watch = (root: ParentNode) => {
      root.querySelectorAll("[data-reveal]:not([data-shown])").forEach((el) => io.observe(el));
    };
    watch(document);
    const mo = new MutationObserver((records) => {
      for (const record of records) {
        record.addedNodes.forEach((node) => {
          if (!(node instanceof Element)) return;
          if (node.matches("[data-reveal]:not([data-shown])")) io.observe(node);
          watch(node);
        });
      }
    });
    mo.observe(document.body, { childList: true, subtree: true });
    return () => {
      mo.disconnect();
      io.disconnect();
    };
  }, []);
  return null;
}
