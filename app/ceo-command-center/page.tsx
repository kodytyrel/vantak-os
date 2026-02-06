'use client';

import { useEffect, useState } from 'react';
import { useRouter } from 'next/navigation';
import { createClient } from '@supabase/supabase-js';
import { 
  TrendingUp, 
  DollarSign, 
  Vault,
  Award,
  Shield,
  ArrowUpRight,
  ArrowDownRight
} from 'lucide-react';

const supabase = createClient(
  process.env.NEXT_PUBLIC_SUPABASE_URL || '',
  process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY || ''
);

interface MetricCardProps {
  title: string;
  value: string;
  subtitle?: string;
  icon: React.ReactNode;
  trend?: number;
}

const MetricCard: React.FC<MetricCardProps> = ({ title, value, subtitle, icon, trend }) => (
  <div className="bg-slate-800/80 backdrop-blur-xl border border-slate-700/50 rounded-2xl p-6 shadow-xl hover:shadow-2xl hover:border-sky-500/30 transition-all">
    <div className="flex items-start justify-between mb-4">
      <div className="p-3 bg-sky-500/10 rounded-xl border border-sky-500/20">
        {icon}
      </div>
      {trend !== undefined && (
        <div className={`flex items-center gap-1 text-xs font-bold ${trend >= 0 ? 'text-emerald-400' : 'text-red-400'}`}>
          {trend >= 0 ? <ArrowUpRight className="w-4 h-4" /> : <ArrowDownRight className="w-4 h-4" />}
          {Math.abs(trend).toFixed(1)}%
        </div>
      )}
    </div>
    <h3 className="text-xs font-black uppercase tracking-wider text-slate-400 mb-2">{title}</h3>
    <p className="text-3xl font-black text-white mb-1 drop-shadow-lg" style={{ textShadow: '0 0 20px rgba(56, 189, 248, 0.3)' }}>
      {value}
    </p>
    {subtitle && <p className="text-xs text-slate-400 font-medium mt-1">{subtitle}</p>}
  </div>
);

interface TenantHealth {
  id: string;
  businessName: string;
  slug: string;
  signupDate: string;
  totalVolume: number;
  challengeProgress: number;
  challengeGoal: number;
  depositAmount: number;
  depositStatus: string;
}

