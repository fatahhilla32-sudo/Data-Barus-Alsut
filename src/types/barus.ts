export interface BarusItem {
  id: string;
  no: number | string;
  site: string;
  weekRaw: string;
  weekDate: Date | null;
  weekFormatted: string;
  article: string;
  description: string;
  dept: string;
  detailKerusakan: string;
  causedBy: string;
  qtyBarus: number; // Qty Awal
  qtyReport: number; // Qty Outstanding (Report)
  price: number;
  value: number; // Value Barus Awal
  fu: 'SUDAH DIAJUKAN ADF' | 'BELUM DIAJUKAN ADF';
  noAdf: string;
  status: string;
  responsibility: string;
  qtyFu: number; // Qty Solved
  remarkSolved: string;
  valueAkhir: number; // Value Outstanding
  ageDays: number | null;
  isValidDate: boolean;
}

export type BasisValue = 'outstanding' | 'awal';

export interface FilterState {
  depts: string[];
  causedBys: string[];
  statusAdf: 'ALL' | 'SUDAH' | 'BELUM';
  statuses: string[];
  dateStart: string; // YYYY-MM-DD
  dateEnd: string; // YYYY-MM-DD
  searchQuery: string;
  basisValue: BasisValue;
}

export interface FileMetadata {
  fileName: string;
  fileSize: number;
  uploadTimestamp: string;
  totalRawRows: number;
  validRows: number;
  sheetUsed: string;
  isSample?: boolean;
}

export interface KPISummary {
  totalItems: number;
  uniqueSkus: number;
  qtyBarusAwal: number;
  qtyOutstanding: number;
  qtySolved: number;
  percentQtySolved: number;
  valueBarusAwal: number;
  valueOutstanding: number;
  valueSolved: number;
  percentValueSolved: number;
  valueSudahAdf: number;
  valueBelumAdf: number;
  percentValueSudahAdf: number;
  percentValueBelumAdf: number;
}

export interface AgingBucket {
  label: string;
  range: string;
  count: number;
  qty: number;
  value: number;
  percentage: number;
  color: string;
}

export interface DeptSummary {
  dept: string;
  itemCount: number;
  qty: number;
  qtyPercent: number;
  value: number;
  valuePercent: number;
  valueBelumAdf: number;
  valueSudahAdf: number;
  cumValuePercent?: number;
}
