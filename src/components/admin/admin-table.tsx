import type { ReactNode } from "react";

type AdminTableProps = {
  headers: string[];
  rows: ReactNode[][];
};

export function AdminTable({ headers, rows }: AdminTableProps) {
  return (
    <div className="max-w-full overflow-x-auto">
      <table className="w-full min-w-[720px] border-separate border-spacing-0 text-left text-sm">
        <thead>
          <tr>
            {headers.map((header) => (
              <th key={header} className="border-b border-white/10 px-3 py-3 font-medium text-[#9db4a5]">
                {header}
              </th>
            ))}
          </tr>
        </thead>
        <tbody>
          {rows.map((row, rowIndex) => (
            <tr key={rowIndex} className="hover:bg-white/[.03]">
              {row.map((cell, cellIndex) => (
                <td key={cellIndex} className="border-b border-white/6 px-3 py-3 text-[#eef7ef]">
                  {cell}
                </td>
              ))}
            </tr>
          ))}
        </tbody>
      </table>
    </div>
  );
}
