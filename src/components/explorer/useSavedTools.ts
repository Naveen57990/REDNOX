"use client";

import { useEffect, useState } from "react";

const STORAGE_KEY = "cyberlab-saved-tools";

function loadSaved(): Set<string> {
  if (typeof window === "undefined") return new Set();
  try {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? new Set(JSON.parse(raw)) : new Set();
  } catch {
    return new Set();
  }
}

export function useSavedTools() {
  const [saved, setSaved] = useState<Set<string>>(loadSaved);

  useEffect(() => {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify([...saved]));
    } catch {
      /* ignore */
    }
  }, [saved]);

  const toggleSaved = (slug: string) =>
    setSaved((prev) => {
      const next = new Set(prev);
      if (next.has(slug)) next.delete(slug);
      else next.add(slug);
      return next;
    });

  return { saved, toggleSaved };
}