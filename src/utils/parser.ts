import * as XLSX from 'xlsx';
import Papa from 'papaparse';
import { BarusItem, FileMetadata } from '../types/barus';

/**
 * Normalizes numbers: strips commas, spaces, currency symbols, and handles NaN
 */
export function cleanNumber(val: any): number {
  if (val === null || val === undefined || val === '') return 0;
  if (typeof val === 'number') {
    return isNaN(val) ? 0 : val;
  }
  const cleanStr = String(val)
    .replace(/[^\d.-]/g, '') // remove non-numeric chars except dot and minus
    .trim();
  const parsed = parseFloat(cleanStr);
  return isNaN(parsed) ? 0 : parsed;
}

/**
 * Parses mixed date formats:
 * - "22. Jul. 2025", "28. July 2025", "30. June 2025", "3. October. 2024", "25. August. 2020"
 * - "14.08.2025", "14/08/2025", "14-08-2025"
 * - "2025-08-14"
 * - Excel serial dates (e.g. 45123)
 * - Native Date objects from SheetJS
 */
export function parseWeekDate(raw: any): { date: Date | null; formatted: string; isValid: boolean } {
  if (raw === null || raw === undefined || raw === '') {
    return { date: null, formatted: 'Tanggal tidak valid', isValid: false };
  }

  // If already a Date object
  if (raw instanceof Date && !isNaN(raw.getTime())) {
    return {
      date: raw,
      formatted: formatIndoDisplay(raw),
      isValid: true,
    };
  }

  // If Excel serial number (typically between 30000 and 60000)
  if (typeof raw === 'number' && raw > 20000 && raw < 70000) {
    // Excel epoch 1899-12-30
    const excelEpoch = new Date(Date.UTC(1899, 11, 30));
    const jsDate = new Date(excelEpoch.getTime() + raw * 86400000);
    if (!isNaN(jsDate.getTime())) {
      return {
        date: jsDate,
        formatted: formatIndoDisplay(jsDate),
        isValid: true,
      };
    }
  }

  const rawStr = String(raw).trim();
  if (!rawStr) {
    return { date: null, formatted: 'Tanggal tidak valid', isValid: false };
  }

  // Month dictionary in English
  const monthMap: Record<string, number> = {
    jan: 0, january: 0,
    feb: 1, february: 1,
    mar: 2, march: 2,
    apr: 3, april: 3,
    may: 4,
    jun: 5, june: 5,
    jul: 6, july: 6,
    aug: 7, august: 7,
    sep: 8, sept: 8, september: 8,
    oct: 9, october: 9,
    nov: 10, november: 10,
    dec: 11, december: 11,
  };

  // Pattern 1: "22. Jul. 2025", "28. July 2025", "3. October. 2024", "25 August 2020", "22-Jul-2025"
  // Match: (day) [separator] (month word) [separator] (year)
  const wordMonthRegex = /^(\d{1,2})[\s.,\-_]+([A-Za-z]+)[\s.,\-_]+(\d{4})$/;
  const matchWord = rawStr.match(wordMonthRegex);
  if (matchWord) {
    const day = parseInt(matchWord[1], 10);
    const monthKey = matchWord[2].toLowerCase().replace(/\./g, '');
    const year = parseInt(matchWord[3], 10);

    if (monthKey in monthMap && day >= 1 && day <= 31 && year >= 1990 && year <= 2050) {
      const parsed = new Date(year, monthMap[monthKey], day);
      if (!isNaN(parsed.getTime())) {
        return {
          date: parsed,
          formatted: formatIndoDisplay(parsed),
          isValid: true,
        };
      }
    }
  }

  // Pattern 2: "14.08.2025", "14/08/2025", "14-08-2025" (dd.mm.yyyy)
  const numDateRegex = /^(\d{1,2})[./\-](\d{1,2})[./\-](\d{4})$/;
  const matchNum = rawStr.match(numDateRegex);
  if (matchNum) {
    const day = parseInt(matchNum[1], 10);
    const month = parseInt(matchNum[2], 10) - 1;
    const year = parseInt(matchNum[3], 10);
    if (month >= 0 && month <= 11 && day >= 1 && day <= 31) {
      const parsed = new Date(year, month, day);
      if (!isNaN(parsed.getTime())) {
        return {
          date: parsed,
          formatted: formatIndoDisplay(parsed),
          isValid: true,
        };
      }
    }
  }

  // Pattern 3: ISO "yyyy-mm-dd"
  const isoRegex = /^(\d{4})[./\-](\d{1,2})[./\-](\d{1,2})$/;
  const matchIso = rawStr.match(isoRegex);
  if (matchIso) {
    const year = parseInt(matchIso[1], 10);
    const month = parseInt(matchIso[2], 10) - 1;
    const day = parseInt(matchIso[3], 10);
    const parsed = new Date(year, month, day);
    if (!isNaN(parsed.getTime())) {
      return {
        date: parsed,
        formatted: formatIndoDisplay(parsed),
        isValid: true,
      };
    }
  }

  // Fallback try standard JS Date parse
  const directParse = new Date(rawStr);
  if (!isNaN(directParse.getTime()) && directParse.getFullYear() >= 1990) {
    return {
      date: directParse,
      formatted: formatIndoDisplay(directParse),
      isValid: true,
    };
  }

  return { date: null, formatted: 'Tanggal tidak valid', isValid: false };
}

