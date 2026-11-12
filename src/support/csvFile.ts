import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname } from 'node:path';

const NEEDS_QUOTES = /[",\r\n]/;

const quote = (cell: string): string => (NEEDS_QUOTES.test(cell) ? `"${cell.split('"').join('""')}"` : cell);

/** Writes an RFC-4180 CSV (header row first) and returns the path. */
export function saveCsv(file: string, header: readonly string[], body: string[][]): string {
  const lines = [header, ...body].map((cells) => cells.map(quote).join(','));
  mkdirSync(dirname(file), { recursive: true });
  writeFileSync(file, lines.join('\n') + '\n', 'utf8');
  return file;
}

/** Reads a CSV back into rows of cells, honouring quoted commas, quotes and line breaks. */
export function loadCsv(file: string): string[][] {
  const text = readFileSync(file, 'utf8');
  const table: string[][] = [];
  let cells: string[] = [];
  let buffer = '';
  let insideQuotes = false;

  const endCell = () => { cells.push(buffer); buffer = ''; };
  const endRow = () => { endCell(); table.push(cells); cells = []; };

  for (let i = 0; i < text.length; i += 1) {
    const char = text[i];
    switch (true) {
      case insideQuotes && char === '"' && text[i + 1] === '"':
        buffer += '"'; i += 1; break;
      case char === '"':
        insideQuotes = !insideQuotes; break;
      case insideQuotes:
        buffer += char; break;
      case char === ',':
        endCell(); break;
      case char === '\r':
        break;
      case char === '\n':
        endRow(); break;
      default:
        buffer += char;
    }
  }
  if (buffer.length > 0 || cells.length > 0) endRow();
  return table;
}
