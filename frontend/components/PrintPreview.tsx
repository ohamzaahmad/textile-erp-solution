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

  // Determine if it's a bill/purchase or invoice/sale
  const isBill = type === 'Bill' || type === 'Purchase';
  const isInvoice = type === 'Invoice' || type === 'Sale';

  // Get party information
  const party = isBill 
    ? vendors?.find(v => v.id === (doc as Bill).vendorId)
    : customers?.find(c => c.id === (doc as Invoice).customerId);

  return (
    <div className="fixed inset-0 bg-black/70 z-70 flex items-center justify-center p-4 backdrop-blur-md animate-in fade-in duration-300">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-4xl max-h-[90vh] overflow-hidden animate-in fade-in zoom-in duration-200">
        {/* Header - Hidden on print */}
        <div className="bg-[#7d2b3f] p-5 text-white font-black text-sm flex justify-between items-center print:hidden">
          <span className="uppercase tracking-widest">Print Preview - {type} #{doc.id}</span>
          <div className="flex space-x-3">
            <button onClick={handlePrint} className="px-4 py-2 bg-white text-[#7d2b3f] rounded font-black text-xs uppercase hover:bg-gray-100">
              <i className="fas fa-print mr-2"></i>Print
            </button>
            <button onClick={onClose} className="hover:text-red-200">
              <i className="fas fa-times"></i>
            </button>
          </div>
        </div>

        {/* Printable Content */}
        <div className="p-12 overflow-auto max-h-[calc(90vh-60px)]" id="printable-area">
          {/* Document Header */}
          <div className="mb-8 pb-6 border-b-2 border-[#7d2b3f]">
            <div className="flex justify-between items-start">
              <div>
                <h1 className="text-4xl font-black text-[#7d2b3f] uppercase tracking-tight mb-2">
                  {isBill ? 'PURCHASE ORDER' : 'SALES INVOICE'}
                </h1>
                <p className="text-sm font-bold text-slate-600">HA FABRICS ERP SYSTEM</p>
                <p className="text-xs text-slate-500 mt-1">Textile Trading Solutions</p>
              </div>
              <div className="text-right">
                <div className="bg-slate-100 p-4 rounded-lg">
                  <p className="text-xs text-slate-500 uppercase font-black mb-1">Document Number</p>
                  <p className="text-2xl font-black text-[#7d2b3f]">{doc.id}</p>
                  <p className="text-xs text-slate-600 mt-2">
                    <span className="font-bold">Date:</span> {doc.date ? new Date(doc.date).toLocaleDateString() : ''}
                  </p>
                  {doc.dueDate && (
                    <p className="text-xs text-slate-600">
                      <span className="font-bold">Due:</span> {new Date(doc.dueDate).toLocaleDateString()}
                    </p>
                  )}
                </div>
              </div>
            </div>
          </div>

          {/* Party Information */}
          <div className="mb-8 grid grid-cols-2 gap-8">
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">
                {isBill ? 'SUPPLIER' : 'CUSTOMER'}
              </h3>
              <div className="bg-slate-50 p-4 rounded-lg">
                <p className="text-lg font-black text-slate-800 mb-2">{party?.name || 'N/A'}</p>
                <p className="text-sm text-slate-600"><i className="fas fa-phone mr-2"></i>{party?.contact || 'No contact'}</p>
                <p className="text-sm text-slate-600"><i className="fas fa-map-marker-alt mr-2"></i>{party?.address || 'No address'}</p>
              </div>
            </div>
            <div>
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">PAYMENT INFO</h3>
              <div className="bg-slate-50 p-4 rounded-lg space-y-2">
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Status:</span>
                  <span className={`font-black ${doc.status === 'Paid' ? 'text-green-600' : 'text-red-600'}`}>
                    {doc.status}
                  </span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Amount Paid:</span>
                  <span className="font-bold">PKR {doc.amountPaid.toLocaleString()}</span>
                </div>
                <div className="flex justify-between text-sm">
                  <span className="text-slate-600">Balance Due:</span>
                  <span className="font-black text-red-600">PKR {(doc.total - doc.amountPaid).toLocaleString()}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Items Table */}
          <div className="mb-8">
            <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">ITEMS</h3>
            <table className="w-full border-collapse">
              <thead>
                <tr className="bg-[#7d2b3f] text-white">
                  <th className="p-3 text-left text-xs font-black uppercase">Description</th>
                  <th className="p-3 text-right text-xs font-black uppercase">Quantity</th>
                  <th className="p-3 text-right text-xs font-black uppercase">Rate</th>
                  <th className="p-3 text-right text-xs font-black uppercase">Amount</th>
                </tr>
              </thead>
              <tbody>
                {doc.items.map((item, index) => {
                  const invItem = inventory?.find(i => i.id === item.itemId);
                  return (
                    <tr key={index} className="border-b border-slate-200">
                      <td className="p-3 text-sm">
                        {invItem?.type || `Item ${item.itemId}`}
                        {invItem?.lotNumber && (
                          <span className="ml-2 text-xs text-slate-500">Lot: {invItem.lotNumber}</span>
                        )}
                      </td>
                      <td className="p-3 text-right text-sm font-mono">{item.meters.toFixed(2)} m</td>
                      <td className="p-3 text-right text-sm font-mono">PKR {item.price.toLocaleString()}</td>
                      <td className="p-3 text-right text-sm font-bold">PKR {(item.meters * item.price).toLocaleString()}</td>
                    </tr>
                  );
                })}
              </tbody>
              <tfoot>
                <tr className="bg-slate-100">
                  <td colSpan={3} className="p-4 text-right font-black text-slate-700 uppercase">Total:</td>
                  <td className="p-4 text-right text-xl font-black text-[#7d2b3f]">PKR {doc.total.toLocaleString()}</td>
                </tr>
              </tfoot>
            </table>
          </div>

          {/* Payment History */}
          {doc.paymentHistory && doc.paymentHistory.length > 0 && (
            <div className="mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-3">PAYMENT HISTORY</h3>
              <table className="w-full border-collapse">
                <thead>
                  <tr className="bg-slate-100">
                    <th className="p-2 text-left text-xs font-black uppercase">Date</th>
                    <th className="p-2 text-left text-xs font-black uppercase">Method</th>
                    <th className="p-2 text-left text-xs font-black uppercase">Reference</th>
                    <th className="p-2 text-right text-xs font-black uppercase">Amount</th>
                  </tr>
                </thead>
                <tbody>
                  {doc.paymentHistory.map((payment, index) => (
                    <tr key={index} className="border-b border-slate-100">
                      <td className="p-2 text-xs">{payment.date ? new Date(payment.date).toLocaleDateString() : ''}</td>
                      <td className="p-2 text-xs">{payment.method} {payment.bankName && `(${payment.bankName})`}</td>
                      <td className="p-2 text-xs font-mono">{payment.tid || 'N/A'}</td>
                      <td className="p-2 text-right text-xs font-bold">PKR {payment.amount.toLocaleString()}</td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          )}

          {/* Notes */}
          {doc.notes && (
            <div className="mb-8">
              <h3 className="text-xs font-black text-slate-400 uppercase tracking-widest mb-2">NOTES</h3>
              <p className="text-sm text-slate-600 bg-slate-50 p-4 rounded">{doc.notes}</p>
            </div>
          )}

          {/* Footer */}
          <div className="mt-12 pt-8 border-t border-slate-200 text-center text-xs text-slate-400">
            <p>This is a computer-generated document. No signature required.</p>
            <p className="mt-1">HA FABRICS ERP SYSTEM - Printed on {new Date().toLocaleString()}</p>
          </div>
        </div>
      </div>

      {/* Print-specific styles */}
      <style jsx>{`
        @media print {
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