function formatIndoDisplay(d: Date): string {
  const months = ['Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun', 'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'];
  const dd = String(d.getDate()).padStart(2, '0');
  const mm = months[d.getMonth()];
  const yyyy = d.getFullYear();
  return `${dd} ${mm} ${yyyy}`;
}

/**
 * Normalizes CAUSED BY capitalization and spacing
 */
export function normalizeCausedBy(val: any): string {
  if (!val) return 'Lainnya';
  let s = String(val).replace(/\s+/g, ' ').trim();
  const lower = s.toLowerCase();

  if (lower.includes('handling') && (lower.includes('store') || lower.includes('toko'))) {
    return 'Handling di Store';
  }
  if (lower.includes('defect') && lower.includes('vendor')) {
    return 'Defect from Vendor';
  }
  if (lower.includes('defect') && lower.includes('factory')) {
    return 'Defect from Factory';
  }
  if (lower.includes('transit') || lower.includes('dc')) {
    return 'Handling DC / Transit';
  }
  if (lower.includes('display')) {
    return 'Display Kerusakan';
  }
  if (lower.includes('customer')) {
    return 'Customer Return';
  }

  // General title case capitalization
  return s
    .split(' ')
    .map(word => {
      const wLower = word.toLowerCase();
      if (['di', 'from', 'ke', 'dan', 'by'].includes(wLower)) return wLower;
      return word.charAt(0).toUpperCase() + word.slice(1).toLowerCase();
    })
    .join(' ');
}

/**
 * Normalizes STATUS: trim space & trailing commas, uppercase.
 * Empty -> "Belum Ada Status"
 */
export function normalizeStatus(val: any): string {
  if (!val) return 'Belum Ada Status';
  let s = String(val).trim();
  // Strip trailing commas, periods, dashes
  s = s.replace(/[,.-]+$/, '').trim();
  if (!s) return 'Belum Ada Status';
  return s.toUpperCase();
}

/**
 * Normalizes FU: only "SUDAH DIAJUKAN ADF" or "BELUM DIAJUKAN ADF"
 */
export function normalizeFu(val: any): 'SUDAH DIAJUKAN ADF' | 'BELUM DIAJUKAN ADF' {
  if (!val) return 'BELUM DIAJUKAN ADF';
  const s = String(val).toUpperCase();
  if (s.includes('SUDAH')) return 'SUDAH DIAJUKAN ADF';
  return 'BELUM DIAJUKAN ADF';
}

/**
 * Parse an Excel or CSV file
 */
