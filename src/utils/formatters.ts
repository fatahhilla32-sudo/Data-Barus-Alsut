/**
 * Format number to full Indonesian Rupiah string (e.g. "Rp 1.928.900.556")
 */
export function formatRupiah(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined) {
    return 'Rp 0';
  }
  const rounded = Math.round(amount);
  const formatted = new Intl.NumberFormat('id-ID').format(rounded);
  return `Rp ${formatted}`;
}

/**
 * Format large Rupiah amounts into compact readable format (e.g. "Rp 1,93 M", "Rp 77,0 Jt")
 */
export function formatRupiahShort(amount: number): string {
  if (isNaN(amount) || amount === null || amount === undefined || amount === 0) {
    return 'Rp 0';
  }
  const isNegative = amount < 0;
  const abs = Math.abs(amount);

  let formatted = '';
  if (abs >= 1_000_000_000) {
    const val = abs / 1_000_000_000;
    formatted = `${val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} M`;
  } else if (abs >= 1_000_000) {
    const val = abs / 1_000_000;
    formatted = `${val.toLocaleString('id-ID', { minimumFractionDigits: 1, maximumFractionDigits: 2 })} Jt`;
  } else if (abs >= 1_000) {
    const val = abs / 1_000;
    formatted = `${val.toLocaleString('id-ID', { minimumFractionDigits: 0, maximumFractionDigits: 1 })} Rb`;
  } else {
    formatted = abs.toLocaleString('id-ID');
  }

  return `${isNegative ? '-Rp ' : 'Rp '}${formatted}`;
}

/**
 * Format general numbers with Indonesian separators
 */
export function formatNumber(num: number): string {
  if (isNaN(num) || num === null || num === undefined) return '0';
  return new Intl.NumberFormat('id-ID').format(num);
}

/**
 * Format percentage
 */
export function formatPercent(value: number, decimals: number = 1): string {
  if (isNaN(value) || value === null || value === undefined) return '0%';
  return `${value.toLocaleString('id-ID', {
    minimumFractionDigits: decimals,
    maximumFractionDigits: decimals,
  })}%`;
}

/**
 * Format bytes to readable file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 B';
  const k = 1024;
  const sizes = ['B', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  return `${parseFloat((bytes / Math.pow(k, i)).toFixed(1))} ${sizes[i]}`;
}

/**
 * Format date to standard Indonesian date string DD MMM YYYY
 */
export function formatDateIndo(date: Date | null): string {
  if (!date || isNaN(date.getTime())) return '-';
  const months = [
    'Jan', 'Feb', 'Mar', 'Apr', 'Mei', 'Jun',
    'Jul', 'Agt', 'Sep', 'Okt', 'Nov', 'Des'
  ];
  const d = date.getDate().toString().padStart(2, '0');
  const m = months[date.getMonth()];
  const y = date.getFullYear();
  return `${d} ${m} ${y}`;
}