export default function CEOCommandCenter() {
  const router = useRouter();
  const [isAuthorized, setIsAuthorized] = useState<boolean | null>(null);
  const [isLoading, setIsLoading] = useState(true);
  
  // Global Analytics
  const [totalEcosystemVolume, setTotalEcosystemVolume] = useState<number>(0);
  const [dailyVelocity, setDailyVelocity] = useState<number>(0);
  const [dailyAverage, setDailyAverage] = useState<number>(0);
  
  // Activation Ledger
  const [vault, setVault] = useState<number>(0);
  const [refunded, setRefunded] = useState<number>(0);
  const [credited, setCredited] = useState<number>(0);
  
  // Tenant Health
  const [tenantHealth, setTenantHealth] = useState<TenantHealth[]>([]);

  useEffect(() => {
    const checkAuthorization = async () => {
      try {
        // Get current user using getUser() for more reliable auth state
        const { data: { user }, error: userError } = await supabase.auth.getUser();
        
        if (userError || !user?.email) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        // SECURE: Only allow your email (hardcoded, case-insensitive)
        const ceoEmail = 'kody@vantakos.com';
        const isCEO = user.email.toLowerCase() === ceoEmail.toLowerCase();

        if (!isCEO) {
          setIsAuthorized(false);
          setIsLoading(false);
          return;
        }

        setIsAuthorized(true);
        await fetchMetrics();
        
        // Refresh metrics every 30 seconds
        const interval = setInterval(fetchMetrics, 30000);
        return () => clearInterval(interval);
      } catch (error) {
        console.error('Authorization check failed:', error);
        setIsAuthorized(false);
        setIsLoading(false);
      }
    };

    checkAuthorization();
  }, []);

  const fetchMetrics = async () => {
    try {
      const response = await fetch('/api/ceo/metrics');
      if (!response.ok) {
        throw new Error('Failed to fetch metrics');
      }

      const data = await response.json();
      
      setTotalEcosystemVolume(data.totalEcosystemVolume || 0);
      setDailyVelocity(data.dailyVelocity || 0);
      setDailyAverage(data.dailyAverage || 0);
      setVault(data.activationLedger?.vault || 0);
      setRefunded(data.activationLedger?.refunded || 0);
      setCredited(data.activationLedger?.credited || 0);
      setTenantHealth(data.tenantHealth || []);

    } catch (error) {
      console.error('Failed to fetch metrics:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-US', {
      style: 'currency',
      currency: 'USD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'refunded':
        return 'text-emerald-400';
      case 'paid':
        return 'text-blue-400';
      case 'credited':
        return 'text-purple-400';
      case 'waived':
        return 'text-amber-400';
      default:
        return 'text-slate-400';
    }
  };

  if (isLoading) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-sky-500 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-400 font-medium">Initializing Command Center...</p>
        </div>
      </div>
    );
  }

  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center px-4">
        <div className="text-center max-w-md">
          <Shield className="w-16 h-16 text-slate-700 mx-auto mb-4" />
          <h1 className="text-2xl font-black text-white mb-2">Access Denied</h1>
          <p className="text-slate-400 mb-6">This page is restricted to authorized personnel only.</p>
          <button
            onClick={() => router.push('/')}
            className="px-6 py-3 bg-slate-800 hover:bg-slate-700 text-white rounded-xl font-semibold transition-all border border-slate-700"
          >
            Return to Home
          </button>
        </div>
      </div>
    );
  }

  const velocityTrend = dailyAverage > 0 ? ((dailyVelocity - dailyAverage) / dailyAverage) * 100 : 0;

  return (
    <div className="min-h-screen bg-slate-950 text-white">
      {/* Header */}
      <header className="sticky top-0 z-40 backdrop-blur-xl bg-slate-900/80 border-b border-slate-800">
        <div className="max-w-7xl mx-auto px-8 py-6">
          <div className="flex items-center justify-between">
            <div>
              <h1 className="text-2xl font-black tracking-tight text-white">
                VantakOS Global Command Center
              </h1>
              <p className="text-xs font-semibold text-slate-400 uppercase tracking-wider mt-1">
                Executive Analytics Dashboard
              </p>
            </div>
            <button
              onClick={() => router.push('/')}
              className="px-4 py-2 text-slate-400 hover:text-white font-semibold text-sm transition-colors"
            >
              Back to Home
            </button>
          </div>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-7xl mx-auto px-8 py-12">
        {/* Global Analytics Engine */}
        <section className="mb-12">
          <h2 className="text-xl font-black text-white mb-6">Global Analytics Engine</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="Total Ecosystem Volume"
              value={formatCurrency(totalEcosystemVolume)}
              subtitle="All-time processed"
              icon={<DollarSign className="w-6 h-6 text-sky-400" />}
            />
            <MetricCard
              title="Daily Velocity"
              value={formatCurrency(dailyVelocity)}
              subtitle="Last 24 hours"
              icon={<TrendingUp className="w-6 h-6 text-sky-400" />}
              trend={velocityTrend}
            />
            <MetricCard
              title="Daily Average"
              value={formatCurrency(dailyAverage)}
              subtitle="7-day rolling average"
              icon={<ArrowUpRight className="w-6 h-6 text-sky-400" />}
            />
          </div>
        </section>

        {/* Activation Ledger */}
        <section className="mb-12">
          <h2 className="text-xl font-black text-white mb-6">Activation Ledger</h2>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
            <MetricCard
              title="The Vault"
              value={formatCurrency(vault)}
              subtitle="Total deposits held"
              icon={<Vault className="w-6 h-6 text-sky-400" />}
            />
            <MetricCard
              title="The Win"
              value={formatCurrency(refunded)}
              subtitle="Total deposits refunded"
              icon={<Award className="w-6 h-6 text-emerald-400" />}
            />
            <MetricCard
              title="The Fail-Safe"
              value={formatCurrency(credited)}
              subtitle="Total deposits credited"
              icon={<Shield className="w-6 h-6 text-purple-400" />}
            />
          </div>
        </section>

        {/* Tenant Health Table */}
        <section>
          <h2 className="text-xl font-black text-white mb-6">Tenant Health</h2>
          <div className="bg-slate-900/80 backdrop-blur-xl border border-slate-800 rounded-2xl shadow-xl overflow-hidden">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-800/50 border-b border-slate-700">
                  <tr>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Business</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Signup Date</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Total Volume</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Challenge Progress</th>
                    <th className="px-6 py-4 text-left text-xs font-black uppercase tracking-wider text-slate-400">Status</th>
                  </tr>
                </thead>
                <tbody className="divide-y divide-slate-800">
                  {tenantHealth.map((tenant) => (
                    <tr key={tenant.id} className="hover:bg-slate-800/30 transition-colors">
                      <td className="px-6 py-4">
                        <div>
                          <p className="font-black text-white">{tenant.businessName}</p>
                          <p className="text-xs text-slate-500 font-mono">{tenant.slug}</p>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm text-slate-300">
                          {new Date(tenant.signupDate).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                            year: 'numeric'
                          })}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <span className="text-sm font-black text-white">
                          {formatCurrency(tenant.totalVolume)}
                        </span>
                      </td>
                      <td className="px-6 py-4">
                        <div className="flex items-center gap-3">
                          <div className="flex-1 bg-slate-800 rounded-full h-2 max-w-[150px]">
                            <div
                              className="bg-gradient-to-r from-sky-500 to-blue-500 h-2 rounded-full transition-all"
                              style={{ width: `${Math.min(tenant.challengeProgress, 100)}%` }}
                            />
                          </div>
                          <span className="text-xs font-bold text-slate-300 min-w-[60px] text-right">
                            {tenant.challengeProgress.toFixed(1)}% / {formatCurrency(tenant.challengeGoal)}
                          </span>
                        </div>
                      </td>
                      <td className="px-6 py-4">
                        <span className={`text-sm font-bold capitalize ${getStatusColor(tenant.depositStatus)}`}>
                          {tenant.depositStatus}
                        </span>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </div>
        </section>
      </main>
    </div>
  );
}