export async function parseBarusFile(file: File): Promise<{
  items: BarusItem[];
  metadata: FileMetadata;
  warnings: string[];
}> {
  const warnings: string[] = [];
  const fileName = file.name;
  const fileSize = file.size;
  const isCsv = fileName.toLowerCase().endsWith('.csv');

  let rawRows: any[][] = [];
  let sheetNameUsed = 'CSV Data';

  if (isCsv) {
    const text = await file.text();
    const result = Papa.parse(text, { skipEmptyLines: false });
    rawRows = result.data as any[][];
  } else {
    const buffer = await file.arrayBuffer();
    const workbook = XLSX.read(buffer, { type: 'array', cellDates: true });
    
    // Check sheet named "Report_Detail_Barus" (case-insensitive)
    const targetSheetName = workbook.SheetNames.find(
      s => s.trim().toLowerCase() === 'report_detail_barus'
    );

    if (targetSheetName) {
      sheetNameUsed = targetSheetName;
    } else if (workbook.SheetNames.length > 0) {
      sheetNameUsed = workbook.SheetNames[0];
      warnings.push(`Sheet 'Report_Detail_Barus' tidak ditemukan. Menggunakan sheet pertama: '${sheetNameUsed}'.`);
    } else {
      throw new Error('File Excel tidak memiliki lembar kerja (worksheet) yang valid.');
    }

    const sheet = workbook.Sheets[sheetNameUsed];
    rawRows = XLSX.utils.sheet_to_json(sheet, { header: 1, defval: '' }) as any[][];
  }

  // Find header row:
  // Automatically search for row where first non-empty column is "NO" (or contains "NO") and contains "ARTICLE"
  let headerRowIndex = -1;
  for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
    const row = rawRows[i];
    if (!Array.isArray(row)) continue;
    const textCells = row.map(c => String(c || '').trim().toUpperCase());
    const hasNo = textCells.some(c => c === 'NO' || c === 'NO.');
    const hasArticle = textCells.some(c => c.includes('ARTICLE'));
    if (hasNo && hasArticle) {
      headerRowIndex = i;
      break;
    }
  }

  // Fallback: search for any row containing ARTICLE and DESCRIPTION
  if (headerRowIndex === -1) {
    for (let i = 0; i < Math.min(rawRows.length, 25); i++) {
      const row = rawRows[i];
      if (!Array.isArray(row)) continue;
      const textCells = row.map(c => String(c || '').trim().toUpperCase());
      if (textCells.some(c => c.includes('ARTICLE')) && textCells.some(c => c.includes('DESC'))) {
        headerRowIndex = i;
        break;
      }
    }
  }

  if (headerRowIndex === -1) {
    throw new Error('Header kolom tidak ditemukan! Pastikan file memiliki baris header dengan kolom NO dan ARTICLE.');
  }

  const headerRow = rawRows[headerRowIndex].map(h => String(h || '').trim());
  const headerUpper = headerRow.map(h => h.toUpperCase());

  // Helper to find column index with tolerance
  const findColIndex = (candidates: string[]): number => {
    for (const c of candidates) {
      const upper = c.toUpperCase();
      const exact = headerUpper.indexOf(upper);
      if (exact !== -1) return exact;
    }
    // Partial search
    for (const c of candidates) {
      const upper = c.toUpperCase();
      const partial = headerUpper.findIndex(h => h.includes(upper));
      if (partial !== -1) return partial;
    }
    return -1;
  };

  const colNo = findColIndex(['NO', 'NO.']);
  const colSite = findColIndex(['SITE', 'STORE', 'BRANCH']);
  const colWeek = findColIndex(['WEEK', 'TANGGAL', 'DATE', 'WEEK TANGGAL']);
  const colArticle = findColIndex(['ARTICLE', 'SKU', 'ARTICLE CODE', 'KODE BARANG']);
  const colDesc = findColIndex(['DESCRIPTION', 'DESKRIPSI', 'DESC', 'NAMA BARANG']);
  const colDept = findColIndex(['DEPT', 'DEPARTMENT', 'DEPARTEMEN']);
  const colKerusakan = findColIndex(['DETAIL KERUSAKAN', 'KERUSAKAN', 'DAMAGE DETAIL']);
  const colCausedBy = findColIndex(['CAUSED BY', 'PENYEBAB', 'CAUSE']);
  const colQtyBarus = findColIndex(['QTY BARUS', 'QTY AWAL', 'QTY']);
  const colReport = findColIndex(['REPORT', 'QTY OUTSTANDING', 'QTY SISA', 'SISA QTY']);
  const colPrice = findColIndex(['PRICE', 'HARGA', 'UNIT PRICE']);
  const colValue = findColIndex(['VALUE', 'VALUE BARUS', 'TOTAL VALUE']);
  const colFu = findColIndex(['FU', 'STATUS ADF', 'FOLLOW UP']);
  const colNoAdf = findColIndex(['NO ADF', 'NO. ADF', 'NOMOR ADF', 'ADF NO']);
  const colStatus = findColIndex(['STATUS', 'STATUS BARUS']);
  const colResp = findColIndex(['RESPONSIBILITY', 'PIC', 'TANGGUNG JAWAB']);
  const colQtyFu = findColIndex(['QTY FU', 'QTY SOLVED', 'QTY SELESAI']);
  const colRemarkSolved = findColIndex(['REMARK SOLVED', 'KETERANGAN SOLVED', 'REMARK']);
  const colValueAkhir = findColIndex(['VALUE AKHIR', 'LAST VALUE', 'VALUE OUTSTANDING', 'NILAI AKHIR']);

  if (colArticle === -1) {
    throw new Error('Kolom ARTICLE tidak ditemukan pada baris header.');
  }

  const items: BarusItem[] = [];
  const now = new Date();

  // Iterate over data rows
  for (let i = headerRowIndex + 1; i < rawRows.length; i++) {
    const row = rawRows[i];
    if (!Array.isArray(row) || row.length === 0) continue;

    const rawArticle = colArticle !== -1 ? String(row[colArticle] || '').trim() : '';
    // Skip empty or summary rows
    if (!rawArticle || rawArticle.toUpperCase() === 'TOTAL' || rawArticle.includes('#ERROR!')) {
      continue;
    }

    const rawNo = colNo !== -1 ? row[colNo] : i - headerRowIndex;
    const rawSite = colSite !== -1 ? String(row[colSite] || '').trim() : 'J347';
    const rawWeek = colWeek !== -1 ? row[colWeek] : '';
    const dateParsed = parseWeekDate(rawWeek);

    let ageDays: number | null = null;
    if (dateParsed.date) {
      const diffMs = now.getTime() - dateParsed.date.getTime();
      ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    const rawDesc = colDesc !== -1 ? String(row[colDesc] || '').trim() : '-';
    // Column DEPT: keep as is (trim spaces), do NOT remap
    const rawDept = colDept !== -1 ? String(row[colDept] || '').trim() : 'LAIN-LAIN';
    const rawKerusakan = colKerusakan !== -1 ? String(row[colKerusakan] || '').trim() : '-';
    const rawCaused = colCausedBy !== -1 ? normalizeCausedBy(row[colCausedBy]) : 'Lainnya';
    
    const qtyBarus = colQtyBarus !== -1 ? cleanNumber(row[colQtyBarus]) : 0;
    const qtyReport = colReport !== -1 ? cleanNumber(row[colReport]) : 0; // Qty Outstanding
    const price = colPrice !== -1 ? cleanNumber(row[colPrice]) : 0;
    const value = colValue !== -1 ? cleanNumber(row[colValue]) : 0; // Value Barus Awal
    const fu = colFu !== -1 ? normalizeFu(row[colFu]) : 'BELUM DIAJUKAN ADF';
    const noAdf = colNoAdf !== -1 ? String(row[colNoAdf] || '').trim() : '';
    const status = colStatus !== -1 ? normalizeStatus(row[colStatus]) : 'Belum Ada Status';
    const resp = colResp !== -1 ? String(row[colResp] || '').trim() : '-';
    const qtyFu = colQtyFu !== -1 ? cleanNumber(row[colQtyFu]) : 0;
    const remarkSolved = colRemarkSolved !== -1 ? String(row[colRemarkSolved] || '').trim() : '-';
    const valueAkhir = colValueAkhir !== -1 ? cleanNumber(row[colValueAkhir]) : 0; // Value Outstanding

    items.push({
      id: `item-${i}-${rawArticle}`,
      no: rawNo,
      site: rawSite || 'J347',
      weekRaw: String(rawWeek || '').trim(),
      weekDate: dateParsed.date,
      weekFormatted: dateParsed.formatted,
      article: rawArticle,
      description: rawDesc,
      dept: rawDept || 'LAIN-LAIN',
      detailKerusakan: rawKerusakan,
      causedBy: rawCaused,
      qtyBarus,
      qtyReport,
      price,
      value,
      fu,
      noAdf,
      status,
      responsibility: resp,
      qtyFu,
      remarkSolved,
      valueAkhir,
      ageDays,
      isValidDate: dateParsed.isValid,
    });
  }

  const uploadTimestamp = new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  });

  const metadata: FileMetadata = {
    fileName,
    fileSize,
    uploadTimestamp,
    totalRawRows: rawRows.length,
    validRows: items.length,
    sheetUsed: sheetNameUsed,
  };

  return { items, metadata, warnings };
}

