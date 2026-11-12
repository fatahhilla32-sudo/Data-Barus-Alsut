import rawItems from './rawOfficialItems.json';
import { BarusItem, FileMetadata } from '../types/barus';

export const OFFICIAL_METADATA: FileMetadata = {
  fileName: 'DATA_BARUS_ALSUT_J347.csv',
  fileSize: 113928,
  uploadTimestamp: new Date().toLocaleString('id-ID', {
    dateStyle: 'medium',
    timeStyle: 'short',
  }),
  totalRawRows: 552,
  validRows: 543,
  sheetUsed: 'Report_Detail_Barus',
  isSample: false,
};

export function getOfficialBarusData(): BarusItem[] {
  const now = new Date();
  return (rawItems as any[]).map(item => {
    let weekDate: Date | null = null;
    let ageDays: number | null = null;

    if (item.weekDateStr) {
      weekDate = new Date(item.weekDateStr);
      if (!isNaN(weekDate.getTime())) {
        const diffMs = now.getTime() - weekDate.getTime();
        ageDays = Math.max(0, Math.floor(diffMs / (1000 * 60 * 60 * 24)));
      }
    }

    return {
      id: item.id,
      no: item.no,
      site: item.site,
      weekRaw: item.weekRaw,
      weekDate,
      weekFormatted: item.weekFormatted,
      article: item.article,
      description: item.description,
      dept: item.dept,
      detailKerusakan: item.detailKerusakan,
      causedBy: item.causedBy,
      qtyBarus: item.qtyBarus,
      qtyReport: item.qtyReport,
      price: item.price,
      value: item.value,
      fu: item.fu,
      noAdf: item.noAdf,
      status: item.status,
      responsibility: item.responsibility,
      qtyFu: item.qtyFu,
      remarkSolved: item.remarkSolved,
      valueAkhir: item.valueAkhir,
      ageDays,
      isValidDate: item.isValidDate,
    };
  });
}
