import React, { forwardRef } from 'react';

// Forwarding ref is required by react-to-print so it knows exactly what DOM element to capture
export const ReceiptPrinter = forwardRef(({ order, restaurant }, ref) => {
  
  // ✅ FIXED: Always return a div with the ref attached so react-to-print doesn't crash
  if (!order) {
    return <div ref={ref} className="hidden"></div>;
  }

  return (
    <div className="hidden">
      {/* This div is the actual receipt that gets sent to the printer */}
      <div 
        ref={ref} 
        style={{
          width: '300px', // Standard width for 80mm thermal paper
          padding: '20px 10px',
          fontFamily: 'monospace', // Monospace looks best on thermal printers
          color: '#000',
          fontSize: '12px',
          lineHeight: '1.4',
          backgroundColor: '#fff' // Ensure white background for the print spooler
        }}
      >
        {/* ================= HEADER ================= */}
        <div style={{ textAlign: 'center', marginBottom: '15px' }}>
          <h2 style={{ fontSize: '18px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            {restaurant?.name || "MenuSent Restaurant"}
          </h2>
          <p style={{ margin: '2px 0' }}>{restaurant?.fullAddress || ""}</p>
          <p style={{ margin: '2px 0' }}>Tel: {restaurant?.phone || ""}</p>
          <p style={{ margin: '10px 0', borderBottom: '1px dashed #000', paddingBottom: '10px' }}></p>
        </div>

        {/* ================= ORDER DETAILS ================= */}
        <div style={{ marginBottom: '15px' }}>
          <h3 style={{ fontSize: '14px', fontWeight: 'bold', margin: '0 0 5px 0' }}>
            Order ID: {order.orderId}
          </h3>
          <p style={{ margin: '2px 0' }}>Date: {new Date(order.createdAt).toLocaleString()}</p>
          <p style={{ margin: '2px 0' }}>Customer: {order.customerName}</p>
          <p style={{ margin: '2px 0' }}>Phone: {order.customerPhone}</p>
          
          {order.deliveryAddress?.building && (
            <p style={{ margin: '2px 0', wordBreak: 'break-word' }}>
              Address: {order.deliveryAddress.building}, {order.deliveryAddress.apt}
            </p>
          )}
          {order.tableNumber && (
            <p style={{ margin: '2px 0', fontWeight: 'bold', fontSize: '14px' }}>
              Table: {order.tableNumber}
            </p>
          )}
        </div>

        <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }}></div>

        {/* ================= ITEMS LIST ================= */}
        <table style={{ width: '100%', marginBottom: '10px', textAlign: 'left', borderCollapse: 'collapse' }}>
          <thead>
            <tr>
              <th style={{ width: '15%', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Qty</th>
              <th style={{ width: '55%', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Item</th>
              <th style={{ width: '30%', textAlign: 'right', borderBottom: '1px solid #000', paddingBottom: '5px' }}>Amt</th>
            </tr>
          </thead>
          <tbody>
            {order.items?.map((item, index) => (
              <tr key={index}>
                <td style={{ verticalAlign: 'top', paddingTop: '5px', fontWeight: 'bold' }}>
                  {item.quantity}x
                </td>
                <td style={{ verticalAlign: 'top', paddingTop: '5px' }}>
                  {item.name}
                  {item.variantName && (
                    <div style={{ fontSize: '10px', color: '#333', marginTop: '2px' }}>
                      ({item.variantName})
                    </div>
                  )}
                </td>
                <td style={{ textAlign: 'right', verticalAlign: 'top', paddingTop: '5px' }}>
                  {(item.price * item.quantity).toFixed(2)}
                </td>
              </tr>
            ))}
          </tbody>
        </table>

        <div style={{ borderBottom: '1px dashed #000', marginBottom: '10px' }}></div>

        {/* ================= TOTALS ================= */}
        {/* We calculate subtotal dynamically assuming totalAmount includes VAT and Delivery */}
        {(() => {
          const vatAmt = order.totalAmount * 0.05;
          const deliveryAmt = order.deliveryFee || 0;
          const subtotalAmt = order.totalAmount - vatAmt - deliveryAmt;

          return (
            <>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>Subtotal:</span>
                <span>{subtotalAmt.toFixed(2)}</span>
              </div>
              <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                <span>VAT (5%):</span>
                <span>{vatAmt.toFixed(2)}</span>
              </div>
              {deliveryAmt > 0 && (
                <div style={{ display: 'flex', justifyContent: 'space-between', marginBottom: '2px' }}>
                  <span>Delivery:</span>
                  <span>{deliveryAmt.toFixed(2)}</span>
                </div>
              )}
            </>
          );
        })()}
        
        <div style={{ 
          display: 'flex', 
          justifyContent: 'space-between', 
          marginTop: '10px', 
          paddingTop: '5px',
          borderTop: '1px solid #000',
          fontWeight: 'bold', 
          fontSize: '16px' 
        }}>
          <span>TOTAL:</span>
          <span>
            {order.items && order.items.length > 0 ? order.items[0].currency : 'AED'} {order.totalAmount?.toFixed(2)}
          </span>
        </div>

        {/* ================= FOOTER ================= */}
        <div style={{ textAlign: 'center', marginTop: '20px', borderTop: '1px dashed #000', paddingTop: '10px' }}>
          <p style={{ margin: '0', fontWeight: 'bold' }}>Thank you for your order!</p>
          <p style={{ margin: '5px 0 0 0', fontSize: '10px' }}>Powered by MenuSent</p>
        </div>
      </div>
    </div>
  );
});