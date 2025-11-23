export interface CSVRow {
  [key: string]: string;
}

export interface CSVParseResult {
  headers: string[];
  rows: CSVRow[];
  errors: string[];
}

export const parseCSV = (csvText: string): CSVParseResult => {
  const result: CSVParseResult = {
    headers: [],
    rows: [],
    errors: [],
  };

  if (!csvText || !csvText.trim()) {
    result.errors.push('CSV file is empty');
    return result;
  }

  const lines = csvText.trim().split('\n');

  if (lines.length < 2) {
    result.errors.push('CSV must have at least a header row and one data row');
    return result;
  }

  result.headers = parseCSVLine(lines[0]);

  if (result.headers.length === 0) {
    result.errors.push('No headers found in CSV');
    return result;
  }

  for (let i = 1; i < lines.length; i++) {
    if (!lines[i].trim()) continue;

    const values = parseCSVLine(lines[i]);

    if (values.length !== result.headers.length) {
      result.errors.push(`Row ${i + 1}: Column count mismatch (expected ${result.headers.length}, got ${values.length})`);
      continue;
    }

    const row: CSVRow = {};
    result.headers.forEach((header, index) => {
      row[header] = values[index] || '';
    });

    result.rows.push(row);
  }

  return result;
};

const parseCSVLine = (line: string): string[] => {
  const values: string[] = [];
  let current = '';
  let inQuotes = false;

  for (let i = 0; i < line.length; i++) {
    const char = line[i];

    if (char === '"') {
      if (inQuotes && line[i + 1] === '"') {
        current += '"';
        i++;
      } else {
        inQuotes = !inQuotes;
      }
    } else if (char === ',' && !inQuotes) {
      values.push(current.trim());
      current = '';
    } else {
      current += char;
    }
  }

  values.push(current.trim());
  return values;
};

export const generateCSV = (headers: string[], rows: CSVRow[]): string => {
  const lines: string[] = [];

  lines.push(headers.map(escapeCSVValue).join(','));

  rows.forEach(row => {
    const values = headers.map(header => escapeCSVValue(row[header] || ''));
    lines.push(values.join(','));
  });

  return lines.join('\n');
};

const escapeCSVValue = (value: string): string => {
  if (value.includes(',') || value.includes('"') || value.includes('\n')) {
    return `"${value.replace(/"/g, '""')}"`;
  }
  return value;
};

export const validateCSVHeaders = (headers: string[], requiredHeaders: string[]): string[] => {
  const errors: string[] = [];
  const normalizedHeaders = headers.map(h => h.toLowerCase().trim());

  requiredHeaders.forEach(required => {
    const normalizedRequired = required.toLowerCase().trim();
    if (!normalizedHeaders.includes(normalizedRequired)) {
      errors.push(`Missing required column: ${required}`);
    }
  });

  return errors;
};

export const mapCSVHeaders = (headers: string[]): Record<string, string> => {
  const mapping: Record<string, string> = {};

  const headerMappings: Record<string, string[]> = {
    name: ['name', 'recipient_name', 'first_name', 'full_name', 'contact_name'],
    email: ['email', 'recipient_email', 'email_address', 'contact_email'],
    company: ['company', 'company_name', 'organization', 'org'],
    role: ['role', 'title', 'job_title', 'position', 'job_role'],
    industry: ['industry', 'sector', 'vertical'],
    pain_point: ['pain_point', 'pain point', 'challenge', 'problem', 'issue'],
  };

  headers.forEach(header => {
    const normalized = header.toLowerCase().trim();

    Object.entries(headerMappings).forEach(([standardKey, variations]) => {
      if (variations.includes(normalized)) {
        mapping[header] = standardKey;
      }
    });

    if (!mapping[header]) {
      mapping[header] = normalized.replace(/\s+/g, '_');
    }
  });

  return mapping;
};

export const downloadCSV = (filename: string, csvContent: string): void => {
  const blob = new Blob([csvContent], { type: 'text/csv;charset=utf-8;' });
  const link = document.createElement('a');
  const url = URL.createObjectURL(blob);

  link.setAttribute('href', url);
  link.setAttribute('download', filename);
  link.style.visibility = 'hidden';

  document.body.appendChild(link);
  link.click();
  document.body.removeChild(link);

  URL.revokeObjectURL(url);
};

export const getCSVTemplate = (): string => {
  const headers = ['name', 'email', 'company', 'role', 'industry', 'pain_point'];
  const exampleRows: CSVRow[] = [
    {
      name: 'John Doe',
      email: 'john@example.com',
      company: 'Acme Corp',
      role: 'CEO',
      industry: 'Technology',
      pain_point: 'Scaling operations efficiently',
    },
    {
      name: 'Jane Smith',
      email: 'jane@startup.io',
      company: 'Startup Inc',
      role: 'VP of Sales',
      industry: 'SaaS',
      pain_point: 'Improving conversion rates',
    },
  ];

  return generateCSV(headers, exampleRows);
};
