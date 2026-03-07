/**
 * CSV Parser for FNB Easy Account exports
 * Handles parsing of transaction CSV files and extracting relevant data
 */

class CSVParser {
  constructor() {
    this.defaultCurrency = 'ZAR'; // FNB is ZAR
  }

  /**
   * Parse CSV file content
   * @param {string} csvText - Raw CSV text content
   * @param {string} currency - Currency code (default: ZAR)
   * @returns {Array} Array of parsed transaction objects
   */
  parse(csvText, currency = this.defaultCurrency) {
    const lines = csvText.split('\n').filter(line => line.trim());
    if (lines.length === 0) {
      throw new Error('CSV file is empty');
    }

    // Try to detect header row
    const headerRow = lines[0].toLowerCase();
    let headers = this.parseCSVLine(lines[0]);
    
    let startIndex = 0;

    // Common FNB column names to look for
    const dateKeywords = ['date', 'transaction date', 'value date'];
    const descKeywords = ['description', 'details', 'narrative', 'transaction details'];
    const amountKeywords = ['amount', 'debit', 'credit', 'balance'];

    // Find column indices
    const dateIndex = headers.findIndex(h => 
      dateKeywords.some(k => h.toLowerCase().includes(k))
    );
    const descIndex = headers.findIndex(h => 
      descKeywords.some(k => h.toLowerCase().includes(k))
    );
    const amountIndex = headers.findIndex(h => 
      amountKeywords.some(k => h.toLowerCase().includes(k))
    );

    // If we can't find expected columns, try first row as data
    if (dateIndex === -1 || descIndex === -1 || amountIndex === -1) {
      // Try without header row
      headers = null;
      startIndex = 0;
      // Assume common format: Date, Description, Amount
      return this.parseWithoutHeaders(lines, currency);
    }

    // Parse data rows
    const transactions = [];
    for (let i = 1; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < Math.max(dateIndex, descIndex, amountIndex) + 1) {
        continue; // Skip incomplete rows
      }

      try {
        const transaction = this.parseTransactionRow(
          values,
          dateIndex,
          descIndex,
          amountIndex,
          currency
        );
        if (transaction) {
          transactions.push(transaction);
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error.message}`);
      }
    }

    return transactions;
  }

  /**
   * Parse CSV line handling quoted values
   */
  parseCSVLine(line) {
    const result = [];
    let current = '';
    let inQuotes = false;

    for (let i = 0; i < line.length; i++) {
      const char = line[i];
      const nextChar = line[i + 1];

      if (char === '"') {
        if (inQuotes && nextChar === '"') {
          current += '"';
          i++; // Skip next quote
        } else {
          inQuotes = !inQuotes;
        }
      } else if (char === ',' && !inQuotes) {
        result.push(current.trim());
        current = '';
      } else {
        current += char;
      }
    }
    result.push(current.trim());
    return result;
  }

  /**
   * Parse transaction row with known column indices
   */
  parseTransactionRow(values, dateIndex, descIndex, amountIndex, currency) {
    const dateStr = values[dateIndex]?.trim();
    const description = values[descIndex]?.trim();
    const amountStr = values[amountIndex]?.trim();

    if (!dateStr || !description || !amountStr) {
      return null;
    }

    // Parse date (handle various formats)
    const date = this.parseDate(dateStr);
    if (!date) {
      throw new Error(`Invalid date format: ${dateStr}`);
    }

    // Parse amount (remove currency symbols, commas, handle negatives)
    const amount = this.parseAmount(amountStr);
    if (amount === null || amount === undefined) {
      throw new Error(`Invalid amount: ${amountStr}`);
    }

    return {
      date: date.toISOString().split('T')[0], // YYYY-MM-DD format
      description: description,
      amount: Math.abs(amount), // Store as positive
      currency: currency,
      isDebit: amount < 0 // Track if it's a debit
    };
  }

  /**
   * Parse without headers (assume Date, Description, Amount format)
   */
  parseWithoutHeaders(lines, currency) {
    const transactions = [];
    for (let i = 0; i < lines.length; i++) {
      const values = this.parseCSVLine(lines[i]);
      if (values.length < 3) continue;

      try {
        const date = this.parseDate(values[0]);
        const description = values[1] || '';
        const amount = this.parseAmount(values[2]);

        if (date && description && amount !== null) {
          transactions.push({
            date: date.toISOString().split('T')[0],
            description: description,
            amount: Math.abs(amount),
            currency: currency,
            isDebit: amount < 0
          });
        }
      } catch (error) {
        console.warn(`Skipping row ${i + 1}: ${error.message}`);
      }
    }
    return transactions;
  }

  /**
   * Parse date string in various formats
   */
  parseDate(dateStr) {
    // Common formats: DD/MM/YYYY, YYYY-MM-DD, DD-MM-YYYY
    const formats = [
      /^(\d{2})\/(\d{2})\/(\d{4})$/, // DD/MM/YYYY
      /^(\d{4})-(\d{2})-(\d{2})$/,    // YYYY-MM-DD
      /^(\d{2})-(\d{2})-(\d{4})$/,    // DD-MM-YYYY
    ];

    for (const format of formats) {
      const match = dateStr.match(format);
      if (match) {
        if (format === formats[0]) {
          // DD/MM/YYYY
          return new Date(`${match[3]}-${match[2]}-${match[1]}`);
        } else if (format === formats[1]) {
          // YYYY-MM-DD
          return new Date(dateStr);
        } else {
          // DD-MM-YYYY
          return new Date(`${match[3]}-${match[2]}-${match[1]}`);
        }
      }
    }

    // Try native Date parsing
    const parsed = new Date(dateStr);
    if (!isNaN(parsed.getTime())) {
      return parsed;
    }

    return null;
  }

  /**
   * Parse amount string, handling currency symbols and formatting
   */
  parseAmount(amountStr) {
    // Remove currency symbols, spaces, commas
    let cleaned = amountStr
      .replace(/[R$£€,]/g, '')
      .replace(/\s/g, '')
      .trim();

    // Handle negative amounts (debits)
    const isNegative = cleaned.startsWith('-') || 
                       cleaned.includes('DR') || 
                       cleaned.includes('Debit');
    
    cleaned = cleaned.replace(/[-DRDebit]/gi, '');

    const amount = parseFloat(cleaned);
    if (isNaN(amount)) {
      return null;
    }

    return isNegative ? -amount : amount;
  }

  /**
   * Validate parsed transactions
   */
  validate(transactions) {
    return transactions.filter(t => {
      return t.date && 
             t.description && 
             t.amount !== null && 
             t.amount !== undefined &&
             t.currency;
    });
  }
}

// Export for use in other modules
if (typeof module !== 'undefined' && module.exports) {
  module.exports = CSVParser;
}