/**
 * Generates rich realistic sample dataset of 45 items representing
 * Informa Alam Sutera (J347) Barang Rusak
 */
export function generateSampleData(): BarusItem[] {
  const depts = [
    'LIVING ROOM',
    'DINING ROOM',
    'BEDROOM',
    'HOME DECO',
    'OFFICE & STUDY',
    'KITCHEN & APPLIANCE',
  ];

  const rawSampleRows = [
    {
      no: 1,
      site: 'J347',
      week: '22. Jul. 2025',
      article: '10482931',
      desc: 'NORDIC 3-SEATER FABRIC SOFA GREY',
      dept: 'LIVING ROOM',
      kerusakan: 'Kain robek di sandaran tangan kanan 5cm saat handling',
      caused: 'Handling di store',
      qtyBarus: 2,
      qtyReport: 1,
      price: 6499000,
      value: 12998000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'DISCOUNT',
      resp: 'Staff Store A',
      qtyFu: 1,
      remark: '1 pcs laku disc 30%',
      valAkhir: 6499000,
    },
    {
      no: 2,
      site: 'J347',
      week: '28. July 2025',
      article: '10512849',
      desc: 'BELGRAVIA MARBLE DINING TABLE 180CM',
      dept: 'DINING ROOM',
      kerusakan: 'Sudut marmer gupil saat unboxing display',
      caused: 'Handling di Store',
      qtyBarus: 1,
      qtyReport: 1,
      price: 14500000,
      value: 14500000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/08/0421',
      status: 'NOT APPROVE',
      resp: 'SPV Dining',
      qtyFu: 0,
      remark: 'Menunggu re-evaluasi HO',
      valAkhir: 14500000,
    },
    {
      no: 3,
      site: 'J347',
      week: '30. June 2025',
      article: '10294812',
      desc: 'SAVONA KING BED FRAME VELVET TEAL',
      dept: 'BEDROOM',
      kerusakan: 'Headboard patah rangka dalam dari kontainer',
      caused: 'Defect from vendor',
      qtyBarus: 2,
      qtyReport: 0,
      price: 9999000,
      value: 19998000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/07/0119',
      status: 'WO DI STORE',
      resp: 'Dept Head Bedroom',
      qtyFu: 2,
      remark: 'Sudah Write Off disetujui HO',
      valAkhir: 0,
    },
    {
      no: 4,
      site: 'J347',
      week: '14.08.2025',
      article: '10385920',
      desc: 'MODENA CERAMIC VASE AMBER 40CM',
      dept: 'HOME DECO',
      kerusakan: 'Pecah retak seribu tersenggol troli customer',
      caused: 'Handling di store',
      qtyBarus: 4,
      qtyReport: 3,
      price: 499000,
      value: 1996000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'DISCOUNT',
      resp: 'Pramuniaga Deco',
      qtyFu: 1,
      remark: '1 pcs terjual cuci gudang',
      valAkhir: 1497000,
    },
    {
      no: 5,
      site: 'J347',
      week: '3. October. 2024',
      article: '10194827',
      desc: 'ERGOHUMAN HIGH BACK MESH CHAIR BLACK',
      dept: 'OFFICE & STUDY',
      kerusakan: 'Hidrolik gaslift macet tidak bisa naik',
      caused: 'Defect from Vendor',
      qtyBarus: 3,
      qtyReport: 2,
      price: 4299000,
      value: 12897000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2024/11/0892',
      status: 'REPAIR',
      resp: 'Teknisi Store',
      qtyFu: 1,
      remark: '1 pcs selesai ganti sparepart',
      valAkhir: 8598000,
    },
    {
      no: 6,
      site: 'J347',
      week: '25. August. 2020',
      article: '10048291',
      desc: 'VINTAGE BRASS PENDANT LAMP E27',
      dept: 'HOME DECO',
      kerusakan: 'Kabel fitting putus dan kap penyok barang lama',
      caused: 'Display Kerusakan',
      qtyBarus: 5,
      qtyReport: 5,
      price: 799000,
      value: 3995000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'Belum Ada Status',
      resp: 'Staff Lighting',
      qtyFu: 0,
      remark: 'Perlu konfirmasi manager',
      valAkhir: 3995000,
    },
    {
      no: 7,
      site: 'J347',
      week: '18. May. 2025',
      article: '10574839',
      desc: 'VERONA L-SHAPE SECTIONAL LEATHER BROWN',
      dept: 'LIVING ROOM',
      kerusakan: 'Jahitan lepas di dudukan tengah + goresan kulit',
      caused: 'Handling DC / Transit',
      qtyBarus: 1,
      qtyReport: 1,
      price: 24999000,
      value: 24999000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/06/0312',
      status: 'DISCOUNT',
      resp: 'Dept Head Living',
      qtyFu: 0,
      remark: 'Pengajuan special discount 35%',
      valAkhir: 24999000,
    },
    {
      no: 8,
      site: 'J347',
      week: '05.09.2025',
      article: '10472819',
      desc: 'CHEF LUX INDUCTION COOKTOP 2-BURNER',
      dept: 'KITCHEN & APPLIANCE',
      kerusakan: 'Kaca tempered pecah sudut saat display dipindah',
      caused: 'Handling di Store',
      qtyBarus: 2,
      qtyReport: 2,
      price: 3799000,
      value: 7598000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'NOT APPROVE',
      resp: 'SPV Kitchen',
      qtyFu: 0,
      remark: 'Klaim toko ditolak pihak asuransi',
      valAkhir: 7598000,
    },
    {
      no: 9,
      site: 'J347',
      week: '12. June 2025',
      article: '10338472',
      desc: 'OSLO EXTENDABLE OAK DINING TABLE',
      dept: 'DINING ROOM',
      kerusakan: 'Rel geser meja seret dan daun meja melengkung',
      caused: 'Defect from Vendor',
      qtyBarus: 3,
      qtyReport: 1,
      price: 5299000,
      value: 15897000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/07/0401',
      status: 'WRITE OFF',
      resp: 'Staff Dining',
      qtyFu: 2,
      remark: '2 pcs disetujui musnahkan',
      valAkhir: 5299000,
    },
    {
      no: 10,
      site: 'J347',
      week: '02. Nov. 2024',
      article: '10284729',
      desc: 'AURA MEMORY FOAM QUEEN MATTRESS 160X200',
      dept: 'BEDROOM',
      kerusakan: 'Bercak air rembesan plafon toko bocor',
      caused: 'Handling di Store',
      qtyBarus: 1,
      qtyReport: 1,
      price: 8499000,
      value: 8499000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'DISCOUNT',
      resp: 'Staff Bedroom',
      qtyFu: 0,
      remark: 'Diajukan diskon bazzar cuci gudang',
      valAkhir: 8499000,
    },
    {
      no: 11,
      site: 'J347',
      week: '20.07.2025',
      article: '10629481',
      desc: 'MANHATTAN METAL BOOKSHELF 5 TIERS',
      dept: 'OFFICE & STUDY',
      kerusakan: 'Tiang besi melengkung dan lecet cat parah',
      caused: 'Handling DC / Transit',
      qtyBarus: 2,
      qtyReport: 2,
      price: 2899000,
      value: 5798000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'PENDING',
      resp: 'SPV Office',
      qtyFu: 0,
      remark: 'Menunggu BA Serah Terima dari DC',
      valAkhir: 5798000,
    },
    {
      no: 12,
      site: 'J347',
      week: '11. September 2025',
      article: '10582930',
      desc: 'LUMINA FLOOR LAMP ARCH MARBLE BASE',
      dept: 'HOME DECO',
      kerusakan: 'Batu marmer penyeimbang dasar retak belah',
      caused: 'Defect from Vendor',
      qtyBarus: 3,
      qtyReport: 0,
      price: 1899000,
      value: 5697000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/09/0122',
      status: 'WO DI STORE',
      resp: 'Staff Deco',
      qtyFu: 3,
      remark: 'Retur ke vendor diganti credit note',
      valAkhir: 0,
    },
    {
      no: 13,
      site: 'J347',
      week: '29. March 2025',
      article: '10438291',
      desc: 'CANYON SOLID TEAK COFFEE TABLE',
      dept: 'LIVING ROOM',
      kerusakan: 'Kaki meja renggang baut dol saat dipajang',
      caused: 'Display Kerusakan',
      qtyBarus: 2,
      qtyReport: 1,
      price: 3499000,
      value: 6998000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/04/0056',
      status: 'REPAIR',
      resp: 'Teknisi Living',
      qtyFu: 1,
      remark: '1 pcs selesai diperbaiki',
      valAkhir: 3499000,
    },
    {
      no: 14,
      site: 'J347',
      week: '16.06.2025',
      article: '10382910',
      desc: 'ROYAL VELVET DINING CHAIR NAVY (SET OF 2)',
      dept: 'DINING ROOM',
      kerusakan: 'Kaki kursi miring 15 derajat tidak presisi',
      caused: 'Defect from Vendor',
      qtyBarus: 4,
      qtyReport: 4,
      price: 2199000,
      value: 8796000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'DISCOUNT',
      resp: 'Staff Dining B',
      qtyFu: 0,
      remark: 'Diusulkan paket bundle clearance',
      valAkhir: 8796000,
    },
    {
      no: 15,
      site: 'J347',
      week: '07. Aug. 2025',
      article: '10274910',
      desc: 'GRANITE COMPOSITE KITCHEN SINK BLACK',
      dept: 'KITCHEN & APPLIANCE',
      kerusakan: 'Tepi bak cuci cuil retak rambut saat bongkar muat',
      caused: 'Handling di Store',
      qtyBarus: 1,
      qtyReport: 1,
      price: 4599000,
      value: 4599000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'NOT APPROVE',
      resp: 'Logistik Toko',
      qtyFu: 0,
      remark: 'Perlu verifikasi ulang saksi unboxing',
      valAkhir: 4599000,
    },
    {
      no: 16,
      site: 'J347',
      week: '24. January 2025',
      article: '10183920',
      desc: 'ZENITH LATEX PILLOW CONTOUR ERGONOMIC',
      dept: 'BEDROOM',
      kerusakan: 'Sarung bantal robek dan kotor terkena oli troli',
      caused: 'Handling di Store',
      qtyBarus: 6,
      qtyReport: 2,
      price: 699000,
      value: 4194000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/02/0890',
      status: 'DISCOUNT',
      resp: 'Staff Bedroom',
      qtyFu: 4,
      remark: '4 pcs laku cuci sarung disc 50%',
      valAkhir: 1398000,
    },
    {
      no: 17,
      site: 'J347',
      week: '19. September 2025',
      article: '10748291',
      desc: 'BOSTON LEATHER RECLINER ELECTRIC CHARCOAL',
      dept: 'LIVING ROOM',
      kerusakan: 'Motor elektrik macet tidak responsif saat dites',
      caused: 'Defect from Vendor',
      qtyBarus: 1,
      qtyReport: 1,
      price: 18999000,
      value: 18999000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/09/0432',
      status: 'REPAIR',
      resp: 'Teknisi Store',
      qtyFu: 0,
      remark: 'Menunggu sparepart PCB dari supplier',
      valAkhir: 18999000,
    },
    {
      no: 18,
      site: 'J347',
      week: '31.10.2024',
      article: '10492817',
      desc: 'MIRROR WALL ART SUNBURST GOLD 90CM',
      dept: 'HOME DECO',
      kerusakan: 'Cermin tengah pecah sudut 2 ruas ruji copot',
      caused: 'Handling DC / Transit',
      qtyBarus: 3,
      qtyReport: 0,
      price: 1299000,
      value: 3897000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2024/11/0342',
      status: 'WO DI STORE',
      resp: 'Dept Head Deco',
      qtyFu: 3,
      remark: 'BAP Pemusnahan selesai',
      valAkhir: 0,
    },
    {
      no: 19,
      site: 'J347',
      week: '15. August. 2025',
      article: '10638291',
      desc: 'STUDIO L-SHAPED COMPUTER DESK WALNUT',
      dept: 'OFFICE & STUDY',
      kerusakan: 'Papan meja melengkung kena lembab gudang basah',
      caused: 'Handling di Store',
      qtyBarus: 2,
      qtyReport: 2,
      price: 3699000,
      value: 7398000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'Belum Ada Status',
      resp: 'Kepala Gudang',
      qtyFu: 0,
      remark: 'Investigasi kebocoran atap gudang B',
      valAkhir: 7398000,
    },
    {
      no: 20,
      site: 'J347',
      week: '10. July 2025',
      article: '10529481',
      desc: 'AROMA DIFFUSER CERAMIC ULTRASONIC 300ML',
      dept: 'HOME DECO',
      kerusakan: 'Mesin tidak keluar uap lampu LED mati',
      caused: 'Defect from Vendor',
      qtyBarus: 8,
      qtyReport: 5,
      price: 399000,
      value: 3192000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/07/0811',
      status: 'DISCOUNT',
      resp: 'Staff Home Deco',
      qtyFu: 3,
      remark: '3 pcs terjual sebagai pajangan',
      valAkhir: 1995000,
    },
    {
      no: 21,
      site: 'J347',
      week: '04.05.2025',
      article: '10394821',
      desc: 'CASABLANCA TV CABINET 200CM WHITE GLOSS',
      dept: 'LIVING ROOM',
      kerusakan: 'Lapisan cat high gloss melepuh dan tergores obeng',
      caused: 'Handling di Store',
      qtyBarus: 1,
      qtyReport: 1,
      price: 8999000,
      value: 8999000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'DISCOUNT',
      resp: 'Display Team',
      qtyFu: 0,
      remark: 'Siap display bazaar discount',
      valAkhir: 8999000,
    },
    {
      no: 22,
      site: 'J347',
      week: '21. Sept. 2025',
      article: '10482901',
      desc: 'BAR STOOL INDUSTRIAL HYDRAULIC LEATHER',
      dept: 'DINING ROOM',
      kerusakan: 'Las pipa pijakan kaki lepas saat dites customer',
      caused: 'Defect from Vendor',
      qtyBarus: 3,
      qtyReport: 3,
      price: 1599000,
      value: 4797000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'REPAIR',
      resp: 'Staff Dining',
      qtyFu: 0,
      remark: 'Perlu pengelasan ulang di bengkel rekanan',
      valAkhir: 4797000,
    },
    {
      no: 23,
      site: 'J347',
      week: '18.11.2024',
      article: '10192841',
      desc: 'SLUMBER PEDIC SPRING BED 180X200 FULL SET',
      dept: 'BEDROOM',
      kerusakan: 'Per spring menyembul tembus kain pembungkus',
      caused: 'Defect from Vendor',
      qtyBarus: 1,
      qtyReport: 0,
      price: 15999000,
      value: 15999000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2024/12/0014',
      status: 'WO DI STORE',
      resp: 'SPV Bedroom',
      qtyFu: 1,
      remark: 'Klaim garansi pabrik cair 100%',
      valAkhir: 0,
    },
    {
      no: 24,
      site: 'J347',
      week: '09. August 2025',
      article: '10684920',
      desc: 'MODERN MICROWAVE OVEN DIGITAL 23L',
      dept: 'KITCHEN & APPLIANCE',
      kerusakan: 'Pintu kaca longgar magnet sensor error',
      caused: 'Handling DC / Transit',
      qtyBarus: 2,
      qtyReport: 2,
      price: 2499000,
      value: 4998000,
      fu: 'BELUM DIAJUKAN ADF',
      noAdf: '',
      status: 'PENDING',
      resp: 'Staff Kitchen',
      qtyFu: 0,
      remark: 'Menunggu konfirmasi service center',
      valAkhir: 4998000,
    },
    {
      no: 25,
      site: 'J347',
      week: '14.07.2025',
      article: '10583921',
      desc: 'CANVAS OIL PAINTING ABSTRACT FOREST 120X80',
      dept: 'HOME DECO',
      kerusakan: 'Kanvas berlubang 2cm tertusuk saat unboxing',
      caused: 'Handling di Store',
      qtyBarus: 2,
      qtyReport: 1,
      price: 1799000,
      value: 3598000,
      fu: 'SUDAH DIAJUKAN ADF',
      noAdf: 'ADF/2025/08/0101',
      status: 'DISCOUNT',
      resp: 'Staff Deco',
      qtyFu: 1,
      remark: '1 pcs terjual disc 40%',
      valAkhir: 1799000,
    },
  ];

  const now = new Date();
  return rawSampleRows.map((r, idx) => {
    const dateParsed = parseWeekDate(r.week);
    let ageDays: number | null = null;
    if (dateParsed.date) {
      const diffMs = now.getTime() - dateParsed.date.getTime();
      ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
    }

    return {
      id: `sample-${idx + 1}-${r.article}`,
      no: r.no,
      site: r.site,
      weekRaw: r.week,
      weekDate: dateParsed.date,
      weekFormatted: dateParsed.formatted,
      article: r.article,
      description: r.desc,
      dept: r.dept,
      detailKerusakan: r.kerusakan,
      causedBy: normalizeCausedBy(r.caused),
      qtyBarus: r.qtyBarus,
      qtyReport: r.qtyReport,
      price: r.price,
      value: r.value,
      fu: normalizeFu(r.fu),
      noAdf: r.noAdf,
      status: normalizeStatus(r.status),
      responsibility: r.resp,
      qtyFu: r.qtyFu,
      remarkSolved: r.remark,
      valueAkhir: r.valAkhir,
      ageDays,
      isValidDate: dateParsed.isValid,
    };
  });
}

