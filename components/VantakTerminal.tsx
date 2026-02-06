'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { QRCodeSVG } from 'qrcode.react';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';
import { PaymentSuccessAnimation } from './PaymentSuccessAnimation';
import { PaymentReceivedOverlay } from './PaymentReceivedOverlay';

interface VantakTerminalProps {
  tenant: TenantConfig;
  isOpen: boolean;
  onClose: () => void;
  onPaymentSuccess: (paymentData: { amount: number; customerName?: string; customerEmail?: string; receiptNumber: string }) => void;
}

export const VantakTerminal: React.FC<VantakTerminalProps> = ({ tenant, isOpen, onClose, onPaymentSuccess }) => {
  const [amount, setAmount] = useState('');
  const [isProcessing, setIsProcessing] = useState(false);
  const [qrCodeUrl, setQrCodeUrl] = useState<string | null>(null);
  const [showSuccess, setShowSuccess] = useState(false);
  const [successData, setSuccessData] = useState<any>(null);
  const [showPaymentReceived, setShowPaymentReceived] = useState(false);
  const [paymentData, setPaymentData] = useState<{ amount: number; invoiceNumber?: string; customerName?: string } | null>(null);
  const channelRef = useRef<any>(null);
  const autoResetTimerRef = useRef<NodeJS.Timeout | null>(null);

  // Set up Supabase Realtime listener for invoice status changes
  useEffect(() => {
    if (!isOpen) {
      // Unsubscribe when terminal is closed
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      // Clear any pending timers
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
      return;
    }

    // Create a channel for listening to invoice updates
    const channel = supabase
      .channel(`terminal-invoices-${tenant.id}`)
      .on(
        'postgres_changes',
        {
          event: 'UPDATE',
          schema: 'public',
          table: 'invoices',
          filter: `tenant_id=eq.${tenant.id}`,
        },
        (payload) => {
          const newRecord = payload.new as any;
          const oldRecord = payload.old as any;

          // Check if status changed to 'paid'
          if (newRecord.status === 'paid' && oldRecord.status !== 'paid') {
            console.log('✅ Payment received via realtime:', newRecord);

            // Clear any existing auto-reset timer
            if (autoResetTimerRef.current) {
              clearTimeout(autoResetTimerRef.current);
            }

            // Show payment received overlay
            setPaymentData({
              amount: parseFloat(newRecord.total_amount || newRecord.amount || '0'),
              invoiceNumber: newRecord.invoice_number,
              customerName: newRecord.customer_name,
            });
            setShowPaymentReceived(true);

            // Auto-reset after 4 seconds
            autoResetTimerRef.current = setTimeout(() => {
              setShowPaymentReceived(false);
              setPaymentData(null);
              setQrCodeUrl(null);
              setAmount('');
              
              // Trigger payment success callback
              onPaymentSuccess({
                amount: parseFloat(newRecord.total_amount || newRecord.amount || '0'),
                customerName: newRecord.customer_name,
                customerEmail: newRecord.customer_email,
                receiptNumber: newRecord.invoice_number || `VTK-${Date.now().toString().slice(-6)}`,
              });

              autoResetTimerRef.current = null;
            }, 4000);
          }
        }
      )
      .subscribe((status) => {
        if (status === 'SUBSCRIBED') {
          console.log('✅ Subscribed to invoice updates for terminal');
        } else if (status === 'CHANNEL_ERROR') {
          console.error('❌ Error subscribing to invoice updates');
        }
      });

    channelRef.current = channel;

    // Cleanup on unmount or when terminal closes
    return () => {
      if (channelRef.current) {
        supabase.removeChannel(channelRef.current);
        channelRef.current = null;
      }
      if (autoResetTimerRef.current) {
        clearTimeout(autoResetTimerRef.current);
        autoResetTimerRef.current = null;
      }
    };
  }, [isOpen, tenant.id, onPaymentSuccess]);

  // Handle visibility change for background/locked screen scenarios
  useEffect(() => {
    if (!isOpen) return;

    const handleVisibilityChange = () => {
      // When app becomes visible again, check for missed updates
      // The realtime subscription should still work, but we can refresh if needed
      if (!document.hidden && channelRef.current) {
        console.log('App visible again - realtime subscription active');
      }
    };

    // Listen for visibility changes (handles locked screen, background tabs, etc.)
    document.addEventListener('visibilitychange', handleVisibilityChange);
    
    // Listen for focus events (PWA specific)
    window.addEventListener('focus', handleVisibilityChange);

    return () => {
      document.removeEventListener('visibilitychange', handleVisibilityChange);
      window.removeEventListener('focus', handleVisibilityChange);
    };
  }, [isOpen]);

  const handleNumberPress = (num: string) => {
    if (amount === '0' && num !== '.') {
      setAmount(num);
      return;
    }
    
    if (num === '.' && amount.includes('.')) return;
    
    const newAmount = amount + num;
    const parts = newAmount.split('.');
    if (parts[1] && parts[1].length > 2) return; // Max 2 decimal places
    
    if (parseFloat(newAmount) > 99999.99) return; // Max amount
    
    setAmount(newAmount);
  };

  const handleClear = () => {
    setAmount('');
    setQrCodeUrl(null);
    setShowPaymentReceived(false);
    setPaymentData(null);
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
  };

  const handleBackspace = () => {
    setAmount(prev => prev.slice(0, -1));
  };

  const handleCharge = async () => {
    if (!amount || parseFloat(amount) <= 0) {
      return;
    }

    setIsProcessing(true);
    try {
      // Create a terminal checkout session
      const response = await fetch('/api/terminal/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          amount: parseFloat(amount),
          method: 'scan',
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setQrCodeUrl(data.checkoutUrl);
    } catch (err: any) {
      console.error('Failed to generate QR code:', err);
      alert(err.message || 'Failed to generate payment QR code');
    } finally {
      setIsProcessing(false);
    }
  };

  // Handle payment received overlay close
  const handlePaymentReceivedClose = () => {
    if (autoResetTimerRef.current) {
      clearTimeout(autoResetTimerRef.current);
      autoResetTimerRef.current = null;
    }
    
    setShowPaymentReceived(false);
    const data = paymentData;
    setPaymentData(null);
    setQrCodeUrl(null);
    setAmount('');
    
    if (data) {
      onPaymentSuccess({
        amount: data.amount,
        customerName: data.customerName,
        receiptNumber: data.invoiceNumber || `VTK-${Date.now().toString().slice(-6)}`,
      });
    }
  };

  if (showSuccess && successData) {
    return (
      <PaymentSuccessAnimation
        amount={successData.amount}
        receiptNumber={successData.receiptNumber}
        tenant={tenant}
        onClose={() => {
          setShowSuccess(false);
          setSuccessData(null);
          onClose();
        }}
      />
    );
  }

  return (
    <>
      {/* Payment Received Overlay (from realtime listener) - Full Screen Glassmorphism */}
      {showPaymentReceived && paymentData && (
        <PaymentReceivedOverlay
          isVisible={showPaymentReceived}
          amount={paymentData.amount}
          invoiceNumber={paymentData.invoiceNumber}
          customerName={paymentData.customerName}
          onClose={handlePaymentReceivedClose}
        />
      )}

      <AnimatePresence>
        {isOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: showPaymentReceived ? 0.4 : 1 }}
              exit={{ opacity: 0 }}
              onClick={onClose}
              className="fixed inset-0 bg-black/80 backdrop-blur-md z-50"
            />

            {/* Terminal Modal - Calculator Style */}
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: showPaymentReceived ? 0.5 : 1, scale: 1 }}
              exit={{ opacity: 0, scale: 0.95 }}
              className="fixed inset-0 z-50 flex items-center justify-center p-4 pointer-events-none overflow-y-auto"
              onClick={(e) => e.stopPropagation()}
            >
            <div className="bg-slate-900 rounded-3xl shadow-2xl max-w-md w-full max-h-[95vh] overflow-y-auto pointer-events-auto my-auto">
              {/* Header */}
              <div className="bg-slate-800 px-6 py-4 flex items-center justify-between border-b border-slate-700">
                <div className="flex items-center gap-3">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-1.5 border border-white/20">
                    <img
                      src="/logo.png"
                      alt="VantakOS - No more gatekeeping"
                      className="h-6 w-auto"
                    />
                  </div>
                  <div>
                    <h2 className="text-lg font-black text-white">Vantak Terminal</h2>
                    <p className="text-xs text-slate-400 font-medium">{tenant.business_name}</p>
                  </div>
                </div>
                <button
                  onClick={onClose}
                  className="p-2 hover:bg-slate-700 rounded-lg transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              {/* Display Area */}
              <div className="bg-slate-950 p-8 min-h-[200px] flex flex-col items-center justify-center">
                {qrCodeUrl ? (
                  <motion.div
                    initial={{ scale: 0.8, opacity: 0 }}
                    animate={{ scale: 1, opacity: 1 }}
                    className="flex flex-col items-center space-y-4"
                  >
                    {/* Business Logo Above QR Code */}
                    <motion.div
                      initial={{ y: -20, opacity: 0 }}
                      animate={{ y: 0, opacity: 1 }}
                      transition={{ delay: 0.2 }}
                      className="mb-2"
                    >
                      <img
                        src={tenant.logoUrl}
                        alt={tenant.business_name}
                        className="w-16 h-16 rounded-xl object-cover shadow-lg ring-2 ring-white/10"
                      />
                    </motion.div>

                    {/* QR Code */}
                    <div className="relative bg-white p-4 rounded-2xl shadow-2xl">
                      <QRCodeSVG 
                        value={qrCodeUrl} 
                        size={280} 
                        level="H"
                        className="rounded-xl"
                      />
                      {/* Logo overlay in center of QR code */}
                      <div className="absolute inset-0 flex items-center justify-center pointer-events-none">
                        <div className="bg-white rounded-xl p-2 shadow-lg flex flex-col items-center gap-1">
                          {tenant.logoUrl && (
                            <img
                              src={tenant.logoUrl}
                              alt={tenant.business_name}
                              className="w-10 h-10 rounded-lg object-cover"
                            />
                          )}
                          <img
                            src="/logo.png"
                            alt="VantakOS - No more gatekeeping"
                            className="h-3 w-auto opacity-60"
                          />
                        </div>
                      </div>
                    </div>

                    <div className="text-center space-y-1">
                      <p className="text-white font-black text-2xl">${parseFloat(amount).toFixed(2)}</p>
                      <p className="text-slate-400 text-sm font-medium">Scan to pay</p>
                    </div>

                    {/* BNPL Badge - Elite Tier Only */}
                    {tenant.tier === 'elite' && (
                      <div className="bg-gradient-to-br from-sky-900/50 to-purple-900/50 border border-sky-500/30 rounded-xl p-3 text-center">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-black text-sky-300 uppercase tracking-widest">Financing Available</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-tight">
                          Get paid in full today. Customer pays over time. <span className="font-black text-white">Zero risk to you.</span>
                        </p>
                      </div>
                    )}

                    <button
                      onClick={() => {
                        setQrCodeUrl(null);
                        setAmount('');
                      }}
                      className="px-6 py-2 bg-slate-700 hover:bg-slate-600 text-white rounded-xl font-semibold text-sm transition-colors"
                    >
                      New Payment
                    </button>
                  </motion.div>
                ) : (
                  <>
                    {/* Calculator Display */}
                    <div className="w-full mb-6">
                      <div className="bg-slate-900 rounded-2xl p-6 border border-slate-700">
                        <div className="text-right">
                          <div className="text-slate-400 text-sm font-medium mb-1">Amount</div>
                          <div className="text-white text-6xl font-black tracking-tight font-mono">
                            {amount || '0.00'}
                          </div>
                          <div className="text-slate-500 text-xs font-medium mt-2">$</div>
                        </div>
                      </div>
                    </div>

                    {/* Calculator Keypad */}
                    <div className="grid grid-cols-3 gap-3 w-full max-w-xs">
                      {[
                        { label: '1', value: '1' },
                        { label: '2', value: '2' },
                        { label: '3', value: '3' },
                        { label: '4', value: '4' },
                        { label: '5', value: '5' },
                        { label: '6', value: '6' },
                        { label: '7', value: '7' },
                        { label: '8', value: '8' },
                        { label: '9', value: '9' },
                        { label: '.', value: '.' },
                        { label: '0', value: '0' },
                        { label: '⌫', value: 'backspace', action: handleBackspace },
                      ].map((key) => (
                        <button
                          key={key.label}
                          onClick={() => key.action ? key.action() : handleNumberPress(key.value)}
                          className={`aspect-square rounded-xl font-black text-xl transition-all active:scale-95 ${
                            key.value === 'backspace'
                              ? 'bg-slate-700 hover:bg-slate-600 text-white'
                              : 'bg-slate-800 hover:bg-slate-700 text-white border border-slate-700'
                          }`}
                        >
                          {key.label}
                        </button>
                      ))}
                    </div>

                    {/* BNPL Badge - Elite Tier Only, show when amount is entered */}
                    {tenant.tier === 'elite' && amount && parseFloat(amount) > 0 && (
                      <div className="bg-gradient-to-br from-sky-900/50 to-purple-900/50 border border-sky-500/30 rounded-xl p-3 text-center mb-4 max-w-xs">
                        <div className="flex items-center justify-center gap-2 mb-1">
                          <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1M21 12a9 9 0 11-18 0 9 9 0 0118 0z" />
                          </svg>
                          <span className="text-xs font-black text-sky-300 uppercase tracking-widest">Financing Available</span>
                        </div>
                        <p className="text-[10px] text-slate-300 font-medium leading-tight">
                          Get paid in full today. Customer pays over time. <span className="font-black text-white">Zero risk to you.</span>
                        </p>
                      </div>
                    )}

                    {/* Control Buttons */}
                    <div className="flex gap-3 w-full max-w-xs mt-4">
                      <button
                        onClick={handleClear}
                        className="flex-1 bg-slate-700 hover:bg-slate-600 text-white py-4 rounded-xl font-black text-sm transition-all active:scale-95"
                      >
                        Clear
                      </button>
                      <button
                        onClick={handleCharge}
                        disabled={isProcessing || !amount || parseFloat(amount) <= 0}
                        className="flex-[2] bg-gradient-to-br from-emerald-500 to-emerald-600 hover:from-emerald-400 hover:to-emerald-500 text-white py-4 rounded-xl font-black text-xl transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed active:scale-95 flex items-center justify-center gap-2"
                      >
                        {isProcessing ? (
                          <>
                            <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                            Processing...
                          </>
                        ) : (
                          <>
                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 4v16m8-8H4" />
                            </svg>
                            CHARGE
                          </>
                        )}
                      </button>
                    </div>
                  </>
                )}
              </div>
            </div>
          </motion.div>
        </>
      )}
    </AnimatePresence>
    </>
  );
};
