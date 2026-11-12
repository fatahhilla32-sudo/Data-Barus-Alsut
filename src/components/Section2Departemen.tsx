import React, { useState } from 'react';
import {
  BarusItem,
  BasisValue,
} from '../types/barus';
import {
  formatRupiah,
  formatNumber,
  formatPercent,
} from '../utils/formatters';
import {
  calculateDeptSummary,
} from '../utils/metrics';
import {
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  ExternalLink,
} from 'lucide-react';

interface Section2DepartemenProps {
  items: BarusItem[];
  basisValue: BasisValue;
  onSelectDepartment: (deptName: string) => void;
}

type SortField =
  | 'dept'
  | 'itemCount'
  | 'qty'
  | 'qtyPercent'
  | 'value'
  | 'valuePercent'
  | 'valueBelumAdf'
  | 'valueSudahAdf';

export const Section2Departemen: React.FC<Section2DepartemenProps> = ({
  items,
  basisValue,
  onSelectDepartment,
}) => {
  const [sortField, setSortField] = useState<SortField>('value');
  const [sortAsc, setSortAsc] = useState<boolean>(false);

  // Compute dept list
  const deptList = calculateDeptSummary(items, basisValue);

  // Totals for the table footer
  const totalItems = deptList.reduce((acc, d) => acc + d.itemCount, 0);
  const totalQty = deptList.reduce((acc, d) => acc + d.qty, 0);
  const totalValue = deptList.reduce((acc, d) => acc + d.value, 0);
  const totalBelumAdf = deptList.reduce((acc, d) => acc + d.valueBelumAdf, 0);
  const totalSudahAdf = deptList.reduce((acc, d) => acc + d.valueSudahAdf, 0);

  // Sorting
  const sortedDepts = [...deptList].sort((a, b) => {
    let aVal: any = a[sortField];
    let bVal: any = b[sortField];
    if (typeof aVal === 'string') {
      return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
    }
    return sortAsc ? aVal - bVal : bVal - aVal;
  });

  const handleSort = (field: SortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false); // default desc for numbers
    }
  };

  const renderSortIcon = (field: SortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-amber-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-600" />
    );
  };

  return (
    <section className="space-y-4 pt-2">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bagian 2 — Kontribusi per Departemen</span>
            <span className="text-xs font-medium text-slate-500 font-normal">
              ({deptList.length} Departemen)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Tabel peringkat nilai kerusakan, kuantitas unit, dan status pengajuan ADF di setiap departemen Informa J347.
          </p>
        </div>
        <div className="text-xs text-slate-500">
          Klik baris departemen untuk meninjau rincian di <strong className="text-slate-800">Bagian 3</strong>.
        </div>
      </div>

      {/* Tabel Ranking Departemen */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden shadow-xs">
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-2">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Tabel Peringkat Departemen
            </h3>
            <p className="text-[11px] text-slate-500">
              Rincian komparasi kuantitas, nilai kerusakan (Basis: {basisValue === 'outstanding' ? 'Value Akhir / Outstanding' : 'Value Awal'}), serta status kesiapan ADF
            </p>
          </div>
          <div className="text-xs text-slate-500">
            Klik judul kolom untuk mengurutkan (sort).
          </div>
        </div>

        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200">
                <th className="py-2.5 px-3 font-semibold text-center w-12">No</th>
                <th
                  onClick={() => handleSort('dept')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Departemen</span>
                    {renderSortIcon('dept')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('itemCount')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Jumlah Item</span>
                    {renderSortIcon('itemCount')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qty')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty</span>
                    {renderSortIcon('qty')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qtyPercent')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Qty</span>
                    {renderSortIcon('qtyPercent')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Value (Rp)</span>
                    {renderSortIcon('value')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valuePercent')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>% Value</span>
                    {renderSortIcon('valuePercent')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valueBelumAdf')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors text-rose-800"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Belum Diajukan ADF</span>
                    {renderSortIcon('valueBelumAdf')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valueSudahAdf')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors text-emerald-800"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Sudah Diajukan ADF</span>
                    {renderSortIcon('valueSudahAdf')}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold text-center">Aksi</th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {sortedDepts.map((d, idx) => (
                <tr
                  key={d.dept}
                  onClick={() => onSelectDepartment(d.dept)}
                  className="hover:bg-amber-50/40 cursor-pointer transition-colors group"
                >
                  <td className="py-2 px-3 text-center text-slate-400 font-mono text-[11px]">
                    {idx + 1}
                  </td>
                  <td className="py-2 px-3 font-medium text-slate-900 group-hover:text-amber-700 transition-colors">
                    {d.dept}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600">
                    {formatNumber(d.itemCount)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-700 font-medium">
                    {formatNumber(d.qty)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-500">
                    {formatPercent(d.qtyPercent)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums font-semibold text-slate-900">
                    {formatRupiah(d.value)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-slate-600 font-medium">
                    {formatPercent(d.valuePercent)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-rose-700 font-medium bg-rose-50/20">
                    {formatRupiah(d.valueBelumAdf)}
                  </td>
                  <td className="py-2 px-3 text-right tabular-nums text-emerald-700 font-medium bg-emerald-50/20">
                    {formatRupiah(d.valueSudahAdf)}
                  </td>
                  <td className="py-2 px-3 text-center">
                    <button
                      type="button"
                      onClick={(e) => {
                        e.stopPropagation();
                        onSelectDepartment(d.dept);
                      }}
                      className="inline-flex items-center gap-1 text-[11px] font-semibold text-amber-700 hover:text-amber-900 hover:underline py-0.5 px-2 rounded"
                    >
                      <span>Detail</span>
                      <ExternalLink className="w-3 h-3" />
                    </button>
                  </td>
                </tr>
              ))}
            </tbody>
            {/* Sticky/Fixed Table Footer with TOTAL row */}
            <tfoot>
              <tr className="bg-slate-100 font-bold text-slate-900 border-t-2 border-slate-300">
                <td className="py-3 px-3 text-center text-xs">TOTAL</td>
                <td className="py-3 px-3 text-xs">{deptList.length} Departemen</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs">{formatNumber(totalItems)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs">{formatNumber(totalQty)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs">100.0%</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs text-amber-800">{formatRupiah(totalValue)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs">100.0%</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs text-rose-800">{formatRupiah(totalBelumAdf)}</td>
                <td className="py-3 px-3 text-right tabular-nums text-xs text-emerald-800">{formatRupiah(totalSudahAdf)}</td>
                <td className="py-3 px-3"></td>
              </tr>
            </tfoot>
          </table>
        </div>
      </div>

    </section>
  );
};
