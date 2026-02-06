'use client';

import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';

interface PaymentSuccessAnimationProps {
  amount: number;
  receiptNumber: string;
  customerName?: string;
  tenant: TenantConfig;
  onClose: () => void;
}

export const PaymentSuccessAnimation: React.FC<PaymentSuccessAnimationProps> = ({
  amount,
  receiptNumber,
  customerName,
  tenant,
  onClose,
}) => {
  const [showReceiptOptions, setShowReceiptOptions] = useState(false);
  const [receiptSent, setReceiptSent] = useState<'email' | 'sms' | null>(null);
  const [contact, setContact] = useState('');
  const [isSending, setIsSending] = useState(false);

  // Play success sound on mount - Apple-style 'Ding'
  useEffect(() => {
    // Create Apple-style 'Ding' sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  // Play success sound on mount
  useEffect(() => {
    // Create Apple-style 'Ding' sound using Web Audio API
    const audioContext = new (window.AudioContext || (window as any).webkitAudioContext)();
    const oscillator = audioContext.createOscillator();
    const gainNode = audioContext.createGain();

    oscillator.connect(gainNode);
    gainNode.connect(audioContext.destination);

    oscillator.frequency.value = 800;
    oscillator.type = 'sine';

    gainNode.gain.setValueAtTime(0.3, audioContext.currentTime);
    gainNode.gain.exponentialRampToValueAtTime(0.01, audioContext.currentTime + 0.3);

    oscillator.start(audioContext.currentTime);
    oscillator.stop(audioContext.currentTime + 0.3);
  }, []);

  const handleSendReceipt = async (method: 'email' | 'sms') => {
    if (!contact.trim()) {
      alert(`Please enter a ${method === 'email' ? 'email address' : 'phone number'}`);
      return;
    }

    setIsSending(true);
    try {
      const response = await fetch('/api/terminal/send-receipt', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          tenantId: tenant.id,
          receiptNumber,
          amount,
          customerName: customerName || 'Customer',
          contact: contact.trim(),
          method,
        }),
      });

      const data = await response.json();
      if (data.error) throw new Error(data.error);

      setReceiptSent(method);
      setTimeout(() => {
        onClose();
      }, 2000);
    } catch (err: any) {
      console.error('Failed to send receipt:', err);
      alert(err.message || 'Failed to send receipt');
    } finally {
      setIsSending(false);
    }
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 z-50 flex items-center justify-center p-4"
    >
      {/* Success Animation */}
      <motion.div
        initial={{ scale: 0.8, opacity: 0 }}
        animate={{ scale: 1, opacity: 1 }}
        transition={{ type: 'spring', stiffness: 200, damping: 20 }}
        className="text-center space-y-8 max-w-md w-full"
      >
        {/* Pioneer Badge Animation */}
        <motion.div
          initial={{ scale: 0, rotate: -180 }}
          animate={{ scale: 1, rotate: 0 }}
          transition={{ delay: 0.2, type: 'spring', stiffness: 200 }}
          className="relative mx-auto w-32 h-32"
        >
          <div className="absolute inset-0 bg-gradient-to-br from-sky-400 to-sky-600 rounded-full animate-pulse shadow-2xl" />
          <div className="absolute inset-2 bg-slate-900 rounded-full flex items-center justify-center">
            <span className="text-5xl font-black text-white">V</span>
          </div>
          {/* Shimmer effect */}
          <motion.div
            animate={{
              x: ['-100%', '100%'],
            }}
            transition={{
              repeat: Infinity,
              duration: 2,
              ease: 'linear',
            }}
            className="absolute inset-0 bg-gradient-to-r from-transparent via-white/20 to-transparent rounded-full"
          />
        </motion.div>

        {/* Paid Text */}
        <motion.div
          initial={{ y: 20, opacity: 0 }}
          animate={{ y: 0, opacity: 1 }}
          transition={{ delay: 0.4 }}
          className="space-y-4"
        >
          <h1 className="text-6xl font-black text-white tracking-tight">PAID</h1>
          <p className="text-3xl font-black text-sky-400">${amount.toFixed(2)}</p>
          {customerName && (
            <p className="text-lg text-slate-400 font-medium">{customerName}</p>
          )}
          <p className="text-sm text-slate-500 font-semibold">Receipt: {receiptNumber}</p>
        </motion.div>

        {/* Receipt Options */}
        {!showReceiptOptions && !receiptSent && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            transition={{ delay: 0.6 }}
            className="space-y-4"
          >
            <p className="text-xl font-black text-white mb-6">Send Receipt?</p>
            <div className="flex gap-4">
              <button
                onClick={() => setShowReceiptOptions(true)}
                className="flex-1 bg-white/10 backdrop-blur-lg border border-white/20 text-white py-4 rounded-xl font-black text-lg hover:bg-white/20 transition-all shadow-xl"
              >
                Yes
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-700 text-white py-4 rounded-xl font-black text-lg hover:bg-slate-600 transition-all shadow-xl"
              >
                No
              </button>
            </div>
          </motion.div>
        )}

        {/* Receipt Input */}
        {showReceiptOptions && !receiptSent && (
          <motion.div
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            className="space-y-4 bg-white/10 backdrop-blur-lg border border-white/20 rounded-2xl p-6"
          >
            <div className="flex gap-2 mb-4">
              <button
                onClick={() => handleSendReceipt('email')}
                disabled={isSending}
                className="flex-1 bg-white/20 backdrop-blur-lg border border-white/30 text-white py-3 rounded-xl font-black text-sm hover:bg-white/30 transition-all disabled:opacity-50"
              >
                📧 Email
              </button>
              <button
                onClick={() => handleSendReceipt('sms')}
                disabled={isSending}
                className="flex-1 bg-white/20 backdrop-blur-lg border border-white/30 text-white py-3 rounded-xl font-black text-sm hover:bg-white/30 transition-all disabled:opacity-50"
              >
                💬 SMS
              </button>
            </div>
            <input
              type="text"
              value={contact}
              onChange={(e) => setContact(e.target.value)}
              placeholder="Email or Phone"
              className="w-full bg-white/10 border border-white/20 rounded-xl px-4 py-3 text-white placeholder-white/50 outline-none focus:ring-2 focus:ring-white/50 font-medium"
            />
            <div className="flex gap-2">
              <button
                onClick={() => setShowReceiptOptions(false)}
                className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-600 transition-all"
              >
                Back
              </button>
              <button
                onClick={onClose}
                className="flex-1 bg-slate-700 text-white py-3 rounded-xl font-semibold text-sm hover:bg-slate-600 transition-all"
              >
                Skip
              </button>
            </div>
          </motion.div>
        )}

        {/* Receipt Sent Confirmation */}
        {receiptSent && (
          <motion.div
            initial={{ scale: 0.8, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            className="space-y-4"
          >
            <div className="text-4xl mb-2">
              {receiptSent === 'email' ? '📧' : '💬'}
            </div>
            <p className="text-xl font-black text-white">
              Receipt sent via {receiptSent === 'email' ? 'Email' : 'SMS'}!
            </p>
          </motion.div>
        )}
      </motion.div>
    </motion.div>
  );
};

