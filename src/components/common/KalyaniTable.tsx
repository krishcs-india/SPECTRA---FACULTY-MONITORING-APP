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
      <div className="text-center py-10 text-xs text-slate-400 border border-kalyani-gold-500/10 rounded-2xl bg-kalyani-crimson-950/40">
        {emptyMessage}
      </div>
    );
  }

  return (
    <div className={`overflow-x-auto rounded-2xl border border-kalyani-gold-500/20 bg-kalyani-crimson-950/40 backdrop-blur-md ${className}`}>
      <table className="w-full text-left border-collapse">
        <thead>
          <tr className="border-b border-kalyani-gold-500/20 bg-kalyani-crimson-900/60">
            {columns.map((col, idx) => (
              <th
                key={idx}
                className={`py-3.5 px-4 text-xs font-bold uppercase tracking-wider text-kalyani-gold-200/90 ${
                  col.headerClassName || ''
                }`}
              >
                {col.header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody className="divide-y divide-kalyani-gold-500/10">
          {data.map((row, rowIdx) => (
            <tr
              key={keyExtractor(row, rowIdx)}
              onClick={() => onRowClick && onRowClick(row)}
              className={`transition-colors duration-150 ${
                onRowClick ? 'cursor-pointer hover:bg-kalyani-gold-500/10' : 'hover:bg-white/[0.02]'
              }`}
            >
              {columns.map((col, colIdx) => (
                <td
                  key={colIdx}
                  className={`py-3.5 px-4 text-sm text-slate-200 ${col.className || ''}`}
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
