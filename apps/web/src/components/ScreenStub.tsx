import { PageHeader } from './PageHeader';

/**
 * Placeholder for a screen from design/02-screen-inventory.md that has a route
 * wired but no implementation yet. Naming the screen id keeps the inventory and
 * the router traceable to each other.
 */
export function ScreenStub({ id, title, note }: { id: string; title: string; note?: string }) {
  return (
    <div>
      <PageHeader eyebrow={id} title={title} />
      <div className="rounded-card border border-dashed border-line-mid bg-paper-raised p-8 text-center">
        <p className="text-body text-ink-55">Not implemented yet.</p>
        {note ? <p className="mt-2 text-body-s text-ink-40">{note}</p> : null}
        <p className="mt-4 text-caption text-ink-40">
          Screen {id} — see design/02-screen-inventory.md
        </p>
      </div>
    </div>
  );
}
