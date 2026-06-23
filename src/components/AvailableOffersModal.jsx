import React, { useState, useEffect } from "react";
import { X, Ticket, Copy, CheckCircle2, Tag } from "lucide-react";

export const AvailableOffersModal = ({ isOpen, onClose, qualifiedOffers = [] }) => {
  const [copiedCode, setCopiedCode] = useState(null);

  // Reset copied state when modal opens/closes
  useEffect(() => {
    if (!isOpen) {
      setTimeout(() => setCopiedCode(null), 300); // Wait for exit animation
    }
  }, [isOpen]);

  if (!isOpen) return null;

  const handleCopy = (code) => {
    navigator.clipboard.writeText(code);
    setCopiedCode(code);
    
    // Smooth UX: Automatically close the modal after copying so they can checkout
    setTimeout(() => {
      onClose();
    }, 1200);
  };

  return (
    <div className="fixed inset-0 z-[70] flex items-end md:items-center justify-center">
      {/* Dark blurry backdrop */}
      <div 
        className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm transition-opacity animate-in fade-in duration-300"
        onClick={onClose}
      ></div>

      {/* Slide-up Bottom Sheet Modal */}
      <div className="bg-white w-full h-[60vh] md:h-auto md:max-h-[70vh] md:max-w-[400px] rounded-t-[32px] md:rounded-[32px] shadow-2xl relative flex flex-col animate-in slide-in-from-bottom-full md:zoom-in-95 duration-300 z-10 overflow-hidden">
        
        {/* Header */}
        <div className="flex items-center justify-between p-6 border-b border-gray-100 bg-white sticky top-0 z-20">
          <div className="flex items-center gap-2">
            <div className="h-8 w-8 bg-emerald-50 rounded-full flex items-center justify-center border border-emerald-100">
               <Ticket className="h-4 w-4 text-emerald-600" />
            </div>
            <h2 className="text-xl font-extrabold text-slate-900 tracking-tight">Available Offers</h2>
          </div>
          <button 
            onClick={onClose}
            className="h-8 w-8 bg-gray-50 rounded-full flex items-center justify-center text-slate-400 hover:bg-gray-200 hover:text-slate-700 transition-colors"
          >
            <X className="h-5 w-5" />
          </button>
        </div>

        {/* Scrollable Offers List */}
        <div className="flex-1 overflow-y-auto p-5 bg-slate-50/50 hide-scrollbar">
          {qualifiedOffers.length === 0 ? (
            <div className="flex flex-col items-center justify-center h-full text-slate-400 mt-10">
              <Ticket className="h-12 w-12 mb-3 opacity-20" />
              <p className="font-medium">No offers unlocked yet.</p>
              <p className="text-sm mt-1">Add more items to your basket!</p>
            </div>
          ) : (
            <div className="flex flex-col gap-4">
              {qualifiedOffers.map((offer, index) => {
                const isCopied = copiedCode === offer.code;

                return (
                  <div 
                    key={index} 
                    className="bg-white border border-gray-200 rounded-[24px] p-5 shadow-sm relative overflow-hidden transition-all hover:border-emerald-200 hover:shadow-md"
                  >
                    {/* Decorative dashed line like a real ticket */}
                    <div className="absolute left-0 top-0 bottom-0 w-1.5 bg-emerald-400"></div>

                    <div className="flex items-center justify-between">
                      <div className="flex flex-col pr-4">
                        <div className="flex items-center gap-2 mb-1">
                          <Tag className="w-3.5 h-3.5 text-emerald-500" />
                          <span className="text-xs font-black text-gray-400 uppercase tracking-widest">Unlocked</span>
                        </div>
                        <h3 className="text-lg font-black text-slate-900 mb-1 tracking-tight">
                          {offer.discountPercentage}% OFF
                        </h3>
                        <p className="text-sm font-semibold text-slate-500 leading-snug">
                          Use code <span className="text-emerald-600 font-bold">{offer.code}</span> at checkout.
                        </p>
                      </div>

                      {/* Action Button */}
                      <button
                        onClick={() => handleCopy(offer.code)}
                        className={`shrink-0 flex flex-col items-center justify-center h-16 w-16 rounded-[18px] transition-all duration-300 ${
                          isCopied 
                            ? "bg-emerald-50 text-emerald-600 border border-emerald-100 scale-105" 
                            : "bg-slate-900 text-white shadow-md hover:bg-slate-800 hover:-translate-y-0.5 active:scale-95"
                        }`}
                      >
                        {isCopied ? (
                          <>
                            <CheckCircle2 className="h-6 w-6 mb-1 animate-in zoom-in" />
                            <span className="text-[9px] font-black uppercase tracking-wider">Copied</span>
                          </>
                        ) : (
                          <>
                            <Copy className="h-5 w-5 mb-1" />
                            <span className="text-[10px] font-bold uppercase tracking-wider">Copy</span>
                          </>
                        )}
                      </button>
                    </div>
                  </div>
                );
              })}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};