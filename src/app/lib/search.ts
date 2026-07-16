import type { SparePart } from "../types";

/**
 * Filter and rank spare parts by query.
 * Description matches are sorted before part-number / serial-number / location matches.
 */
export function searchParts(parts: SparePart[], query: string): SparePart[] {
  const q = query.trim().toLowerCase();
  if (!q) return parts;

  const descMatches: SparePart[] = [];
  const otherMatches: SparePart[] = [];

  for (const p of parts) {
    const inDesc = p.description.toLowerCase().includes(q);
    const inPN   = p.partNumber.toLowerCase().includes(q);
    const inSN   = p.serialNumber.toLowerCase().includes(q);
    const inLoc  = p.location.toLowerCase().includes(q);

    if (inDesc) {
      descMatches.push(p);
    } else if (inPN || inSN || inLoc) {
      otherMatches.push(p);
    }
  }

  return [...descMatches, ...otherMatches];
}
