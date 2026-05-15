export function Pagination({
  total,
  pageSize,
  current,
  onChange,
}: {
  total: number;
  pageSize: number;
  current: number;
  onChange: (page: number) => void;
}) {
  const pages = Math.max(1, Math.ceil(total / pageSize));
  if (pages <= 1) return null;
  return (
    <nav className="mt-md flex flex-wrap gap-xs">
      {Array.from({ length: pages }).map((_, i) => (
        <button
          key={i}
          onClick={() => onChange(i)}
          className={`rounded border px-sm py-xs text-sm ${
            i === current
              ? 'border-primary bg-primary text-white'
              : 'border-muted text-muted hover:border-secondary hover:text-secondary'
          }`}
        >
          {i + 1}
        </button>
      ))}
    </nav>
  );
}
