import React, { useState, useRef } from 'react';
import { Upload, FileSpreadsheet, AlertCircle, FileCheck, HelpCircle, Download, RefreshCw } from 'lucide-react';
import { parseBarusFile, downloadSampleExcelTemplate } from '../utils/parser';
import { BarusItem, FileMetadata } from '../types/barus';

interface UploadZoneProps {
  onDataLoaded: (items: BarusItem[], metadata: FileMetadata, warnings: string[]) => void;
  onLoadSample: () => void;
  isModal?: boolean;
  onCloseModal?: () => void;
}

export const UploadZone: React.FC<UploadZoneProps> = ({
  onDataLoaded,
  onLoadSample,
  isModal = false,
  onCloseModal,
}) => {
  const [isDragging, setIsDragging] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [errorMessage, setErrorMessage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const processFile = async (file: File) => {
    const ext = file.name.split('.').pop()?.toLowerCase();
    if (ext !== 'xlsx' && ext !== 'xls' && ext !== 'csv') {
      setErrorMessage('Format file tidak didukung! Harap unggah file .xlsx atau .csv.');
      return;
    }

    setIsLoading(true);
    setErrorMessage(null);

    try {
      const { items, metadata, warnings } = await parseBarusFile(file);
      if (items.length === 0) {
        throw new Error('Tidak ada data barang rusak yang valid ditemukan dalam file.');
      }
      onDataLoaded(items, metadata, warnings);
      if (onCloseModal) onCloseModal();
    } catch (err: any) {
      console.error('Error parsing file:', err);
      setErrorMessage(err.message || 'Gagal memproses file. Pastikan struktur kolom sesuai.');
    } finally {
      setIsLoading(false);
    }
  };

  const handleDragOver = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(true);
  };

  const handleDragLeave = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
  };

  const handleDrop = (e: React.DragEvent) => {
    e.preventDefault();
    setIsDragging(false);
    if (e.dataTransfer.files && e.dataTransfer.files.length > 0) {
      processFile(e.dataTransfer.files[0]);
    }
  };

  const handleFileInputChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    if (e.target.files && e.target.files.length > 0) {
      processFile(e.target.files[0]);
    }
  };

  const content = (
    <div className="space-y-6">
      
      {/* Upload Box */}
      <div
        onDragOver={handleDragOver}
        onDragLeave={handleDragLeave}
        onDrop={handleDrop}
        onClick={() => fileInputRef.current?.click()}
        className={`relative border-2 border-dashed rounded-xl p-8 text-center cursor-pointer transition-all duration-200 ${
          isDragging
            ? 'border-amber-500 bg-amber-50/70 scale-[0.99]'
            : 'border-slate-300 hover:border-amber-500 bg-slate-50/50 hover:bg-amber-50/30'
        }`}
      >
        <input
          ref={fileInputRef}
          type="file"
          accept=".xlsx,.xls,.csv"
          onChange={handleFileInputChange}
          className="hidden"
        />

        <div className="flex flex-col items-center justify-center">
          <div className="w-14 h-14 rounded-full bg-amber-100 flex items-center justify-center text-amber-700 mb-4">
            {isLoading ? (
              <div className="w-6 h-6 border-3 border-amber-600 border-t-transparent rounded-full animate-spin" />
            ) : (
              <Upload className="w-7 h-7" />
            )}
          </div>

          <h3 className="text-base font-semibold text-slate-900 mb-1">
            {isLoading ? 'Sedang Memproses & Memvalidasi Data...' : 'Pilih File atau Tarik & Lepas di Sini'}
          </h3>
          <p className="text-xs text-slate-500 max-w-md mx-auto mb-4">
            Format yang didukung: <span className="font-semibold text-slate-700">.xlsx</span> (Sheet: <span className="font-mono font-medium text-amber-700">Report_Detail_Barus</span>) atau <span className="font-semibold text-slate-700">.csv</span>.
            Semua pembersihan dan parsing data 100% diproses di browser Anda (client-side).
          </p>

          <button
            type="button"
            disabled={isLoading}
            className="px-4 py-2 text-xs font-semibold text-white bg-amber-600 hover:bg-amber-700 rounded-lg shadow-xs transition-colors"
          >
            Pilih File dari Komputer
          </button>
        </div>
      </div>

      {/* Error Alert */}
      {errorMessage && (
        <div className="p-4 bg-rose-50 border border-rose-200 rounded-lg flex items-start gap-3 text-rose-800 text-xs">
          <AlertCircle className="w-4 h-4 shrink-0 text-rose-600 mt-0.5" />
          <div className="space-y-1">
            <p className="font-semibold">Terjadi Kesalahan Saat Membaca File</p>
            <p>{errorMessage}</p>
          </div>
        </div>
      )}

      {/* Quick Actions & Specifications */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        
        {/* Sample Data & Template */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg flex flex-col justify-between">
          <div>
            <div className="flex items-center gap-2 mb-2">
              <FileCheck className="w-4 h-4 text-emerald-600" />
              <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
                Dataset Resmi Informa ALSUT (J347)
              </h4>
            </div>
            <p className="text-xs text-slate-600 leading-relaxed mb-3">
              Muat langsung dataset resmi Informa Alam Sutera (J347) dari sheet <span className="font-semibold text-slate-800">Report_Detail_Barus</span> berisi <span className="font-semibold text-slate-800">543 SKU</span> lengkap dengan status ADF dan departemen.
            </p>
          </div>
          <div className="flex items-center gap-2 pt-2 border-t border-slate-100">
            <button
              onClick={(e) => {
                e.stopPropagation();
                onLoadSample();
                if (onCloseModal) onCloseModal();
              }}
              className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-semibold text-amber-800 bg-amber-50 hover:bg-amber-100 border border-amber-200 rounded-md transition-colors"
            >
              <RefreshCw className="w-3.5 h-3.5 text-amber-600" />
              <span>Muat Data ALSUT (543 SKU)</span>
            </button>

            <button
              onClick={(e) => {
                e.stopPropagation();
                downloadSampleExcelTemplate();
              }}
              className="inline-flex items-center justify-center gap-1.5 px-3 py-1.5 text-xs font-medium text-slate-700 bg-slate-100 hover:bg-slate-200 rounded-md transition-colors"
              title="Unduh format file .xlsx resmi untuk pengisian"
            >
              <Download className="w-3.5 h-3.5" />
              <span>Unduh Template</span>
            </button>
          </div>
        </div>

        {/* Structure Guide */}
        <div className="p-4 bg-white border border-slate-200 rounded-lg">
          <div className="flex items-center gap-2 mb-2">
            <HelpCircle className="w-4 h-4 text-blue-600" />
            <h4 className="text-xs font-semibold text-slate-800 uppercase tracking-wide">
              Ketentuan Struktur File BARUS
            </h4>
          </div>
          <ul className="text-xs text-slate-600 space-y-1.5 list-disc list-inside">
            <li>
              Nama sheet Excel: <span className="font-mono text-slate-800 font-semibold">Report_Detail_Barus</span>.
            </li>
            <li>
              Baris ringkasan 1–6 dilewati otomatis; sistem mendeteksi header kolom <span className="font-semibold text-slate-800">NO</span> & <span className="font-semibold text-slate-800">ARTICLE</span>.
            </li>
            <li>
              Format kolom utama: <span className="font-mono text-[11px] text-slate-700">WEEK, ARTICLE, DESCRIPTION, DEPT, DETAIL KERUSAKAN, CAUSED BY, QTY BARUS, Report, PRICE, VALUE, FU, NO ADF, STATUS, VALUE AKHIR</span>.
            </li>
            <li>
              Format tanggal campur (<span className="font-mono text-[11px]">22. Jul. 2025</span>, <span className="font-mono text-[11px]">14.08.2025</span>, serial date) otomatis diproses.
            </li>
          </ul>
        </div>

      </div>

    </div>
  );

  if (isModal) {
    return (
      <div className="fixed inset-0 z-50 bg-slate-900/50 backdrop-blur-xs flex items-center justify-center p-4">
        <div className="bg-white rounded-xl max-w-2xl w-full p-6 shadow-2xl relative max-h-[90vh] overflow-y-auto">
          <div className="flex items-center justify-between pb-4 mb-4 border-b border-slate-100">
            <div>
              <h2 className="text-base font-bold text-slate-900">Upload Data BARUS</h2>
              <p className="text-xs text-slate-500">Unggah file laporan barang rusak Informa (.xlsx atau .csv)</p>
            </div>
            <button
              onClick={onCloseModal}
              className="text-slate-400 hover:text-slate-700 text-lg font-bold p-1 rounded-md"
            >
              ✕
            </button>
          </div>
          {content}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto py-12 px-4 sm:px-6">
      <div className="text-center mb-8">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-amber-50 text-amber-800 text-xs font-semibold mb-3 border border-amber-200">
          Informa Alam Sutera (J347)
        </div>
        <h2 className="text-2xl font-bold text-slate-900 tracking-tight sm:text-3xl">
          Sistem Monitoring Barang Rusak (BARUS)
        </h2>
        <p className="text-sm text-slate-600 mt-2 max-w-xl mx-auto">
          Analisis komprehensif nilai kerusakan barang, pelacakan pengajuan ADF (Approval Disposal Form), kontribusi per departemen, dan estimasi recovery nilai.
        </p>
      </div>

      {content}
    </div>
  );
};
