import React, { useEffect, useState, useRef } from 'react';
import { vendorsAPI, customersAPI, invoicesAPI, billsAPI, inventoryAPI, emitToast } from '../api';

const parseCsv = (text: string) => {
  // Simple RFC4180-style line parser that handles quoted fields with commas
  const rawLines = text.split(/\r?\n/);
  const lines = rawLines.map(l => l).filter(l => l.trim() !== '');
  if (lines.length === 0) return { headers: [], rows: [] };

  const parseLine = (line: string) => {
    const cols: string[] = [];
    let cur = '';
    let inQuotes = false;
    for (let i = 0; i < line.length; i += 1) {
      const ch = line[i];
      if (ch === '"') {
        // handle escaped double quotes ""
        if (inQuotes && i + 1 < line.length && line[i + 1] === '"') {
          cur += '"';
          i += 1;
        } else {
          inQuotes = !inQuotes;
        }
      } else if (ch === ',' && !inQuotes) {
        cols.push(cur.trim());
        cur = '';
      } else {
        cur += ch;
      }
    }
    cols.push(cur.trim());
    return cols.map(c => {
      // strip surrounding quotes if present
      if (c.startsWith('"') && c.endsWith('"')) return c.slice(1, -1).replace(/""/g, '"');
      return c;
    });
  };

  const headers = parseLine(lines[0]).map(h => h.trim());
  const rows = lines.slice(1).map(line => {
    const cols = parseLine(line);
    const obj: any = {};
    headers.forEach((h, i) => obj[h] = cols[i] !== undefined ? cols[i] : '');
    return obj;
  });
  return { headers, rows };
};

// normalize numeric-like strings: remove thousands separators, currency symbols
const normalizeNumber = (v: any) => {
  if (v === null || v === undefined) return '';
  const s = String(v).trim();
  if (!s) return '';
  // Remove common currency signs and spaces, keep digits, minus and dot
  const cleaned = s.replace(/[,\s]+/g, '').replace(/[^0-9.\-]/g, '');
  return cleaned;
};

const FileDropArea: React.FC<{onFile: (f?: File) => void, accept?: string}> = ({ onFile, accept = '.csv' }) => {
  const ref = useRef<HTMLInputElement | null>(null);
  const onDrop = (e: React.DragEvent) => {
    e.preventDefault();
    if (e.dataTransfer.files && e.dataTransfer.files.length) onFile(e.dataTransfer.files[0]);
  };
  return (
    <div>
      <input ref={ref} type="file" accept={accept} className="hidden" onChange={(e) => onFile(e.target.files?.[0])} />
      <div
        onClick={() => ref.current?.click()}
        onDrop={onDrop}
        onDragOver={(e) => e.preventDefault()}
        className="w-full border-2 border-dashed border-slate-200 rounded-lg p-6 flex flex-col items-center justify-center text-center cursor-pointer hover:border-[#7d2b3f] transition-all bg-white/50"
      >
        <div className="text-sm text-slate-500">Click or drag & drop a CSV file here</div>
        <div className="text-[11px] text-slate-400">Header row required · UTF-8</div>
      </div>
    </div>
  );
};

