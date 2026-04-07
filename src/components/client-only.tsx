"use client";

import { useEffect, useState, type ReactNode } from "react";

/**
 * Renders `children` only after mount so the server and first client paint match
 * (`fallback`). Use for subtrees that confuse hydration in embedded/dev browsers
 * (e.g. attributes injected before hydrate) or heavy client-only trees.
 */
export function ClientOnly({
  children,
  fallback,
}: {
  children: ReactNode;
  fallback: ReactNode;
}) {
  const [mounted, setMounted] = useState(false);
  useEffect(() => {
    setMounted(true);
  }, []);
  if (!mounted) return fallback;
  return children;
}
