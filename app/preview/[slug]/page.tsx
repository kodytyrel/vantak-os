import { supabase } from '@/lib/supabase';
import { notFound } from 'next/navigation';
import InstallBanner from '@/components/InstallBanner';

interface PreviewPageProps {
  params: {
    slug: string;
  };
}

async function getTenant(slug: string) {
  const { data, error } = await supabase
    .from('tenants')
    .select('*')
    .eq('slug', slug)
    .single();

  if (error || !data) {
    return null;
  }

  return data;
}

export default async function PreviewPage({ params }: PreviewPageProps) {
  const tenant = await getTenant(params.slug);

  if (!tenant) {
    notFound();
  }

  const businessName = tenant.business_name || 'Your Business';
  const primaryColor = tenant.primary_color || '#38bdf8';
  const logoUrl = tenant.logo_url || 'https://via.placeholder.com/200';

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100 font-sans overflow-hidden relative">
      {/* Animated Background Blobs */}
      <div className="fixed inset-0 pointer-events-none z-0">
        <div
          className="absolute top-0 -left-40 w-[600px] h-[600px] rounded-full blur-[120px] opacity-20 animate-pulse"
          style={{ backgroundColor: primaryColor, animationDuration: '8s' }}
        />
        <div
          className="absolute bottom-0 -right-40 w-[800px] h-[800px] rounded-full blur-[140px] opacity-10 animate-pulse"
          style={{ backgroundColor: primaryColor, animationDuration: '12s', animationDelay: '2s' }}
        />
      </div>

      {/* Header */}
      <header className="relative z-10 px-8 py-6 flex justify-between items-center max-w-7xl mx-auto">
        <div className="flex items-center gap-3">
          <div className="w-10 h-10 bg-slate-900 rounded-xl flex items-center justify-center text-white font-black text-xl shadow-lg">
            V
          </div>
          <span className="text-xl font-black tracking-tight text-slate-900">
            Vantak<span style={{ color: primaryColor }}>OS</span>
          </span>
        </div>
        <div className="text-xs font-black uppercase tracking-widest text-slate-400">
          Preview Mode
        </div>
      </header>

      {/* Main Content */}
      <main className="relative z-10 max-w-6xl mx-auto px-8 py-20 flex flex-col items-center text-center">
        {/* Hero Text */}
        <div className="mb-16 space-y-8 max-w-4xl">
          <div className="inline-flex items-center gap-2 px-4 py-2 rounded-full bg-white border border-slate-200 shadow-sm text-xs font-black uppercase tracking-widest text-slate-500">
            <span className="w-2 h-2 rounded-full bg-sky-500 animate-pulse" />
            Live Instance Preview
          </div>
          
          <h1 className="text-7xl md:text-8xl font-black tracking-tighter leading-[0.9] text-slate-900">
            Hey{' '}
            <span
              className="inline-block"
              style={{ color: primaryColor }}
            >
              {businessName.split(' ')[0]}
            </span>
            ,<br />
            <span className="text-slate-400">we built this</span>
            <br />
            for you.
          </h1>
          
          <p className="text-2xl md:text-3xl text-slate-500 font-medium max-w-3xl mx-auto leading-relaxed">
            Your brand. Your customers. Your payments.
            <br />
            <span className="text-slate-900 font-bold">One platform to rule it all.</span>
          </p>
        </div>

        {/* iPhone Mockup */}
        <div className="relative mb-20">
          {/* Glow Effect */}
          <div
            className="absolute inset-0 blur-[80px] opacity-30 scale-110 -z-10"
            style={{ backgroundColor: primaryColor }}
          />
          
          {/* iPhone Frame */}
          <div className="relative w-[340px] h-[690px] bg-slate-900 rounded-[60px] shadow-2xl p-3 border-[14px] border-slate-900">
            {/* Notch */}
            <div className="absolute top-3 left-1/2 -translate-x-1/2 w-40 h-7 bg-slate-900 rounded-b-3xl z-20" />
            
            {/* Screen */}
            <div className="relative w-full h-full bg-white rounded-[48px] overflow-hidden">
              {/* Status Bar */}
              <div className="absolute top-0 left-0 right-0 h-14 bg-white z-10 flex items-center justify-between px-8 pt-2">
                <span className="text-xs font-semibold text-slate-900">9:41</span>
                <div className="flex items-center gap-1">
                  <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M2 11a1 1 0 011-1h2a1 1 0 011 1v5a1 1 0 01-1 1H3a1 1 0 01-1-1v-5zM8 7a1 1 0 011-1h2a1 1 0 011 1v9a1 1 0 01-1 1H9a1 1 0 01-1-1V7zM14 4a1 1 0 011-1h2a1 1 0 011 1v12a1 1 0 01-1 1h-2a1 1 0 01-1-1V4z" />
                  </svg>
                  <svg className="w-4 h-4 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path fillRule="evenodd" d="M17.778 8.222c-4.296-4.296-11.26-4.296-15.556 0A1 1 0 01.808 6.808c5.076-5.077 13.308-5.077 18.384 0a1 1 0 01-1.414 1.414zM14.95 11.05a7 7 0 00-9.9 0 1 1 0 01-1.414-1.414 9 9 0 0112.728 0 1 1 0 01-1.414 1.414zM12.12 13.88a3 3 0 00-4.242 0 1 1 0 01-1.415-1.415 5 5 0 017.072 0 1 1 0 01-1.415 1.415zM9 16a1 1 0 011-1h.01a1 1 0 110 2H10a1 1 0 01-1-1z" clipRule="evenodd" />
                  </svg>
                  <svg className="w-5 h-5 text-slate-900" fill="currentColor" viewBox="0 0 20 20">
                    <path d="M8 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0zM15 16.5a1.5 1.5 0 11-3 0 1.5 1.5 0 013 0z" />
                    <path d="M3 4a1 1 0 00-1 1v10a1 1 0 001 1h1.05a2.5 2.5 0 014.9 0H10a1 1 0 001-1V5a1 1 0 00-1-1H3zM14 7a1 1 0 00-1 1v6.05A2.5 2.5 0 0115.95 16H17a1 1 0 001-1v-5a1 1 0 00-.293-.707l-2-2A1 1 0 0015 7h-1z" />
                  </svg>
                </div>
              </div>

              {/* App Content */}
              <div
                className="absolute inset-0 pt-14"
                style={{
                  background: `linear-gradient(to bottom, ${primaryColor}15, white)`
                }}
              >
                {/* Hero Section */}
                <div className="px-6 pt-12 pb-8 space-y-6">
                  {/* Logo */}
                  <div className="flex justify-center mb-6">
                    <div
                      className="w-20 h-20 rounded-2xl shadow-lg flex items-center justify-center overflow-hidden"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <img
                        src={logoUrl}
                        alt={businessName}
                        className="w-16 h-16 object-contain"
                        onError={(e) => {
                          (e.target as HTMLImageElement).style.display = 'none';
                        }}
                      />
                    </div>
                  </div>

                  {/* Business Name */}
                  <h2 className="text-2xl font-black tracking-tight text-slate-900 leading-tight">
                    {businessName}
                  </h2>

                  {/* CTA Button */}
                  <button
                    className="w-full py-4 rounded-2xl font-bold text-white shadow-xl text-sm"
                    style={{ backgroundColor: primaryColor }}
                  >
                    Book Appointment
                  </button>
                </div>

                {/* Service Cards */}
                <div className="px-6 space-y-3">
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-900 text-sm">Premium Service</span>
                      <span className="font-black text-slate-900">$65</span>
                    </div>
                    <p className="text-xs text-slate-500">Professional treatment • 45 mins</p>
                  </div>
                  
                  <div className="bg-white rounded-2xl p-4 shadow-sm border border-slate-100">
                    <div className="flex justify-between items-center mb-2">
                      <span className="font-bold text-slate-900 text-sm">Signature Package</span>
                      <span className="font-black text-slate-900">$95</span>
                    </div>
                    <p className="text-xs text-slate-500">Complete experience • 60 mins</p>
                  </div>
                </div>

                {/* Bottom Nav */}
                <div className="absolute bottom-0 left-0 right-0 bg-white/80 backdrop-blur-xl border-t border-slate-100 px-6 py-4 flex justify-around">
                  <div className="flex flex-col items-center gap-1">
                    <div
                      className="w-8 h-8 rounded-full flex items-center justify-center"
                      style={{ backgroundColor: `${primaryColor}20` }}
                    >
                      <svg className="w-4 h-4" style={{ color: primaryColor }} fill="currentColor" viewBox="0 0 20 20">
                        <path d="M10.707 2.293a1 1 0 00-1.414 0l-7 7a1 1 0 001.414 1.414L4 10.414V17a1 1 0 001 1h2a1 1 0 001-1v-2a1 1 0 011-1h2a1 1 0 011 1v2a1 1 0 001 1h2a1 1 0 001-1v-6.586l.293.293a1 1 0 001.414-1.414l-7-7z" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold" style={{ color: primaryColor }}>Home</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                      <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M6 2a1 1 0 00-1 1v1H4a2 2 0 00-2 2v10a2 2 0 002 2h12a2 2 0 002-2V6a2 2 0 00-2-2h-1V3a1 1 0 10-2 0v1H7V3a1 1 0 00-1-1zm0 5a1 1 0 000 2h8a1 1 0 100-2H6z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600">Book</span>
                  </div>
                  <div className="flex flex-col items-center gap-1 opacity-40">
                    <div className="w-8 h-8 rounded-full flex items-center justify-center bg-slate-100">
                      <svg className="w-4 h-4 text-slate-600" fill="currentColor" viewBox="0 0 20 20">
                        <path fillRule="evenodd" d="M10 9a3 3 0 100-6 3 3 0 000 6zm-7 9a7 7 0 1114 0H3z" clipRule="evenodd" />
                      </svg>
                    </div>
                    <span className="text-[9px] font-bold text-slate-600">Profile</span>
                  </div>
                </div>
              </div>
            </div>
          </div>

          {/* Floating Badge */}
          <div className="absolute -bottom-6 left-1/2 -translate-x-1/2 bg-slate-900 text-white px-6 py-3 rounded-full font-black text-xs uppercase tracking-widest shadow-2xl flex items-center gap-3 whitespace-nowrap">
            <svg className="w-5 h-5 text-sky-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M12 18h.01M8 21h8a2 2 0 002-2V5a2 2 0 00-2-2H8a2 2 0 00-2 2v14a2 2 0 002 2z" />
            </svg>
            Interactive Demo
          </div>
        </div>

        {/* Value Props */}
        <div className="grid md:grid-cols-3 gap-8 mb-20 max-w-5xl">
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center text-sky-400 text-2xl shadow-xl">
              📱
            </div>
            <h3 className="font-black text-xl text-slate-900">Native PWA</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Installs like a real app. No App Store needed.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center text-emerald-400 text-2xl shadow-xl">
              💳
            </div>
            <h3 className="font-black text-xl text-slate-900">Instant Payments</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              Stripe Connect with 2-day payouts.
            </p>
          </div>
          
          <div className="text-center space-y-3">
            <div className="w-16 h-16 mx-auto bg-slate-900 rounded-2xl flex items-center justify-center text-purple-400 text-2xl shadow-xl">
              🎨
            </div>
            <h3 className="font-black text-xl text-slate-900">Your Branding</h3>
            <p className="text-slate-500 text-sm leading-relaxed">
              100% white-label. Your colors, your logo.
            </p>
          </div>
        </div>

        {/* CTA Section */}
        <div className="bg-slate-900 rounded-[4rem] px-16 py-20 max-w-4xl text-center space-y-10 shadow-2xl relative overflow-hidden">
          <div
            className="absolute inset-0 opacity-10"
            style={{
              background: `radial-gradient(circle at top right, ${primaryColor}, transparent 70%)`
            }}
          />
          
          <div className="relative z-10 space-y-6">
            <h2 className="text-6xl font-black tracking-tighter text-white leading-tight">
              Ready to launch?
            </h2>
            <p className="text-2xl text-slate-400 font-medium max-w-2xl mx-auto">
              No setup fees. No monthly bills. Start accepting bookings in minutes.
            </p>
          </div>

          <a
            href={`/claim/${params.slug}`}
            className="relative z-10 inline-flex items-center gap-4 px-12 py-6 rounded-[2rem] font-black uppercase tracking-widest text-lg shadow-2xl transition-all hover:scale-105 active:scale-95 text-slate-900"
            style={{ backgroundColor: primaryColor }}
          >
            Claim {businessName}
            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="3" d="M13 7l5 5m0 0l-5 5m5-5H6" />
            </svg>
          </a>
        </div>
      </main>

      {/* Footer */}
      <footer className="relative z-10 text-center py-12 text-slate-400 text-xs font-black uppercase tracking-widest">
        Powered by VantakOS • KC Dev Co
      </footer>

      {/* PWA Install Banner */}
      <InstallBanner
        businessName={businessName}
        primaryColor={primaryColor}
        logoUrl={logoUrl}
      />
    </div>
  );
}

