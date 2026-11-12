import React, { useState, useMemo } from 'react';
import {
  ResponsiveContainer,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Tooltip,
  PieChart,
  Pie,
  Cell,
  Legend,
} from 'recharts';
import {
  BarusItem,
  BasisValue,
} from '../types/barus';
import {
  formatRupiah,
  formatRupiahShort,
  formatNumber,
  formatPercent,
} from '../utils/formatters';
import { exportItemsToCSV } from '../utils/parser';
import {
  Search,
  ArrowUpDown,
  ArrowUp,
  ArrowDown,
  Download,
  AlertTriangle,
  ChevronLeft,
  ChevronRight,
  Package,
  Layers,
  Clock,
  CheckCircle,
  XCircle,
} from 'lucide-react';

interface Section3DetailDeptProps {
  items: BarusItem[]; // all filtered items
  selectedDept: string;
  onSelectDept: (dept: string) => void;
  availableDepts: string[];
  totalStoreValue: number;
  basisValue: BasisValue;
}

type DetailSortField =
  | 'weekDate'
  | 'article'
  | 'description'
  | 'causedBy'
  | 'qtyBarus'
  | 'qtyReport'
  | 'price'
  | 'value'
  | 'valueAkhir'
  | 'fu'
  | 'status'
  | 'ageDays';

const ADF_COLORS = ['#10B981', '#E11D48'];
const CAUSE_COLORS = ['#D97706', '#2563EB', '#7C3AED', '#059669', '#DB2777', '#64748B'];

