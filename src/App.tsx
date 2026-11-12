/**
 * @license
 * SPDX-License-Identifier: Apache-2.0
 */

import React, { useState, useMemo, useEffect } from 'react';
import { BarusItem, FilterState, FileMetadata } from './types/barus';
import { generateSampleData, exportItemsToCSV } from './utils/parser';
import { getOfficialBarusData, OFFICIAL_METADATA } from './data/officialDataset';
import { calculateKPISummary, calculateAging, calculateDeptSummary } from './utils/metrics';
import { Header } from './components/Header';
import { GlobalFilters } from './components/GlobalFilters';
import { UploadZone } from './components/UploadZone';
import { Section1Resume } from './components/Section1Resume';
import { Section2Departemen } from './components/Section2Departemen';
import { Section3DetailDept } from './components/Section3DetailDept';
import { AlertCircle, X } from 'lucide-react';

export default function App() {
  const [rawData, setRawData] = useState<BarusItem[]>([]);
  const [metadata, setMetadata] = useState<FileMetadata | null>(null);
  const [warnings, setWarnings] = useState<string[]>([]);
  const [isUploadModalOpen, setIsUploadModalOpen] = useState<boolean>(false);

  // Global Filter State
  const [filters, setFilters] = useState<FilterState>({
    depts: [],
    causedBys: [],
    statusAdf: 'ALL',
    statuses: [],
    dateStart: '',
    dateEnd: '',
    searchQuery: '',
    basisValue: 'outstanding',
  });

  // Selected Department for Section 3
  const [selectedDept, setSelectedDept] = useState<string>('');

  // Auto-load sample data on first launch so user immediately experiences a live dashboard
  useEffect(() => {
    handleLoadSample();
  }, []);

  // Available Filter Options from Raw Data
  const availableDepts = useMemo(() => {
    const set = new Set(rawData.map(i => i.dept || 'LAIN-LAIN'));
    return Array.from(set).sort();
  }, [rawData]);

  const availableCauses = useMemo(() => {
    const set = new Set(rawData.map(i => i.causedBy || 'Lainnya'));
    return Array.from(set).sort();
  }, [rawData]);

  const availableStatuses = useMemo(() => {
    const set = new Set(rawData.map(i => i.status || 'Belum Ada Status'));
    return Array.from(set).sort();
  }, [rawData]);

  // Filtering Logic
  const filteredItems = useMemo(() => {
    return rawData.filter(item => {
      // Dept filter
      if (filters.depts.length > 0 && !filters.depts.includes(item.dept)) {
        return false;
      }

      // Caused By filter
      if (filters.causedBys.length > 0 && !filters.causedBys.includes(item.causedBy)) {
        return false;
      }

      // Status ADF filter
      if (filters.statusAdf === 'SUDAH' && item.fu !== 'SUDAH DIAJUKAN ADF') {
        return false;
      }
      if (filters.statusAdf === 'BELUM' && item.fu !== 'BELUM DIAJUKAN ADF') {
        return false;
      }

      // Status Tindakan filter
      if (filters.statuses.length > 0 && !filters.statuses.includes(item.status)) {
        return false;
      }

      // Date Range Filter
      if (filters.dateStart || filters.dateEnd) {
        if (!item.weekDate) return false;
        const itemTime = item.weekDate.getTime();
        if (filters.dateStart) {
          const startTime = new Date(filters.dateStart).getTime();
          if (itemTime < startTime) return false;
        }
        if (filters.dateEnd) {
          const endTime = new Date(filters.dateEnd).setHours(23, 59, 59, 999);
          if (itemTime > endTime) return false;
        }
      }

      // Search Query filter (Article / Description / No ADF)
      if (filters.searchQuery.trim()) {
        const q = filters.searchQuery.toLowerCase();
        const artMatch = item.article.toLowerCase().includes(q);
        const descMatch = item.description.toLowerCase().includes(q);
        const adfMatch = item.noAdf.toLowerCase().includes(q);
        if (!artMatch && !descMatch && !adfMatch) {
          return false;
        }
      }

      return true;
    });
  }, [rawData, filters]);

  // Aggregated KPIs and Metrics
  const kpi = useMemo(() => calculateKPISummary(filteredItems), [filteredItems]);
  const aging = useMemo(() => calculateAging(filteredItems, filters.basisValue), [filteredItems, filters.basisValue]);

  // Auto-set selected department when data changes or current selection is invalid
  useEffect(() => {
    if (availableDepts.length > 0) {
      if (!selectedDept || !availableDepts.includes(selectedDept)) {
        // Pick department with largest value
        const deptRanking = calculateDeptSummary(filteredItems, filters.basisValue);
        if (deptRanking.length > 0) {
          setSelectedDept(deptRanking[0].dept);
        } else {
          setSelectedDept(availableDepts[0]);
        }
      }
    }
  }, [availableDepts, filteredItems, filters.basisValue, selectedDept]);

  // Handle uploaded data
  const handleDataLoaded = (items: BarusItem[], meta: FileMetadata, warnList: string[]) => {
    setRawData(items);
    setMetadata(meta);
    setWarnings(warnList);
    // Reset filters on new file upload
    setFilters({
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

  // Handle official ALSUT dataset load
  const handleLoadSample = () => {
    const items = getOfficialBarusData();
    setRawData(items);
    setMetadata(OFFICIAL_METADATA);
    setWarnings([]);
  };

  // Navigate to Section 3 and select department
  const handleSelectDepartment = (deptName: string) => {
    setSelectedDept(deptName);
    const targetElement = document.getElementById('section-detail-departemen');
    if (targetElement) {
      targetElement.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
  };

  // Export filtered items to CSV
  const handleExportFilteredCSV = () => {
    exportItemsToCSV(filteredItems, `BARUS_J347_Export_${new Date().toISOString().slice(0, 10)}.csv`);
  };

  return (
    <div className="min-h-screen bg-slate-50 text-slate-800 flex flex-col font-sans">
      
      {/* Top Bar Header */}
      <Header
        metadata={metadata}
        onOpenUpload={() => setIsUploadModalOpen(true)}
        onLoadSample={handleLoadSample}
        onExportFilteredCSV={handleExportFilteredCSV}
        itemCount={filteredItems.length}
        totalStoreCount={rawData.length}
      />

      {/* Main Viewport */}
      {rawData.length === 0 ? (
        <main className="flex-1 flex items-center justify-center p-6">
          <UploadZone
            onDataLoaded={handleDataLoaded}
            onLoadSample={handleLoadSample}
          />
        </main>
      ) : (
        <>
          {/* Global Sticky Filter Bar */}
          <GlobalFilters
            filters={filters}
            onChangeFilters={setFilters}
            availableDepts={availableDepts}
            availableCauses={availableCauses}
            availableStatuses={availableStatuses}
            totalItemCount={rawData.length}
            filteredItemCount={filteredItems.length}
          />

          {/* Body Content */}
          <main className="flex-1 max-w-7xl w-full mx-auto px-4 sm:px-6 lg:px-8 py-6 space-y-10">
            
            {/* Warnings Alert Banner (if any Sheet name fallback occurred) */}
            {warnings.length > 0 && (
              <div className="p-3 bg-amber-50 border border-amber-200 rounded-lg flex items-center justify-between text-xs text-amber-800">
                <div className="flex items-center gap-2">
                  <AlertCircle className="w-4 h-4 text-amber-600 shrink-0" />
                  <span>{warnings.join(' ')}</span>
                </div>
                <button
                  onClick={() => setWarnings([])}
                  className="text-amber-600 hover:text-amber-900 font-bold ml-2"
                >
                  <X className="w-3.5 h-3.5" />
                </button>
              </div>
            )}

            {/* Bagian 1 — Resume Barang Rusak */}
            <Section1Resume
              items={filteredItems}
              kpi={kpi}
              aging={aging}
              basisValue={filters.basisValue}
            />

            {/* Bagian 2 — Kontribusi per Departemen */}
            <Section2Departemen
              items={filteredItems}
              basisValue={filters.basisValue}
              onSelectDepartment={handleSelectDepartment}
            />

            {/* Bagian 3 — Detail per Departemen */}
            <Section3DetailDept
              items={filteredItems}
              selectedDept={selectedDept}
              onSelectDept={setSelectedDept}
              availableDepts={availableDepts}
              totalStoreValue={filters.basisValue === 'outstanding' ? kpi.valueOutstanding : kpi.valueBarusAwal}
              basisValue={filters.basisValue}
            />

          </main>
        </>
      )}

      {/* Upload Modal (when clicking Ganti File in Header) */}
      {isUploadModalOpen && (
        <UploadZone
          isModal={true}
          onCloseModal={() => setIsUploadModalOpen(false)}
          onDataLoaded={handleDataLoaded}
          onLoadSample={handleLoadSample}
        />
      )}

      {/* Footer */}
      <footer className="bg-white border-t border-slate-200 py-4 mt-12 text-center text-xs text-slate-500">
        <div className="max-w-7xl mx-auto px-4 flex flex-col sm:flex-row items-center justify-between gap-2">
          <p>
            Informa Alam Sutera (J347) · Sistem Dashboard Barang Rusak (BARUS)
          </p>
          <p className="text-slate-400">
            Pemrosesan data client-side lokal tanpa pengiriman ke server eksternal.
          </p>
        </div>
      </footer>

    </div>
  );
}