const SuppliersImport: React.FC<{onImported?: () => void, downloadSample?: () => void}> = ({ onImported, downloadSample }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{success:number, failed:number} | null>(null);
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const buildPayload = (row: any) => ({
    name: row['name'] || row['Name'] || row['supplier'] || row['Supplier'] || '',
    contact: row['contact'] || row['Contact'] || row['phone'] || row['Phone'] || '',
    address: row['address'] || row['Address'] || row['addr'] || '',
    bank_details: row['bank_details'] || row['bank'] || row['Bank'] || ''
  });

  const doImport = async (rows?: any[]) => {
    const toProcess = rows || preview;
    if (!toProcess.length) return emitToast('No rows to import', 'error');
    setLoading(true);
    let success = 0;
    let failed = 0;
    const failedList: any[] = [];
    for (const row of toProcess) {
      const payload = buildPayload(row);
      try {
        await vendorsAPI.create(payload);
        success += 1;
      } catch (e: any) {
        failed += 1;
        failedList.push(row);
      }
    }
    setLoading(false);
    setLastResult({ success, failed });
    setFailedRows(failedList);
    emitToast(`Imported ${success} suppliers, ${failed} failed`, failed ? 'error' : 'success');
    if (onImported) onImported();
  };

  const retryFailed = async () => {
    if (!failedRows.length) return emitToast('No failed rows to retry', 'error');
    await doImport(failedRows);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-700">Import Suppliers</h3>
        <div className="space-x-2">
          <button onClick={downloadSample} className="px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50">Download sample</button>
        </div>
      </div>
      <div className="mb-3 text-sm text-slate-600">Upload suppliers CSV to bulk create supplier records.</div>
      <FileDropArea onFile={onFile} />
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Preview ({preview.length} rows)</div>
          <div className="overflow-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {headers.map(h => <td key={h} className="p-2 border">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <button onClick={() => { if (!preview.length) return emitToast('No rows to import','error'); if (!window.confirm('Import ' + preview.length + ' suppliers?')) return; doImport(); }} disabled={loading} className="px-4 py-2 bg-[#7d2b3f] text-white rounded font-black text-sm hover:bg-[#5a1f2d]">
              {loading ? 'Importing...' : 'Import Suppliers'}
            </button>
            {lastResult && <div className="text-sm text-slate-700">Imported: {lastResult.success}, Failed: {lastResult.failed}</div>}
            {failedRows.length > 0 && <button onClick={retryFailed} disabled={loading} className="px-2 py-1 border rounded text-sm">Retry Failed ({failedRows.length})</button>}
          </div>
        </div>
      )}
    </div>
  );
};

const CustomersImport: React.FC<{onImported?: () => void, downloadSample?: () => void}> = ({ onImported, downloadSample }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{success:number, failed:number} | null>(null);
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const buildPayload = (row: any) => ({
    name: row['name'] || row['Name'] || row['customer'] || row['Customer'] || '',
    contact: row['contact'] || row['Contact'] || row['phone'] || row['Phone'] || '',
    address: row['address'] || row['Address'] || ''
  });

  const doImport = async (rows?: any[]) => {
    const toProcess = rows || preview;
    if (!toProcess.length) return emitToast('No rows to import', 'error');
    setLoading(true);
    let success = 0;
    let failed = 0;
    const failedList: any[] = [];
    for (const row of toProcess) {
      const payload = buildPayload(row);
      try {
        await customersAPI.create(payload);
        success += 1;
      } catch (e: any) {
        failed += 1;
        failedList.push(row);
      }
    }
    setLoading(false);
    setLastResult({ success, failed });
    setFailedRows(failedList);
    emitToast(`Imported ${success} customers, ${failed} failed`, failed ? 'error' : 'success');
    if (onImported) onImported();
  };

  const retryFailed = async () => {
    if (!failedRows.length) return emitToast('No failed rows to retry', 'error');
    await doImport(failedRows);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-700">Import Customers</h3>
        <div>
          <button onClick={downloadSample} className="px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50">Download sample</button>
        </div>
      </div>
      <div className="mb-3 text-sm text-slate-600">Upload customers CSV to bulk create customer records.</div>
      <FileDropArea onFile={onFile} />
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Preview ({preview.length} rows)</div>
          <div className="overflow-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {headers.map(h => <td key={h} className="p-2 border">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <button onClick={() => { if (!preview.length) return emitToast('No rows to import','error'); if (!window.confirm('Import ' + preview.length + ' customers?')) return; doImport(); }} disabled={loading} className="px-4 py-2 bg-[#7d2b3f] text-white rounded font-black text-sm hover:bg-[#5a1f2d]">
              {loading ? 'Importing...' : 'Import Customers'}
            </button>
            {lastResult && <div className="text-sm text-slate-700">Imported: {lastResult.success}, Failed: {lastResult.failed}</div>}
            {failedRows.length > 0 && <button onClick={retryFailed} disabled={loading} className="px-2 py-1 border rounded text-sm">Retry Failed ({failedRows.length})</button>}
          </div>
        </div>
      )}
    </div>
  );
};

