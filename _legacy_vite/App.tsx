
import React, { useState, useEffect, useRef } from 'react';
import { resolveTenant } from './services/tenantService';
import { TenantConfig, Service } from './types';
import { Layout } from './components/Layout';
import { BookingFlow } from './components/BookingFlow';
import { OwnerDashboard } from './components/OwnerDashboard';
import { ThemeProvider } from './components/shared/ThemeProvider';
import { LandingPage } from './components/LandingPage';
import { AdminProspector } from './components/AdminProspector';
import { PitchPreview } from './components/PitchPreview';
import { ClaimOnboarding } from './components/ClaimOnboarding';
import { MOCK_SERVICES } from './constants';
import { motion, AnimatePresence } from 'framer-motion';

const App: React.FC = () => {
  const [tenant, setTenant] = useState<TenantConfig | null>(null);
  const [services, setServices] = useState<Service[]>([]);
  const [view, setView] = useState<'home' | 'book' | 'admin' | 'prospector' | 'preview' | 'claim'>('home');
  const [showConfetti, setShowConfetti] = useState(false);
  const isInitialized = useRef(false);

  useEffect(() => {
    // Prevent re-initialization if already initialized
    if (isInitialized.current) return;
    
    const initApp = async () => {
      const path = window.location.pathname;
      const params = new URLSearchParams(window.location.search);
      
      // Check if we have a persisted view in sessionStorage
      const persistedView = sessionStorage.getItem('vantak_current_view');
      
      // Determine View based on Route
      let initialView: 'home' | 'book' | 'admin' | 'prospector' | 'preview' | 'claim' = 'home';
      
      if (path === '/admin/prospector') {
        initialView = 'prospector';
      } else if (path === '/preview') {
        initialView = 'preview';
      } else if (path === '/claim') {
        initialView = 'claim';
      } else if (params.get('view') === 'admin') {
        initialView = 'admin';
      } else if (persistedView && ['home', 'book', 'admin', 'prospector', 'preview', 'claim'].includes(persistedView)) {
        // Restore persisted view if no explicit route
        initialView = persistedView as typeof initialView;
      }

      setView(initialView);
      sessionStorage.setItem('vantak_current_view', initialView);

      // Handle successful onboarding return from Stripe
      if (params.get('onboarded') === 'true') {
        setShowConfetti(true);
        // Clean URL without refresh
        window.history.replaceState({}, document.title, window.location.pathname + (params.get('tenant') ? `?tenant=${params.get('tenant')}` : ''));
        setTimeout(() => setShowConfetti(false), 6000);
      }

      const config = await resolveTenant();
      setTenant(config);
      setServices(MOCK_SERVICES[config.id] || []);
      
      isInitialized.current = true;
    };

    initApp();
  }, []); // Keep empty array - only run once on mount

  // Persist view changes to sessionStorage
  useEffect(() => {
    if (view && isInitialized.current) {
      sessionStorage.setItem('vantak_current_view', view);
    }
  }, [view]);

  if (!tenant) return (
    <div className="min-h-screen flex flex-col items-center justify-center bg-[#0F172A] text-white">
      <motion.div 
        animate={{ scale: [1, 1.1, 1], opacity: [0.5, 1, 0.5] }}
        transition={{ duration: 2, repeat: Infinity }}
        className="w-16 h-16 bg-sky-500 rounded-2xl flex items-center justify-center text-[#0F172A] font-black text-2xl mb-6 shadow-2xl shadow-sky-500/20"
      >V</motion.div>
      <span className="font-black text-[10px] uppercase tracking-[0.4em] text-slate-500">
        Handshaking VantakOS...
      </span>
    </div>
  );

  const renderContent = () => {
    switch (view) {
      case 'home':
        return (
          <LandingPage 
            tenant={tenant} 
            services={services} 
            onBookNow={() => setView('book')}
            onSelectService={() => setView('book')}
          />
        );
      case 'book':
        return <BookingFlow tenant={tenant} />;
      case 'admin':
        return <OwnerDashboard tenant={tenant} onUpdateConfig={setTenant} />;
      case 'prospector':
        return <AdminProspector />;
      case 'preview':
        return <PitchPreview tenant={tenant} />;
      case 'claim':
        return <ClaimOnboarding tenant={tenant} />;
      default:
        return <div className="p-20 text-center font-bold">404 - OS Registry Error</div>;
    }
  };

  return (
    <ThemeProvider tenantConfig={tenant}>
      <AnimatePresence>
        {showConfetti && (
          <motion.div 
            initial={{ opacity: 0, scale: 0.9 }}
            animate={{ opacity: 1, scale: 1 }}
            exit={{ opacity: 0 }}
            className="fixed inset-0 z-[500] pointer-events-none flex items-center justify-center bg-[#0F172A]/80 backdrop-blur-md"
          >
            <div className="bg-white p-16 rounded-[4rem] shadow-2xl text-center space-y-6 border border-white/20 max-w-lg mx-6">
              <div className="w-20 h-20 bg-emerald-500 rounded-3xl mx-auto flex items-center justify-center text-white text-4xl shadow-2xl shadow-emerald-500/30">✓</div>
              <div className="space-y-2">
                <h2 className="text-4xl font-black text-slate-900 tracking-tighter">OS Activated.</h2>
                <p className="text-slate-500 font-medium">Your brand is now live and accepting payments on the Vantak Network.</p>
              </div>
              <button 
                className="pointer-events-auto bg-[#0F172A] text-white px-10 py-5 rounded-2xl font-black uppercase tracking-widest text-xs"
                onClick={() => setShowConfetti(false)}
              >
                Enter Dashboard
              </button>
            </div>
          </motion.div>
        )}
      </AnimatePresence>

      {['home', 'book'].includes(view) ? (
        <Layout tenant={tenant} onNavigate={(v: any) => setView(v)}>
          {renderContent()}
        </Layout>
      ) : renderContent()}

      {/* Internal Navigation Controls */}
      <div className="fixed bottom-8 right-8 z-[100] flex flex-col gap-4">
        {view !== 'prospector' && (
          <button 
            onClick={() => { window.location.href = '/admin/prospector'; }}
            className="bg-[#0F172A] text-white h-16 px-8 rounded-2xl text-[10px] font-black shadow-2xl uppercase tracking-[0.2em] hover:scale-105 active:scale-95 transition-all flex items-center gap-4 border border-white/10"
          >
            <span className="w-2 h-2 rounded-full bg-sky-400 animate-pulse" />
            New Prospect
          </button>
        )}
        <button 
          onClick={() => {
            const newView = view === 'admin' ? 'home' : 'admin';
            setView(newView);
            sessionStorage.setItem('vantak_current_view', newView);
          }}
          className="bg-white text-slate-900 h-16 px-8 rounded-2xl text-[10px] font-black shadow-xl flex items-center gap-4 hover:bg-slate-50 transition-all uppercase tracking-[0.2em] border border-slate-200"
        >
          {view === 'admin' ? '👁 View Store' : '⚙️ Manage OS'}
        </button>
      </div>
    </ThemeProvider>
  );
};

export default App;
