import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';
import { ExpenseTracker } from './ExpenseTracker';
import { MileageLog } from './dashboard/MileageLog';
import { UpgradeModal } from './UpgradeModal';
import { hasBusinessSuiteAccess } from '../lib/tierGating';
import { generateLedgerCSV, generateLedgerFilename, downloadCSV } from '../lib/ledgerCSV';
import { supabase } from '../services/supabase';

interface TheLedgerProps {
  tenant: TenantConfig;
}

export const TheLedger: React.FC<TheLedgerProps> = ({ tenant }) => {
  const [activeView, setActiveView] = useState<'expenses' | 'mileage'>('expenses');
  const [isExporting, setIsExporting] = useState(false);
  const [monthlyMileageTotal, setMonthlyMileageTotal] = useState<number>(0);
  const [showUpgradeModal, setShowUpgradeModal] = useState(false);

  // Access Check: Business Suite (Elite/Business tier) required
  if (!hasBusinessSuiteAccess(tenant.tier)) {
    const handleClose = () => {
      // Redirect to dashboard (overview will be the default view)
      const urlParams = new URLSearchParams(window.location.search);
      const tenantSlug = urlParams.get('tenant') || tenant.slug;
      window.location.href = `/dashboard?tenant=${tenantSlug}`;
    };

    const handleUpgrade = () => {
      // Close the modal and show upgrade flow
      handleClose();
      // TODO: Implement upgrade flow - redirect to upgrade page or trigger upgrade API
    };

    return (
      <div className="min-h-screen bg-slate-950 py-12 px-4 sm:px-6 lg:px-8">
        <div className="max-w-4xl mx-auto">
          {/* Informational Header */}
          <div className="mb-8">
            <div className="flex items-center gap-3 mb-4">
              <div className="w-12 h-12 bg-sky-500/20 rounded-xl flex items-center justify-center">
                <svg className="w-6 h-6 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h1 className="text-3xl font-black text-white">The Ledger</h1>
            </div>
            <p className="text-lg text-slate-300 leading-relaxed">
              Your complete business expense and mileage tracking system. The Ledger helps you organize every business expense, track mileage, and maintain detailed records throughout the year. Export everything to CSV for your accountant with one click.
            </p>
          </div>

          {/* Feature Cards */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mb-8">
            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17 9V7a2 2 0 00-2-2H5a2 2 0 00-2 2v6a2 2 0 002 2h2m2 4h10a2 2 0 002-2v-6a2 2 0 00-2-2H9a2 2 0 00-2 2v6a2 2 0 002 2zm7-5a2 2 0 11-4 0 2 2 0 014 0z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Track Expenses</h3>
              <p className="text-slate-400 text-sm">
                Log every business expense with categories, amounts, dates, and notes. Keep receipts organized and ready for tax season.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 20l-5.447-2.724A1 1 0 013 16.382V5.618a1 1 0 011.447-.894L9 7m0 13l6-3m-6 3V7m6 10l4.553 2.276A1 1 0 0021 18.382V7.618a1 1 0 00-.553-.894L15 4m0 13V4m0 0L9 7" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Mileage Log</h3>
              <p className="text-slate-400 text-sm">
                Record business trips with purpose, distance, and notes. Automatically calculate totals for easy tax deductions.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Export to CSV</h3>
              <p className="text-slate-400 text-sm">
                Download your complete business history as a professional CSV file. Perfect for your accountant or tax preparation.
              </p>
            </div>

            <div className="bg-slate-900/50 border border-slate-800 rounded-xl p-6">
              <div className="w-10 h-10 bg-sky-500/20 rounded-lg flex items-center justify-center mb-4">
                <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-black text-white mb-2">Year-Round Tracking</h3>
              <p className="text-slate-400 text-sm">
                Maintain organized records all year long. Never lose track of a business expense or mileage entry again.
              </p>
            </div>
          </div>

          {/* Upgrade CTA */}
          <div className="bg-gradient-to-r from-sky-500/20 to-blue-500/20 border-2 border-sky-500/50 rounded-2xl p-8 backdrop-blur-sm">
            <div className="text-center space-y-6">
              <div>
                <h2 className="text-2xl font-black text-white mb-2">Unlock The Ledger</h2>
                <p className="text-slate-300">
                  Upgrade to Business Suite to access The Ledger and all premium features
                </p>
              </div>

              <div className="flex items-center justify-center gap-6">
                <button
                  onClick={() => setShowUpgradeModal(true)}
                  className="px-8 py-4 bg-sky-500 hover:bg-sky-600 text-white rounded-xl font-black text-lg transition-all shadow-lg shadow-sky-500/20 hover:shadow-xl hover:shadow-sky-500/30"
                >
                  Upgrade to Business Suite
                </button>
                <button
                  onClick={handleClose}
                  className="px-6 py-4 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all"
                >
                  Back to Dashboard
                </button>
              </div>

              <div className="text-sm text-slate-400">
                <p className="font-semibold mb-2">Business Suite includes:</p>
                <ul className="space-y-1 text-left max-w-md mx-auto">
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Everything in Pro: Recurring appointments, unlimited AI support
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    The Ledger: Complete expense and mileage tracking
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Lowest transaction fees: Just 0.4% per transaction
                  </li>
                  <li className="flex items-center gap-2">
                    <svg className="w-4 h-4 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                    </svg>
                    Priority support and advanced analytics
                  </li>
                </ul>
              </div>
            </div>
          </div>
        </div>

        {/* Upgrade Modal */}
        <UpgradeModal
          isOpen={showUpgradeModal}
          onClose={() => setShowUpgradeModal(false)}
          featureName="The Ledger"
          currentTier={tenant.tier || 'starter'}
          targetTier="Business Suite"
          benefits={[
            'Everything in Pro: Recurring appointments, unlimited AI support.',
            'The Ledger: Track miles, expenses, and receipts all year. Download CSV files for your accountant in one click.',
            'Lowest transaction fees: Just 0.4% per transaction (vs 1.0% on Pro or 1.5% on Starter).',
            'Advanced features: Priority support, advanced analytics, and exclusive Business Suite tools.',
          ]}
          price="$79"
        />
      </div>
    );
  }

  const handleDownloadRecords = async () => {
    setIsExporting(true);
    try {
      const year = new Date().getFullYear();
      
      // Fetch all expenses and mileage logs for current year (including notes)
      const [expensesResult, mileageResult] = await Promise.all([
        supabase
          .from('expenses')
          .select('date, category, amount, notes')
          .eq('tenant_id', tenant.id)
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`)
          .order('date', { ascending: false }),
        supabase
          .from('mileage_logs')
          .select('date, purpose, total_miles, notes')
          .eq('tenant_id', tenant.id)
          .gte('date', `${year}-01-01`)
          .lte('date', `${year}-12-31`)
          .order('date', { ascending: false }),
      ]);

      const expenses = expensesResult.data || [];
      const mileageLogs = mileageResult.data || [];

      // Generate professional CSV using utility function
      const csvContent = generateLedgerCSV({
        expenses: expenses.map(e => ({
          date: e.date,
          category: e.category,
          amount: e.amount,
          notes: e.notes,
        })),
        mileageLogs: mileageLogs.map(m => ({
          date: m.date,
          purpose: m.purpose,
          total_miles: m.total_miles,
          notes: m.notes,
        })),
        businessName: tenant.name || 'Business',
        year,
      });

      // Generate professional filename
      const filename = generateLedgerFilename(tenant.name || 'Business', year);
      
      // Export the records as CSV
      downloadCSV(filename, csvContent);

      alert(`Business history for ${year} exported! Check your downloads folder.`);
    } catch (err: any) {
      console.error('Export error:', err);
      alert('Failed to export business history. Please try again.');
    } finally {
      setIsExporting(false);
    }
  };


  const fetchMonthlyMileageTotal = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('total_miles')
      .eq('tenant_id', tenant.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (!error && data) {
      const total = data
        .filter(entry => entry.total_miles !== null)
        .reduce((sum, entry) => sum + (entry.total_miles || 0), 0);
      setMonthlyMileageTotal(total);
    }
  };

  useEffect(() => {
    fetchMonthlyMileageTotal();
  }, [tenant.id, activeView]); // Refresh when switching tabs or tenant changes

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="min-h-screen bg-slate-50">
      <motion.div
        {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, transition: { duration: 0.3 }, className: "max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 lg:py-12" } as any)}
      >
        {/* Header Section with Download Button */}
        <div className="mb-8 flex items-start justify-between gap-6">
          <div className="flex-1">
            <h1 className="text-4xl font-black text-slate-900 tracking-tight mb-3">
              The Ledger: Your Business History, Centralized.
            </h1>
            <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mb-6">
              Every mile, every receipt, every record. One elegant stack for the organized entrepreneur.
            </p>
            
            {/* Feature Points */}
            <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mt-6">
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 mb-1 text-sm">Instant Capture.</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">Snap and save receipts to your private vault in seconds.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 mb-1 text-sm">Precision Logs.</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">Record every mile and every expense as it happens.</p>
              </div>
              <div className="bg-white rounded-xl border border-slate-200 p-4">
                <div className="w-10 h-10 rounded-lg bg-slate-100 flex items-center justify-center mb-3">
                  <svg className="w-5 h-5 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z" />
                  </svg>
                </div>
                <h3 className="font-black text-slate-900 mb-1 text-sm">Complete Sovereignty.</h3>
                <p className="text-xs text-slate-600 font-medium leading-relaxed">Your business records, organized and ready whenever you need them.</p>
              </div>
            </div>
          </div>
          
          {/* Export Button - Top Right */}
          <div className="flex-shrink-0">
            <button
              onClick={handleDownloadRecords}
              disabled={isExporting}
              className="px-6 py-3 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-sm transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center gap-3 whitespace-nowrap"
            >
              {isExporting ? (
                <>
                  <div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                  Exporting...
                </>
              ) : (
                <>
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 10v6m0 0l-3-3m3 3l3-3m2 8H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                  Export Records
                </>
              )}
            </button>
          </div>
        </div>

        {/* Tab System */}
        <div className="mb-8">
          <div className="flex gap-1 border-b border-slate-200">
            <button
              onClick={() => setActiveView('expenses')}
              className={`relative px-6 py-4 font-bold text-sm transition-all ${
                activeView === 'expenses'
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
                Business Expenses
              </span>
              {activeView === 'expenses' && (
                <motion.div
                  {...({ layoutId: "activeTab", className: "absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-t-full", initial: false, transition: { type: 'spring', stiffness: 500, damping: 30 } } as any)}
                />
              )}
            </button>
            <button
              onClick={() => setActiveView('mileage')}
              className={`relative px-6 py-4 font-bold text-sm transition-all ${
                activeView === 'mileage'
                  ? 'text-slate-900'
                  : 'text-slate-500 hover:text-slate-700'
              }`}
            >
              <span className="flex items-center gap-2">
                <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                </svg>
                Mileage Logs
              </span>
              {activeView === 'mileage' && (
                <motion.div
                  {...({ layoutId: "activeTab", className: "absolute bottom-0 left-0 right-0 h-1 bg-slate-900 rounded-t-full", initial: false, transition: { type: 'spring', stiffness: 500, damping: 30 } } as any)}
                />
              )}
            </button>
          </div>
        </div>

        {/* Content with Smooth Transitions */}
        <AnimatePresence mode="wait">
          <motion.div
            key={activeView}
            initial={{ opacity: 0, y: 10 }}
            animate={{ opacity: 1, y: 0 }}
            exit={{ opacity: 0, y: -10 }}
            transition={{ duration: 0.2 }}
          >
            {activeView === 'expenses' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <ExpenseTracker tenant={tenant} />
              </div>
            )}
            {activeView === 'mileage' && (
              <div className="bg-white rounded-2xl shadow-sm border border-slate-200 p-6 lg:p-8">
                <MileageLog tenant={tenant} onEntrySaved={fetchMonthlyMileageTotal} />
              </div>
            )}
          </motion.div>
        </AnimatePresence>
      </motion.div>

      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="The Ledger"
        currentTier={tenant.tier || 'starter'}
        targetTier="Business Suite"
        benefits={[
          'Stop hunting for lost receipts and missing logs',
          'Keep your business history in one secure, elegant stack',
          'From mileage to expenses, all records organized and vaulted',
          'Ready exactly when you need them',
        ]}
        price="$79/mo"
      />
    </div>
  );
};

