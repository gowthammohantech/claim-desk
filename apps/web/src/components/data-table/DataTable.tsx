import {
  type ColumnDef,
  type RowData,
  type RowSelectionState,
  rowSelectionFeature,
  tableFeatures,
  useTable,
} from '@tanstack/react-table';
import { useState } from 'react';

import { cn } from '@/lib/utils';

/**
 * The load-bearing component of the Finance portal.
 *
 * requirements/TDD.md §18: "Bulk operations SHALL validate every selected claim
 * independently and return per-item result." That is why `bulkResults` exists —
 * a toast saying "3 of 5 succeeded" is not enough; the operator has to see
 * WHICH ones failed and why, on the row itself.
 *
 * TanStack Table v9 requires features to be declared explicitly rather than
 * tree-shaken away, so only row selection is enabled here. Add sorting,
 * filtering or pagination to `tableFeatures` as screens need them.
 */
export const dataTableFeatures = tableFeatures({ rowSelectionFeature });

export type BulkOutcome = 'pending' | 'success' | 'failure';

export interface BulkResult {
  outcome: BulkOutcome;
  message?: string;
}

/**
 * Columns built with `createColumnHelper<typeof dataTableFeatures, TData>()`.
 *
 * The value type is `any` because a column list is heterogeneous — each column
 * has its own cell value type — and that is exactly how TanStack types
 * `ColumnHelper.columns()` itself. Narrowing it here would reject valid tables.
 */
// eslint-disable-next-line @typescript-eslint/no-explicit-any
type DataTableColumns<TData extends RowData> = Array<ColumnDef<typeof dataTableFeatures, TData, any>>;

interface DataTableProps<TData extends RowData> {
  columns: DataTableColumns<TData>;
  data: TData[];
  /** Stable row id — required for selection to survive a refetch. */
  getRowId: (row: TData) => string;
  selectable?: boolean;
  onSelectionChange?: (ids: string[]) => void;
  /** Per-row outcome of the last bulk operation, keyed by row id. */
  bulkResults?: Record<string, BulkResult>;
  emptyMessage?: string;
}

const OUTCOME_STYLE: Record<BulkOutcome, string> = {
  pending: 'bg-paper-sunken text-ink-55',
  success: 'bg-ok-tint text-ok',
  failure: 'bg-danger-tint text-danger',
};

const HEAD_CELL =
  'px-4 py-3 text-caption font-semibold uppercase tracking-[0.07em] text-ink-40';

export function DataTable<TData extends RowData>({
  columns,
  data,
  getRowId,
  selectable = false,
  onSelectionChange,
  bulkResults,
  emptyMessage = 'Nothing to show.',
}: DataTableProps<TData>) {
  // RowSelectionState is Record<string, true> — absent keys mean unselected.
  const [rowSelection, setRowSelection] = useState<RowSelectionState>({});

  const table = useTable({
    features: dataTableFeatures,
    columns,
    data,
    getRowId,
    enableRowSelection: selectable,
    state: { rowSelection },
    onRowSelectionChange: (updater) => {
      const next = typeof updater === 'function' ? updater(rowSelection) : updater;
      setRowSelection(next);
      onSelectionChange?.(Object.keys(next).filter((id) => next[id]));
    },
  });

  const rows = table.getRowModel().rows;
  const columnCount = columns.length + (selectable ? 1 : 0) + (bulkResults ? 1 : 0);

  return (
    <div className="overflow-hidden rounded-card border border-line bg-paper-raised shadow-raised">
      <div className="overflow-x-auto">
        <table className="w-full border-collapse text-left">
          <thead>
            {table.getHeaderGroups().map((group) => (
              <tr key={group.id} className="border-b border-line">
                {selectable ? (
                  <th className={cn(HEAD_CELL, 'w-10')}>
                    <input
                      type="checkbox"
                      aria-label="Select all rows"
                      checked={table.getIsAllRowsSelected()}
                      ref={(el) => {
                        if (el) el.indeterminate = table.getIsSomeRowsSelected();
                      }}
                      onChange={table.getToggleAllRowsSelectedHandler()}
                    />
                  </th>
                ) : null}

                {group.headers.map((header) => (
                  <th key={header.id} className={HEAD_CELL}>
                    {header.isPlaceholder ? null : <table.FlexRender header={header} />}
                  </th>
                ))}

                {bulkResults ? <th className={HEAD_CELL}>Result</th> : null}
              </tr>
            ))}
          </thead>

          <tbody>
            {rows.length === 0 ? (
              <tr>
                <td colSpan={columnCount} className="px-4 py-12 text-center text-body-s text-ink-40">
                  {emptyMessage}
                </td>
              </tr>
            ) : (
              rows.map((row) => {
                const result = bulkResults?.[row.id];

                return (
                  <tr key={row.id} className="border-b border-line last:border-0">
                    {selectable ? (
                      <td className="px-4 py-3">
                        <input
                          type="checkbox"
                          aria-label={`Select ${row.id}`}
                          checked={row.getIsSelected()}
                          disabled={!row.getCanSelect()}
                          onChange={row.getToggleSelectedHandler()}
                        />
                      </td>
                    ) : null}

                    {row.getAllCells().map((cell) => (
                      <td key={cell.id} className="px-4 py-3 text-body-s text-ink">
                        <table.FlexRender cell={cell} />
                      </td>
                    ))}

                    {bulkResults ? (
                      <td className="px-4 py-3">
                        {result ? (
                          <span
                            className={cn(
                              'inline-flex items-center rounded-pill px-3 py-1 text-caption font-semibold',
                              OUTCOME_STYLE[result.outcome],
                            )}
                            title={result.message}
                          >
                            {result.message ?? result.outcome}
                          </span>
                        ) : (
                          <span className="text-caption text-ink-25">&mdash;</span>
                        )}
                      </td>
                    ) : null}
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