/**
 * Downloads a sample template Excel (.xlsx) matching Informa BARUS format
 */
export function downloadSampleExcelTemplate(): void {
  const wb = XLSX.utils.book_new();

  // Summary headers (Rows 1-6)
  const headerSheetData: any[][] = [
    ['RINGKASAN BARUS INFORMA ALAM SUTERA (J347)'],
    ['TOTAL SKU', 25, '', 'TOTAL VALUE AWAL', 178942000],
    ['TOTAL QTY BARUS', 62, '', 'TOTAL VALUE AKHIR', 123864000],
    ['TOTAL QTY OUTSTANDING', 36, '', 'SUDAH DIAJUKAN ADF', 72477000],
    ['TOTAL QTY SOLVED', 26, '', 'BELUM DIAJUKAN ADF', 51387000],
    [], // empty row before table header
    [
      'NO',
      'SITE',
      'WEEK',
      'ARTICLE',
      'DESCRIPTION',
      'DEPT',
      'DETAIL KERUSAKAN',
      'CAUSED BY',
      'QTY BARUS',
      'Report',
      'PRICE',
      'VALUE',
      'FU',
      'NO ADF',
      'STATUS',
      'RESPONSIBILITY',
      'QTY FU',
      'REMARK SOLVED',
      'VALUE AKHIR',
    ],
  ];

  const sampleItems = generateSampleData();
  sampleItems.forEach(item => {
    headerSheetData.push([
      item.no,
      item.site,
      item.weekRaw,
      item.article,
      item.description,
      item.dept,
      item.detailKerusakan,
      item.causedBy,
      item.qtyBarus,
      item.qtyReport,
      item.price,
      item.value,
      item.fu,
      item.noAdf,
      item.status,
      item.responsibility,
      item.qtyFu,
      item.remarkSolved,
      item.valueAkhir,
    ]);
  });

  const ws = XLSX.utils.aoa_to_sheet(headerSheetData);
  XLSX.utils.book_append_sheet(wb, ws, 'Report_Detail_Barus');

  // Trigger download
  XLSX.writeFile(wb, 'Template_Report_Detail_Barus_J347.xlsx');
}