const parseItemsCell = (cell: string) => {
  // Accept JSON array or pipe/semicolon format: "inventoryId|meters|price;inventoryId|meters|price"
  if (!cell) return [];
  try {
    const parsed = JSON.parse(cell);
    if (Array.isArray(parsed)) return parsed;
  } catch (e) {
    // fallthrough
  }

  // fallback parse
  return cell.split(';').map(part => {
    const [inventory_item, meters, price] = part.split('|').map(s => s && s.trim());
    const inv = inventory_item || '';
    const metersNum = parseFloat(normalizeNumber(meters || '0')) || 0;
    const priceNum = parseFloat(normalizeNumber(price || '0')) || 0;
    const invParsed = /^[0-9]+$/.test(inv) ? parseInt(normalizeNumber(inv)) : inv;
    return { inventory_item: invParsed, meters: metersNum, price: priceNum };
  }).filter(p => p && p.inventory_item);
};

const InvoicesImport: React.FC<{vendorsMap: Record<string,string>, customersMap: Record<string,string>, onImported?: () => void, downloadSample?: () => void}> = ({ vendorsMap, customersMap, onImported, downloadSample }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{success:number, failed:number} | null>(null);
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const buildPayload = (row: any) => {
    const custKey = (row['customer'] || row['Customer'] || row['customer_name'] || row['CustomerName'] || '').trim();
    const customerId = customersMap[custKey] || (row['customer_id'] ? String(row['customer_id']) : undefined);
    const itemsCell = row['items'] || row['Items'] || row['line_items'] || '';
    const items = parseItemsCell(itemsCell);
    return {
      invoice_number: row['invoice_number'] || row['InvoiceNumber'] || row['id'] || '',
      customer: customerId ? parseInt(normalizeNumber(customerId)) : undefined,
      date: row['date'] || '',
      due_date: row['due_date'] || row['dueDate'] || '',
      notes: row['notes'] || '',
      items: items
    };
  };

  const doImport = async (rows?: any[]) => {
    const toProcess = rows || preview;
    if (!toProcess.length) return emitToast('No rows to import', 'error');
    setLoading(true);
    let success = 0;
    let failed = 0;
    const failedList: any[] = [];
    for (const row of toProcess) {
      const payload = buildPayload(row);
      try {
        await invoicesAPI.create(payload);
        success += 1;
      } catch (e: any) {
        failed += 1;
        failedList.push(row);
      }
    }
    setLoading(false);
    setLastResult({ success, failed });
    setFailedRows(failedList);
    emitToast(`Imported ${success} invoices, ${failed} failed`, failed ? 'error' : 'success');
    if (onImported) onImported();
  };

  const retryFailed = async () => {
    if (!failedRows.length) return emitToast('No failed rows to retry', 'error');
    await doImport(failedRows);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-700">Import Invoices</h3>
        <div>
          <button onClick={downloadSample} className="px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50">Download sample</button>
        </div>
      </div>
      <div className="mb-3 text-sm text-slate-600">Upload invoices CSV. `items` may be JSON or `id|meters|price;...`</div>
      <FileDropArea onFile={onFile} />
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Preview ({preview.length} rows)</div>
          <div className="overflow-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {headers.map(h => <td key={h} className="p-2 border">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <button onClick={() => { if (!preview.length) return emitToast('No rows to import','error'); if (!window.confirm('Import ' + preview.length + ' invoices?')) return; doImport(); }} disabled={loading} className="px-4 py-2 bg-[#7d2b3f] text-white rounded font-black text-sm hover:bg-[#5a1f2d]">
              {loading ? 'Importing...' : 'Import Invoices'}
            </button>
            {lastResult && <div className="text-sm text-slate-700">Imported: {lastResult.success}, Failed: {lastResult.failed}</div>}
            {failedRows.length > 0 && <button onClick={retryFailed} disabled={loading} className="px-2 py-1 border rounded text-sm">Retry Failed ({failedRows.length})</button>}
          </div>
        </div>
      )}
    </div>
  );
};

