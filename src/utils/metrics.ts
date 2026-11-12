import { BarusItem, BasisValue, KPISummary, AgingBucket, DeptSummary } from '../types/barus';

export function calculateKPISummary(items: BarusItem[]): KPISummary {
  const totalItems = items.length;
  const uniqueSkus = new Set(items.map(i => i.article)).size;

  let qtyBarusAwal = 0;
  let qtyOutstanding = 0;
  let qtySolved = 0;
  let valueBarusAwal = 0;
  let valueOutstanding = 0;
  let valueSudahAdf = 0;
  let valueBelumAdf = 0;

  for (const item of items) {
    qtyBarusAwal += item.qtyBarus;
    qtyOutstanding += item.qtyReport;
    qtySolved += item.qtyFu;
    valueBarusAwal += item.value;
    valueOutstanding += item.valueAkhir;

    if (item.fu === 'SUDAH DIAJUKAN ADF') {
      valueSudahAdf += item.valueAkhir;
    } else {
      valueBelumAdf += item.valueAkhir;
    }
  }

  const valueSolved = Math.max(0, valueBarusAwal - valueOutstanding);
  const percentQtySolved = qtyBarusAwal > 0 ? (qtySolved / qtyBarusAwal) * 100 : 0;
  const percentValueSolved = valueBarusAwal > 0 ? (valueSolved / valueBarusAwal) * 100 : 0;
  const percentValueSudahAdf = valueOutstanding > 0 ? (valueSudahAdf / valueOutstanding) * 100 : 0;
  const percentValueBelumAdf = valueOutstanding > 0 ? (valueBelumAdf / valueOutstanding) * 100 : 0;

  return {
    totalItems,
    uniqueSkus,
    qtyBarusAwal,
    qtyOutstanding,
    qtySolved,
    percentQtySolved,
    valueBarusAwal,
    valueOutstanding,
    valueSolved,
    percentValueSolved,
    valueSudahAdf,
    valueBelumAdf,
    percentValueSudahAdf,
    percentValueBelumAdf,
  };
}

export function calculateAging(items: BarusItem[], basisValue: BasisValue): AgingBucket[] {
  const buckets: Record<string, { label: string; range: string; count: number; qty: number; value: number; color: string }> = {
    b0_30: { label: '0–30 Hari', range: '< 1 Bulan', count: 0, qty: 0, value: 0, color: '#10B981' }, // emerald
    b31_90: { label: '31–90 Hari', range: '1–3 Bulan', count: 0, qty: 0, value: 0, color: '#3B82F6' }, // blue
    b91_180: { label: '91–180 Hari', range: '3–6 Bulan', count: 0, qty: 0, value: 0, color: '#F59E0B' }, // amber
    b181_365: { label: '181–365 Hari', range: '6–12 Bulan', count: 0, qty: 0, value: 0, color: '#F97316' }, // orange
    b365_plus: { label: '> 1 Tahun', range: '> 365 Hari', count: 0, qty: 0, value: 0, color: '#EF4444' }, // red
    invalid: { label: 'Tanggal Tidak Valid', range: 'Format Tidak Dikenal', count: 0, qty: 0, value: 0, color: '#94A3B8' }, // slate
  };

  let totalVal = 0;

  for (const item of items) {
    const itemVal = basisValue === 'outstanding' ? item.valueAkhir : item.value;
    const itemQty = basisValue === 'outstanding' ? item.qtyReport : item.qtyBarus;
    totalVal += itemVal;

    if (item.ageDays === null || !item.isValidDate) {
      buckets.invalid.count += 1;
      buckets.invalid.qty += itemQty;
      buckets.invalid.value += itemVal;
    } else {
      const days = item.ageDays;
      if (days <= 30) {
        buckets.b0_30.count += 1;
        buckets.b0_30.qty += itemQty;
        buckets.b0_30.value += itemVal;
      } else if (days <= 90) {
        buckets.b31_90.count += 1;
        buckets.b31_90.qty += itemQty;
        buckets.b31_90.value += itemVal;
      } else if (days <= 180) {
        buckets.b91_180.count += 1;
        buckets.b91_180.qty += itemQty;
        buckets.b91_180.value += itemVal;
      } else if (days <= 365) {
        buckets.b181_365.count += 1;
        buckets.b181_365.qty += itemQty;
        buckets.b181_365.value += itemVal;
      } else {
        buckets.b365_plus.count += 1;
        buckets.b365_plus.qty += itemQty;
        buckets.b365_plus.value += itemVal;
      }
    }
  }

  const result: AgingBucket[] = Object.values(buckets).map(b => ({
    ...b,
    percentage: totalVal > 0 ? (b.value / totalVal) * 100 : 0,
  }));

  // If no invalid items, we can filter out or keep if count > 0
  return result.filter(b => b.label !== 'Tanggal Tidak Valid' || b.count > 0);
}

