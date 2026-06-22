import React, { useState, useEffect } from "react";
import { useParams, useNavigate } from "react-router-dom";
import { 
  ArrowLeft, 
  Receipt, 
  CreditCard, 
  Clock, 
  UtensilsCrossed, 
  CheckCircle2,
  AlertCircle,
  Loader2
} from "lucide-react";
import { fetchTableActiveOrder, updateOrderStatus } from "../api/order.api";
// Assuming you have a table API to clear the table status
// import { updateTableStatus } from "../api/table.api"; 

const TableOrderView = () => {
  const { tableId } = useParams();
  const navigate = useNavigate();
  
  const [order, setOrder] = useState(null);
  const [isLoading, setIsLoading] = useState(true);
  const [error, setError] = useState(null);
  const [isProcessing, setIsProcessing] = useState(false);

  useEffect(() => {
    const loadOrder = async () => {
      try {
        setIsLoading(true);
        const data = await fetchTableActiveOrder(tableId);
        setOrder(data);
        setError(null);
      } catch (err) {
        console.error("Failed to fetch order:", err);
        setError("No active order found for this table, or the table is currently available.");
      } finally {
        setIsLoading(false);
      }
    };

    if (tableId) {
      loadOrder();
    }
  }, [tableId]);

  const handleMarkAsPaid = async () => {
    if (!order) return;
    
    try {
      setIsProcessing(true);
      
      // 1. Mark the order as Delivered/Completed in the database
      await updateOrderStatus(order._id, 'Delivered'); 
      
      // 2. Clear the table status back to Available or Cleaning
      // You will need this endpoint if you haven't built it yet:
      // await updateTableStatus(tableId, 'Available');
      
      // 3. Navigate back to table management
      navigate('/restaurant/tables');
      
    } catch (err) {
      console.error("Payment processing failed:", err);
      alert("Failed to complete the order. Please try again.");
      setIsProcessing(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#f4f6f9] items-center justify-center">
        <Loader2 className="h-10 w-10 animate-spin text-[#ff6b35] mb-4" />
        <p className="text-slate-500 font-bold tracking-wide">Retrieving ticket details...</p>
      </div>
    );
  }

  if (error || !order) {
    return (
      <div className="flex flex-col h-screen w-full bg-[#f4f6f9] items-center justify-center p-6 text-center">
        <div className="bg-white p-8 rounded-[32px] shadow-[0_8px_30px_rgba(0,0,0,0.04)] max-w-md w-full flex flex-col items-center">
          <div className="h-16 w-16 bg-red-50 rounded-full flex items-center justify-center mb-6">
            <AlertCircle className="h-8 w-8 text-red-500" strokeWidth={2.5} />
          </div>
          <h2 className="text-[22px] font-black text-slate-900 mb-2">Order Not Found</h2>
          <p className="text-slate-500 font-medium mb-8 leading-relaxed">{error}</p>
          <button 
            onClick={() => navigate('/restaurant/tables')}
            className="w-full bg-slate-900 text-white font-bold py-4 rounded-[20px] hover:bg-slate-800 transition-colors"
          >
            Return to Floor Plan
          </button>
        </div>
      </div>
    );
  }

  return (
    <div className="flex flex-col h-screen w-full bg-[#f4f6f9] font-sans selection:bg-[#ff6b35]/20 overflow-hidden">
      
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-md border-b border-slate-100/80 px-8 py-5 flex items-center justify-between sticky top-0 z-20">
        <div className="flex items-center gap-4">
          <button 
            onClick={() => navigate('/restaurant/tables')}
            className="p-2.5 bg-slate-50 hover:bg-slate-100 text-slate-600 rounded-[16px] transition-colors"
          >
            <ArrowLeft className="h-5 w-5" strokeWidth={2.5} />
          </button>
          <div>
            <h1 className="text-[24px] font-black tracking-tight text-slate-900 leading-none">
              {order.tableNumber || "Table"} - Active Order
            </h1>
            <div className="flex items-center gap-2 mt-1.5 text-[13px] font-bold text-slate-500">
              <Receipt className="h-3.5 w-3.5" />
              <span>{order.orderId}</span>
              <span className="w-1 h-1 rounded-full bg-slate-300 mx-1"></span>
              <Clock className="h-3.5 w-3.5" />
              <span>{new Date(order.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
            </div>
          </div>
        </div>
        
        <div className="px-4 py-2 rounded-full bg-[#ff6b35]/10 text-[#ff6b35] font-black text-[13px] tracking-widest uppercase flex items-center gap-2 border border-[#ff6b35]/20">
          <div className="w-2 h-2 rounded-full bg-[#ff6b35] animate-pulse"></div>
          {order.orderStatus}
        </div>
      </header>

      {/* Main Content Area */}
      <main className="flex-1 overflow-y-auto p-8 flex justify-center custom-scrollbar">
        <div className="w-full max-w-4xl grid grid-cols-1 lg:grid-cols-3 gap-8 items-start">
          
          {/* Order Items List (Left Column - Takes up 2/3) */}
          <div className="lg:col-span-2 bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/80">
            <h3 className="text-[18px] font-black text-slate-900 mb-6 flex items-center gap-2">
              <UtensilsCrossed className="h-5 w-5 text-slate-400" />
              Order Items
            </h3>
            
            <div className="flex flex-col gap-4">
              {order.items.map((item, index) => (
                <div key={index} className="flex items-center justify-between p-4 rounded-[20px] bg-slate-50 border border-slate-100/60">
                  <div className="flex items-center gap-4">
                    <div className="h-12 w-12 rounded-[14px] bg-white shadow-sm flex items-center justify-center border border-slate-100 text-slate-800 font-black text-[16px]">
                      x{item.quantity}
                    </div>
                    <div className="flex flex-col">
                      <span className="font-bold text-[16px] text-slate-900">{item.name}</span>
                      {item.variantName && (
                        <span className="text-[13px] font-medium text-slate-500">{item.variantName}</span>
                      )}
                    </div>
                  </div>
                  <span className="font-black text-[16px] text-[#ff6b35]">
                    AED {(item.price * item.quantity).toFixed(2)}
                  </span>
                </div>
              ))}
            </div>
          </div>

          {/* Financial Summary & Action Panel (Right Column - Takes up 1/3) */}
          <div className="bg-white rounded-[32px] p-8 shadow-[0_8px_30px_rgba(0,0,0,0.03)] border border-slate-100/80 sticky top-8">
            <h3 className="text-[18px] font-black text-slate-900 mb-6 border-b border-slate-100 pb-4">Payment Summary</h3>
            
            <div className="flex flex-col gap-4 mb-6">
              <div className="flex justify-between items-center text-slate-500 font-bold text-[15px]">
                <span>Subtotal</span>
                <span className="text-slate-900">AED {order.subtotal?.toFixed(2)}</span>
              </div>
              <div className="flex justify-between items-center text-slate-500 font-bold text-[15px]">
                <span>VAT (5%)</span>
                <span className="text-slate-900">AED {order.vat?.toFixed(2)}</span>
              </div>
            </div>

            <div className="flex justify-between items-end border-t border-slate-100 pt-6 mb-8">
              <span className="text-[14px] font-black uppercase tracking-widest text-slate-400">Total</span>
              <span className="text-[36px] font-black text-slate-900 leading-none tracking-tighter">
                <span className="text-[20px] mr-1.5 text-slate-400">AED</span>
                {order.totalAmount?.toFixed(2)}
              </span>
            </div>

            <button 
              onClick={handleMarkAsPaid}
              disabled={isProcessing}
              className="w-full bg-slate-900 disabled:bg-slate-200 disabled:text-slate-400 text-white font-black text-[16px] tracking-wide py-5 rounded-[24px] shadow-[0_12px_28px_rgba(15,23,42,0.15)] flex items-center justify-center gap-3 transition-all hover:-translate-y-0.5 hover:shadow-[0_16px_32px_rgba(15,23,42,0.2)] active:scale-[0.98]"
            >
              {isProcessing ? (
                <>
                  <Loader2 className="h-5 w-5 animate-spin" />
                  Processing...
                </>
              ) : (
                <>
                  <CreditCard className="h-5 w-5" strokeWidth={2.5} />
                  Mark as Paid & Clear
                </>
              )}
            </button>
          </div>

        </div>
      </main>

    </div>
  );
};

export default TableOrderView;