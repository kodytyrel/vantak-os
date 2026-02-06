import Link from 'next/link';
import FoundingMemberBannerClient from './FoundingMemberBannerClient';
import { PWAInstallAnimation } from '@/components/PWAInstallAnimation';
import { WindowShopper } from '@/components/WindowShopper';
import { LandingPageHeroWrapper } from '@/components/LandingPageHeroWrapper';
import { LandingPageNavigation } from '@/components/LandingPageNavigation';

export default function HomePage() {
  return (
    <div className="min-h-screen bg-white">
      {/* Founding Member Banner */}
      <FoundingMemberBannerClient />
      
      {/* Premium SEO Navigation Header */}
      <LandingPageNavigation />

      {/* Hero Section - Dynamic based on Pioneer availability */}
      <LandingPageHeroWrapper />

      {/* PWA Smart-Install Animation - Only shown after hero */}
      <div className="max-w-7xl mx-auto px-8">
        <PWAInstallAnimation />
      </div>

      {/* Window Shopper - Try It Out */}
      <section id="how-it-works" className="max-w-7xl mx-auto px-8">
        <WindowShopper />
      </section>

      {/* Bento Grid & Content Sections */}
      <main className="max-w-7xl mx-auto px-8">
        {/* Features Section */}
        <section id="features" className="mt-32 md:mt-40 max-w-6xl mx-auto mb-16">
          {/* Section Divider - You craft. We work. */}
          <div className="mb-16">
            <div className="text-center">
              <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
                You craft. We work.
              </h2>
              <div className="w-24 h-1 bg-sky-500 mx-auto rounded-full"></div>
            </div>
          </div>

          {/* Bento Grid */}
          <div className="max-w-6xl mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
            {/* Booking Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-10 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Booking
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Digital scheduling that respects your time.
                </p>
              </div>
            </div>

            {/* Payments Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-10 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Payments
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Enterprise financing and instant payouts.
                </p>
              </div>
            </div>

            {/* Records Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-10 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  Records
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  A secure vault for your business history.
                </p>
              </div>
            </div>

            {/* The App Card */}
            <div className="bg-white border border-slate-200 rounded-lg p-10 hover:shadow-lg transition-shadow">
              <div className="space-y-4">
                <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center">
                  <svg className="w-6 h-6 text-slate-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
                  </svg>
                </div>
                <h3 className="text-2xl font-black text-slate-900 tracking-tight">
                  The App
                </h3>
                <p className="text-slate-600 font-medium leading-relaxed">
                  Instant home-screen installation
                </p>
              </div>
            </div>
          </div>
          </div>
        </section>

        {/* Pricing Section with Pioneer Benefit */}
        <section id="pricing" className="mt-32 md:mt-40 max-w-5xl mx-auto">
          <div className="text-center mb-16">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Simple Pricing
            </h2>
            <p className="text-lg text-slate-600 font-medium max-w-2xl mx-auto">
              Pay only when you get paid. No monthly fees on Starter.
            </p>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-3 gap-6 mb-12">
            {/* Starter Tier */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Starter</h3>
                  <p className="text-4xl font-black text-slate-900 mb-1">$0</p>
                  <p className="text-sm text-slate-500 font-medium">per month</p>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <p className="text-lg font-black text-slate-900">+ 1.5% per transaction</p>
                  <ul className="text-sm text-slate-600 font-medium space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Full branding control</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Customer app (PWA)</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Booking & payments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>5 AI questions/day</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Pro Tier */}
            <div className="bg-gradient-to-br from-slate-900 to-slate-800 border-2 border-slate-900 rounded-2xl p-8 hover:shadow-2xl transition-all relative">
              <div className="absolute -top-4 left-1/2 transform -translate-x-1/2 bg-emerald-500 text-white px-4 py-1 rounded-full text-xs font-black uppercase tracking-widest">
                Popular
              </div>
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-white mb-2">Pro</h3>
                  <p className="text-4xl font-black text-white mb-1">$29</p>
                  <p className="text-sm text-slate-400 font-medium">per month</p>
                </div>
                <div className="border-t border-slate-700 pt-6 space-y-3">
                  <p className="text-lg font-black text-white">+ 1.0% per transaction</p>
                  <ul className="text-sm text-slate-300 font-medium space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Everything in Starter</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Recurring appointments</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-400 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Unlimited AI support</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>

            {/* Elite Tier */}
            <div className="bg-white border-2 border-slate-200 rounded-2xl p-8 hover:shadow-xl transition-all">
              <div className="text-center space-y-6">
                <div>
                  <h3 className="text-2xl font-black text-slate-900 mb-2">Elite</h3>
                  <p className="text-4xl font-black text-slate-900 mb-1">$79</p>
                  <p className="text-sm text-slate-500 font-medium">per month</p>
                </div>
                <div className="border-t border-slate-100 pt-6 space-y-3">
                  <p className="text-lg font-black text-slate-900">+ 0.4% per transaction</p>
                  <ul className="text-sm text-slate-600 font-medium space-y-2 text-left">
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Everything in Pro</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>The Ledger</span>
                    </li>
                    <li className="flex items-center gap-2">
                      <svg className="w-5 h-5 text-emerald-500 flex-shrink-0" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                      </svg>
                      <span>Advanced features</span>
                    </li>
                  </ul>
                </div>
              </div>
            </div>
          </div>

          {/* Pioneer Benefit Banner - Lifetime Fee Waiver Only */}
          <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-2xl p-8 md:p-12 border-2 border-sky-200 text-center space-y-6">
            <div className="flex items-center justify-center gap-3 mb-4">
              <div className="w-12 h-12 rounded-full bg-gradient-to-br from-sky-400 to-sky-600 flex items-center justify-center">
                <span className="text-white font-black text-xl">🏆</span>
              </div>
              <h3 className="text-3xl font-black text-slate-900">
                Pioneer Benefit
              </h3>
            </div>
            <div className="space-y-3 max-w-2xl mx-auto">
              <p className="text-xl font-black text-slate-900">
                <span className="text-emerald-600">Lifetime Annual Fee Waiver.</span>
              </p>
              <p className="text-2xl font-black text-slate-900">
                No connectivity fees—ever.
              </p>
              <p className="text-sm text-slate-600 font-medium mt-4">
                The first 100 businesses receive a Lifetime Annual Fee Waiver. The $99/year connectivity fee is waived for life.
              </p>
            </div>
          </div>
        </section>

        {/* Mission Section */}
        <section id="mission" className="mt-32 md:mt-40 max-w-4xl mx-auto mb-32">
          <div className="text-center space-y-6">
            <h2 className="text-4xl md:text-5xl font-black text-slate-900 tracking-tight mb-4">
              Our Mission
            </h2>
            <div className="w-24 h-1 bg-sky-500 mx-auto rounded-full mb-8"></div>
            <div className="bg-gradient-to-br from-slate-50 to-slate-100 rounded-2xl p-8 md:p-12 border-2 border-slate-200">
              <p className="text-2xl md:text-3xl font-black text-slate-900 italic leading-relaxed mb-6">
                "No one should be gatekeeping small business."
              </p>
              <p className="text-lg text-slate-600 font-medium leading-relaxed max-w-2xl mx-auto">
                VantakOS was built on one principle: Every entrepreneur deserves the same digital tools that big businesses take for granted. We give you the branded app, seamless payments, and home-screen presence your customers expect—without the enterprise price tag.
              </p>
              <p className="text-base text-slate-500 font-medium mt-6 italic">
                — The VantakOS Principle
              </p>
            </div>
          </div>
        </section>
      </main>

      {/* Minimalist Footer */}
      <footer className="border-t border-slate-200 mt-32">
        <div className="max-w-7xl mx-auto px-8 py-12">
          <div className="flex flex-col md:flex-row items-center justify-between gap-6">
            <div className="flex flex-col items-center md:items-start">
              <div className="flex items-center gap-3 mb-2">
                <img
                  src="/logo.png"
                  alt="VantakOS - No more gatekeeping"
                  className="h-6 w-auto"
                />
              </div>
              <span className="text-slate-500 text-sm font-medium">
                © 2026 VantakOS
              </span>
              <p className="text-slate-400 text-xs font-medium mt-1 italic">
                We handle the business, so you can focus on the craft.
              </p>
            </div>
            <div className="flex items-center gap-8">
              <Link href="/signup" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                Privacy
              </Link>
              <Link href="/signup" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                Terms
              </Link>
              <Link href="/signup" className="text-slate-500 hover:text-slate-900 text-sm font-medium transition-colors">
                Contact
              </Link>
            </div>
          </div>
        </div>
      </footer>
    </div>
  );
}
