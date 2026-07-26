/**
 * Build 16 — executive identity resolution.
 * Canonical slug remains `primary-executive` (existing seed row).
 * Aliases map Andrew/Andre requests onto that row — no duplicate executives.
 */

export const CANONICAL_EXECUTIVE_SLUG = "primary-executive";

const ALIASES: Record<string, string> = {
  "primary-executive": CANONICAL_EXECUTIVE_SLUG,
  andrew: CANONICAL_EXECUTIVE_SLUG,
  andre: CANONICAL_EXECUTIVE_SLUG,
  "andrew-executive": CANONICAL_EXECUTIVE_SLUG,
};

export function resolveExecutiveSlug(requested?: string | null, fallback = CANONICAL_EXECUTIVE_SLUG): string {
  const raw = (requested ?? fallback).trim().toLowerCase();
  return ALIASES[raw] ?? raw;
}