export function calculateDeptSummary(items: BarusItem[], basisValue: BasisValue): DeptSummary[] {
  const map: Record<string, {
    count: number;
    qty: number;
    value: number;
    valueBelumAdf: number;
    valueSudahAdf: number;
  }> = {};

  let totalQty = 0;
  let totalValue = 0;

  for (const item of items) {
    const d = item.dept || 'LAIN-LAIN';
    if (!map[d]) {
      map[d] = { count: 0, qty: 0, value: 0, valueBelumAdf: 0, valueSudahAdf: 0 };
    }
    const val = basisValue === 'outstanding' ? item.valueAkhir : item.value;
    const qty = basisValue === 'outstanding' ? item.qtyReport : item.qtyBarus;

    map[d].count += 1;
    map[d].qty += qty;
    map[d].value += val;

    if (item.fu === 'SUDAH DIAJUKAN ADF') {
      map[d].valueSudahAdf += item.valueAkhir;
    } else {
      map[d].valueBelumAdf += item.valueAkhir;
    }

    totalQty += qty;
    totalValue += val;
  }

  const list: DeptSummary[] = Object.keys(map).map(dept => {
    const data = map[dept];
    return {
      dept,
      itemCount: data.count,
      qty: data.qty,
      qtyPercent: totalQty > 0 ? (data.qty / totalQty) * 100 : 0,
      value: data.value,
      valuePercent: totalValue > 0 ? (data.value / totalValue) * 100 : 0,
      valueBelumAdf: data.valueBelumAdf,
      valueSudahAdf: data.valueSudahAdf,
    };
  });

  // Sort descending by value
  list.sort((a, b) => b.value - a.value);

  // Compute cumulative % for Pareto
  let runningVal = 0;
  for (const d of list) {
    runningVal += d.value;
    d.cumValuePercent = totalValue > 0 ? (runningVal / totalValue) * 100 : 0;
  }

  return list;
}

export function calculateMonthlyTrend(items: BarusItem[]) {
  const map: Record<string, {
    sortKey: string;
    monthLabel: string;
    valueAwal: number;
    valueAkhir: number;
    qtyAwal: number;
    qtyAkhir: number;
    count: number;
  }> = {};

  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];

  for (const item of items) {
    if (!item.weekDate || isNaN(item.weekDate.getTime())) {
      const fallbackKey = '9999-99';
      if (!map[fallbackKey]) {
        map[fallbackKey] = {
          sortKey: fallbackKey,
          monthLabel: 'Lainnya',
          valueAwal: 0,
          valueAkhir: 0,
          qtyAwal: 0,
          qtyAkhir: 0,
          count: 0,
        };
      }
      map[fallbackKey].valueAwal += item.value;
      map[fallbackKey].valueAkhir += item.valueAkhir;
      map[fallbackKey].qtyAwal += item.qtyBarus;
      map[fallbackKey].qtyAkhir += item.qtyReport;
      map[fallbackKey].count += 1;
      continue;
    }

    const y = item.weekDate.getFullYear();
    const m = item.weekDate.getMonth();
    const key = `${y}-${String(m + 1).padStart(2, '0')}`;
    const label = `${months[m]} ${y}`;

    if (!map[key]) {
      map[key] = {
        sortKey: key,
        monthLabel: label,
        valueAwal: 0,
        valueAkhir: 0,
        qtyAwal: 0,
        qtyAkhir: 0,
        count: 0,
      };
    }

    map[key].valueAwal += item.value;
    map[key].valueAkhir += item.valueAkhir;
    map[key].qtyAwal += item.qtyBarus;
    map[key].qtyAkhir += item.qtyReport;
    map[key].count += 1;
  }

  const sortedKeys = Object.keys(map).sort();
  return sortedKeys.map(k => map[k]);
}

export function calculateBreakdown(
  items: BarusItem[],
  key: 'causedBy' | 'status',
  basisValue: BasisValue
) {
  const map: Record<string, { label: string; count: number; value: number; qty: number }> = {};
  let totalVal = 0;

  for (const item of items) {
    const val = basisValue === 'outstanding' ? item.valueAkhir : item.value;
    const qty = basisValue === 'outstanding' ? item.qtyReport : item.qtyBarus;
    const name = item[key] || 'Lainnya';

    if (!map[name]) {
      map[name] = { label: name, count: 0, value: 0, qty: 0 };
    }
    map[name].count += 1;
    map[name].value += val;
    map[name].qty += qty;
    totalVal += val;
  }

  const result = Object.values(map).map(b => ({
    ...b,
    percentage: totalVal > 0 ? (b.value / totalVal) * 100 : 0,
  }));

  result.sort((a, b) => b.value - a.value);
  return result;
}

export function calculateDeptCausedByStack(items: BarusItem[], basisValue: BasisValue) {
  // Find all distinct caused by values
  const allCauses = Array.from(new Set(items.map(i => i.causedBy))).filter(Boolean);
  const deptMap: Record<string, { dept: string; total: number; [key: string]: any }> = {};

  for (const item of items) {
    const dept = item.dept || 'LAIN-LAIN';
    const cause = item.causedBy || 'Lainnya';
    const val = basisValue === 'outstanding' ? item.valueAkhir : item.value;

    if (!deptMap[dept]) {
      deptMap[dept] = { dept, total: 0 };
      allCauses.forEach(c => {
        deptMap[dept][c] = 0;
      });
    }

    deptMap[dept][cause] = (Number(deptMap[dept][cause]) || 0) + val;
    deptMap[dept].total += val;
  }

  const list = Object.values(deptMap);
  list.sort((a, b) => b.total - a.total);
  return { data: list, causes: allCauses };
}
