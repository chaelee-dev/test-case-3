// Slugify per RealWorld convention: lowercase, ASCII-safe, hyphen-separated.
// On collision, suffix with `-2`, `-3`, ... (policy decided in chore/slug-policy-adr #12).

export function slugify(input: string): string {
  return input
    .toLowerCase()
    .normalize('NFKD')
    .replace(/[̀-ͯ]/g, '')
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '')
    .slice(0, 80) || 'article';
}

export async function generateUniqueSlug(
  title: string,
  exists: (slug: string) => Promise<boolean>,
): Promise<string> {
  const base = slugify(title);
  if (!(await exists(base))) return base;
  for (let i = 2; i < 1000; i++) {
    const candidate = `${base}-${i}`;
    if (!(await exists(candidate))) return candidate;
  }
  throw new Error(`slug exhausted for base "${base}"`);
}
