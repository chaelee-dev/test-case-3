export function ErrorList({ errors }: { errors: Record<string, string[]> | null }) {
  if (!errors) return null;
  const entries = Object.entries(errors);
  if (entries.length === 0) return null;
  return (
    <ul className="mb-md list-disc rounded border border-danger bg-red-50 px-lg py-md text-danger">
      {entries.flatMap(([field, msgs]) =>
        msgs.map((m) => (
          <li key={`${field}:${m}`} className="ml-md">
            <strong className="capitalize">{field}</strong> {m}
          </li>
        )),
      )}
    </ul>
  );
}