export const Section3DetailDept: React.FC<Section3DetailDeptProps> = ({
  items,
  selectedDept,
  onSelectDept,
  availableDepts,
  totalStoreValue,
  basisValue,
}) => {
  // Local table search, sort & pagination
  const [localSearch, setLocalSearch] = useState('');
  const [sortField, setSortField] = useState<DetailSortField>('valueAkhir');
  const [sortAsc, setSortAsc] = useState<boolean>(false);
  const [currentPage, setCurrentPage] = useState<number>(1);
  const [pageSize, setPageSize] = useState<number>(25);

  // Filter items for the selected department
  const deptItems = useMemo(() => {
    if (!selectedDept) return [];
    return items.filter(i => (i.dept || 'LAIN-LAIN') === selectedDept);
  }, [items, selectedDept]);

  // Mini KPI calculations
  const miniKPI = useMemo(() => {
    const itemCount = deptItems.length;
    let qty = 0;
    let value = 0;
    let valueBelumAdf = 0;
    let valueSudahAdf = 0;

    for (const item of deptItems) {
      qty += basisValue === 'outstanding' ? item.qtyReport : item.qtyBarus;
      const v = basisValue === 'outstanding' ? item.valueAkhir : item.value;
      value += v;
      if (item.fu === 'SUDAH DIAJUKAN ADF') {
        valueSudahAdf += item.valueAkhir;
      } else {
        valueBelumAdf += item.valueAkhir;
      }
    }

    const contribution = totalStoreValue > 0 ? (value / totalStoreValue) * 100 : 0;
    const ratioBelumAdf = value > 0 ? (valueBelumAdf / value) * 100 : 0;

    return {
      itemCount,
      qty,
      value,
      contribution,
      valueBelumAdf,
      valueSudahAdf,
      ratioBelumAdf,
    };
  }, [deptItems, totalStoreValue, basisValue]);

  // Top 10 articles by value in this department
  const top10Articles = useMemo(() => {
    const map: Record<string, { article: string; desc: string; value: number; qty: number }> = {};
    for (const item of deptItems) {
      const art = item.article;
      const val = basisValue === 'outstanding' ? item.valueAkhir : item.value;
      const qty = basisValue === 'outstanding' ? item.qtyReport : item.qtyBarus;

      if (!map[art]) {
        map[art] = {
          article: art,
          desc: item.description,
          value: 0,
          qty: 0,
        };
      }
      map[art].value += val;
      map[art].qty += qty;
    }
    const list = Object.values(map);
    list.sort((a, b) => b.value - a.value);
    return list.slice(0, 10).map(i => ({
      ...i,
      displayName: `${i.article} - ${i.desc.slice(0, 22)}${i.desc.length > 22 ? '…' : ''}`,
    }));
  }, [deptItems, basisValue]);

  // Department Cause Breakdown
  const deptCauses = useMemo(() => {
    const map: Record<string, number> = {};
    let total = 0;
    for (const item of deptItems) {
      const val = basisValue === 'outstanding' ? item.valueAkhir : item.value;
      const c = item.causedBy || 'Lainnya';
      map[c] = (map[c] || 0) + val;
      total += val;
    }
    return Object.entries(map).map(([name, value]) => ({
      name,
      value,
      percentage: total > 0 ? (value / total) * 100 : 0,
    })).sort((a, b) => b.value - a.value);
  }, [deptItems, basisValue]);

  // Department ADF Breakdown
  const deptAdfData = useMemo(() => {
    return [
      { name: 'Sudah ADF', value: miniKPI.valueSudahAdf },
      { name: 'Belum ADF', value: miniKPI.valueBelumAdf },
    ].filter(d => d.value > 0);
  }, [miniKPI]);

  // Local filtered, sorted items for table
  const tableItems = useMemo(() => {
    let result = [...deptItems];

    if (localSearch.trim()) {
      const q = localSearch.toLowerCase();
      result = result.filter(
        i =>
          i.article.toLowerCase().includes(q) ||
          i.description.toLowerCase().includes(q) ||
          i.noAdf.toLowerCase().includes(q) ||
          i.detailKerusakan.toLowerCase().includes(q) ||
          i.status.toLowerCase().includes(q)
      );
    }

    result.sort((a, b) => {
      let aVal: any = a[sortField];
      let bVal: any = b[sortField];

      if (sortField === 'weekDate') {
        const timeA = a.weekDate ? a.weekDate.getTime() : 0;
        const timeB = b.weekDate ? b.weekDate.getTime() : 0;
        return sortAsc ? timeA - timeB : timeB - timeA;
      }

      if (typeof aVal === 'string') {
        return sortAsc ? aVal.localeCompare(bVal) : bVal.localeCompare(aVal);
      }
      if (aVal === null || aVal === undefined) aVal = -1;
      if (bVal === null || bVal === undefined) bVal = -1;
      return sortAsc ? aVal - bVal : bVal - aVal;
    });

    return result;
  }, [deptItems, localSearch, sortField, sortAsc]);

  // Pagination
  const totalPages = Math.ceil(tableItems.length / pageSize) || 1;
  const safeCurrentPage = Math.min(currentPage, totalPages);
  const pagedItems = tableItems.slice(
    (safeCurrentPage - 1) * pageSize,
    safeCurrentPage * pageSize
  );

  const handleSort = (field: DetailSortField) => {
    if (sortField === field) {
      setSortAsc(!sortAsc);
    } else {
      setSortField(field);
      setSortAsc(false);
    }
  };

  const renderSortIcon = (field: DetailSortField) => {
    if (sortField !== field) {
      return <ArrowUpDown className="w-3 h-3 text-slate-300" />;
    }
    return sortAsc ? (
      <ArrowUp className="w-3 h-3 text-amber-600" />
    ) : (
      <ArrowDown className="w-3 h-3 text-amber-600" />
    );
  };

  const handleExportDeptCSV = () => {
    exportItemsToCSV(deptItems, `BARUS_${selectedDept.replace(/\s+/g, '_')}_J347.csv`);
  };

  return (
    <section id="section-detail-departemen" className="space-y-6 pt-4">
      
      {/* Section Header & Selector */}
      <div className="bg-white p-4 border border-slate-200 rounded-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
        <div>
          <span className="text-[11px] font-semibold text-amber-700 uppercase tracking-wider block">
            Bagian 3 — Detail & Artikel Barang Rusak
          </span>
          <div className="flex items-center gap-2 mt-0.5">
            <h2 className="text-xl font-bold text-slate-900 tracking-tight">
              Departemen: {selectedDept || 'Pilih Departemen'}
            </h2>
          </div>
        </div>

        {/* Dropdown Selector */}
        <div className="flex items-center gap-2 shrink-0">
          <label htmlFor="dept-select" className="text-xs text-slate-500 font-medium">
            Pilih Departemen:
          </label>
          <select
            id="dept-select"
            value={selectedDept}
            onChange={e => {
              onSelectDept(e.target.value);
              setCurrentPage(1);
            }}
            className="text-xs font-semibold bg-slate-50 border border-slate-200 rounded-md px-3 py-1.5 focus:outline-hidden focus:border-amber-500 focus:bg-white text-slate-800"
          >
            {availableDepts.map(d => (
              <option key={d} value={d}>
                {d}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Mini KPI Cards for Selected Department */}
      <div className="grid grid-cols-2 sm:grid-cols-5 gap-3.5">
        
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Item Departemen</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">
            {formatNumber(miniKPI.itemCount)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Baris data</p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Qty Kerusakan</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums">
            {formatNumber(miniKPI.qty)} unit
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">
            Basis: {basisValue === 'outstanding' ? 'Sisa (Report)' : 'Awal'}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Total Nilai Dept</span>
            <span className="text-xs font-mono text-slate-400">Rp</span>
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums truncate" title={formatRupiah(miniKPI.value)}>
            {formatRupiahShort(miniKPI.value)}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
            {formatRupiah(miniKPI.value)}
          </p>
        </div>

        <div className="p-3.5 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Kontribusi ke Toko</span>
            <span className="text-xs font-semibold text-amber-700">%</span>
          </div>
          <div className="text-lg font-bold text-amber-700 tabular-nums">
            {formatPercent(miniKPI.contribution)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Dari total nilai J347</p>
        </div>

        <div className="p-3.5 bg-white border border-rose-200 rounded-lg bg-rose-50/30">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-bold text-rose-800">Belum Diajukan ADF</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700 tabular-nums truncate" title={formatRupiah(miniKPI.valueBelumAdf)}>
            {formatRupiahShort(miniKPI.valueBelumAdf)}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5 tabular-nums">
            {formatPercent(miniKPI.ratioBelumAdf)} dari nilai dept
          </p>
        </div>

      </div>

      {/* Row 2: Charts (Top 10 Articles + Breakdown Dept) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Top 10 Articles Horizontal Bar (2 Columns) */}
        <div className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between pb-2 mb-2 border-b border-slate-100">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Top 10 Artikel Kerusakan Terbesar ({selectedDept})
              </h3>
              <p className="text-[11px] text-slate-500">
                Peringkat artikel berdasarkan nilai kerugian tertinggi
              </p>
            </div>
            <span className="text-xs text-slate-400 font-mono">
              Basis: {basisValue === 'outstanding' ? 'Outstanding' : 'Awal'}
            </span>
          </div>

          <div className="h-72">
            {top10Articles.length > 0 ? (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart
                  data={top10Articles}
                  layout="vertical"
                  margin={{ top: 5, right: 30, left: 10, bottom: 5 }}
                >
                  <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                  <XAxis
                    type="number"
                    tickFormatter={val => formatRupiahShort(val)}
                    tick={{ fontSize: 11 }}
                  />
                  <YAxis
                    type="category"
                    dataKey="displayName"
                    tick={{ fontSize: 10, fill: '#334155' }}
                    width={180}
                  />
                  <Tooltip
                    formatter={(val: any, name: any, item: any) => [
                      `${formatRupiah(Number(val))} (${item.payload.qty} Unit)`,
                      'Total Value',
                    ]}
                    labelFormatter={(label: any, payload: any) => {
                      if (payload && payload[0]) {
                        return `${payload[0].payload.article} - ${payload[0].payload.desc}`;
                      }
                      return label;
                    }}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  />
                  <Bar dataKey="value" fill="#D97706" radius={[0, 4, 4, 0]} />
                </BarChart>
              </ResponsiveContainer>
            ) : (
              <div className="h-full flex items-center justify-center text-slate-400 text-xs">
                Tidak ada data artikel pada departemen ini.
              </div>
            )}
          </div>
        </div>

        {/* Breakdown ADF & Penyebab Dept (1 Column) */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between space-y-4">
          
          {/* ADF Status Mini Donut */}
          <div>
            <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100">
              <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Status ADF Dept
              </h4>
              <span className="text-[11px] text-slate-500 font-mono">
                {formatRupiahShort(miniKPI.value)}
              </span>
            </div>
            <div className="h-32">
              <ResponsiveContainer width="100%" height="100%">
                <PieChart>
                  <Pie
                    data={deptAdfData}
                    cx="50%"
                    cy="50%"
                    innerRadius={28}
                    outerRadius={48}
                    dataKey="value"
                  >
                    {deptAdfData.map((e, idx) => (
                      <Cell key={`dept-adf-${idx}`} fill={ADF_COLORS[idx % ADF_COLORS.length]} />
                    ))}
                  </Pie>
                  <Tooltip
                    formatter={(val: any) => [formatRupiah(Number(val)), 'Value']}
                    contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '11px' }}
                  />
                </PieChart>
              </ResponsiveContainer>
            </div>
            <div className="flex items-center justify-around text-[11px] pt-1">
              <span className="text-emerald-700 font-medium">Sudah: {formatRupiahShort(miniKPI.valueSudahAdf)}</span>
              <span className="text-rose-700 font-bold">Belum: {formatRupiahShort(miniKPI.valueBelumAdf)}</span>
            </div>
          </div>

          {/* Causes List */}
          <div className="pt-2 border-t border-slate-100">
            <h4 className="text-xs font-bold text-slate-800 uppercase tracking-wide mb-2">
              Akar Penyebab ({selectedDept})
            </h4>
            <div className="space-y-1.5">
              {deptCauses.slice(0, 4).map((c, idx) => (
                <div key={c.name} className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-1.5 truncate max-w-[140px]">
                    <span className="w-2 h-2 rounded-full shrink-0" style={{ backgroundColor: CAUSE_COLORS[idx % CAUSE_COLORS.length] }} />
                    <span className="text-slate-600 truncate">{c.name}</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-800 tabular-nums">{formatRupiahShort(c.value)}</span>
                    <span className="text-[10px] text-slate-400 ml-1">({formatPercent(c.percentage, 0)})</span>
                  </div>
                </div>
              ))}
            </div>
          </div>

        </div>

      </div>

      {/* Row 3: Detail Barang Rusak Table */}
      <div className="bg-white border border-slate-200 rounded-lg overflow-hidden">
        
        {/* Table Controls (Search, Row Count, Export) */}
        <div className="p-4 border-b border-slate-200 flex flex-col sm:flex-row sm:items-center justify-between gap-3">
          <div>
            <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
              Tabel Detail Barang Rusak — {selectedDept}
            </h3>
            <p className="text-[11px] text-slate-500">
              Menampilkan {tableItems.length} barang rusak pada departemen ini
            </p>
          </div>

          <div className="flex flex-wrap items-center gap-2">
            {/* Table Search */}
            <div className="relative min-w-[200px]">
              <Search className="w-3.5 h-3.5 absolute left-2.5 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari dalam tabel departemen ini..."
                value={localSearch}
                onChange={e => {
                  setLocalSearch(e.target.value);
                  setCurrentPage(1);
                }}
                className="w-full pl-7 pr-3 py-1 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:border-amber-500"
              />
              {localSearch && (
                <button
                  onClick={() => setLocalSearch('')}
                  className="absolute right-2 top-1/2 -translate-y-1/2 text-slate-400 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Page Size */}
            <div className="flex items-center gap-1 text-xs text-slate-600">
              <span>Baris:</span>
              <select
                value={pageSize}
                onChange={e => {
                  setPageSize(Number(e.target.value));
                  setCurrentPage(1);
                }}
                className="bg-slate-50 border border-slate-200 rounded px-1.5 py-1 text-xs text-slate-700"
              >
                <option value={10}>10</option>
                <option value={25}>25</option>
                <option value={50}>50</option>
                <option value={100}>100</option>
              </select>
            </div>

            {/* Export Button */}
            <button
              onClick={handleExportDeptCSV}
              className="inline-flex items-center gap-1.5 px-3 py-1 text-xs font-semibold text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Unduh data departemen ini dalam file CSV"
            >
              <Download className="w-3.5 h-3.5 text-slate-600" />
              <span>Ekspor Dept (.csv)</span>
            </button>
          </div>
        </div>

        {/* The Grid Table */}
        <div className="overflow-x-auto">
          <table className="w-full text-xs text-left border-collapse">
            <thead>
              <tr className="bg-slate-50 text-slate-700 border-b border-slate-200 whitespace-nowrap">
                <th
                  onClick={() => handleSort('weekDate')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Tanggal (WEEK)</span>
                    {renderSortIcon('weekDate')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('article')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Article</span>
                    {renderSortIcon('article')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('description')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors max-w-xs"
                >
                  <div className="flex items-center gap-1">
                    <span>Description</span>
                    {renderSortIcon('description')}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold max-w-xs">Detail Kerusakan</th>
                <th
                  onClick={() => handleSort('causedBy')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Caused By</span>
                    {renderSortIcon('causedBy')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qtyBarus')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty Awal</span>
                    {renderSortIcon('qtyBarus')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('qtyReport')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Qty Sisa</span>
                    {renderSortIcon('qtyReport')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('price')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Price</span>
                    {renderSortIcon('price')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('value')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Value Awal</span>
                    {renderSortIcon('value')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('valueAkhir')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors text-amber-800"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Value Akhir</span>
                    {renderSortIcon('valueAkhir')}
                  </div>
                </th>
                <th
                  onClick={() => handleSort('fu')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors text-center"
                >
                  <div className="flex items-center justify-center gap-1">
                    <span>Status ADF</span>
                    {renderSortIcon('fu')}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold">No ADF</th>
                <th
                  onClick={() => handleSort('status')}
                  className="py-2.5 px-3 font-semibold cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center gap-1">
                    <span>Status</span>
                    {renderSortIcon('status')}
                  </div>
                </th>
                <th className="py-2.5 px-3 font-semibold">Responsibility</th>
                <th
                  onClick={() => handleSort('ageDays')}
                  className="py-2.5 px-3 font-semibold text-right cursor-pointer hover:bg-slate-100 transition-colors"
                >
                  <div className="flex items-center justify-end gap-1">
                    <span>Umur (Hari)</span>
                    {renderSortIcon('ageDays')}
                  </div>
                </th>
              </tr>
            </thead>
            <tbody className="divide-y divide-slate-100 text-slate-700">
              {pagedItems.map((item, idx) => {
                const isBelumAdf = item.fu === 'BELUM DIAJUKAN ADF';
                const isOld = item.ageDays !== null && item.ageDays > 180;
                const isVeryOld = item.ageDays !== null && item.ageDays > 365;

                return (
                  <tr key={item.id} className="hover:bg-amber-50/30 transition-colors">
                    {/* Tanggal WEEK */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600 font-mono text-[11px]">
                      {item.weekFormatted}
                    </td>

                    {/* Article */}
                    <td className="py-2 px-3 whitespace-nowrap font-mono font-semibold text-slate-900">
                      {item.article}
                    </td>

                    {/* Description */}
                    <td className="py-2 px-3 max-w-xs truncate text-slate-800" title={item.description}>
                      {item.description}
                    </td>

                    {/* Detail Kerusakan */}
                    <td className="py-2 px-3 max-w-xs truncate text-slate-500" title={item.detailKerusakan}>
                      {item.detailKerusakan}
                    </td>

                    {/* Caused By */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-700">
                      {item.causedBy}
                    </td>

                    {/* Qty Awal */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums text-slate-500">
                      {item.qtyBarus}
                    </td>

                    {/* Qty Sisa (Report) */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-semibold text-amber-700">
                      {item.qtyReport}
                    </td>

                    {/* Price */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums text-slate-600">
                      {formatRupiah(item.price)}
                    </td>

                    {/* Value Awal */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums text-slate-500">
                      {formatRupiah(item.value)}
                    </td>

                    {/* Value Akhir */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums font-bold text-slate-900 bg-amber-50/30">
                      {formatRupiah(item.valueAkhir)}
                    </td>

                    {/* Status ADF (Badge Merah / Hijau) */}
                    <td className="py-2 px-3 whitespace-nowrap text-center">
                      {isBelumAdf ? (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-rose-800 bg-rose-50 border border-rose-200 px-2 py-0.5 rounded-sm">
                          <XCircle className="w-3 h-3 text-rose-600" />
                          <span>BELUM ADF</span>
                        </span>
                      ) : (
                        <span className="inline-flex items-center gap-1 text-[11px] font-semibold text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded-sm">
                          <CheckCircle className="w-3 h-3 text-emerald-600" />
                          <span>SUDAH ADF</span>
                        </span>
                      )}
                    </td>

                    {/* No ADF */}
                    <td className="py-2 px-3 whitespace-nowrap font-mono text-[11px] text-slate-600">
                      {item.noAdf || '-'}
                    </td>

                    {/* Status Tindakan */}
                    <td className="py-2 px-3 whitespace-nowrap">
                      <span className="text-[11px] font-medium text-slate-700 bg-slate-100 px-1.5 py-0.5 rounded">
                        {item.status}
                      </span>
                    </td>

                    {/* Responsibility */}
                    <td className="py-2 px-3 whitespace-nowrap text-slate-600">
                      {item.responsibility}
                    </td>

                    {/* Umur (Hari) */}
                    <td className="py-2 px-3 whitespace-nowrap text-right tabular-nums">
                      {item.ageDays !== null ? (
                        <span
                          className={`font-mono font-medium ${
                            isVeryOld
                              ? 'text-rose-700 font-bold bg-rose-50 px-1.5 py-0.5 rounded'
                              : isOld
                              ? 'text-amber-700 font-semibold'
                              : 'text-slate-600'
                          }`}
                        >
                          {item.ageDays} hr
                        </span>
                      ) : (
                        <span className="text-slate-400 text-[10px]">Tidak valid</span>
                      )}
                    </td>
                  </tr>
                );
              })}

              {pagedItems.length === 0 && (
                <tr>
                  <td colSpan={15} className="py-8 text-center text-slate-400 text-xs">
                    Tidak ada barang rusak yang cocok dengan filter atau pencarian.
                  </td>
                </tr>
              )}
            </tbody>
          </table>
        </div>

        {/* Pagination Footer */}
        <div className="p-3 border-t border-slate-200 bg-slate-50 flex items-center justify-between text-xs text-slate-600">
          <div className="tabular-nums">
            Menampilkan{' '}
            <span className="font-semibold text-slate-800">
              {tableItems.length > 0 ? (safeCurrentPage - 1) * pageSize + 1 : 0}
            </span>{' '}
            hingga{' '}
            <span className="font-semibold text-slate-800">
              {Math.min(safeCurrentPage * pageSize, tableItems.length)}
            </span>{' '}
            dari <span className="font-semibold text-slate-800">{tableItems.length}</span> baris
          </div>

          <div className="flex items-center gap-2">
            <button
              onClick={() => setCurrentPage(p => Math.max(p - 1, 1))}
              disabled={safeCurrentPage <= 1}
              className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronLeft className="w-4 h-4 text-slate-600" />
            </button>
            <span className="font-mono text-xs tabular-nums font-medium">
              Hal {safeCurrentPage} / {totalPages}
            </span>
            <button
              onClick={() => setCurrentPage(p => Math.min(p + 1, totalPages))}
              disabled={safeCurrentPage >= totalPages}
              className="p-1 rounded bg-white border border-slate-200 disabled:opacity-40 disabled:cursor-not-allowed hover:bg-slate-100"
            >
              <ChevronRight className="w-4 h-4 text-slate-600" />
            </button>
          </div>
        </div>

      </div>

    </section>
  );
};
