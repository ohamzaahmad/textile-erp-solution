
import React, { useState, useEffect } from 'react';
import { Page, Vendor, Customer, InventoryItem, Invoice, Bill, PaymentRecord, Transaction, User, Expense } from './types';
import { vendorsAPI, customersAPI, inventoryAPI, invoicesAPI, billsAPI, authAPI, TokenManager, emitToast } from './api';
import Sidebar from './components/Sidebar';
import FlowchartDashboard from './components/FlowchartDashboard';
import VendorCenter from './components/VendorCenter';
import CustomerCenter from './components/CustomerCenter';
import InventoryCenter from './components/InventoryCenter';
import InvoiceBillCenter from './components/InvoiceBillCenter';
import ReportsCenter from './components/ReportsCenter';
import DepositsCenter from './components/DepositsCenter';
import ItemMasterCenter from './components/ItemMasterCenter';
import ExpensesCenter from './components/ExpensesCenter';
import AuthPage from './components/AuthPage';
import Toast from './components/Toast';
import Imports from './components/Imports';

const App: React.FC = () => {
  const [currentUser, setCurrentUser] = useState<User | null>(null);
  const [currentPage, setCurrentPage] = useState<Page>(() => {
    try {
      const hash = window?.location?.hash?.replace(/^#/, '') || '';
      return (hash as Page) || 'home';
    } catch (e) {
      return 'home';
    }
  });
  const [vendors, setVendors] = useState<Vendor[]>([]);
  const [customers, setCustomers] = useState<Customer[]>([]);
  const [inventory, setInventory] = useState<InventoryItem[]>([]);
  const [invoices, setInvoices] = useState<Invoice[]>([]);
  const [bills, setBills] = useState<Bill[]>([]);
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isLoading, setIsLoading] = useState(false);
  const [sidebarOpen, setSidebarOpen] = useState<boolean>(false);
  
  const [pendingBillLot, setPendingBillLot] = useState<InventoryItem[] | null>(null);
  const [selectedVendorId, setSelectedVendorId] = useState<string | null>(null);
  const [selectedCustomerId, setSelectedCustomerId] = useState<string | null>(null);

  // Load data from backend when user logs in
  useEffect(() => {
    if (currentUser) {
      loadAllData();
    }
  }, [currentUser]);

  // Restore session on initial mount if tokens exist
  useEffect(() => {
    const tryRestore = async () => {
      const token = TokenManager.getAccessToken();
      if (!token) return;
      try {
        const userData = await authAPI.getCurrentUser();
        const user: User = {
          username: userData.username,
          role: userData.role as any,
          name: userData.name,
        };
        setCurrentUser(user);
      } catch (err) {
        console.error('Session restore failed:', err);
        TokenManager.clearTokens();
      }
    };
    tryRestore();
  }, []);

  const loadAllData = async () => {
    setIsLoading(true);
    try {
      const [vendorsData, customersData, inventoryData, invoicesData, billsData] = await Promise.all([
        vendorsAPI.getAll(),
        customersAPI.getAll(),
        inventoryAPI.getAll(),
        invoicesAPI.getAll(),
        billsAPI.getAll(),
      ]);

      console.log('Loaded data:', { vendorsData, customersData, inventoryData, invoicesData, billsData });

      // Map backend data to frontend format
      const mappedVendors = Array.isArray(vendorsData) ? vendorsData.map(mapVendor) : [];
      const mappedCustomers = Array.isArray(customersData) ? customersData.map(mapCustomer) : [];
      
      // Load transaction logs for each vendor and customer
      const vendorsWithLogs = await Promise.all(
        mappedVendors.map(async (vendor) => {
          try {
            const transactions = await vendorsAPI.getTransactions(vendor.id);
            return { ...vendor, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return vendor;
          }
        })
      );
      
      const customersWithLogs = await Promise.all(
        mappedCustomers.map(async (customer) => {
          try {
            const transactions = await customersAPI.getTransactions(customer.id);
            return { ...customer, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return customer;
          }
        })
      );
      
      setVendors(vendorsWithLogs);
      setCustomers(customersWithLogs);
      setInventory(Array.isArray(inventoryData) ? inventoryData.map(mapInventoryItem) : []);
      setInvoices(Array.isArray(invoicesData) ? invoicesData.map(mapInvoice) : []);
      setBills(Array.isArray(billsData) ? billsData.map(mapBill) : []);
    } catch (error) {
      console.error('Error loading data:', error);
      alert('Failed to load data from server. Please refresh the page.');
    } finally {
      setIsLoading(false);
    }
  };

  // Mapping functions to convert backend format to frontend format
  const mapVendor = (data: any): Vendor => ({
    id: String(data.id),
    name: data.name || '',
    contact: data.contact || '',
    address: data.address || '',
    bankDetails: data.bank_details || '',
    balance: parseFloat(data.balance) || 0,
    logs: [] // Will be loaded separately if needed
  });

  const mapCustomer = (data: any): Customer => ({
    id: String(data.id),
    name: data.name || '',
    contact: data.contact || '',
    address: data.address || '',
    shortDescription: data.short_description || '',
    balance: parseFloat(data.balance) || 0,
    logs: [] // Will be loaded separately if needed
  });

  const mapInventoryItem = (data: any): InventoryItem => ({
    id: String(data.id),
    lotNumber: data.lot_number || '',
    type: data.fabric_type || '',
    meters: parseFloat(data.meters) || 0,
    unitPrice: parseFloat(data.unit_price) || 0,
    vendorId: String(data.vendor),
    receivedDate: data.received_date || new Date().toISOString().slice(0, 10),
    isBilled: data.is_billed || false
  });

  const mapInvoice = (data: any): Invoice => ({
    id: String(data.id),
    customerId: String(data.customer),
    date: data.date || '',
    dueDate: data.due_date || '',
    items: data.items?.map((item: any) => ({
      itemId: String(item.inventory_item),
      meters: parseFloat(item.meters) || 0,
      price: parseFloat(item.price) || 0
    })) || [],
    status: (data.status as Invoice['status']) || 'Pending',
    total: parseFloat(data.total) || 0,
    amountPaid: parseFloat(data.amount_paid) || 0,
    paymentHistory: data.payment_records?.map((pr: any) => ({
      id: String(pr.id),
      date: pr.date || '',
      amount: parseFloat(pr.amount) || 0,
      method: pr.method || 'Cash',
      bankName: pr.bank_name || '',
      tid: pr.tid || ''
    })) || []
  });

  const mapBill = (data: any): Bill => ({
    id: String(data.id),
    vendorId: String(data.vendor),
    date: data.date || '',
    dueDate: data.due_date || '',
    items: data.items?.map((item: any) => ({
      itemId: String(item.inventory_item),
      meters: parseFloat(item.meters) || 0,
      price: parseFloat(item.price) || 0
    })) || [],
    status: (data.status as Bill['status']) || 'Unpaid',
    total: parseFloat(data.total) || 0,
    amountPaid: parseFloat(data.amount_paid) || 0,
    paymentHistory: data.payment_records?.map((pr: any) => ({
      id: String(pr.id),
      date: pr.date || '',
      amount: parseFloat(pr.amount) || 0,
      method: pr.method || 'Cash',
      bankName: pr.bank_name || '',
      tid: pr.tid || ''
    })) || []
  });

  const mapTransaction = (data: any): Transaction => ({
    id: String(data.id),
    date: data.date || '',
    type: data.transaction_type as Transaction['type'],
    amount: parseFloat(data.amount) || 0,
    description: data.description || '',
    referenceId: data.reference_id || ''
  });

  // Redirection Logic for Cashier
  useEffect(() => {
    // Only redirect cashiers to invoices when they have no explicit page selected
    if (currentUser?.role === 'cashier') {
      if (currentPage === 'home' || !currentPage) {
        setCurrentPage('invoices');
      }
    }
  }, [currentUser, currentPage]);

  // Persist current page in the URL hash so refresh preserves the route
  useEffect(() => {
    try {
      if (typeof window !== 'undefined') {
        window.location.hash = `#${currentPage}`;
      }
    } catch (e) {}
  }, [currentPage]);

  // Allow lightweight data refresh without reloading the entire app.
  // Dispatch `window.dispatchEvent(new Event('app-refresh-data'))` to trigger.
  useEffect(() => {
    const handler = async (e?: Event) => {
      // Only reload data if user is signed in
      if (!currentUser) return;
      try {
        emitToast('Refreshing data...', 'info');
        await loadAllData();
        emitToast('Data refreshed', 'success');
      } catch (err) {
        console.error('Soft refresh failed:', err);
        emitToast('Failed to refresh data', 'error');
      }
    };
    window.addEventListener('app-refresh-data', handler as EventListener);
    return () => window.removeEventListener('app-refresh-data', handler as EventListener);
  // intentionally depends on currentUser and loadAllData
  }, [currentUser]);

  // Intercept F5 and Ctrl/Cmd+R to perform a soft refresh (reload data only)
  useEffect(() => {
    const onKeyDown = (e: KeyboardEvent) => {
      // Ignore when focus is on editable elements
      const tag = (e.target as HTMLElement)?.tagName;
      const isEditable = tag === 'INPUT' || tag === 'TEXTAREA' || (e.target as HTMLElement)?.isContentEditable;
      if (isEditable) return;

      const isCtrlR = (e.key === 'r' || e.key === 'R') && (e.ctrlKey || e.metaKey);
      const isF5 = e.key === 'F5';
      if (isF5 || isCtrlR) {
        e.preventDefault();
        // dispatch the same event used by the Refresh button
        window.dispatchEvent(new Event('app-refresh-data'));
      }
    };

    window.addEventListener('keydown', onKeyDown as EventListener);
    return () => window.removeEventListener('keydown', onKeyDown as EventListener);
  }, [currentUser]);

  const handleLogin = (user: User) => {
    setCurrentUser(user);
    if (user.role === 'cashier') {
      setCurrentPage('invoices');
    } else {
      setCurrentPage('home');
    }
  };

  const handleLogout = () => {
    try {
      authAPI.logout();
    } catch (e) {
      console.error('Logout error', e);
    }
    setCurrentUser(null);
    setVendors([]);
    setCustomers([]);
    setInventory([]);
    setInvoices([]);
    setBills([]);
  };

  const handleReceiveStock = async (items: InventoryItem | InventoryItem[]) => {
    const itemsToAdd = Array.isArray(items) ? items : [items];
    
    try {
      // Create inventory items in backend
      for (const item of itemsToAdd) {
        const backendData = {
          lot_number: item.lotNumber,
          fabric_type: item.type,
          meters: parseFloat(String(item.meters)),
          unit_price: parseFloat(String(item.unitPrice)),
          vendor: parseInt(item.vendorId),
          received_date: item.receivedDate,
        };
        console.log('Creating inventory item:', backendData);
        await inventoryAPI.create(backendData);
      }
      
      // Reload inventory from backend
      const inventoryData = await inventoryAPI.getAll();
      setInventory(Array.isArray(inventoryData) ? inventoryData.map(mapInventoryItem) : []);
    } catch (error: any) {
      console.error('Error adding inventory:', error);
      alert(`Failed to add inventory items: ${error.message}`);
    }
  };

  const handleInitiateBill = (lotItems: InventoryItem[]) => {
    setPendingBillLot(lotItems);
    setCurrentPage('bills');
  };

  const handleAddVendor = async (vendor: Vendor) => {
    try {
      const backendData = {
        name: vendor.name,
        contact: vendor.contact,
        address: vendor.address,
        bank_details: vendor.bankDetails,
      };
      const newVendor = await vendorsAPI.create(backendData);
      const mappedVendor = mapVendor(newVendor);
      setVendors(prev => [...prev, mappedVendor]);
      return mappedVendor; // Return the mapped vendor with correct ID
    } catch (error) {
      console.error('Error adding vendor:', error);
      alert('Failed to add vendor. Please try again.');
      return null;
    }
  };

  const handleUpdateVendor = async (vendor: Vendor) => {
    try {
      const backendData = {
        name: vendor.name,
        contact: vendor.contact,
        address: vendor.address,
        bank_details: vendor.bankDetails,
      };
      const updated = await vendorsAPI.update(String(vendor.id), backendData);
      const mapped = mapVendor(updated);
      setVendors(prev => prev.map(v => v.id === mapped.id ? mapped : v));
      return mapped;
    } catch (error) {
      console.error('Error updating vendor:', error);
      alert('Failed to update vendor.');
      return null;
    }
  };

  const handleAddCustomer = async (customer: Customer) => {
    try {
      const backendData = {
        name: customer.name,
        contact: customer.contact,
        address: customer.address,
      };
      const newCustomer = await customersAPI.create(backendData);
      const mappedCustomer = mapCustomer(newCustomer);
      setCustomers(prev => [...prev, mappedCustomer]);
      return mappedCustomer; // Return the mapped customer with correct ID
    } catch (error) {
      console.error('Error adding customer:', error);
      alert('Failed to add customer. Please try again.');
    }
  };

  const handleUpdateCustomer = async (customer: Customer) => {
    try {
      const backendData = {
        name: customer.name,
        contact: customer.contact,
        address: customer.address,
      };
      const updated = await customersAPI.update(String(customer.id), backendData);
      const mapped = mapCustomer(updated);
      setCustomers(prev => prev.map(c => c.id === mapped.id ? mapped : c));
      return mapped;
    } catch (error) {
      console.error('Error updating customer:', error);
      alert('Failed to update customer.');
      return null;
    }
  };

  const handleAddBill = async (billData: any) => {
    try {
      const backendData = {
        bill_number: billData.id,
        vendor: parseInt(billData.vendorId),
        date: billData.date,
        due_date: billData.dueDate,
        notes: billData.notes || '',
        items: billData.items.map((item: any) => ({
          inventory_item: parseInt(item.itemId),
          meters: item.meters,
          price: item.price
        }))
      };
      
      console.log('Creating bill with data:', backendData);
      const newBill = await billsAPI.create(backendData);
      console.log('Bill created, response:', newBill);
      
      // If there's an initial payment, add it
      if (billData.initialPayment && newBill && newBill.id) {
        console.log('Adding initial payment to bill:', newBill.id);
        await billsAPI.addPayment(String(newBill.id), {
          date: billData.initialPayment.date,
          amount: billData.initialPayment.amount,
          method: billData.initialPayment.method,
          bank_name: billData.initialPayment.bankName,
          tid: billData.initialPayment.tid
        });
      }
      
      // Reload bills, inventory, and vendors with transaction logs
      const [billsData, inventoryData, vendorsData] = await Promise.all([
        billsAPI.getAll(),
        inventoryAPI.getAll(),
        vendorsAPI.getAll()
      ]);
      
      const mappedVendors = vendorsData.map(mapVendor);
      const vendorsWithLogs = await Promise.all(
        mappedVendors.map(async (vendor: Vendor) => {
          try {
            const transactions = await vendorsAPI.getTransactions(vendor.id);
            return { ...vendor, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return vendor;
          }
        })
      );
      
      setBills(billsData.map(mapBill));
      setInventory(inventoryData.map(mapInventoryItem));
      setVendors(vendorsWithLogs);
      
      setPendingBillLot(null);
    } catch (error) {
      console.error('Error creating bill:', error);
      alert('Failed to create bill. Please try again.');
    }
  };

  const handlePayBill = async (billId: string, payment: PaymentRecord) => {
    try {
      await billsAPI.addPayment(billId, {
        date: payment.date,
        amount: payment.amount,
        method: payment.method,
        bank_name: payment.bankName,
        tid: payment.tid
      });
      
      // Reload bills and vendors with their transaction logs
      const [billsData, vendorsData] = await Promise.all([
        billsAPI.getAll(),
        vendorsAPI.getAll()
      ]);
      
      const mappedVendors = vendorsData.map(mapVendor);
      const vendorsWithLogs = await Promise.all(
        mappedVendors.map(async (vendor: Vendor) => {
          try {
            const transactions = await vendorsAPI.getTransactions(vendor.id);
            return { ...vendor, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return vendor;
          }
        })
      );
      
      setBills(billsData.map(mapBill));
      setVendors(vendorsWithLogs);
    } catch (error) {
      console.error('Error adding payment to bill:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleReceivePayment = async (invoiceId: string, payment: PaymentRecord) => {
    try {
      await invoicesAPI.addPayment(invoiceId, {
        date: payment.date,
        amount: payment.amount,
        method: payment.method,
        bank_name: payment.bankName,
        tid: payment.tid
      });
      
      // Reload invoices and customers with their transaction logs
      const [invoicesData, customersData] = await Promise.all([
        invoicesAPI.getAll(),
        customersAPI.getAll()
      ]);
      
      const mappedCustomers = customersData.map(mapCustomer);
      const customersWithLogs = await Promise.all(
        mappedCustomers.map(async (customer: Customer) => {
          try {
            const transactions = await customersAPI.getTransactions(customer.id);
            return { ...customer, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return customer;
          }
        })
      );
      
      setInvoices(invoicesData.map(mapInvoice));
      setCustomers(customersWithLogs);
    } catch (error) {
      console.error('Error adding payment to invoice:', error);
      alert('Failed to process payment. Please try again.');
    }
  };

  const handleAddInvoice = async (invoiceData: any) => {
    try {
      const backendData = {
        invoice_number: invoiceData.id,
        customer: parseInt(invoiceData.customerId),
        date: invoiceData.date,
        due_date: invoiceData.dueDate,
        notes: invoiceData.notes || '',
        items: invoiceData.items.map((item: any) => ({
          inventory_item: parseInt(item.itemId),
          meters: item.meters,
          price: item.price
        }))
      };
      
      const newInvoice = await invoicesAPI.create(backendData);
      
      // If there's an initial payment, add it
      if (invoiceData.initialPayment) {
        await invoicesAPI.addPayment(String(newInvoice.id), {
          date: invoiceData.initialPayment.date,
          amount: invoiceData.initialPayment.amount,
          method: invoiceData.initialPayment.method,
          bank_name: invoiceData.initialPayment.bankName,
          tid: invoiceData.initialPayment.tid
        });
      }
      
      // Reload invoices, inventory, and customers with transaction logs
      const [invoicesData, inventoryData, customersData] = await Promise.all([
        invoicesAPI.getAll(),
        inventoryAPI.getAll(),
        customersAPI.getAll()
      ]);
      
      const mappedCustomers = customersData.map(mapCustomer);
      const customersWithLogs = await Promise.all(
        mappedCustomers.map(async (customer: Customer) => {
          try {
            const transactions = await customersAPI.getTransactions(customer.id);
            return { ...customer, logs: Array.isArray(transactions) ? transactions.map(mapTransaction) : [] };
          } catch {
            return customer;
          }
        })
      );
      
      setInvoices(invoicesData.map(mapInvoice));
      setInventory(inventoryData.map(mapInventoryItem));
      setCustomers(customersWithLogs);
    } catch (error) {
      console.error('Error creating invoice:', error);
      alert('Failed to create invoice. Please try again.');
    }
  };

  const renderContent = () => {
    switch (currentPage) {
      case 'home':
        // compute financial summary from invoices and bills
        const payables = bills.reduce((acc, b) => acc + (parseFloat(String(b.total || 0)) - parseFloat(String(b.amountPaid || 0))), 0);
        const receivables = invoices.reduce((acc, i) => acc + (parseFloat(String(i.total || 0)) - parseFloat(String(i.amountPaid || 0))), 0);
        return <FlowchartDashboard onNavigate={setCurrentPage} financialSummary={{ payables, receivables }} />;
      case 'vendors':
        return <VendorCenter vendors={vendors} bills={bills} inventory={inventory} onPayBill={handlePayBill} onAddVendor={handleAddVendor} onUpdateVendor={handleUpdateVendor} currentUser={currentUser} selectedId={selectedVendorId} />;
        case 'customers':
          return <CustomerCenter customers={customers} invoices={invoices} inventory={inventory} onReceivePayment={handleReceivePayment} onAddCustomer={handleAddCustomer} onUpdateCustomer={handleUpdateCustomer} currentUser={currentUser} selectedId={selectedCustomerId} />;
      case 'inventory':
        return <InventoryCenter inventory={inventory} setInventory={setInventory} vendors={vendors} onReceive={handleReceiveStock} onInitiateBill={handleInitiateBill} />;
      case 'invoices':
      case 'bills':
        return (
          <InvoiceBillCenter 
            type={currentPage === 'invoices' ? 'Invoice' : 'Bill'} 
            items={currentPage === 'invoices' ? invoices : bills}
            onAdd={currentPage === 'invoices' ? handleAddInvoice : handleAddBill}
            vendors={vendors}
            customers={customers}
            inventory={inventory}
            preFilledLot={currentPage === 'bills' ? pendingBillLot : null}
            onPayBill={handlePayBill}
            onReceivePayment={handleReceivePayment}
          />
        );

      case 'deposits':
        return <DepositsCenter invoices={invoices} bills={bills} />;
      case 'itemMaster':
        return <ItemMasterCenter inventory={inventory} />;
      case 'expenses':
        return <ExpensesCenter expenses={expenses} onExpensesChange={setExpenses} />;
      case 'reports':
        return <ReportsCenter invoices={invoices} bills={bills} expenses={expenses} vendors={vendors} customers={customers}
          onNavigate={(page, id) => {
            setCurrentPage(page === 'vendors' ? 'vendors' : 'customers');
            if (page === 'vendors') setSelectedVendorId(id || null);
            else setSelectedCustomerId(id || null);
            try { window.location.hash = `#${page === 'vendors' ? 'vendors' : 'customers'}`; } catch {}
          }}
        />;
      case 'imports':
        return <Imports />;
      default:
        return <FlowchartDashboard onNavigate={setCurrentPage} />;
    }
  };

  if (!currentUser) {
    return <AuthPage onLogin={handleLogin} />;
  }

  return (
    <div className="flex h-screen overflow-hidden">
      <Toast />
      <Sidebar 
        currentPage={currentPage} 
        onNavigate={setCurrentPage} 
        role={currentUser.role}
        onLogout={handleLogout}
        isOpen={sidebarOpen}
        onToggle={() => setSidebarOpen(s => !s)}
      />
      <div className={`flex-1 flex flex-col overflow-hidden bg-[#e0e7ee] transition-all duration-300 ${sidebarOpen ? 'lg:ml-56' : ''}`}>
        { /* Backdrop for small screens when sidebar open */ }
        {sidebarOpen && (
          <div className="fixed inset-0 bg-black/40 z-20 lg:hidden" onClick={() => setSidebarOpen(false)} />
        )}

        <div className="h-8 bg-[#f8f9fa] border-b border-[#a3b6cc] flex items-center px-4 space-x-1 shrink-0 shadow-sm relative z-50">
          {currentUser.role === 'manager' && (
            <>
              <button
                onClick={() => setSidebarOpen(s => !s)}
                className="mr-2 px-2 h-full text-[12px] flex items-center justify-center border-r border-[#dee2e6] hover:bg-slate-200 text-slate-600"
                title="Toggle menu"
              >
                <i className="fas fa-bars"></i>
              </button>
              <button 
                onClick={() => setCurrentPage('home')}
                className={`px-4 h-full text-[10px] font-black uppercase tracking-widest flex items-center space-x-2 border-r border-[#dee2e6] transition-all duration-300 ease-in-out ${currentPage === 'home' ? 'bg-[#7d2b3f] text-white shadow-sm' : 'hover:bg-slate-200 text-slate-600'}`}
              >
                <i className="fas fa-home"></i> <span>Home</span>
              </button>
            </>
          )}
          <div className="px-4 h-full flex items-center border-r border-[#dee2e6]">
            <div className="text-[10px] text-slate-500 font-black uppercase tracking-wider">
              {currentPage.replace(/([A-Z])/g, ' $1')} Center
            </div>
          </div>

          {/* Centered brand so it's visible across viewports */}
          <div className="absolute inset-x-0 flex justify-center pointer-events-none">
            <div className="pointer-events-auto flex items-center text-[#7d2b3f] font-black text-sm uppercase tracking-widest">
              <i className="fas fa-leaf mr-2"></i>
              <span>HA FABRICS</span>
            </div>
          </div>
          <div className="flex-1 flex justify-end items-center text-[10px] font-black text-slate-400 uppercase space-x-4">
             <span><i className="fas fa-user-circle mr-1 text-red-400"></i> {currentUser.name}</span>
             <span className="bg-slate-200 px-2 py-0.5 rounded text-slate-600 border border-slate-300">{currentUser.role}</span>
             {isLoading && (
               <span className="flex items-center text-red-600">
                 <i className="fas fa-sync fa-spin mr-2"></i> Loading...
               </span>
             )}
             <button
               onClick={() => window.dispatchEvent(new Event('app-refresh-data'))}
               title="Refresh data"
               className="flex items-center px-3 py-1 rounded bg-slate-100 text-slate-600 border border-slate-300 hover:bg-slate-200"
             >
               <i className="fas fa-sync-alt mr-2"></i>
               <span className="text-[10px] font-black uppercase">Refresh</span>
             </button>
          </div>
        </div>
        <main className={`flex-1 overflow-auto p-8 relative bg-[#eef2f6] transition-all duration-300 ease-in-out`}>
          <div className="animate-in fade-in slide-in-from-bottom-4 duration-500">
            {renderContent()}
          </div>
        </main>
      </div>
    </div>
  );
};

export default App;
