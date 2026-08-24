import { ClaimStatus } from '@claimdesk/contracts';
import { createColumnHelper } from '@tanstack/react-table';
import { useState } from 'react';

import { Money } from '@/components/Money';
import { PageHeader } from '@/components/PageHeader';
import { StatusBadge } from '@/components/StatusBadge';
import { type BulkResult, DataTable, type dataTableFeatures } from '@/components/data-table/DataTable';

/**
 * W-003 Finance verification queue.
 *
 * The one fully-built screen in the skeleton: it exercises the whole stack —
 * shared enums, shared money formatting, the "Clear Ledger" tokens, and the
 * per-row bulk result reporting that TDD §18 requires.
 *
 * Rows are fixtures. Swap in a `useQuery` against GET /finance/claims once the
 * finance module lands; the table contract does not change.
 */
interface QueueRow {
  id: string;
  claimNo: string;
  employee: string;
  totalPaise: number;
  status: ClaimStatus;
  ageDays: number;
  exceptions: number;
}

const FIXTURES: QueueRow[] = [
  {
    id: 'CLM-2041',
    claimNo: 'CLM-2041',
    employee: 'Priya Nair',
    totalPaise: 1_234_567,
    status: ClaimStatus.FINANCE_REVIEW,
    ageDays: 2,
    exceptions: 1,
  },
  {
    id: 'CLM-2038',
    claimNo: 'CLM-2038',
    employee: 'R. Deshpande',
    totalPaise: 450_000,
    status: ClaimStatus.FINANCE_REVIEW,
    ageDays: 5,
    exceptions: 0,
  },
  {
    id: 'CLM-2033',
    claimNo: 'CLM-2033',
    employee: 'A. Krishnan',
    totalPaise: 2_750_000,
    status: ClaimStatus.APPROVED,
    ageDays: 9,
    exceptions: 2,
  },
];

const helper = createColumnHelper<typeof dataTableFeatures, QueueRow>();

const columns = helper.columns([
  helper.accessor('claimNo', {
    header: 'Claim',
    cell: ({ getValue }) => <span className="font-semibold">{getValue()}</span>,
  }),
  helper.accessor('employee', { header: 'Employee' }),
  helper.accessor('totalPaise', {
    header: 'Amount',
    cell: ({ getValue }) => <Money paise={getValue()} />,
  }),
  helper.accessor('status', {
    header: 'Status',
    cell: ({ getValue }) => <StatusBadge status={getValue()} />,
  }),
  helper.accessor('ageDays', {
    header: 'Age',
    cell: ({ getValue }) => <span className="num">{getValue()}d</span>,
  }),
  helper.accessor('exceptions', {
    header: 'Exceptions',
    cell: ({ getValue }) =>
      getValue() > 0 ? (
        <span className="rounded-pill bg-warn-tint px-2 py-0.5 text-caption font-semibold text-warn">
          {getValue()}
        </span>
      ) : (
        <span className="text-ink-25">&mdash;</span>
      ),
  }),
]);

export function FinanceQueuePage() {
  const [selected, setSelected] = useState<string[]>([]);
  const [bulkResults, setBulkResults] = useState<Record<string, BulkResult> | undefined>();

  /**
   * Stand-in for the real bulk verify. Note the shape: every selected claim is
   * validated INDEPENDENTLY and reports its own outcome, rather than the whole
   * batch succeeding or failing together.
   */
  const verifySelected = () => {
    const results: Record<string, BulkResult> = {};
    for (const id of selected) {
      const row = FIXTURES.find((r) => r.id === id);
      results[id] =
        row && row.exceptions > 0
          ? { outcome: 'failure', message: 'Unresolved policy exception' }
          : { outcome: 'success', message: 'Verified' };
    }
    setBulkResults(results);
  };

  return (
    <div>
      <PageHeader
        eyebrow="W-003"
        title="Verification queue"
        description="Claims awaiting finance verification."
        actions={
          <button
            type="button"
            onClick={verifySelected}
            disabled={selected.length === 0}
            className="rounded-pill bg-accent px-5 py-2 text-body-s font-semibold text-on-accent shadow-raised transition-opacity disabled:opacity-40"
          >
            Verify selected ({selected.length})
          </button>
        }
      />

      <DataTable
        columns={columns}
        data={FIXTURES}
        getRowId={(row) => row.id}
        selectable
        onSelectionChange={setSelected}
        {...(bulkResults ? { bulkResults } : {})}
        emptyMessage="No claims are waiting for verification."
      />
    </div>
  );
}