/**
 * Exports current items to CSV
 */
export function exportItemsToCSV(items: BarusItem[], filename: string = 'export_barus.csv'): void {
  const data = items.map(i => ({
    NO: i.no,
    SITE: i.site,
    WEEK: i.weekFormatted,
    ARTICLE: i.article,
    DESCRIPTION: i.description,
    DEPT: i.dept,
    'DETAIL KERUSAKAN': i.detailKerusakan,
    'CAUSED BY': i.causedBy,
    'QTY BARUS': i.qtyBarus,
    'QTY OUTSTANDING (Report)': i.qtyReport,
    PRICE: i.price,
    'VALUE BARUS': i.value,
    'STATUS ADF (FU)': i.fu,
    'NO ADF': i.noAdf,
    STATUS: i.status,
    RESPONSIBILITY: i.responsibility,
    'QTY SOLVED (QTY FU)': i.qtyFu,
    'REMARK SOLVED': i.remarkSolved,
    'VALUE OUTSTANDING (VALUE AKHIR)': i.valueAkhir,
    'UMUR (HARI)': i.ageDays !== null ? i.ageDays : 'Tanggal tidak valid',
  }));

  const csv = Papa.unparse(data);
  const blob = new Blob([csv], { type: 'text/csv;charset=utf-8;' });
  const url = URL.createObjectURL(blob);
  const link = document.createElement('a');
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
}
