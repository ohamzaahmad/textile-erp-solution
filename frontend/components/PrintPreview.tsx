import React from 'react';
import { Invoice, Bill, Customer, Vendor, InventoryItem } from '../types';

interface PrintPreviewProps {
  doc: Invoice | Bill;
  type: 'Invoice' | 'Bill' | 'Purchase' | 'Sale';
  customers?: Customer[];
  vendors?: Vendor[];
  inventory?: InventoryItem[];
  onClose: () => void;
}

const PrintPreview: React.FC<PrintPreviewProps> = ({ doc, type, customers, vendors, inventory, onClose }) => {
  const handlePrint = () => {
    window.print();
  };

  const isBill = type === 'Bill' || type === 'Purchase';

  const party = isBill 
    ? vendors?.find(v => v.id === (doc as Bill).vendorId)
    : customers?.find(c => c.id === (doc as Invoice).customerId);

  return (
    <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-2 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-lg shadow-2xl overflow-hidden animate-in fade-in zoom-in duration-200" style={{ width: '560px', maxHeight: '90vh' }}>
        {/* Header - Hidden on print */}
        <div className="bg-[#7d2b3f] px-4 py-2.5 text-white font-black text-xs flex justify-between items-center print:hidden">
          <span className="uppercase tracking-widest">Preview - {type} #{doc.id}</span>
          <div className="flex space-x-2">
            <button onClick={handlePrint} className="px-3 py-1.5 bg-white text-[#7d2b3f] rounded font-black text-[10px] uppercase hover:bg-gray-100">
              <i className="fas fa-print mr-1"></i>Print
            </button>
            <button onClick={onClose} className="hover:text-red-200">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Printable Content — A5 optimized */}
        <div className="px-6 py-4 overflow-auto max-h-[calc(90vh-44px)]" id="printable-area">

          {/* Document Header */}
          <div className="mb-3 pb-2 border-b-2 border-[#7d2b3f]">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-xl font-black text-[#7d2b3f] uppercase tracking-tight leading-tight">
                  {isBill ? 'PURCHASE ORDER' : 'SALES INVOICE'}
                </h1>
                <p className="text-[10px] font-bold text-slate-600">HA FABRICS</p>
              </div>
              <div className="text-right">
                <p className="text-lg font-black text-[#7d2b3f] leading-tight">#{doc.id}</p>
                <p className="text-[10px] text-slate-600">
                  <span className="font-bold">Date:</span> {doc.date ? new Date(doc.date).toLocaleDateString() : ''}
                </p>
                {doc.dueDate && (
                  <p className="text-[10px] text-slate-600">
                    <span className="font-bold">Due:</span> {new Date(doc.dueDate).toLocaleDateString()}
                  </p>
                )}
              </div>
            </div>
          </div>

          {/* Party + Payment Info — side by side compact */}
          <div className="mb-3 grid grid-cols-2 gap-3">
            <div className="border border-slate-200 rounded p-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">
                {isBill ? 'SUPPLIER' : 'CUSTOMER'}
              </p>
              <p className="text-xs font-black text-slate-800 leading-tight">{party?.name || 'N/A'}</p>
              <p className="text-[10px] text-slate-500 leading-tight">{party?.contact || ''}</p>
              {party?.address && <p className="text-[10px] text-slate-500 leading-tight">{party.address}</p>}
            </div>
            <div className="border border-slate-200 rounded p-2">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PAYMENT</p>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Status:</span>
                <span className={`font-black ${doc.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>{doc.status}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Paid:</span>
                <span className="font-bold">PKR {doc.amountPaid.toLocaleString()}</span>
              </div>
              <div className="flex justify-between text-[10px]">
                <span className="text-slate-500">Balance:</span>
                <span className="font-black text-red-600">PKR {(doc.total - doc.amountPaid).toLocaleString()}</span>
              </div>
            </div>
          </div>

          {/* Items Table — compact */}
          <div className="mb-3">
            <table className="w-full border-collapse text-[10px]">
              <thead>
                <tr className="bg-[#7d2b3f] text-white">
                  <th className="px-2 py-1.5 text-left font-black uppercase">#</th>
                  <th className="px-2 py-1.5 text-left font-black uppercase">Description</th>
                  <th className="px-2 py-1.5 text-right font-black uppercase">Qty (m)</th>
                  <th className="px-2 py-1.5 text-right font-black uppercase">Rate</th>
                  <th className="px-2 py-1.5 text-right font-black uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item, index) => {
                  const invItem = inventory?.find(i => i.id === item.itemId);
                  return (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="px-2 py-1 text-slate-400">{index + 1}</td>
                      <td className="px-2 py-1">
                        <span className="font-bold text-slate-700">{invItem?.type || `Item ${item.itemId}`}</span>
                        {invItem?.lotNumber && (
                          <span className="ml-1 text-[9px] text-slate-400">({invItem.lotNumber})</span>
                        )}
                      </td>
                      <td className="px-2 py-1 text-right font-mono">{item.meters.toFixed(2)}</td>
                      <td className="px-2 py-1 text-right font-mono">{item.price.toLocaleString()}</td>
                      <td className="px-2 py-1 text-right font-bold">{(item.meters * item.price).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-50 border-t-2 border-[#7d2b3f]">
                  <td colSpan={4} className="px-2 py-1.5 text-right font-black text-slate-700 uppercase">Total:</td>
                  <td className="px-2 py-1.5 text-right text-sm font-black text-[#7d2b3f]">PKR {doc.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment History — compact */}
          {doc.paymentHistory && doc.paymentHistory.length > 0 && (
            <div className="mb-3">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-1">PAYMENT HISTORY</p>
              <table className="w-full border-collapse text-[9px]">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="px-2 py-1 text-left font-black uppercase">Date</th>
                    <th className="px-2 py-1 text-left font-black uppercase">Method</th>
                    <th className="px-2 py-1 text-left font-black uppercase">Ref</th>
                    <th className="px-2 py-1 text-right font-black uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.paymentHistory.map((payment, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="px-2 py-0.5">{payment.date ? new Date(payment.date).toLocaleDateString() : ''}</td>
                      <td className="px-2 py-0.5">{payment.method}{payment.bankName ? ` (${payment.bankName})` : ''}</td>
                      <td className="px-2 py-0.5 font-mono">{payment.tid || '-'}</td>
                      <td className="px-2 py-0.5 text-right font-bold">PKR {payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {doc.notes && (
            <div className="mb-3">
              <p className="text-[8px] font-black text-slate-400 uppercase tracking-widest mb-0.5">NOTES</p>
              <p className="text-[10px] text-slate-600 border border-slate-200 rounded p-1.5">{doc.notes}</p>
            </div>
          )}

          {/* Signature Area */}
          <div className="mt-4 pt-3 border-t border-slate-300 grid grid-cols-2 gap-8">
            <div className="text-center">
              <div className="border-b border-slate-300 mb-1 h-8"></div>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Authorized Signature</p>
            </div>
            <div className="text-center">
              <div className="border-b border-slate-300 mb-1 h-8"></div>
              <p className="text-[8px] font-bold text-slate-400 uppercase">Received By</p>
            </div>
          </div>

          {/* Footer */}
          <div className="mt-3 pt-2 border-t border-slate-200 text-center text-[8px] text-slate-400">
            <p>Computer-generated document — HA FABRICS ERP</p>
            <p>Printed: {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Print-specific styles — A5 page */}
      <style>{`
        @media print {
          @page {
            size: A5 portrait;
            margin: 8mm;
          }
          html, body {
            width: 148mm;
            height: 210mm;
          }
          body * {
            visibility: hidden;
          }
          #printable-area,
          #printable-area * {
            visibility: visible;
          }
          #printable-area {
            position: absolute;
            left: 0;
            top: 0;
            width: 100%;
            padding: 0 !important;
            font-size: 9px !important;
          }
          #printable-area table {
            page-break-inside: auto;
          }
          #printable-area tr {
            page-break-inside: avoid;
          }
          .print\\:hidden {
            display: none !important;
          }
        }
      `}</style>
    </div>
  );
};

export default PrintPreview;
