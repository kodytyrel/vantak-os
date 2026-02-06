'use client';

import React, { useState, useEffect, Suspense } from 'react';
import { useSearchParams, useRouter } from 'next/navigation';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '@/lib/supabase';

// CEO Access Token - This should be set as an environment variable in production
const CEO_ACCESS_TOKEN = process.env.NEXT_PUBLIC_CEO_ACCESS_TOKEN || 'vantak-ceo-2024-secure';

function ProspectorContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const [isAuthorized, setIsAuthorized] = useState(false);
  const [accessToken, setAccessToken] = useState('');
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [logoUrl, setLogoUrl] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [successMessage, setSuccessMessage] = useState('');
  const [demoSlug, setDemoSlug] = useState('');

  // Check CEO access on mount
  useEffect(() => {
    const token = searchParams.get('token');
    if (token === CEO_ACCESS_TOKEN) {
      setIsAuthorized(true);
      setAccessToken(token);
    } else {
      // Redirect to signup page if not authorized
      router.push('/signup');
    }
  }, [searchParams, router]);

  // Auto-generate slug from business name
  useEffect(() => {
    if (businessName) {
      const generatedSlug = businessName
        .toLowerCase()
        .trim()
        .replace(/[^\w\s-]/g, '')
        .replace(/[\s_-]+/g, '-')
        .replace(/^-+|-+$/g, '');
      setSlug(generatedSlug);
    }
  }, [businessName]);

  // Extract domain and fetch logo from Clearbit
  const handleWebsiteUrlChange = (url: string) => {
    setWebsiteUrl(url);
    if (url) {
      try {
        const domain = url
          .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
          .split('/')[0]
          .split('?')[0]
          .toLowerCase();
        
        // Validate domain format (basic check)
        if (domain && domain.includes('.') && domain.length > 3) {
          const clearbitUrl = `https://logo.clearbit.com/${domain}`;
          setLogoUrl(clearbitUrl);
          
          // Preload image to check if it exists
          const img = new Image();
          img.onerror = () => {
            // If Clearbit fails, use placeholder
            setLogoUrl('https://via.placeholder.com/200');
          };
          img.src = clearbitUrl;
        } else {
          setLogoUrl('https://via.placeholder.com/200');
        }
      } catch (e) {
        console.error('Invalid URL:', e);
        setLogoUrl('https://via.placeholder.com/200');
      }
    } else {
      setLogoUrl('');
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setSuccessMessage('');

    try {
      const { data, error } = await supabase
        .from('tenants')
        .insert([
          {
            business_name: businessName,
            slug: slug,
            primary_color: primaryColor,
            logo_url: logoUrl || 'https://via.placeholder.com/200',
            is_demo: true,
            tier: 'starter',
            platform_fee_percent: 1.5,
            address: websiteUrl || 'Demo Lead',
            secondary_color: '#0f172a',
            accent_color: '#f0f9ff',
          },
        ])
        .select()
        .single();

      if (error) throw error;

      setDemoSlug(slug);
      setSuccessMessage('Demo Created Successfully!');
      
      // Reset form
      setBusinessName('');
      setSlug('');
      setWebsiteUrl('');
      setLogoUrl('');
      setPrimaryColor('#38bdf8');
    } catch (err: any) {
      alert(`Error: ${err.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  // Show unauthorized message if not CEO
  if (!isAuthorized) {
    return (
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center space-y-4">
          <h1 className="text-2xl font-black text-slate-900">Unauthorized Access</h1>
          <p className="text-slate-600">This page is restricted to CEO access only.</p>
          <a href="/signup" className="text-slate-900 font-semibold hover:underline">
            Go to Sign Up →
          </a>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-white">
      {/* Header */}
      <header className="border-b border-slate-200 px-8 py-6 bg-white">
        <div className="max-w-6xl mx-auto flex items-center justify-between">
          <div className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl">
              V
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                VANTAK<span className="text-slate-600">OS</span>
              </h1>
              <p className="text-xs font-black uppercase tracking-widest text-slate-500">
                Prospector Engine (CEO Only)
              </p>
            </div>
          </div>
          <a
            href="/"
            className="bg-slate-900 hover:bg-slate-800 text-white px-6 py-3 rounded-lg font-semibold text-sm transition-all"
          >
            ← Dashboard
          </a>
        </div>
      </header>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-8 py-16 bg-white">
        <div className="mb-12">
          <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-slate-100 text-slate-700 text-xs font-semibold uppercase tracking-widest mb-4 border border-slate-200">
            CEO Only
          </div>
          <h2 className="text-6xl font-black tracking-tight mb-4 text-slate-900">
            Create Demo Instance
          </h2>
          <p className="text-slate-600 text-lg font-medium">
            Deploy a high-conversion demo for prospects in seconds.
          </p>
        </div>

        <div className="grid lg:grid-cols-12 gap-12">
          {/* Form */}
          <form
            onSubmit={handleSubmit}
            className="lg:col-span-7 bg-white border border-slate-200 rounded-lg p-10 space-y-8"
          >
            {/* Website URL Discovery */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Website URL Discovery
              </label>
              <input
                type="text"
                value={websiteUrl}
                onChange={(e) => handleWebsiteUrlChange(e.target.value)}
                placeholder="e.g. glowstudio.com"
                className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 rounded-lg px-6 py-4 text-slate-900 placeholder-slate-400 outline-none transition-all"
              />
            </div>

            {/* Business Name */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Business Name *
              </label>
              <input
                type="text"
                required
                value={businessName}
                onChange={(e) => setBusinessName(e.target.value)}
                placeholder="The Business Name"
                className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 rounded-lg px-6 py-4 text-slate-900 placeholder-slate-400 outline-none font-semibold text-lg transition-all"
              />
            </div>

            {/* Slug */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Platform Slug *
              </label>
              <input
                type="text"
                required
                value={slug}
                onChange={(e) => setSlug(e.target.value)}
                placeholder="auto-generated"
                className="w-full bg-white border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 rounded-lg px-6 py-4 text-slate-700 placeholder-slate-400 outline-none font-mono text-sm transition-all"
              />
            </div>

            {/* Primary Color */}
            <div className="space-y-3">
              <label className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                Brand Primary Color
              </label>
              <div className="flex items-center gap-6">
                <div className="bg-white border border-slate-200 rounded-lg p-4">
                  <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                </div>
                <div className="flex-grow space-y-3">
                  <input
                    type="text"
                    value={primaryColor}
                    onChange={(e) => setPrimaryColor(e.target.value)}
                    className="w-full bg-white border border-slate-200 rounded-lg px-4 py-3 text-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900"
                  />
                  <div
                    className="w-full h-16 rounded-lg border border-slate-200"
                    style={{ backgroundColor: primaryColor }}
                  />
                </div>
              </div>
            </div>

            {/* Submit */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full bg-slate-900 hover:bg-slate-800 text-white py-6 rounded-lg font-semibold uppercase tracking-widest text-sm disabled:opacity-50 transition-all"
            >
              {isSubmitting ? 'Deploying to Registry...' : 'Deploy Demo Instance'}
            </button>
          </form>

          {/* Preview & Success */}
          <div className="lg:col-span-5 space-y-8">
            {/* Logo Preview */}
            {logoUrl && (
              <div className="bg-white border border-slate-200 rounded-lg p-8 space-y-4">
                <p className="text-xs font-semibold uppercase tracking-widest text-slate-500">
                  Logo Preview
                </p>
                <div className="bg-slate-50 rounded-lg p-6 flex items-center justify-center border border-slate-200">
                  <img
                    src={logoUrl}
                    alt="Logo"
                    className="h-24 w-24 object-contain"
                    onError={(e) => {
                      // Fallback to placeholder if logo fails to load
                      const target = e.target as HTMLImageElement;
                      if (target.src !== 'https://via.placeholder.com/200') {
                        target.src = 'https://via.placeholder.com/200';
                      } else {
                        target.style.display = 'none';
                      }
                    }}
                    onLoad={() => {
                      // Logo loaded successfully
                      const target = document.querySelector(`img[alt="Logo"]`) as HTMLImageElement;
                      if (target) {
                        target.style.display = 'block';
                      }
                    }}
                  />
                </div>
              </div>
            )}

            {/* Success Message */}
            {successMessage && (
              <div className="bg-emerald-50 border border-emerald-200 rounded-lg p-10 space-y-6">
                <div className="w-16 h-16 bg-emerald-500 rounded-lg flex items-center justify-center text-white text-3xl mx-auto">
                  ✓
                </div>
                <div className="text-center space-y-4">
                  <h3 className="text-2xl font-black text-emerald-600">
                    {successMessage}
                  </h3>
                  <p className="text-slate-600 text-sm">
                    Demo instance is live and ready for preview.
                  </p>
                  <a
                    href={`/preview/${demoSlug}`}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="inline-block bg-slate-900 hover:bg-slate-800 text-white px-8 py-4 rounded-lg font-semibold uppercase tracking-widest text-xs transition-all"
                  >
                    View Preview →
                  </a>
                </div>
              </div>
            )}

            {/* Placeholder */}
            {!successMessage && !logoUrl && (
              <div className="min-h-[400px] bg-slate-50 border-2 border-dashed border-slate-200 rounded-lg flex flex-col items-center justify-center p-12 text-center">
                <svg
                  className="w-16 h-16 text-slate-400 mb-6"
                  fill="none"
                  stroke="currentColor"
                  viewBox="0 0 24 24"
                >
                  <path
                    strokeLinecap="round"
                    strokeLinejoin="round"
                    strokeWidth="2"
                    d="M13 10V3L4 14h7v7l9-11h-7z"
                  />
                </svg>
                <p className="text-slate-500 font-semibold uppercase tracking-widest text-xs">
                  Registry Initialization Pending
                </p>
              </div>
            )}
          </div>
        </div>
      </main>
    </div>
  );
}

export default function ProspectorPage() {
  return (
    <Suspense fallback={
      <div className="min-h-screen bg-white flex items-center justify-center">
        <div className="text-center">
          <div className="w-12 h-12 border-4 border-slate-900 border-t-transparent rounded-full animate-spin mx-auto mb-4"></div>
          <p className="text-slate-600 font-medium">Loading...</p>
        </div>
      </div>
    }>
      <ProspectorContent />
    </Suspense>
  );
}

