export function normalizeTag(input: string): string {
  return input.trim().toLowerCase().slice(0, 40);
}

export function normalizeTagList(tags: readonly string[]): string[] {
  const seen = new Set<string>();
  const out: string[] = [];
  for (const raw of tags) {
    const n = normalizeTag(raw);
    if (!n || seen.has(n)) continue;
    seen.add(n);
    out.push(n);
  }
  return out;
}
