import React, { useState, useRef, useEffect } from 'react';
import { Search, RotateCcw, ChevronDown, Check, Calendar, Filter } from 'lucide-react';
import { FilterState, BasisValue } from '../types/barus';

interface GlobalFiltersProps {
  filters: FilterState;
  onChangeFilters: (newFilters: FilterState) => void;
  availableDepts: string[];
  availableCauses: string[];
  availableStatuses: string[];
  totalItemCount: number;
  filteredItemCount: number;
}

export const GlobalFilters: React.FC<GlobalFiltersProps> = ({
  filters,
  onChangeFilters,
  availableDepts,
  availableCauses,
  availableStatuses,
  totalItemCount,
  filteredItemCount,
}) => {
  const [openDropdown, setOpenDropdown] = useState<'dept' | 'cause' | 'status' | null>(null);

  // Close dropdown on outside click
  const dropdownRef = useRef<HTMLDivElement>(null);
  useEffect(() => {
    function handleClickOutside(event: MouseEvent) {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setOpenDropdown(null);
      }
    }
    document.addEventListener('mousedown', handleClickOutside);
    return () => document.removeEventListener('mousedown', handleClickOutside);
  }, []);

  const handleReset = () => {
    onChangeFilters({
      depts: [],
      causedBys: [],
      statusAdf: 'ALL',
      statuses: [],
      dateStart: '',
      dateEnd: '',
      searchQuery: '',
      basisValue: 'outstanding',
    });
  };

  const isFiltered =
    filters.depts.length > 0 ||
    filters.causedBys.length > 0 ||
    filters.statusAdf !== 'ALL' ||
    filters.statuses.length > 0 ||
    filters.dateStart !== '' ||
    filters.dateEnd !== '' ||
    filters.searchQuery !== '' ||
    filters.basisValue !== 'outstanding';

  const toggleDept = (dept: string) => {
    const exists = filters.depts.includes(dept);
    const updated = exists ? filters.depts.filter(d => d !== dept) : [...filters.depts, dept];
    onChangeFilters({ ...filters, depts: updated });
  };

  const toggleCause = (cause: string) => {
    const exists = filters.causedBys.includes(cause);
    const updated = exists ? filters.causedBys.filter(c => c !== cause) : [...filters.causedBys, cause];
    onChangeFilters({ ...filters, causedBys: updated });
  };

  const toggleStatus = (status: string) => {
    const exists = filters.statuses.includes(status);
    const updated = exists ? filters.statuses.filter(s => s !== status) : [...filters.statuses, status];
    onChangeFilters({ ...filters, statuses: updated });
  };

  return (
    <div className="bg-white border-b border-slate-200 sticky top-16 z-30 shadow-xs" ref={dropdownRef}>
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-3">
        <div className="flex flex-col lg:flex-row lg:items-center justify-between gap-3">
          
          {/* Row 1: Search and Primary Selectors */}
          <div className="flex flex-wrap items-center gap-2 flex-1">
            
            {/* Search Input */}
            <div className="relative min-w-[200px] flex-1 max-w-xs">
              <Search className="w-3.5 h-3.5 absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" />
              <input
                type="text"
                placeholder="Cari Article / Deskripsi / No ADF..."
                value={filters.searchQuery}
                onChange={e => onChangeFilters({ ...filters, searchQuery: e.target.value })}
                className="w-full pl-8 pr-3 py-1.5 text-xs bg-slate-50 border border-slate-200 rounded-md focus:bg-white focus:outline-hidden focus:border-amber-500 focus:ring-1 focus:ring-amber-500 transition-colors"
              />
              {filters.searchQuery && (
                <button
                  onClick={() => onChangeFilters({ ...filters, searchQuery: '' })}
                  className="absolute right-2.5 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 text-xs"
                >
                  ✕
                </button>
              )}
            </div>

            {/* Dropdown: Departemen */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'dept' ? null : 'dept')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  filters.depts.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Dept</span>
                {filters.depts.length > 0 && (
                  <span className="bg-amber-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {filters.depts.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {openDropdown === 'dept' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                    <span>Pilih Departemen ({filters.depts.length}/{availableDepts.length})</span>
                    {filters.depts.length > 0 && (
                      <button
                        onClick={() => onChangeFilters({ ...filters, depts: [] })}
                        className="text-amber-700 hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {availableDepts.map(dept => {
                      const isSelected = filters.depts.includes(dept);
                      return (
                        <button
                          key={dept}
                          type="button"
                          onClick={() => toggleDept(dept)}
                          className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <span className={`truncate ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {dept}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Caused By */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'cause' ? null : 'cause')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  filters.causedBys.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Penyebab</span>
                {filters.causedBys.length > 0 && (
                  <span className="bg-amber-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {filters.causedBys.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {openDropdown === 'cause' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                    <span>Penyebab Kerusakan</span>
                    {filters.causedBys.length > 0 && (
                      <button
                        onClick={() => onChangeFilters({ ...filters, causedBys: [] })}
                        className="text-amber-700 hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {availableCauses.map(cause => {
                      const isSelected = filters.causedBys.includes(cause);
                      return (
                        <button
                          key={cause}
                          type="button"
                          onClick={() => toggleCause(cause)}
                          className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <span className={`truncate ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {cause}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Dropdown: Status BARUS */}
            <div className="relative">
              <button
                type="button"
                onClick={() => setOpenDropdown(openDropdown === 'status' ? null : 'status')}
                className={`inline-flex items-center gap-1.5 px-3 py-1.5 text-xs rounded-md border transition-colors ${
                  filters.statuses.length > 0
                    ? 'bg-amber-50 border-amber-300 text-amber-900 font-medium'
                    : 'bg-slate-50 border-slate-200 text-slate-700 hover:bg-slate-100'
                }`}
              >
                <span>Status Tindakan</span>
                {filters.statuses.length > 0 && (
                  <span className="bg-amber-600 text-white rounded-full text-[10px] w-4 h-4 flex items-center justify-center font-bold">
                    {filters.statuses.length}
                  </span>
                )}
                <ChevronDown className="w-3.5 h-3.5 text-slate-500" />
              </button>

              {openDropdown === 'status' && (
                <div className="absolute left-0 mt-1 w-64 bg-white border border-slate-200 rounded-lg shadow-lg z-50 p-2 max-h-72 overflow-y-auto">
                  <div className="flex items-center justify-between pb-1.5 mb-1.5 border-b border-slate-100 text-[11px] text-slate-500">
                    <span>Status Penyelesaian</span>
                    {filters.statuses.length > 0 && (
                      <button
                        onClick={() => onChangeFilters({ ...filters, statuses: [] })}
                        className="text-amber-700 hover:underline font-medium"
                      >
                        Reset
                      </button>
                    )}
                  </div>
                  <div className="space-y-0.5">
                    {availableStatuses.map(status => {
                      const isSelected = filters.statuses.includes(status);
                      return (
                        <button
                          key={status}
                          type="button"
                          onClick={() => toggleStatus(status)}
                          className="w-full text-left px-2 py-1.5 rounded text-xs flex items-center justify-between hover:bg-slate-100 transition-colors"
                        >
                          <span className={`truncate ${isSelected ? 'font-semibold text-slate-900' : 'text-slate-700'}`}>
                            {status}
                          </span>
                          {isSelected && <Check className="w-3.5 h-3.5 text-amber-600 shrink-0" />}
                        </button>
                      );
                    })}
                  </div>
                </div>
              )}
            </div>

            {/* Status ADF Segmented Radio */}
            <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, statusAdf: 'ALL' })}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  filters.statusAdf === 'ALL'
                    ? 'bg-white text-slate-900 font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Semua ADF
              </button>
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, statusAdf: 'SUDAH' })}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  filters.statusAdf === 'SUDAH'
                    ? 'bg-emerald-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Sudah ADF
              </button>
              <button
                type="button"
                onClick={() => onChangeFilters({ ...filters, statusAdf: 'BELUM' })}
                className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                  filters.statusAdf === 'BELUM'
                    ? 'bg-rose-600 text-white font-semibold shadow-xs'
                    : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                Belum ADF
              </button>
            </div>

            {/* Date Range Picker (WEEK) */}
            <div className="flex items-center gap-1 bg-slate-50 border border-slate-200 px-2 py-1 rounded-md text-xs text-slate-600">
              <Calendar className="w-3.5 h-3.5 text-slate-400 shrink-0" />
              <span className="text-[11px] text-slate-400">Dari:</span>
              <input
                type="date"
                value={filters.dateStart}
                onChange={e => onChangeFilters({ ...filters, dateStart: e.target.value })}
                className="bg-transparent text-slate-700 text-xs focus:outline-hidden"
              />
              <span className="text-[11px] text-slate-400">s/d</span>
              <input
                type="date"
                value={filters.dateEnd}
                onChange={e => onChangeFilters({ ...filters, dateEnd: e.target.value })}
                className="bg-transparent text-slate-700 text-xs focus:outline-hidden"
              />
              {(filters.dateStart || filters.dateEnd) && (
                <button
                  onClick={() => onChangeFilters({ ...filters, dateStart: '', dateEnd: '' })}
                  className="text-slate-400 hover:text-slate-600 text-xs ml-1"
                  title="Hapus filter tanggal"
                >
                  ✕
                </button>
              )}
            </div>

          </div>

          {/* Row 2: Basis Value Toggle & Reset */}
          <div className="flex items-center justify-between lg:justify-end gap-3 shrink-0 pt-2 lg:pt-0 border-t lg:border-t-0 border-slate-100">
            
            {/* Basis Value Toggle */}
            <div className="flex items-center gap-1.5">
              <span className="text-xs text-slate-500 font-medium">Basis Value:</span>
              <div className="flex items-center bg-slate-100 p-0.5 rounded-md border border-slate-200">
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, basisValue: 'outstanding' })}
                  title="Gunakan VALUE AKHIR (nilai barang rusak yang masih tersisa)"
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    filters.basisValue === 'outstanding'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Outstanding
                </button>
                <button
                  type="button"
                  onClick={() => onChangeFilters({ ...filters, basisValue: 'awal' })}
                  title="Gunakan VALUE awal saat barang pertama kali dilaporkan"
                  className={`px-2.5 py-1 text-xs rounded transition-colors whitespace-nowrap ${
                    filters.basisValue === 'awal'
                      ? 'bg-white text-slate-900 font-semibold shadow-xs'
                      : 'text-slate-600 hover:text-slate-900'
                  }`}
                >
                  Value Awal
                </button>
              </div>
            </div>

            {/* Filtered Count & Reset Button */}
            <div className="flex items-center gap-2">
              <span className="text-xs text-slate-500 tabular-nums">
                <span className="font-semibold text-slate-800">{filteredItemCount}</span> dari {totalItemCount} item
              </span>

              {isFiltered && (
                <button
                  type="button"
                  onClick={handleReset}
                  className="inline-flex items-center gap-1 px-2.5 py-1 text-xs font-medium text-rose-700 bg-rose-50 hover:bg-rose-100 border border-rose-200 rounded-md transition-colors"
                  title="Reset semua filter ke pengaturan awal"
                >
                  <RotateCcw className="w-3 h-3" />
                  <span>Reset</span>
                </button>
              )}
            </div>

          </div>

        </div>
      </div>
    </div>
  );
};
