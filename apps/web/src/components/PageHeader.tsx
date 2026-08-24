interface PageHeaderProps {
  eyebrow?: string;
  title: string;
  description?: string;
  actions?: React.ReactNode;
}

export function PageHeader({ eyebrow, title, description, actions }: PageHeaderProps) {
  return (
    <header className="mb-6 flex items-start justify-between gap-4">
      <div>
        {eyebrow ? (
          <p className="text-caption font-semibold uppercase tracking-[0.07em] text-ink-40">
            {eyebrow}
          </p>
        ) : null}
        <h1 className="text-h2 font-bold tracking-[-0.02em] text-ink">{title}</h1>
        {description ? <p className="mt-1 text-body-s text-ink-55">{description}</p> : null}
      </div>
      {actions ? <div className="flex shrink-0 gap-2">{actions}</div> : null}
    </header>
  );
}
