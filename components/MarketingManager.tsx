import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';

interface Subscriber {
  id: string;
  email: string;
  first_name: string | null;
  source: string;
  created_at: string;
}

interface MarketingManagerProps {
  tenant: TenantConfig;
}

export const MarketingManager: React.FC<MarketingManagerProps> = ({ tenant }) => {
  const [subscribers, setSubscribers] = useState<Subscriber[]>([]);
  const [isGenerating, setIsGenerating] = useState(false);
  const [generatedNewsletter, setGeneratedNewsletter] = useState<string>('');
  const [showPreview, setShowPreview] = useState(false);

  useEffect(() => {
    fetchSubscribers();
  }, [tenant.id]);

  const fetchSubscribers = async () => {
    const { data, error } = await supabase
      .from('subscribers')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching subscribers:', error);
    } else {
      setSubscribers(data || []);
    }
  };

  const generateNewsletter = async () => {
    setIsGenerating(true);
    try {
      // Fetch recent products/services for context
      const { data: products } = await supabase
        .from('products')
        .select('name, description')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const { data: services } = await supabase
        .from('services')
        .select('name, description')
        .eq('tenant_id', tenant.id)
        .order('created_at', { ascending: false })
        .limit(5);

      const context = {
        businessName: tenant.name,
        products: products || [],
        services: services || [],
        subscriberCount: subscribers.length,
      };

      const response = await fetch('/api/marketing/generate-newsletter', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ tenantId: tenant.id, context }),
      });

      const data = await response.json();

      if (data.newsletter) {
        setGeneratedNewsletter(data.newsletter);
        setShowPreview(true);
      } else {
        throw new Error(data.error || 'Failed to generate newsletter');
      }
    } catch (err: any) {
      console.error('Newsletter generation error:', err);
      alert(`Failed to generate newsletter: ${err.message}`);
    } finally {
      setIsGenerating(false);
    }
  };

  return (
    <motion.div
      {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            Marketing Engine
          </h2>
          <p className="text-slate-500 font-medium">
            Build your email list and engage customers with AI-powered newsletters
          </p>
        </div>
        <button
          onClick={generateNewsletter}
          disabled={isGenerating || subscribers.length === 0}
          className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3"
        >
          {isGenerating ? (
            <>
              <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
              Generating...
            </>
          ) : (
            <>
              <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 10V3L4 14h7v7l9-11h-7z" />
              </svg>
              Generate AI Update
            </>
          )}
        </button>
      </div>

      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Total Subscribers
          </div>
          <div className="text-3xl font-black text-slate-900">{subscribers.length}</div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            From Checkout
          </div>
          <div className="text-3xl font-black text-slate-900">
            {subscribers.filter(s => s.source === 'checkout').length}
          </div>
        </div>
        <div className="bg-white p-6 rounded-2xl border border-slate-200 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            From Popup
          </div>
          <div className="text-3xl font-black text-slate-900">
            {subscribers.filter(s => s.source === 'popup').length}
          </div>
        </div>
      </div>

      {/* Subscribers List */}
      <div className="bg-white rounded-3xl border border-slate-200 shadow-sm overflow-hidden">
        <div className="p-6 border-b border-slate-100">
          <h3 className="text-lg font-black text-slate-900">Email List</h3>
        </div>
        <div className="divide-y divide-slate-100">
          {subscribers.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 8l7.89 5.26a2 2 0 002.22 0L21 8M5 19h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v10a2 2 0 002 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No subscribers yet</p>
              <p className="text-sm text-slate-400 mt-2">Subscribers will appear here when they sign up via checkout or popup</p>
            </div>
          ) : (
            subscribers.map((subscriber) => (
              <div key={subscriber.id} className="p-6 hover:bg-slate-50 transition-colors">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-4">
                    <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-bold">
                      {(subscriber.first_name || subscriber.email)[0].toUpperCase()}
                    </div>
                    <div>
                      <div className="font-bold text-slate-900">
                        {subscriber.first_name || 'No name'}
                      </div>
                      <div className="text-sm text-slate-500">{subscriber.email}</div>
                    </div>
                  </div>
                  <div className="flex items-center gap-4">
                    <span className="text-xs font-bold text-slate-400 uppercase tracking-wider bg-slate-100 px-3 py-1.5 rounded-full">
                      {subscriber.source}
                    </span>
                    <span className="text-xs text-slate-400">
                      {new Date(subscriber.created_at).toLocaleDateString()}
                    </span>
                  </div>
                </div>
              </div>
            ))
          )}
        </div>
      </div>

      {/* Newsletter Preview Modal */}
      <AnimatePresence>
        {showPreview && generatedNewsletter && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              {...({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl shadow-2xl max-w-3xl w-full max-h-[90vh] overflow-y-auto" } as any)}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">AI Newsletter Preview</h3>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>
                <div className="prose max-w-none">
                  <div className="bg-slate-50 rounded-2xl p-8 border border-slate-200 whitespace-pre-wrap font-medium text-slate-700 leading-relaxed">
                    {generatedNewsletter}
                  </div>
                </div>
                <div className="flex gap-4 mt-8">
                  <button
                    onClick={() => {
                      navigator.clipboard.writeText(generatedNewsletter);
                      alert('Newsletter copied to clipboard!');
                    }}
                    className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                  >
                    Copy to Clipboard
                  </button>
                  <button
                    onClick={() => setShowPreview(false)}
                    className="flex-1 px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all"
                  >
                    Close
                  </button>
                </div>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


