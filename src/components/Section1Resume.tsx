import React, { useState } from 'react';
import {
  ResponsiveContainer,
  PieChart,
  Pie,
  Cell,
  Tooltip,
  Legend,
  BarChart,
  Bar,
  XAxis,
  YAxis,
  CartesianGrid,
  Line,
  ComposedChart,
} from 'recharts';
import {
  BarusItem,
  KPISummary,
  AgingBucket,
  BasisValue,
} from '../types/barus';
import {
  formatRupiah,
  formatRupiahShort,
  formatNumber,
  formatPercent,
} from '../utils/formatters';
import {
  calculateMonthlyTrend,
  calculateBreakdown,
} from '../utils/metrics';
import {
  Package,
  Layers,
  TrendingDown,
  CheckCircle2,
  Clock,
  FileCheck,
  AlertTriangle,
  Boxes,
  HelpCircle,
} from 'lucide-react';

interface Section1ResumeProps {
  items: BarusItem[];
  kpi: KPISummary;
  aging: AgingBucket[];
  basisValue: BasisValue;
}

const ADF_COLORS = ['#10B981', '#E11D48']; // Emerald (Sudah), Rose (Belum)
const CAUSE_COLORS = ['#D97706', '#2563EB', '#7C3AED', '#059669', '#DB2777', '#64748B'];
const STATUS_COLORS = ['#3B82F6', '#EF4444', '#10B981', '#F59E0B', '#8B5CF6', '#64748B'];

