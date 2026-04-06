import { clsx, type ClassValue } from "clsx"
import { twMerge } from "tailwind-merge"

export function cn(...inputs: ClassValue[]) {
  return twMerge(clsx(inputs))
}

/** Shortens a label for compact headers; appends "..." when trimmed (total length ≤ maxChars). */
export function excerptHeading(text: string, maxChars = 36): string {
  const t = text.trim()
  if (t.length <= maxChars) return t
  const ellipsis = "..."
  const sliceLen = Math.max(0, maxChars - ellipsis.length)
  const slice = t.slice(0, sliceLen).trimEnd()
  return slice.length === 0 ? ellipsis : `${slice}${ellipsis}`
}
