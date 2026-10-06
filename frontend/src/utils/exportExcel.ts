import * as XLSX from 'xlsx';

export function exportToExcel<T extends Record<string, any>>(
  data: T[],
  filename: string,
  sheetName: string = 'Sheet1'
) {
  if (!data || data.length === 0) {
    return false;
  }

  // Create worksheet
  const worksheet = XLSX.utils.json_to_sheet(data);

  // Auto-fit column widths
  const columnKeys = Object.keys(data[0] || {});
  const colWidths = columnKeys.map((key) => {
    const maxLen = Math.max(
      key.length,
      ...data.map((row) => (row[key] !== undefined && row[key] !== null ? String(row[key]).length : 0))
    );
    return { wch: Math.min(Math.max(maxLen + 4, 12), 40) };
  });
  worksheet['!cols'] = colWidths;

  // Create workbook
  const workbook = XLSX.utils.book_new();
  XLSX.utils.book_append_sheet(workbook, worksheet, sheetName);

  // Write file
  const fullFileName = filename.endsWith('.xlsx') ? filename : `${filename}.xlsx`;
  XLSX.writeFile(workbook, fullFileName);
  return true;
}
