import React from 'react';

export interface Column<T> {
  header: React.ReactNode;
  accessor?: keyof T | ((row: T, index: number) => React.ReactNode);
  className?: string;
  headerClassName?: string;
}

interface KalyaniTableProps<T> {
  columns: Column<T>[];
  data: T[];
  keyExtractor: (row: T, index: number) => string | number;
  emptyMessage?: string;
  className?: string;
  onRowClick?: (row: T) => void;
}

export function KalyaniTable<T>({
  columns,
  data,
  keyExtractor,
  emptyMessage = 'No records found.',
  className = '',
  onRowClick,
}: KalyaniTableProps<T>) {
  if (data.length === 0) {
    return (
      <div className="text-center py-10 text-xs text-slate-600 dark:text-slate-400 border border-rose-200 dark:border-rose-900/40 rounded-2xl bg-rose-50/30 dark:bg-[#180E1C]/40">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-rose-200/80 dark:border-rose-900/40 bg-white/80 dark:bg-[#180E1C]/80 shadow-sm backdrop-blur-md ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-rose-200/80 dark:border-rose-900/40 bg-rose-50/80 dark:bg-[#221229]/90">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 text-xs font-semibold uppercase tracking-wider text-rose-800 dark:text-rose-200 ${
                  col.headerClassName || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-rose-100/80 dark:divide-rose-950/60">
          {data.map((row, rowIdx) => (
            <tr
              key={keyExtractor(row, rowIdx)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-rose-50/60 dark:hover:bg-rose-950/40' : 'hover:bg-rose-50/30 dark:hover:bg-rose-950/20'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`py-3.5 px-4 text-sm text-slate-700 dark:text-slate-200 ${col.className || ''}`}
                >
                  {typeof col.accessor === 'function'
                    ? col.accessor(row, rowIdx)
                    : col.accessor
                    ? (row[col.accessor] as any)
                    : null}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
