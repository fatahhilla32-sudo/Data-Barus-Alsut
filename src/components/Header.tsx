import React from 'react';
import { Upload, FileSpreadsheet, Download, RefreshCw, FileText } from 'lucide-react';
import { FileMetadata } from '../types/barus';
import { formatFileSize } from '../utils/formatters';
import { downloadSampleExcelTemplate } from '../utils/parser';

interface HeaderProps {
  metadata: FileMetadata | null;
  onOpenUpload: () => void;
  onLoadSample: () => void;
  onExportFilteredCSV: () => void;
  itemCount: number;
  totalStoreCount: number;
}

export const Header: React.FC<HeaderProps> = ({
  metadata,
  onOpenUpload,
  onLoadSample,
  onExportFilteredCSV,
  itemCount,
  totalStoreCount,
}) => {
  return (
    <header className="bg-white border-b border-slate-200 sticky top-0 z-40 shadow-xs">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-between h-16 gap-4">
          
          {/* Zone 1: Brand Wordmark */}
          <div className="flex items-center gap-3 shrink-0">
            <div className="w-9 h-9 bg-amber-600 rounded-md flex items-center justify-center text-white font-bold text-base shadow-xs tracking-wider">
              IN
            </div>
            <div>
              <div className="flex items-center gap-2">
                <h1 className="text-base font-bold text-slate-900 tracking-tight leading-none whitespace-nowrap">
                  Dashboard Barang Rusak (BARUS)
                </h1>
                <span className="text-xs font-semibold px-2 py-0.5 rounded bg-slate-100 text-slate-700 tracking-wide">
                  J347 · Alam Sutera
                </span>
              </div>
              <p className="text-xs text-slate-500 mt-0.5 leading-none">
                Monitoring & Analisis Kerusakan Barang Toko Informa
              </p>
            </div>
          </div>

          {/* Zone 2: File Context / Summary Metadata */}
          <div className="hidden lg:flex items-center gap-3 text-xs text-slate-600 border-x border-slate-200 px-4 py-1">
            {metadata ? (
              <div className="flex items-center gap-2">
                <FileSpreadsheet className="w-4 h-4 text-emerald-600 shrink-0" />
                <span className="font-medium text-slate-800 truncate max-w-[200px]" title={metadata.fileName}>
                  {metadata.fileName}
                </span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{formatFileSize(metadata.fileSize)}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">Sheet: {metadata.sheetUsed}</span>
                <span className="text-slate-400">·</span>
                <span className="text-slate-500">{metadata.uploadTimestamp}</span>
              </div>
            ) : (
              <span className="text-slate-400 italic">Belum ada file data diunggah</span>
            )}
          </div>

          {/* Zone 3: Primary Actions */}
          <div className="flex items-center gap-2 shrink-0">
            <button
              onClick={downloadSampleExcelTemplate}
              title="Unduh format template Excel .xlsx resmi Informa"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Template .xlsx</span>
            </button>

            {metadata && (
              <button
                onClick={onExportFilteredCSV}
                title="Ekspor data hasil filter ke file CSV"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors whitespace-nowrap"
              >
                <FileText className="w-3.5 h-3.5 text-slate-600" />
                <span>Ekspor CSV</span>
              </button>
            )}

            <button
              onClick={onLoadSample}
              title="Muat dataset resmi Informa Alam Sutera (J347) dengan 543 SKU"
              className="inline-flex items-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors whitespace-nowrap"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Data Asli ALSUT (543 SKU)</span>
            </button>

            <button
              onClick={onOpenUpload}
              className="inline-flex items-center gap-1.5 px-3.5 py-1.5 text-xs font-semibold text-white bg-slate-900 hover:bg-slate-800 rounded-md shadow-xs transition-colors whitespace-nowrap"
            >
              <Upload className="w-3.5 h-3.5" />
              <span>{metadata ? 'Ganti File BARUS' : 'Upload Data BARUS'}</span>
            </button>
          </div>

        </div>
      </div>
    </header>
  );
};
