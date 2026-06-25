export function PageHeader({
  eyebrow,
  title,
  description,
}: {
  eyebrow?: string;
  title: string;
  description?: string;
}) {
  return (
    <div className="mb-8">
      {eyebrow && (
        <div className="text-xs font-semibold tracking-[0.25em] text-gold">
          {eyebrow}
        </div>
      )}
      <h1 className="mt-2 text-4xl font-bold tracking-tight">{title}</h1>
      {description && (
        <p className="mt-3 max-w-3xl text-sm text-muted-foreground">
          {description}
        </p>
      )}
    </div>
  );
}
