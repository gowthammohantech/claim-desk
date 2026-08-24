import { createColumnHelper } from '@tanstack/react-table';
import { fireEvent, render, screen, within } from '@testing-library/react';
import { describe, expect, it, vi } from 'vitest';

import { type BulkResult, DataTable, type dataTableFeatures } from './DataTable';

interface Row {
  id: string;
  claimNo: string;
  totalPaise: number;
}

const helper = createColumnHelper<typeof dataTableFeatures, Row>();
const columns = helper.columns([
  helper.accessor('claimNo', { header: 'Claim' }),
  helper.accessor('totalPaise', { header: 'Amount' }),
]);

const DATA: Row[] = [
  { id: 'CLM-1', claimNo: 'CLM-1', totalPaise: 100 },
  { id: 'CLM-2', claimNo: 'CLM-2', totalPaise: 200 },
];

const renderTable = (props: Partial<Parameters<typeof DataTable<Row>>[0]> = {}) =>
  render(
    <DataTable columns={columns} data={DATA} getRowId={(row) => row.id} {...props} />,
  );

describe('DataTable', () => {
  it('renders headers and rows', () => {
    renderTable();

    expect(screen.getByText('Claim')).toBeDefined();
    expect(screen.getByText('CLM-1')).toBeDefined();
    expect(screen.getByText('CLM-2')).toBeDefined();
  });

  it('shows the empty message instead of a blank table', () => {
    renderTable({ data: [], emptyMessage: 'Nothing pending.' });

    expect(screen.getByText('Nothing pending.')).toBeDefined();
  });

  it('reports selected row ids by their stable id, not row index', () => {
    const onSelectionChange = vi.fn();
    renderTable({ selectable: true, onSelectionChange });

    fireEvent.click(screen.getByLabelText('Select CLM-2'));

    expect(onSelectionChange).toHaveBeenCalledWith(['CLM-2']);
  });

  it('selects and clears every row from the header checkbox', () => {
    const onSelectionChange = vi.fn();
    renderTable({ selectable: true, onSelectionChange });

    const selectAll = screen.getByLabelText('Select all rows');
    fireEvent.click(selectAll);
    expect(onSelectionChange).toHaveBeenLastCalledWith(['CLM-1', 'CLM-2']);

    fireEvent.click(selectAll);
    expect(onSelectionChange).toHaveBeenLastCalledWith([]);
  });

  /**
   * requirements/TDD.md §18: bulk operations must "validate every selected claim
   * independently and return per-item result". A summary toast is not enough —
   * the operator has to see which rows failed, on the rows themselves.
   */
  it('renders a per-row outcome for a bulk operation', () => {
    const bulkResults: Record<string, BulkResult> = {
      'CLM-1': { outcome: 'success', message: 'Verified' },
      'CLM-2': { outcome: 'failure', message: 'Unresolved policy exception' },
    };
    renderTable({ selectable: true, bulkResults });

    const rows = screen.getAllByRole('row');
    const clm1 = rows.find((r) => within(r).queryByText('CLM-1'));
    const clm2 = rows.find((r) => within(r).queryByText('CLM-2'));

    expect(clm1).toBeDefined();
    expect(clm2).toBeDefined();
    expect(within(clm1!).getByText('Verified')).toBeDefined();
    expect(within(clm2!).getByText('Unresolved policy exception')).toBeDefined();
  });

  it('leaves rows without a result visibly blank rather than implying success', () => {
    renderTable({ bulkResults: { 'CLM-1': { outcome: 'success', message: 'Verified' } } });

    const rows = screen.getAllByRole('row');
    const clm2 = rows.find((r) => within(r).queryByText('CLM-2'));

    expect(within(clm2!).getByText('—')).toBeDefined();
  });

  it('omits the result column entirely when no bulk operation has run', () => {
    renderTable();

    expect(screen.queryByText('Result')).toBeNull();
  });
});
