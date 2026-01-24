
import React from 'react';

const GuideCenter: React.FC = () => {
  return (
    <div className="max-w-5xl mx-auto space-y-12 pb-24 animate-in fade-in duration-500">
      <div className="text-center space-y-4">
        <h1 className="text-5xl font-black text-slate-800 tracking-tighter uppercase">System Blueprint</h1>
        <p className="text-slate-500 font-medium max-w-2xl mx-auto">Complete guide to workflow logic, entity relationships, and technical backend architecture for HA FABRICS ERP.</p>
      </div>

      {/* 1. Overall Workflow */}
      <section className="bg-white rounded-3xl shadow-xl border border-slate-200 overflow-hidden">
        <div className="bg-[#7d2b3f] p-8 text-white">
          <h2 className="text-2xl font-black uppercase tracking-widest flex items-center">
            <i className="fas fa-project-diagram mr-4"></i> Core Operational Workflow
          </h2>
        </div>
        <div className="p-12 space-y-8">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full font-black">1</div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Inventory Inflow</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Vendors deliver fabrics in <strong>Lots</strong>. Users "Receive Stock" to log physical meters. This creates a <strong>Pending Receipt</strong> that doesn't yet affect financial accounts.</p>
            </div>
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full font-black">2</div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Financial Recognition</h3>
              <p className="text-xs text-slate-500 leading-relaxed">Creating a <strong>Bill</strong> against a received Lot converts physical stock into a financial liability. Vendor balances are updated (Decreased/Negative Balance represents money we owe).</p>
            </div>
            <div className="space-y-4 p-6 bg-slate-50 rounded-2xl border border-slate-100">
              <div className="w-10 h-10 bg-blue-600 text-white flex items-center justify-center rounded-full font-black">3</div>
              <h3 className="font-black text-slate-800 uppercase text-xs tracking-widest">Sales & Outflow</h3>
              <p className="text-xs text-slate-500 leading-relaxed"><strong>Invoices</strong> are created for Customers. This reduces stock meters in real-time and increases Customer <strong>Receivables</strong>. Lot numbers are hidden on client invoices for privacy.</p>
            </div>
          </div>
          <div className="bg-blue-50 border border-blue-100 p-6 rounded-2xl">
            <h4 className="text-[10px] font-black text-blue-800 uppercase tracking-widest mb-2">Settlement Logic</h4>
            <p className="text-xs text-blue-700 leading-relaxed">Every Bill and Invoice tracks its own <strong>Payment History</strong>. A document is only marked "Paid" when the total sum of payments matches the document total. Partial payments keep the document in "Partially Paid" status.</p>
          </div>
        </div>
      </section>

      {/* 2. Backend Design */}
      <section className="bg-slate-900 rounded-3xl shadow-2xl border border-slate-800 overflow-hidden text-white">
        <div className="bg-slate-800 p-8">
          <h2 className="text-2xl font-black uppercase tracking-widest flex items-center">
            <i className="fas fa-server mr-4 text-blue-400"></i> Django Backend Architecture
          </h2>
        </div>
        <div className="p-12 space-y-12">
          {/* Models */}
          <div>
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[3px] mb-6">Database Schema (Models)</h3>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 font-mono text-[11px] leading-relaxed">
                <p className="text-blue-300 font-bold mb-2"># User Profile</p>
                <p>class ERPUser(AbstractUser):</p>
                <p className="pl-4">ROLE_CHOICES = [('manager', 'Manager'), ('cashier', 'Cashier')]</p>
                <p className="pl-4">role = models.CharField(choices=ROLE_CHOICES)</p>
                <p className="pl-4">full_name = models.CharField(max_length=100)</p>
              </div>
              <div className="bg-slate-800/50 p-6 rounded-xl border border-slate-700 font-mono text-[11px] leading-relaxed">
                <p className="text-blue-300 font-bold mb-2"># Inventory Management</p>
                <p>class InventoryItem(models.Model):</p>
                <p className="pl-4">lot_number = models.CharField(index=True)</p>
                <p className="pl-4">meters = models.DecimalField(max_digits=12, decimal_places=2)</p>
                <p className="pl-4">vendor = models.ForeignKey(Vendor, on_delete=models.CASCADE)</p>
                <p className="pl-4">is_billed = models.BooleanField(default=False)</p>
              </div>
            </div>
          </div>

          {/* Endpoints */}
          <div>
            <h3 className="text-blue-400 text-[10px] font-black uppercase tracking-[3px] mb-6">REST API Endpoints</h3>
            <table className="w-full text-left text-xs">
              <thead className="text-slate-500 border-b border-slate-700">
                <tr className="uppercase font-black tracking-widest">
                  <th className="pb-4">Endpoint</th>
                  <th className="pb-4">Method</th>
                  <th className="pb-4">Action</th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-800">
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/auth/login/</td><td className="py-3">POST</td><td className="py-3 opacity-60">JWT Token Generation & Role Return</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/vendors/</td><td className="py-3">GET/POST</td><td className="py-3 opacity-60">Vendor list and creation</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/inventory/lots/</td><td className="py-3">POST</td><td className="py-3 opacity-60">Bulk create Inventory items (Receive Lot)</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/bills/</td><td className="py-3">POST</td><td className="py-3 opacity-60">Create Bill, Update Inventory.is_billed=True</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/invoices/</td><td className="py-3">POST</td><td className="py-3 opacity-60">Create Invoice, Deduct Inventory meters</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/payments/settle/</td><td className="py-3">POST</td><td className="py-3 opacity-60">Generic handler for partial settlements</td></tr>
                <tr><td className="py-3 font-mono text-blue-300">/api/v1/reports/summary/</td><td className="py-3">GET</td><td className="py-3 opacity-60">Dashboard totals (Aggregated)</td></tr>
              </tbody>
            </table>
          </div>
        </div>
      </section>

      {/* 3. Tech Roadmap */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">Django Transaction Safety</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              When creating an invoice, use <code>transaction.atomic()</code>. 
              You must simultaneously create the Invoice object, create the Payment record (if any), 
              deduct inventory meters, and update the Customer's ledger balance. 
              If any step fails, the database must roll back to prevent stock inconsistencies.
            </p>
         </div>
         <div className="bg-white p-8 rounded-3xl border border-slate-200 shadow-sm space-y-4">
            <h4 className="font-black text-slate-800 uppercase text-xs tracking-widest">DRF Serializer Logic</h4>
            <p className="text-xs text-slate-500 leading-relaxed">
              Use <code>serializers.SerializerMethodField</code> to calculate "Amount Due" dynamically 
              on the backend rather than storing it in a column. This ensures that the balance 
              always reflects the current sum of the transaction history.
            </p>
         </div>
      </div>
    </div>
  );
};

export default GuideCenter;