export const Section1Resume: React.FC<Section1ResumeProps> = ({
  items,
  kpi,
  aging,
  basisValue,
}) => {
  const [trendMetric, setTrendMetric] = useState<'both' | 'value' | 'qty'>('both');

  // ADF Composition data
  const adfDonutData = [
    {
      name: 'Sudah Diajukan ADF',
      value: kpi.valueSudahAdf,
      percentage: kpi.percentValueSudahAdf,
    },
    {
      name: 'Belum Diajukan ADF',
      value: kpi.valueBelumAdf,
      percentage: kpi.percentValueBelumAdf,
    },
  ].filter(d => d.value > 0);

  // Caused By breakdown data
  const causeBreakdown = calculateBreakdown(items, 'causedBy', basisValue);

  // Status breakdown data
  const statusBreakdown = calculateBreakdown(items, 'status', basisValue);

  // Monthly trend data
  const monthlyTrend = calculateMonthlyTrend(items);

  return (
    <section className="space-y-6">
      
      {/* Section Header */}
      <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 border-b border-slate-200 gap-2">
        <div>
          <h2 className="text-lg font-bold text-slate-900 tracking-tight flex items-center gap-2">
            <span>Bagian 1 — Resume Barang Rusak</span>
            <span className="text-xs font-medium text-slate-500 font-normal">
              (Informa Alam Sutera J347)
            </span>
          </h2>
          <p className="text-xs text-slate-500 mt-0.5">
            Ikhtisar performa akumulasi barang rusak, rasio penyelesaian, dan aging outstanding.
          </p>
        </div>
        <div className="text-xs text-slate-500 self-start sm:self-auto">
          Basis visualisasi: <span className="font-semibold text-slate-800 uppercase">{basisValue === 'outstanding' ? 'Value Akhir (Outstanding)' : 'Value Awal'}</span>
        </div>
      </div>

      {/* Grid KPI Cards (10 Cards) */}
      <div className="grid grid-cols-2 sm:grid-cols-3 lg:grid-cols-5 gap-3.5">
        
        {/* 1. Jumlah Item */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Jumlah Item</span>
            <Package className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(kpi.totalItems)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Baris data valid</p>
        </div>

        {/* 2. SKU Unik */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">SKU Unik</span>
            <Layers className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(kpi.uniqueSkus)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Kode artikel berbeda</p>
        </div>

        {/* 3. Qty Barus Awal */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Qty Barus (Awal)</span>
            <Boxes className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-xl font-bold text-slate-900 tabular-nums">
            {formatNumber(kpi.qtyBarusAwal)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Unit barang terlaporkan</p>
        </div>

        {/* 4. Qty Outstanding */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Qty Outstanding</span>
            <Clock className="w-4 h-4 text-amber-500" />
          </div>
          <div className="text-xl font-bold text-amber-600 tabular-nums">
            {formatNumber(kpi.qtyOutstanding)}
          </div>
          <p className="text-[11px] text-slate-400 mt-0.5">Sisa unit (Report)</p>
        </div>

        {/* 5. Qty Sudah Solved */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Qty Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-xl font-bold text-emerald-700 tabular-nums">
            {formatNumber(kpi.qtySolved)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {formatPercent(kpi.percentQtySolved)} terselesaikan
          </p>
        </div>

        {/* 6. Value Barus Awal */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Value Barus (Awal)</span>
            <TrendingDown className="w-4 h-4 text-slate-400" />
          </div>
          <div className="text-lg font-bold text-slate-900 tabular-nums truncate" title={formatRupiah(kpi.valueBarusAwal)}>
            {formatRupiahShort(kpi.valueBarusAwal)}
          </div>
          <p className="text-[11px] text-slate-400 truncate mt-0.5 font-mono">
            {formatRupiah(kpi.valueBarusAwal)}
          </p>
        </div>

        {/* 7. Value Outstanding */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors bg-amber-50/20">
          <div className="flex items-center justify-between text-slate-600 mb-1">
            <span className="text-xs font-semibold text-slate-800">Value Outstanding</span>
            <AlertTriangle className="w-4 h-4 text-amber-600" />
          </div>
          <div className="text-lg font-bold text-amber-700 tabular-nums truncate" title={formatRupiah(kpi.valueOutstanding)}>
            {formatRupiahShort(kpi.valueOutstanding)}
          </div>
          <p className="text-[11px] text-amber-800/80 truncate mt-0.5 font-mono">
            {formatRupiah(kpi.valueOutstanding)}
          </p>
        </div>

        {/* 8. Value Sudah Solved */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Value Solved</span>
            <CheckCircle2 className="w-4 h-4 text-emerald-500" />
          </div>
          <div className="text-lg font-bold text-emerald-700 tabular-nums truncate" title={formatRupiah(kpi.valueSolved)}>
            {formatRupiahShort(kpi.valueSolved)}
          </div>
          <p className="text-[11px] text-emerald-700 font-medium mt-0.5">
            {formatPercent(kpi.percentValueSolved)} nilai pulih
          </p>
        </div>

        {/* 9. Value Sudah Diajukan ADF */}
        <div className="p-3.5 bg-white border border-slate-200 rounded-lg hover:border-slate-300 transition-colors">
          <div className="flex items-center justify-between text-slate-500 mb-1">
            <span className="text-xs font-medium">Sudah ADF</span>
            <FileCheck className="w-4 h-4 text-emerald-600" />
          </div>
          <div className="text-lg font-bold text-emerald-700 tabular-nums truncate" title={formatRupiah(kpi.valueSudahAdf)}>
            {formatRupiahShort(kpi.valueSudahAdf)}
          </div>
          <p className="text-[11px] text-slate-500 mt-0.5 tabular-nums">
            {formatPercent(kpi.percentValueSudahAdf)} dari outstanding
          </p>
        </div>

        {/* 10. Value Belum Diajukan ADF */}
        <div className="p-3.5 bg-white border border-rose-200 rounded-lg hover:border-rose-300 transition-colors bg-rose-50/30">
          <div className="flex items-center justify-between text-rose-700 mb-1">
            <span className="text-xs font-bold text-rose-800">Belum Diajukan ADF</span>
            <AlertTriangle className="w-4 h-4 text-rose-600" />
          </div>
          <div className="text-lg font-bold text-rose-700 tabular-nums truncate" title={formatRupiah(kpi.valueBelumAdf)}>
            {formatRupiahShort(kpi.valueBelumAdf)}
          </div>
          <p className="text-[11px] text-rose-700 font-semibold mt-0.5 tabular-nums">
            {formatPercent(kpi.percentValueBelumAdf)} butuh follow-up
          </p>
        </div>

      </div>

      {/* Row 2: Charts (ADF Donut + Caused By Donut + Status Bar) */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Chart 1: Donut ADF Composition */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Status Pengajuan ADF
              </h3>
              <p className="text-[11px] text-slate-500">
                Komposisi Value Outstanding
              </p>
            </div>
            <span className="text-[11px] font-mono text-slate-500">
              Total: {formatRupiahShort(kpi.valueOutstanding)}
            </span>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={adfDonutData}
                  cx="50%"
                  cy="50%"
                  innerRadius={55}
                  outerRadius={80}
                  paddingAngle={3}
                  dataKey="value"
                >
                  {adfDonutData.map((entry, index) => (
                    <Cell key={`cell-${index}`} fill={ADF_COLORS[index % ADF_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                  itemStyle={{ color: '#fff' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-around text-xs">
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />
              <span className="text-slate-600">Sudah ADF:</span>
              <span className="font-bold text-emerald-700 tabular-nums">
                {formatPercent(kpi.percentValueSudahAdf)}
              </span>
            </div>
            <div className="flex items-center gap-1.5">
              <span className="w-2.5 h-2.5 rounded-full bg-rose-600 inline-block" />
              <span className="text-slate-600">Belum ADF:</span>
              <span className="font-bold text-rose-700 tabular-nums">
                {formatPercent(kpi.percentValueBelumAdf)}
              </span>
            </div>
          </div>
        </div>

        {/* Chart 2: Donut Caused By Breakdown */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Penyebab Kerusakan (Caused By)
              </h3>
              <p className="text-[11px] text-slate-500">
                Proporsi nilai berdasarkan akar penyebab
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <PieChart>
                <Pie
                  data={causeBreakdown}
                  cx="50%"
                  cy="50%"
                  innerRadius={50}
                  outerRadius={75}
                  paddingAngle={2}
                  dataKey="value"
                  nameKey="label"
                >
                  {causeBreakdown.map((entry, index) => (
                    <Cell key={`cell-cause-${index}`} fill={CAUSE_COLORS[index % CAUSE_COLORS.length]} />
                  ))}
                </Pie>
                <Tooltip
                  formatter={(val: any) => [formatRupiah(Number(val)), 'Value']}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
              </PieChart>
            </ResponsiveContainer>
          </div>

          {/* Compact Legend */}
          <div className="pt-2 border-t border-slate-100 flex flex-wrap gap-x-3 gap-y-1 justify-center text-[11px]">
            {causeBreakdown.slice(0, 4).map((c, idx) => (
              <div key={c.label} className="flex items-center gap-1">
                <span className="w-2 h-2 rounded-full inline-block" style={{ backgroundColor: CAUSE_COLORS[idx % CAUSE_COLORS.length] }} />
                <span className="text-slate-600 truncate max-w-[100px]">{c.label}</span>
                <span className="font-semibold text-slate-800 tabular-nums">{formatPercent(c.percentage, 0)}</span>
              </div>
            ))}
          </div>
        </div>

        {/* Chart 3: Horizontal Bar Status Penyelesaian */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="flex items-center justify-between mb-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Jumlah Item per Status Tindakan
              </h3>
              <p className="text-[11px] text-slate-500">
                Distribusi item berdasarkan status tindak lanjut
              </p>
            </div>
          </div>

          <div className="h-56">
            <ResponsiveContainer width="100%" height="100%">
              <BarChart
                data={statusBreakdown}
                layout="vertical"
                margin={{ top: 5, right: 20, left: 20, bottom: 5 }}
              >
                <CartesianGrid strokeDasharray="3 3" horizontal={false} stroke="#f1f5f9" />
                <XAxis type="number" tick={{ fontSize: 11 }} />
                <YAxis
                  type="category"
                  dataKey="label"
                  tick={{ fontSize: 10, fill: '#475569' }}
                  width={90}
                />
                <Tooltip
                  formatter={(val: any, name: any, item: any) => [
                    `${val} Item (${formatRupiah(item.payload.value)})`,
                    'Jumlah Item',
                  ]}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Bar dataKey="count" radius={[0, 4, 4, 0]}>
                  {statusBreakdown.map((entry, index) => (
                    <Cell key={`status-bar-${index}`} fill={STATUS_COLORS[index % STATUS_COLORS.length]} />
                  ))}
                </Bar>
              </BarChart>
            </ResponsiveContainer>
          </div>

          <div className="pt-2 border-t border-slate-100 flex items-center justify-between text-xs text-slate-500">
            <span>Status teratas: <strong className="text-slate-800">{statusBreakdown[0]?.label || '-'}</strong></span>
            <span>{statusBreakdown.length} kategori status</span>
          </div>
        </div>

      </div>

      {/* Row 3: Monthly Trend & Aging Distribution */}
      <div className="grid grid-cols-1 lg:grid-cols-3 gap-5">
        
        {/* Monthly Trend (2 Columns) */}
        <div className="lg:col-span-2 p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="flex flex-col sm:flex-row sm:items-center justify-between pb-2 mb-2 border-b border-slate-100 gap-2">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Tren Barang Rusak per Bulan (WEEK)
              </h3>
              <p className="text-[11px] text-slate-500">
                Kronologis pencatatan barang rusak berdasarkan tanggal WEEK laporan
              </p>
            </div>
            <div className="flex items-center gap-1 bg-slate-100 p-0.5 rounded-md">
              <button
                onClick={() => setTrendMetric('both')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  trendMetric === 'both' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Value & Qty
              </button>
              <button
                onClick={() => setTrendMetric('value')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  trendMetric === 'value' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Hanya Value
              </button>
              <button
                onClick={() => setTrendMetric('qty')}
                className={`px-2 py-0.5 text-xs rounded transition-colors ${
                  trendMetric === 'qty' ? 'bg-white text-slate-900 font-semibold shadow-xs' : 'text-slate-600'
                }`}
              >
                Hanya Qty
              </button>
            </div>
          </div>

          <div className="h-64">
            <ResponsiveContainer width="100%" height="100%">
              <ComposedChart data={monthlyTrend} margin={{ top: 10, right: 20, left: 10, bottom: 20 }}>
                <CartesianGrid strokeDasharray="3 3" stroke="#f1f5f9" />
                <XAxis dataKey="monthLabel" tick={{ fontSize: 11 }} angle={-25} textAnchor="end" height={40} />
                {(trendMetric === 'both' || trendMetric === 'value') && (
                  <YAxis
                    yAxisId="left"
                    tickFormatter={(val: number) => formatRupiahShort(val)}
                    tick={{ fontSize: 11 }}
                  />
                )}
                {(trendMetric === 'both' || trendMetric === 'qty') && (
                  <YAxis
                    yAxisId="right"
                    orientation="right"
                    tick={{ fontSize: 11 }}
                  />
                )}
                <Tooltip
                  formatter={(val: any, name: any) => {
                    if (name.includes('Value')) return [formatRupiah(Number(val)), name];
                    return [`${val} unit`, name];
                  }}
                  contentStyle={{ backgroundColor: '#0f172a', borderColor: '#1e293b', borderRadius: '8px', color: '#fff', fontSize: '12px' }}
                />
                <Legend wrapperStyle={{ fontSize: '11px', paddingTop: '10px' }} />

                {(trendMetric === 'both' || trendMetric === 'value') && (
                  <Bar
                    yAxisId="left"
                    dataKey="valueAkhir"
                    name="Value Outstanding (Rp)"
                    fill="#D97706"
                    radius={[4, 4, 0, 0]}
                  />
                )}
                {(trendMetric === 'both' || trendMetric === 'value') && (
                  <Line
                    yAxisId="left"
                    type="monotone"
                    dataKey="valueAwal"
                    name="Value Awal (Rp)"
                    stroke="#2563EB"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
                {(trendMetric === 'both' || trendMetric === 'qty') && (
                  <Line
                    yAxisId="right"
                    type="monotone"
                    dataKey="qtyAkhir"
                    name="Qty Outstanding"
                    stroke="#10B981"
                    strokeWidth={2}
                    dot={{ r: 3 }}
                  />
                )}
              </ComposedChart>
            </ResponsiveContainer>
          </div>
        </div>

        {/* Aging Panel (1 Column) */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div className="pb-2 mb-3 border-b border-slate-100 flex items-center justify-between">
            <div>
              <h3 className="text-xs font-bold text-slate-800 uppercase tracking-wide">
                Distribusi Aging (Umur Kerusakan)
              </h3>
              <p className="text-[11px] text-slate-500">
                Dihitung dari tanggal WEEK sampai hari ini
              </p>
            </div>
            <Clock className="w-4 h-4 text-slate-400" />
          </div>

          <div className="space-y-3.5 my-auto">
            {aging.map(bucket => (
              <div key={bucket.label} className="space-y-1">
                <div className="flex items-center justify-between text-xs">
                  <div className="flex items-center gap-2">
                    <span className="w-2.5 h-2.5 rounded-full shrink-0" style={{ backgroundColor: bucket.color }} />
                    <span className="font-medium text-slate-800">{bucket.label}</span>
                    <span className="text-[10px] text-slate-400">({bucket.range})</span>
                  </div>
                  <div className="text-right">
                    <span className="font-semibold text-slate-900 tabular-nums">
                      {formatRupiahShort(bucket.value)}
                    </span>
                    <span className="text-[11px] text-slate-400 ml-1.5 tabular-nums">
                      {formatPercent(bucket.percentage, 0)}
                    </span>
                  </div>
                </div>

                {/* Progress Bar */}
                <div className="w-full bg-slate-100 h-2 rounded-full overflow-hidden">
                  <div
                    className="h-full rounded-full transition-all duration-300"
                    style={{
                      width: `${Math.min(100, Math.max(0, bucket.percentage))}%`,
                      backgroundColor: bucket.color,
                    }}
                  />
                </div>

                <div className="flex items-center justify-between text-[10px] text-slate-400 px-0.5">
                  <span>{bucket.count} baris item</span>
                  <span>{bucket.qty} unit</span>
                </div>
              </div>
            ))}
          </div>

          <div className="pt-3 mt-3 border-t border-slate-100 text-[11px] text-slate-500 flex items-center gap-1.5">
            <AlertTriangle className="w-3.5 h-3.5 text-amber-600 shrink-0" />
            <span>Perhatikan barang &gt; 180 hari untuk percepatan disposisi ADF.</span>
          </div>
        </div>

      </div>

    </section>
  );
};