const BillsImport: React.FC<{vendorsMap: Record<string,string>, onImported?: () => void, downloadSample?: () => void}> = ({ vendorsMap, onImported, downloadSample }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{success:number, failed:number} | null>(null);
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const buildPayload = (row: any) => {
    const vendorKey = (row['vendor'] || row['Vendor'] || row['vendor_name'] || '').trim();
    const vendorId = vendorsMap[vendorKey] || (row['vendor_id'] ? String(row['vendor_id']) : undefined);
    const itemsCell = row['items'] || row['Items'] || '';
    const items = parseItemsCell(itemsCell);
    return {
      bill_number: row['bill_number'] || row['BillNumber'] || row['id'] || '',
      vendor: vendorId ? parseInt(vendorId) : undefined,
      date: row['date'] || '',
      due_date: row['due_date'] || row['dueDate'] || '',
      notes: row['notes'] || '',
      items: items
    };
  };

  const doImport = async (rows?: any[]) => {
    const toProcess = rows || preview;
    if (!toProcess.length) return emitToast('No rows to import', 'error');
    setLoading(true);
    let success = 0;
    let failed = 0;
    const failedList: any[] = [];
    for (const row of toProcess) {
      const payload = buildPayload(row);
      try {
        await billsAPI.create(payload);
        success += 1;
      } catch (e: any) {
        failed += 1;
        failedList.push(row);
      }
    }
    setLoading(false);
    setLastResult({ success, failed });
    setFailedRows(failedList);
    emitToast(`Imported ${success} bills, ${failed} failed`, failed ? 'error' : 'success');
    if (onImported) onImported();
  };

  const retryFailed = async () => {
    if (!failedRows.length) return emitToast('No failed rows to retry', 'error');
    await doImport(failedRows);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-700">Import Bills</h3>
        <div>
          <button onClick={downloadSample} className="px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50">Download sample</button>
        </div>
      </div>
      <div className="mb-3 text-sm text-slate-600">Upload bills CSV. `items` may be JSON or `id|meters|price;...`</div>
      <FileDropArea onFile={onFile} />
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Preview ({preview.length} rows)</div>
          <div className="overflow-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {headers.map(h => <td key={h} className="p-2 border">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <button onClick={() => { if (!preview.length) return emitToast('No rows to import','error'); if (!window.confirm('Import ' + preview.length + ' bills?')) return; doImport(); }} disabled={loading} className="px-4 py-2 bg-[#7d2b3f] text-white rounded font-black text-sm hover:bg-[#5a1f2d]">
              {loading ? 'Importing...' : 'Import Bills'}
            </button>
            {lastResult && <div className="text-sm text-slate-700">Imported: {lastResult.success}, Failed: {lastResult.failed}</div>}
            {failedRows.length > 0 && <button onClick={retryFailed} disabled={loading} className="px-2 py-1 border rounded text-sm">Retry Failed ({failedRows.length})</button>}
          </div>
        </div>
      )}
    </div>
  );
};

