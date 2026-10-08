import type { ReactNode } from 'react';

interface TableProps<T extends string> {
  columns: Array<{ key: T; label: string; render?: (row: unknown) => ReactNode }>;
  rows: unknown[];
  emptyMessage?: string;
}

export function Table<T extends string>({ columns, rows, emptyMessage = 'No records found' }: TableProps<T>) {
  return (
    <div className="ui-table-wrap">
      <table className="ui-table">
        <thead>
          <tr>
            {columns.map((column) => <th key={column.key}>{column.label}</th>)}
          </tr>
        </thead>
        <tbody>
          {rows.length === 0 ? (
            <tr><td colSpan={columns.length} className="ui-empty">{emptyMessage}</td></tr>
          ) : rows.map((row, rowIndex) => (
            <tr key={rowIndex}>
              {columns.map((column) => (
                <td key={column.key}>{column.render ? column.render(row) : String(row)}</td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
