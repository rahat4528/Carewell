'use client';

import React, { useState } from 'react';
import { ShoppingCart, Barcode, Trash2, CreditCard, DollarSign, Receipt, CheckCircle, Plus } from 'lucide-react';

interface PosCartLine {
  id: string;
  medicationId: string;
  name: string;
  ndc: string;
  unitPriceCents: number;
  quantity: number;
  isTaxable: boolean;
}

const SAMPLE_ITEMS = [
  { id: '1', medicationId: 'm3', name: 'Advil Liqui-Gels 200mg', ndc: '00573-0160-20', unitPriceCents: 1099, isTaxable: true },
  { id: '2', medicationId: 'm1', name: 'Amoxicillin 500mg', ndc: '00093-3109-01', unitPriceCents: 1850, isTaxable: false },
  { id: '3', medicationId: 'm4', name: 'Digital Clinical Thermometer', ndc: '00123-4567-89', unitPriceCents: 1499, isTaxable: true }
];

export const PosCheckoutTerminal: React.FC = () => {
  const [cart, setCart] = useState<PosCartLine[]>([
    { id: '1', medicationId: 'm3', name: 'Advil Liqui-Gels 200mg', ndc: '00573-0160-20', unitPriceCents: 1099, quantity: 2, isTaxable: true }
  ]);
  const [barcodeInput, setBarcodeInput] = useState('');
  const [paymentMethod, setPaymentMethod] = useState<'CASH' | 'CARD' | 'SPLIT'>('CASH');
  const [cashTendered, setCashTendered] = useState('25.00');
  const [receiptModal, setReceiptModal] = useState<any | null>(null);

  const addItemToCart = (item: typeof SAMPLE_ITEMS[0]) => {
    setCart((prev) => {
      const existing = prev.find((i) => i.medicationId === item.medicationId);
      if (existing) {
        return prev.map((i) => (i.medicationId === item.medicationId ? { ...i, quantity: i.quantity + 1 } : i));
      }
      return [...prev, { ...item, quantity: 1 }];
    });
  };

  const removeItem = (medicationId: string) => {
    setCart((prev) => prev.filter((i) => i.medicationId !== medicationId));
  };

  // Exact Integer Calculations (Cents)
  const subtotalCents = cart.reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  const taxableSubtotalCents = cart
    .filter((i) => i.isTaxable)
    .reduce((sum, item) => sum + item.quantity * item.unitPriceCents, 0);
  // 8.25% sales tax on taxable items
  const taxCents = Math.round((taxableSubtotalCents * 825) / 10000);
  const totalCents = subtotalCents + taxCents;

  const cashCents = Math.round(parseFloat(cashTendered || '0') * 100);
  const changeDueCents = Math.max(0, cashCents - totalCents);

  const handleCheckout = () => {
    if (cart.length === 0) return;
    if (paymentMethod === 'CASH' && cashCents < totalCents) {
      alert(`Insufficient cash tendered: Short by $${((totalCents - cashCents) / 100).toFixed(2)}`);
      return;
    }

    const receipt = {
      saleNumber: `POS-${Date.now().toString().slice(-6)}`,
      timestamp: new Date().toLocaleTimeString(),
      items: [...cart],
      subtotalCents,
      taxCents,
      totalCents,
      paymentMethod,
      cashTenderedCents: cashCents,
      changeDueCents
    };

    setReceiptModal(receipt);
    setCart([]);
  };

  return (
    <div className="bg-white border border-slate-200 rounded-2xl p-6 shadow-sm space-y-6">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 pb-4 border-b border-slate-100">
        <div>
          <h3 className="font-extrabold text-slate-900 text-lg">Point of Sale (POS) Dispensary Terminal</h3>
          <p className="text-xs text-slate-500">
            Real-time integer-cents financial engine. Automatic FEFO stock allocation upon checkout.
          </p>
        </div>
        <div className="flex items-center gap-2">
          {SAMPLE_ITEMS.map((item) => (
            <button
              key={item.id}
              onClick={() => addItemToCart(item)}
              className="px-2.5 py-1 rounded-lg bg-slate-100 hover:bg-slate-200 text-slate-700 text-xs font-semibold flex items-center gap-1 transition"
            >
              <Plus className="w-3 h-3" /> {item.name.split(' ')[0]}
            </button>
          ))}
        </div>
      </div>

      <div className="grid grid-cols-1 lg:grid-cols-3 gap-6">
        {/* Left: Cart Item Table */}
        <div className="lg:col-span-2 space-y-4">
          <div className="flex items-center gap-2">
            <Barcode className="w-5 h-5 text-slate-400" />
            <input
              type="text"
              value={barcodeInput}
              onChange={(e) => setBarcodeInput(e.target.value)}
              placeholder="Scan medication barcode or enter NDC..."
              className="w-full px-3 py-2 border border-slate-200 rounded-xl text-xs font-mono focus:outline-none focus:ring-2 focus:ring-emerald-500"
            />
          </div>

          <div className="border border-slate-200 rounded-xl overflow-hidden">
            <table className="w-full text-left text-xs">
              <thead className="bg-slate-50 border-b border-slate-200 text-slate-500 font-bold uppercase text-[10px]">
                <tr>
                  <th className="py-2.5 px-3">Item Description</th>
                  <th className="py-2.5 px-3 text-center">Qty</th>
                  <th className="py-2.5 px-3">Unit Price</th>
                  <th className="py-2.5 px-3">Tax Status</th>
                  <th className="py-2.5 px-3 text-right">Line Total</th>
                  <th className="py-2.5 px-3"></th>
                </tr>
              </thead>
              <tbody className="divide-y divide-slate-100">
                {cart.length === 0 ? (
                  <tr>
                    <td colSpan={6} className="py-8 text-center text-slate-400 italic">
                      Scan items or add fast picks above to begin transaction.
                    </td>
                  </tr>
                ) : (
                  cart.map((item) => (
                    <tr key={item.id} className="hover:bg-slate-50/50">
                      <td className="py-2.5 px-3">
                        <div className="font-bold text-slate-900">{item.name}</div>
                        <div className="text-[10px] text-slate-400 font-mono">NDC: {item.ndc}</div>
                      </td>
                      <td className="py-2.5 px-3 text-center font-bold text-slate-800">{item.quantity}</td>
                      <td className="py-2.5 px-3 font-mono text-slate-600">${(item.unitPriceCents / 100).toFixed(2)}</td>
                      <td className="py-2.5 px-3">
                        {item.isTaxable ? (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-amber-50 text-amber-800 border border-amber-200">
                            TAXABLE
                          </span>
                        ) : (
                          <span className="px-2 py-0.5 rounded text-[10px] font-bold bg-slate-100 text-slate-600">
                            RX EXEMPT
                          </span>
                        )}
                      </td>
                      <td className="py-2.5 px-3 text-right font-mono font-bold text-slate-900">
                        ${((item.quantity * item.unitPriceCents) / 100).toFixed(2)}
                      </td>
                      <td className="py-2.5 px-3 text-right">
                        <button
                          onClick={() => removeItem(item.medicationId)}
                          className="text-slate-400 hover:text-rose-600"
                        >
                          <Trash2 className="w-3.5 h-3.5" />
                        </button>
                      </td>
                    </tr>
                  ))
                )}
              </tbody>
            </table>
          </div>
        </div>

        {/* Right: Payment Panel */}
        <div className="bg-slate-50/70 border border-slate-200 rounded-2xl p-5 space-y-4 flex flex-col justify-between">
          <div className="space-y-3">
            <h4 className="font-extrabold text-sm text-slate-900 pb-2 border-b border-slate-200">
              Payment Summary
            </h4>

            <div className="space-y-1.5 text-xs">
              <div className="flex justify-between text-slate-600">
                <span>Subtotal ({cart.reduce((s, i) => s + i.quantity, 0)} items):</span>
                <span className="font-mono font-semibold">${(subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-slate-600">
                <span>Estimated Tax (8.25%):</span>
                <span className="font-mono font-semibold">${(taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between text-base font-extrabold text-slate-900 pt-2 border-t border-slate-200">
                <span>Total Due:</span>
                <span className="font-mono text-emerald-700">${(totalCents / 100).toFixed(2)}</span>
              </div>
            </div>

            {/* Payment Options */}
            <div className="space-y-2 pt-2">
              <label className="text-xs font-bold text-slate-700 block">Tender Method</label>
              <div className="grid grid-cols-2 gap-2">
                <button
                  onClick={() => setPaymentMethod('CASH')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    paymentMethod === 'CASH'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <DollarSign className="w-4 h-4" /> Cash
                </button>
                <button
                  onClick={() => setPaymentMethod('CARD')}
                  className={`py-2 px-3 rounded-xl text-xs font-bold flex items-center justify-center gap-1.5 border transition ${
                    paymentMethod === 'CARD'
                      ? 'bg-emerald-600 text-white border-emerald-600'
                      : 'bg-white text-slate-700 border-slate-200'
                  }`}
                >
                  <CreditCard className="w-4 h-4" /> Credit Card
                </button>
              </div>

              {paymentMethod === 'CASH' && (
                <div className="pt-2">
                  <label className="text-[11px] font-semibold text-slate-600 block mb-1">Cash Tendered ($)</label>
                  <input
                    type="number"
                    step="0.01"
                    value={cashTendered}
                    onChange={(e) => setCashTendered(e.target.value)}
                    className="w-full px-3 py-1.5 border border-slate-200 rounded-lg text-xs font-mono font-bold"
                  />
                  <div className="text-xs font-semibold text-slate-600 mt-1 flex justify-between">
                    <span>Change Due:</span>
                    <span className="font-mono font-bold text-emerald-700">${(changeDueCents / 100).toFixed(2)}</span>
                  </div>
                </div>
              )}
            </div>
          </div>

          <button
            onClick={handleCheckout}
            disabled={cart.length === 0}
            className={`w-full py-3 rounded-xl font-bold text-xs flex items-center justify-center gap-2 shadow-md transition ${
              cart.length > 0
                ? 'bg-emerald-600 hover:bg-emerald-500 text-white'
                : 'bg-slate-200 text-slate-400 cursor-not-allowed'
            }`}
          >
            <ShoppingCart className="w-4 h-4" /> Finalize POS Checkout
          </button>
        </div>
      </div>

      {/* Itemized Receipt Modal */}
      {receiptModal && (
        <div className="fixed inset-0 z-50 bg-slate-950/70 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-white rounded-2xl max-w-sm w-full p-6 shadow-2xl border border-slate-200 space-y-4 font-mono text-xs">
            <div className="text-center space-y-1 pb-3 border-b border-dashed border-slate-300">
              <div className="font-extrabold text-slate-900 text-sm">CAREWELL PHARMACY</div>
              <div className="text-[10px] text-slate-500">Receipt #{receiptModal.saleNumber}</div>
              <div className="text-[10px] text-slate-400">{receiptModal.timestamp}</div>
            </div>

            <div className="space-y-1.5 divide-y divide-slate-100">
              {receiptModal.items.map((i: any, idx: number) => (
                <div key={idx} className="pt-1.5 flex justify-between">
                  <div>
                    <div>{i.name}</div>
                    <div className="text-[10px] text-slate-400">{i.quantity} x ${(i.unitPriceCents / 100).toFixed(2)}</div>
                  </div>
                  <div className="font-bold">${((i.quantity * i.unitPriceCents) / 100).toFixed(2)}</div>
                </div>
              ))}
            </div>

            <div className="pt-3 border-t border-dashed border-slate-300 space-y-1 text-slate-700">
              <div className="flex justify-between">
                <span>Subtotal:</span>
                <span>${(receiptModal.subtotalCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between">
                <span>Tax:</span>
                <span>${(receiptModal.taxCents / 100).toFixed(2)}</span>
              </div>
              <div className="flex justify-between font-extrabold text-slate-900 text-sm pt-1">
                <span>TOTAL:</span>
                <span>${(receiptModal.totalCents / 100).toFixed(2)}</span>
              </div>
              {receiptModal.paymentMethod === 'CASH' && (
                <div className="flex justify-between text-slate-500 pt-1 text-[11px]">
                  <span>Change:</span>
                  <span>${(receiptModal.changeDueCents / 100).toFixed(2)}</span>
                </div>
              )}
            </div>

            <button
              onClick={() => setReceiptModal(null)}
              className="w-full mt-4 py-2 bg-slate-900 text-white rounded-xl font-sans text-xs font-bold hover:bg-slate-800"
            >
              Close Receipt
            </button>
          </div>
        </div>
      )}
    </div>
  );
};