const InventoryImport: React.FC<{vendorsMap: Record<string,string>, onImported?: () => void, downloadSample?: () => void}> = ({ vendorsMap, onImported, downloadSample }) => {
  const [preview, setPreview] = useState<any[]>([]);
  const [headers, setHeaders] = useState<string[]>([]);
  const [loading, setLoading] = useState(false);
  const [lastResult, setLastResult] = useState<{success:number, failed:number} | null>(null);
  const [failedRows, setFailedRows] = useState<any[]>([]);

  const onFile = (file?: File) => {
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (e) => {
      const text = String(e.target?.result || '');
      const { headers, rows } = parseCsv(text);
      setHeaders(headers);
      setPreview(rows);
    };
    reader.readAsText(file);
  };

  const buildPayload = (row: any) => {
    const vendorKey = (row['vendor'] || row['Vendor'] || '').trim();
    const vendorId = vendorsMap[vendorKey] || (row['vendor_id'] ? String(row['vendor_id']) : undefined);
    return {
      lot_number: row['lot_number'] || row['lot'] || row['Lot'] || '',
      fabric_type: row['fabric_type'] || row['type'] || row['FabricType'] || '',
      meters: parseFloat(normalizeNumber(row['meters'] || row['quantity'] || '0')) || 0,
      unit_price: parseFloat(normalizeNumber(row['unit_price'] || row['price'] || '0')) || 0,
      vendor: vendorId ? parseInt(normalizeNumber(vendorId)) : undefined,
      received_date: row['received_date'] || row['date'] || ''
    };
  };

  const doImport = async (rows?: any[]) => {
    const toProcess = rows || preview;
    if (!toProcess.length) return emitToast('No rows to import', 'error');
    setLoading(true);
    let success = 0;
    let failed = 0;
    const failedList: any[] = [];
    for (const row of toProcess) {
      const payload = buildPayload(row);
      try {
        await inventoryAPI.create(payload);
        success += 1;
      } catch (e: any) {
        failed += 1;
        failedList.push(row);
      }
    }
    setLoading(false);
    setLastResult({ success, failed });
    setFailedRows(failedList);
    emitToast(`Imported ${success} inventory items, ${failed} failed`, failed ? 'error' : 'success');
    if (onImported) onImported();
  };

  const retryFailed = async () => {
    if (!failedRows.length) return emitToast('No failed rows to retry', 'error');
    await doImport(failedRows);
  };

  return (
    <div className="bg-white p-6 rounded shadow-sm">
      <div className="flex items-center justify-between">
        <h3 className="text-lg font-black mb-4 uppercase tracking-wider text-slate-700">Import Inventory</h3>
        <div>
          <button onClick={downloadSample} className="px-3 py-2 border rounded text-sm text-slate-700 hover:bg-slate-50">Download sample</button>
        </div>
      </div>
      <div className="mb-3 text-sm text-slate-600">Upload inventory CSV to bulk add inventory lots.</div>
      <FileDropArea onFile={onFile} />
      {preview.length > 0 && (
        <div className="mt-4">
          <div className="mb-2 text-sm text-slate-600">Preview ({preview.length} rows)</div>
          <div className="overflow-auto max-h-48 border rounded">
            <table className="w-full text-sm">
              <thead className="bg-slate-50">
                <tr>
                  {headers.map(h => <th key={h} className="p-2 border">{h}</th>)}
                </tr>
              </thead>
              <tbody>
                {preview.map((r, i) => (
                  <tr key={i} className="odd:bg-white even:bg-slate-50">
                    {headers.map(h => <td key={h} className="p-2 border">{r[h]}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          <div className="mt-3 flex items-center space-x-3">
            <button onClick={() => { if (!preview.length) return emitToast('No rows to import','error'); if (!window.confirm('Import ' + preview.length + ' inventory rows?')) return; doImport(); }} disabled={loading} className="px-4 py-2 bg-[#7d2b3f] text-white rounded font-black text-sm hover:bg-[#5a1f2d]">
              {loading ? 'Importing...' : 'Import Inventory'}
            </button>
            {lastResult && <div className="text-sm text-slate-700">Imported: {lastResult.success}, Failed: {lastResult.failed}</div>}
            {failedRows.length > 0 && <button onClick={retryFailed} disabled={loading} className="px-2 py-1 border rounded text-sm">Retry Failed ({failedRows.length})</button>}
          </div>
        </div>
      )}
    </div>
  );
};

const Imports: React.FC = () => {
  const [key, setKey] = useState<'suppliers' | 'customers' | 'invoices' | 'bills' | 'inventory'>('suppliers');
  const [vendorsMap, setVendorsMap] = useState<Record<string,string>>({});
  const [customersMap, setCustomersMap] = useState<Record<string,string>>({});

  useEffect(() => {
    // load vendor and customer lists to map names -> ids
    let mounted = true;
    const load = async () => {
      try {
        const v = await vendorsAPI.getAll();
        const c = await customersAPI.getAll();
        if (!mounted) return;
        const vmap: Record<string,string> = {};
        (v || []).forEach((item: any) => { vmap[String(item.name).trim()] = String(item.id); });
        const cmap: Record<string,string> = {};
        (c || []).forEach((item: any) => { cmap[String(item.name).trim()] = String(item.id); });
        setVendorsMap(vmap);
        setCustomersMap(cmap);
      } catch (e) {
        // ignore
      }
    };
    load();
    return () => { mounted = false; };
  }, []);

  const generateSampleCsv = (k: string) => {
    switch (k) {
      case 'suppliers':
        return `name,contact,address,bank_details,notes\nABC Textiles,+923001234567,"123 Textile Road, Lahore","Account: 12345678, Bank: ABC","Main supplier"\n`;
      case 'customers':
        return `name,contact,email,address,notes\nMr. Ahmed,+923001112223,ahmed@example.com,"12 Commerce Ave, Lahore","Retail"\n`;
      case 'invoices':
        return `invoice_number,customer,customer_id,date,due_date,notes,items\nINV-001,Shah Fabrics,12,2026-01-05,2026-02-05,,123|10|50;124|5|25\n`;
      case 'bills':
        return `bill_number,vendor,vendor_id,date,due_date,notes,items\nBILL-001,ABC Textiles,8,2026-01-02,2026-01-30,,201|50|20;202|10|100\n`;
      case 'inventory':
        return `lot_number,fabric_type,meters,unit_price,vendor,vendor_id,received_date\nLOT-001,Cotton,100,50,ABC Textiles,8,2026-01-15\n`;
      default:
        return '';
    }
  };

  const downloadCsv = (filename: string, content: string) => {
    const blob = new Blob([content], { type: 'text/csv;charset=utf-8;' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    document.body.appendChild(a);
    a.click();
    a.remove();
    URL.revokeObjectURL(url);
  };

  const downloadSample = (k: string) => {
    const csv = generateSampleCsv(k);
    if (!csv) return emitToast('No sample available', 'error');
    downloadCsv(`${k}-sample.csv`, csv);
  };

  return (
    <div className="space-y-6">
      <div className="flex items-center space-x-3">
        <button onClick={() => setKey('suppliers')} className={`px-3 py-1 rounded ${key === 'suppliers' ? 'bg-[#7d2b3f] text-white' : 'bg-white text-slate-700'}`}>Suppliers</button>
        <button onClick={() => setKey('customers')} className={`px-3 py-1 rounded ${key === 'customers' ? 'bg-[#7d2b3f] text-white' : 'bg-white text-slate-700'}`}>Customers</button>
        <button onClick={() => setKey('invoices')} className={`px-3 py-1 rounded ${key === 'invoices' ? 'bg-[#7d2b3f] text-white' : 'bg-white text-slate-700'}`}>Invoices</button>
        <button onClick={() => setKey('bills')} className={`px-3 py-1 rounded ${key === 'bills' ? 'bg-[#7d2b3f] text-white' : 'bg-white text-slate-700'}`}>Bills</button>
        <button onClick={() => setKey('inventory')} className={`px-3 py-1 rounded ${key === 'inventory' ? 'bg-[#7d2b3f] text-white' : 'bg-white text-slate-700'}`}>Inventory</button>
        {/* <div className="ml-4">
          <button onClick={() => downloadSample(key)} className="px-3 py-1 rounded border text-sm">Download sample CSV</button>
        </div> */}
      </div>

      {key === 'suppliers' && <SuppliersImport downloadSample={() => downloadSample('suppliers')} onImported={() => emitToast('Suppliers import complete', 'success')} />}
      {key === 'customers' && <CustomersImport downloadSample={() => downloadSample('customers')} onImported={() => emitToast('Customers import complete', 'success')} />}
      {key === 'invoices' && <InvoicesImport downloadSample={() => downloadSample('invoices')} vendorsMap={vendorsMap} customersMap={customersMap} onImported={() => emitToast('Invoices import complete', 'success')} />}
      {key === 'bills' && <BillsImport downloadSample={() => downloadSample('bills')} vendorsMap={vendorsMap} onImported={() => emitToast('Bills import complete', 'success')} />}
      {key === 'inventory' && <InventoryImport downloadSample={() => downloadSample('inventory')} vendorsMap={vendorsMap} onImported={() => emitToast('Inventory import complete', 'success')} />}
    </div>
  );
};

export default Imports;
