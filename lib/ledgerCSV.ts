/**
 * Ledger CSV Generation Utility
 * 
 * Generates a professional, combined CSV file from expenses and mileage logs
 * for business record-keeping and organization.
 */

interface Expense {
  date: string;
  category: string;
  amount: number;
  notes: string | null;
}

interface MileageLog {
  date: string;
  purpose: string;
  total_miles: number | null;
  notes: string | null;
}

interface GenerateLedgerCSVParams {
  expenses: Expense[];
  mileageLogs: MileageLog[];
  businessName: string;
  year: number;
}

/**
 * Escapes CSV values to handle commas, quotes, and newlines
 */
function escapeCSV(value: string | null | undefined): string {
  if (!value) return '';
  const str = String(value);
  // Escape quotes by doubling them
  const escaped = str.replace(/"/g, '""');
  // Wrap in quotes if contains comma, quote, or newline
  if (str.includes(',') || str.includes('"') || str.includes('\n')) {
    return `"${escaped}"`;
  }
  return str;
}

/**
 * Generates a professional combined CSV file from expenses and mileage logs
 * 
 * Format:
 * - Date, Type, Category/Purpose, Amount/Miles, Notes
 * - All entries sorted by date
 * - Professional filename: VantakOS_Records_[BusinessName]_[Year].csv
 */
export function generateLedgerCSV({
  expenses,
  mileageLogs,
  businessName,
  year,
}: GenerateLedgerCSVParams): string {
  // CSV Header
  const header = 'Date,Type,Category/Purpose,Amount/Miles,Notes\n';
  
  // Combine and sort all entries by date
  const allEntries: Array<{
    date: string;
    type: 'Expense' | 'Mileage';
    categoryOrPurpose: string;
    amountOrMiles: string;
    notes: string | null;
  }> = [];

  // Add expenses
  expenses.forEach(expense => {
    const date = new Date(expense.date).toLocaleDateString('en-US');
    allEntries.push({
      date,
      type: 'Expense',
      categoryOrPurpose: expense.category,
      amountOrMiles: `$${expense.amount.toFixed(2)}`,
      notes: expense.notes,
    });
  });

  // Add mileage logs (only those with valid total_miles)
  mileageLogs
    .filter(log => log.total_miles !== null)
    .forEach(log => {
      const date = new Date(log.date).toLocaleDateString('en-US');
      allEntries.push({
        date,
        type: 'Mileage',
        categoryOrPurpose: log.purpose,
        amountOrMiles: `${log.total_miles?.toFixed(1)} miles`,
        notes: log.notes,
      });
    });

  // Sort by date (most recent first, then by type)
  allEntries.sort((a, b) => {
    const dateA = new Date(a.date).getTime();
    const dateB = new Date(b.date).getTime();
    if (dateA !== dateB) {
      return dateB - dateA; // Most recent first
    }
    // If same date, sort by type (Expense before Mileage)
    return a.type.localeCompare(b.type);
  });

  // Generate CSV rows
  const rows = allEntries.map(entry => {
    const date = escapeCSV(entry.date);
    const type = escapeCSV(entry.type);
    const categoryOrPurpose = escapeCSV(entry.categoryOrPurpose);
    const amountOrMiles = escapeCSV(entry.amountOrMiles);
    const notes = escapeCSV(entry.notes);

    return `${date},${type},${categoryOrPurpose},${amountOrMiles},${notes}`;
  });

  // Combine header and rows
  return header + rows.join('\n');
}

/**
 * Generates a professional filename for the ledger CSV
 * Format: VantakOS_Records_[BusinessName]_[Year].csv
 */
export function generateLedgerFilename(businessName: string, year: number): string {
  // Sanitize business name for filename (remove special characters)
  const sanitizedName = businessName
    .replace(/[^a-zA-Z0-9\s-]/g, '') // Remove special chars except spaces and hyphens
    .replace(/\s+/g, '_') // Replace spaces with underscores
    .substring(0, 50); // Limit length

  return `VantakOS_Records_${sanitizedName}_${year}.csv`;
}

/**
 * Downloads a CSV file to the user's device
 */
export function downloadCSV(filename: string, content: string): void {
  const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);
  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';
  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);
  URL.revokeObjectURL(url);
}


