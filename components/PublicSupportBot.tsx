'use client';

import React, { useState, useRef, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '@/types';

interface PublicSupportBotProps {
  tenant?: TenantConfig;
  isOpen: boolean;
  onClose: () => void;
}

export const PublicSupportBot: React.FC<PublicSupportBotProps> = ({ tenant, isOpen, onClose }) => {
  const [aiMessage, setAiMessage] = useState('');
  const [isAiTyping, setIsAiTyping] = useState(false);
  const [userMessageCount, setUserMessageCount] = useState(0);
  const MESSAGE_LIMIT = 5;
  const [aiChat, setAiChat] = useState<{role: 'user' | 'ai', text: string}[]>([
    { 
      role: 'ai', 
      text: `Welcome! I'm the Vantak Guide. I'm here to answer your questions about VantakOS and explain how our "$0 Monthly" offer works. 

What would you like to know about Pioneer status or our "You Craft, We Work" mission?` 
    }
  ]);
  const scrollRef = useRef<HTMLDivElement>(null);

  useEffect(() => {
    if (scrollRef.current) {
      scrollRef.current.scrollTop = scrollRef.current.scrollHeight;
    }
  }, [aiChat, isAiTyping]);

  const triggerAiResponse = async (text: string) => {
    if (isAiTyping || userMessageCount >= MESSAGE_LIMIT) return;
    
    setAiChat(prev => [...prev, { role: 'user', text }]);
    setUserMessageCount(prev => prev + 1);
    setIsAiTyping(true);

    try {
      const res = await fetch('/api/support/chat', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ 
          message: text,
          tenantContext: tenant || null,
          isPublic: true // Flag to indicate this is a public query
        }),
      });
      
      const data = await res.json();
      
      if (data.text) {
        setAiChat(prev => [...prev, { role: 'ai', text: data.text }]);
      } else {
        setAiChat(prev => [...prev, { 
          role: 'ai', 
          text: 'I apologize, but I encountered an error. Please try asking your question again or contact support@kcdevco.com for assistance.' 
        }]);
      }
    } catch (err) {
      setAiChat(prev => [...prev, { 
        role: 'ai', 
        text: 'Network error. Please check your connection and try again.' 
      }]);
    } finally {
      setIsAiTyping(false);
    }
  };

  const handleSendAi = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!aiMessage.trim() || userMessageCount >= MESSAGE_LIMIT) return;
    const msg = aiMessage;
    setAiMessage('');
    await triggerAiResponse(msg);
  };

  const copyEmailToClipboard = () => {
    navigator.clipboard.writeText('Support@vantakos.com');
    // Show a brief toast notification
    const toast = document.createElement('div');
    toast.className = 'fixed bottom-10 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-lg font-semibold text-sm z-[200] shadow-lg';
    toast.textContent = 'Email copied to clipboard!';
    document.body.appendChild(toast);
    setTimeout(() => toast.remove(), 2000);
  };

  // Quick action buttons for common questions
  const quickActions = [
    { label: 'Pioneer Status', question: 'What is Pioneer status and how does it work?' },
    { label: 'You Craft, We Work', question: 'What does "You Craft, We Work" mean?' },
    { label: '$0 Monthly', question: 'How does the $0 monthly offer work? Is there a catch?' },
  ];

  if (!isOpen) return null;

  return (
    <AnimatePresence>
      <motion.div
        initial={{ opacity: 0, y: 30, scale: 0.9 }}
        animate={{ opacity: 1, y: 0, scale: 1 }}
        exit={{ opacity: 0, y: 30, scale: 0.9 }}
        className="fixed inset-0 z-[100] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
        onClick={onClose}
      >
        <motion.div
          initial={{ opacity: 0, scale: 0.9 }}
          animate={{ opacity: 1, scale: 1 }}
          exit={{ opacity: 0, scale: 0.9 }}
          className="w-full max-w-2xl h-[80vh] max-h-[700px] bg-white border border-slate-200 rounded-lg shadow-2xl flex flex-col overflow-hidden"
          onClick={(e) => e.stopPropagation()}
        >
          {/* AI Header */}
          <div className="p-6 pb-4 flex items-center justify-between border-b border-slate-200 bg-slate-50">
            <div className="flex items-center gap-4">
              <div className="w-12 h-12 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">
                V
              </div>
              <div>
                <h4 className="text-sm font-black text-slate-900 uppercase tracking-widest">
                  Vantak Guide
                </h4>
                <div className="flex items-center gap-2">
                  <div className="w-2 h-2 bg-emerald-500 rounded-full" />
                  <span className="text-[10px] font-black text-slate-500 uppercase tracking-widest">
                    Online
                  </span>
                </div>
              </div>
            </div>
            <button 
              onClick={onClose} 
              className="w-10 h-10 rounded-lg bg-white hover:bg-slate-100 border border-slate-200 flex items-center justify-center transition-colors"
            >
              <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12"/>
              </svg>
            </button>
          </div>

          {/* AI Quick Actions */}
          <div className="px-6 py-4 flex gap-2 overflow-x-auto no-scrollbar border-b border-slate-200 bg-white">
            {quickActions.map((action, idx) => (
              <button 
                key={idx}
                onClick={() => triggerAiResponse(action.question)}
                className="flex items-center gap-2 whitespace-nowrap bg-white border border-slate-200 px-5 py-2.5 rounded-lg text-[11px] font-black uppercase tracking-widest text-slate-900 hover:bg-slate-900 hover:text-white transition-all"
              >
                {action.label}
              </button>
            ))}
          </div>

          {/* AI Chat Area */}
          <div 
            ref={scrollRef} 
            className="flex-grow p-6 overflow-y-auto space-y-5 bg-slate-50"
            style={{ scrollbarWidth: 'thin' }}
          >
            {aiChat.map((msg, i) => (
              <div key={i} className={`flex ${msg.role === 'user' ? 'justify-end' : 'justify-start'}`}>
                <div className={`max-w-[85%] px-6 py-4 rounded-lg text-sm font-medium leading-relaxed ${
                  msg.role === 'user' 
                    ? 'bg-slate-900 text-white' 
                    : 'bg-white text-slate-900 border border-slate-200 shadow-sm'
                }`}>
                  {msg.text}
                </div>
              </div>
            ))}

            {isAiTyping && (
              <div className="flex justify-start">
                <div className="bg-white border border-slate-200 px-6 py-4 rounded-lg flex items-center gap-4 shadow-sm">
                  <span className="text-[11px] font-black text-slate-500 uppercase tracking-[0.3em] animate-pulse">
                    Thinking
                  </span>
                  <div className="flex gap-1.5">
                    <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.3s]" />
                    <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce [animation-delay:-0.15s]" />
                    <span className="w-2 h-2 bg-slate-900 rounded-full animate-bounce" />
                  </div>
                </div>
              </div>
            )}

            {/* Message Limit Gate */}
            {userMessageCount >= MESSAGE_LIMIT && (
              <motion.div
                initial={{ opacity: 0, y: 10 }}
                animate={{ opacity: 1, y: 0 }}
                className="p-6 bg-amber-50 border-2 border-amber-200 rounded-lg space-y-4"
              >
                <div className="flex items-start gap-3">
                  <div className="w-6 h-6 bg-amber-500 rounded-full flex items-center justify-center shrink-0 mt-0.5">
                    <svg className="w-4 h-4 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-3L13.732 4c-.77-1.333-2.694-1.333-3.464 0L3.34 16c-.77 1.333.192 3 1.732 3z" />
                    </svg>
                  </div>
                  <div className="flex-grow">
                    <p className="text-sm font-semibold text-slate-900 mb-2">
                      You have reached the limit for the Vantak Guide.
                    </p>
                    <p className="text-sm text-slate-700 leading-relaxed mb-4">
                      To ensure your specific business needs are met, please email our founding team at{' '}
                      <a href="mailto:Support@vantakos.com" className="font-semibold text-slate-900 underline">
                        Support@vantakos.com
                      </a>
                      .
                    </p>
                    <button
                      onClick={copyEmailToClipboard}
                      className="inline-flex items-center gap-2 bg-slate-900 text-white px-5 py-2.5 rounded-lg text-sm font-semibold hover:bg-slate-800 transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 16H6a2 2 0 01-2-2V6a2 2 0 012-2h8a2 2 0 012 2v2m-6 12h8a2 2 0 002-2v-8a2 2 0 00-2-2h-8a2 2 0 00-2 2v8a2 2 0 002 2z" />
                      </svg>
                      Copy Email
                    </button>
                  </div>
                </div>
              </motion.div>
            )}
          </div>

          {/* AI Input Area */}
          <form onSubmit={handleSendAi} className="p-6 bg-white border-t border-slate-200 flex gap-4">
            <input 
              value={aiMessage}
              onChange={(e) => setAiMessage(e.target.value)}
              placeholder={userMessageCount >= MESSAGE_LIMIT ? "Message limit reached" : "Ask about Pioneer status, pricing, or how VantakOS works..."}
              disabled={userMessageCount >= MESSAGE_LIMIT}
              className="flex-grow bg-slate-50 border border-slate-200 px-6 py-4 rounded-lg text-slate-900 text-sm font-medium outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 placeholder:text-slate-400 transition-all disabled:opacity-50 disabled:cursor-not-allowed"
            />
            <button 
              type="submit"
              disabled={userMessageCount >= MESSAGE_LIMIT}
              className="bg-slate-900 text-white w-14 h-14 rounded-lg flex items-center justify-center hover:bg-slate-800 active:scale-95 transition-all shrink-0 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M14 5l7 7m0 0l-7 7m7-7H3"/>
              </svg>
            </button>
          </form>
        </motion.div>
      </motion.div>
    </AnimatePresence>
  );
};

