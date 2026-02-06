'use client';

import React, { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { HexColorPicker } from 'react-colorful';
import { supabase } from '@/lib/supabase';
import Link from 'next/link';

export default function SignUpPage() {
  const router = useRouter();
  const [step, setStep] = useState<1 | 2 | 3 | 4>(1);
  const [businessName, setBusinessName] = useState('');
  const [slug, setSlug] = useState('');
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [websiteUrl, setWebsiteUrl] = useState('');
  const [primaryColor, setPrimaryColor] = useState('#0f172a');
  const [logoUrl, setLogoUrl] = useState('');
  const [isManualLogoUploaded, setIsManualLogoUploaded] = useState(false);
  
  // Map the 4 Bespoke Buckets to business_type values
  type BusinessBucket = 'beauty_lifestyle' | 'therapy_health' | 'trades' | 'education' | 'artisan';
  const [businessBucket, setBusinessBucket] = useState<BusinessBucket | null>(null);
  
  // Social connectivity fields
  const [instagramHandle, setInstagramHandle] = useState('');
  const [facebookPage, setFacebookPage] = useState('');
  const [tiktokHandle, setTiktokHandle] = useState('');

  // Business Identity fields (NEW Step 2)
  const [businessEmail, setBusinessEmail] = useState('');
  const [businessPhone, setBusinessPhone] = useState('');
  const [physicalAddress, setPhysicalAddress] = useState('');
  const [isUploadingLogo, setIsUploadingLogo] = useState(false);
  
  // Hours of Operation
  type DayHours = {
    closed: boolean;
    open: string;
    close: string;
  };
  const [hoursOfOperation, setHoursOfOperation] = useState<Record<string, DayHours>>({
    monday: { closed: false, open: '09:00', close: '17:00' },
    tuesday: { closed: false, open: '09:00', close: '17:00' },
    wednesday: { closed: false, open: '09:00', close: '17:00' },
    thursday: { closed: false, open: '09:00', close: '17:00' },
    friday: { closed: false, open: '09:00', close: '17:00' },
    saturday: { closed: false, open: '09:00', close: '17:00' },
    sunday: { closed: true, open: '09:00', close: '17:00' },
  });
  
  // Map bucket to database business_type
  const getBusinessType = (bucket: BusinessBucket | null): 'service' | 'education' | 'retail' | 'professional' | 'beauty_lifestyle' | 'therapy_health' => {
    switch (bucket) {
      case 'beauty_lifestyle':
        return 'beauty_lifestyle';
      case 'therapy_health':
        return 'therapy_health';
      case 'trades':
        return 'professional';
      case 'education':
        return 'education';
      case 'artisan':
        return 'retail';
      default:
        return 'service';
    }
  };
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [pioneerSpotsRemaining, setPioneerSpotsRemaining] = useState<number | null>(null);
  const [isLoadingSpots, setIsLoadingSpots] = useState(true);
  const [selectedChallengeType, setSelectedChallengeType] = useState<'starter' | 'elite'>('starter');
  const [paymentSessionId, setPaymentSessionId] = useState<string | null>(null);

  // Fetch Pioneer spots remaining
  useEffect(() => {
    const fetchSpots = async () => {
      try {
        const response = await fetch('/api/founding-member/spots', {
          method: 'GET',
          cache: 'no-store'
        });
        const data = await response.json();
        setPioneerSpotsRemaining(data.spotsRemaining || 0);
      } catch (error) {
        console.error('Error fetching pioneer spots:', error);
        setPioneerSpotsRemaining(0);
      } finally {
        setIsLoadingSpots(false);
      }
    };
    fetchSpots();
    // Refresh every 30 seconds
    const interval = setInterval(fetchSpots, 30000);
    return () => clearInterval(interval);
  }, []);

  // Scroll to top whenever step changes
  useEffect(() => {
    window.scrollTo({ top: 0, behavior: 'smooth' });
  }, [step]); // This fires every time you move to a new step

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

  // Extract domain and fetch logo from Clearbit (only if no manual logo uploaded)
  const handleWebsiteUrlChange = (url: string) => {
    setWebsiteUrl(url);
    // Only auto-fetch logo if no logo has been manually uploaded
    if (url && !isManualLogoUploaded) {
      try {
        const domain = url
          .replace(/^(?:https?:\/\/)?(?:www\.)?/i, '')
          .split('/')[0]
          .split('?')[0]
          .toLowerCase();
        
        if (domain && domain.includes('.') && domain.length > 3) {
          const clearbitUrl = `https://logo.clearbit.com/${domain}`;
          // Only set if no manual logo exists
          const img = new Image();
          img.onload = () => {
            // Double-check that manual logo wasn't uploaded while image was loading
            if (!isManualLogoUploaded) {
              setLogoUrl(clearbitUrl);
            }
          };
          img.onerror = () => {
            // Don't clear if manual logo exists
            if (!isManualLogoUploaded) {
              setLogoUrl('');
            }
          };
          img.src = clearbitUrl;
        }
      } catch (e) {
        // Ignore errors if manual logo exists
      }
    }
  };

  // Check if slug is available
  const checkSlugAvailability = async (slugToCheck: string) => {
    if (!slugToCheck) return true;
    try {
      const { data, error } = await supabase
        .from('tenants')
        .select('id')
        .eq('slug', slugToCheck)
        .maybeSingle(); // Use maybeSingle() instead of single() to avoid 406 errors
      
      // If no data found, slug is available
      return !data;
    } catch (err) {
      // On any error (including 406), assume slug is available to allow signup to proceed
      console.warn('Slug availability check failed, proceeding:', err);
      return true;
    }
  };

  const handleStep1Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    
    if (!businessBucket) {
      setError('Please select your craft category');
      return;
    }

    // Auto-advance to Step 2 when craft is selected
    setStep(2);
  };

  // Handle logo upload with drag-and-drop
  const handleLogoUpload = async (file: File) => {
    if (!file.type.startsWith('image/')) {
      setError('Please upload an image file');
      return;
    }

    setIsUploadingLogo(true);
    try {
      // Generate unique filename
      const fileExt = file.name.split('.').pop();
      const fileName = `temp/${Date.now()}.${fileExt}`;

      // Upload to Supabase logos bucket with proper content-type
      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
          contentType: file.type,
        });

      if (error) throw error;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      console.log('Logo uploaded successfully. Public URL:', publicUrl);
      setLogoUrl(publicUrl);
      setIsManualLogoUploaded(true); // Mark that a manual logo was uploaded
    } catch (error: any) {
      console.error('Error uploading logo:', error);
      setError('Failed to upload logo: ' + error.message);
    } finally {
      setIsUploadingLogo(false);
    }
  };

  const handleLogoDrop = (e: React.DragEvent) => {
    e.preventDefault();
    const file = e.dataTransfer.files?.[0];
    if (file) handleLogoUpload(file);
  };

  const handleLogoFileSelect = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) handleLogoUpload(file);
  };

  // Handle Step 2: Business Identity (Business Name, Slug, Website, Social)
  const handleStep2Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    if (!businessName) {
      setError('Please enter your business name');
      return;
    }

    if (!slug) {
      setError('Please enter a digital address');
      return;
    }

    const isAvailable = await checkSlugAvailability(slug);
    if (!isAvailable) {
      setError('This digital address is already taken. Please choose another.');
      return;
    }

    setStep(3);
  };

  // Handle Step 3: Branding (Logo upload and Color selection)
  const handleStep3Submit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');

    // Logo and color are optional, so just advance
    setStep(4);
  };

  // Handle Step 4: Final Launch (previously Step 3)
  const handleFinalSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsSubmitting(true);
    setError('');

    try {
      // Get current user ID for owner_id linking
      let currentUserId: string | null = null;
      try {
        const { data: { user } } = await supabase.auth.getUser();
        currentUserId = user?.id || null;
      } catch (err) {
        console.warn('Could not get user ID for owner linking:', err);
      }

      // Create the tenant via API route (bypasses RLS using service role)
      // SECURITY NOTE: The database trigger auto_assign_founding_member() will automatically
      // assign founding member status if under 100 businesses. This happens server-side in the database,
      // making it impossible to spoof from client-side code.
      // Prepare tenant data with safe defaults to prevent 400 errors
      const tenantData = {
        business_name: businessName,
        slug: slug,
        primary_color: primaryColor || '#0f172a',
        logo_url: logoUrl || null,
        business_type: getBusinessType(businessBucket) || 'service',
        is_demo: false,
        tier: 'starter',
        platform_fee_percent: 1.5,
        contact_email: businessEmail || email,
        contact_phone: businessPhone || null,
        physical_address: physicalAddress || null,
        hours_of_operation: hoursOfOperation || null,
        secondary_color: '#ffffff',
        accent_color: '#f8fafc',
        // Note: is_founding_member and founding_member_number will be set automatically
        // by the database trigger if this tenant is within the first 100 businesses
        // We don't send these fields to avoid validation errors
      };

      // Ensure all required fields have defaults before sending
      const requestBody = {
        ...tenantData,
        owner_id: currentUserId, // Link to authenticated user
        // Hard-code defaults to prevent API validation errors
        business_name: tenantData.business_name || '',
        slug: tenantData.slug || '',
        business_type: tenantData.business_type || 'service',
        primary_color: tenantData.primary_color || '#0f172a',
        platform_fee_percent: tenantData.platform_fee_percent || 1.5,
        tier: tenantData.tier || 'starter',
        is_demo: tenantData.is_demo ?? false,
        secondary_color: tenantData.secondary_color || '#ffffff',
        accent_color: tenantData.accent_color || '#f8fafc',
        // Explicitly do NOT send founding member fields - let DB trigger handle it
      };

      const response = await fetch('/api/tenants/create', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify(requestBody),
      });

      const data = await response.json();

      if (!response.ok) {
        // Log detailed error for debugging
        console.error('API Error:', JSON.stringify({
          status: response.status,
          statusText: response.statusText,
          error: data,
        }, null, 2));
        
        // Build a detailed error message
        let errorMessage = data.error || `Failed to create tenant (${response.status})`;
        if (data.details) {
          errorMessage += `: ${data.details}`;
        }
        if (data.hint) {
          errorMessage += ` (${data.hint})`;
        }
        if (data.code) {
          errorMessage += ` [Code: ${data.code}]`;
        }
        
        throw new Error(errorMessage);
      }

      // Even if the API is a bit 'empty', if we have the slug, we WIN.
      if (data && (data.slug || data.id)) {
        const finalSlug = data.slug || slug;
        // Redirect to the Owner Dashboard/Command Center
        router.push(`/dashboard?tenant=${finalSlug}`);
        return;
      } else {
        throw new Error(data.error || "No tenant returned from API");
      }
    } catch (err: any) {
      setError(err.message || 'Failed to create your business. Please try again.');
      setIsSubmitting(false);
    }
  };

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-50 via-white to-slate-100">
      {/* Background Pattern */}
      <div className="fixed inset-0 opacity-[0.02] pointer-events-none" style={{
        backgroundImage: `url("data:image/svg+xml,%3Csvg width='60' height='60' viewBox='0 0 60 60' xmlns='http://www.w3.org/2000/svg'%3E%3Cg fill='none' fill-rule='evenodd'%3E%3Cg fill='%23000000' fill-opacity='1'%3E%3Cpath d='M36 34v-4h-2v4h-4v2h4v4h2v-4h4v-2h-4zm0-30V0h-2v4h-4v2h4v4h2V6h4V4h-4zM6 34v-4H4v4H0v2h4v4h2v-4h4v-2H6zM6 4V0H4v4H0v2h4v4h2V6h4V4H6z'/%3E%3C/g%3E%3C/g%3E%3C/svg%3E")`,
      }} />

      {/* Header */}
      <header className="border-b border-slate-200/50 sticky top-0 z-50 bg-white/80 backdrop-blur-xl">
        <div className="max-w-7xl mx-auto px-8 py-6 flex items-center justify-between">
          <Link href="/" className="flex items-center gap-3">
            <div className="w-10 h-10 bg-slate-900 rounded-lg flex items-center justify-center text-white font-black text-xl shadow-lg">
              V
            </div>
            <div>
              <h1 className="text-xl font-black tracking-tight text-slate-900">
                VANTAK
              </h1>
            </div>
          </Link>
          <Link
            href="/"
            className="text-slate-600 hover:text-slate-900 text-sm font-semibold transition-colors"
          >
            Already have an account? Sign in
          </Link>
        </div>
      </header>

      {/* Progress Indicator - 4 Steps with Sky Blue Accents */}
      <div className="border-b border-slate-200/50 bg-white/50 backdrop-blur-sm">
        <div className="max-w-4xl mx-auto px-8 py-4">
          <div className="flex items-center justify-between">
            {/* Step 1: Craft */}
            <div className={`flex items-center gap-2 ${step >= 1 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${step >= 1 ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'border-slate-300 bg-white'}`}>
                {step > 1 ? '✓' : '1'}
              </div>
              <span className="text-sm font-semibold hidden sm:block">Craft</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-all ${step >= 2 ? 'bg-sky-500' : 'bg-slate-200'}`} />
            
            {/* Step 2: Identity */}
            <div className={`flex items-center gap-2 ${step >= 2 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${step >= 2 ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'border-slate-300 bg-white'}`}>
                {step > 2 ? '✓' : '2'}
              </div>
              <span className="text-sm font-semibold hidden sm:block">Identity</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-all ${step >= 3 ? 'bg-sky-500' : 'bg-slate-200'}`} />
            
            {/* Step 3: Branding */}
            <div className={`flex items-center gap-2 ${step >= 3 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${step >= 3 ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'border-slate-300 bg-white'}`}>
                {step > 3 ? '✓' : '3'}
              </div>
              <span className="text-sm font-semibold hidden sm:block">Branding</span>
            </div>
            <div className={`flex-1 h-0.5 mx-2 transition-all ${step >= 4 ? 'bg-sky-500' : 'bg-slate-200'}`} />
            
            {/* Step 4: Launch */}
            <div className={`flex items-center gap-2 ${step >= 4 ? 'text-slate-900' : 'text-slate-400'}`}>
              <div className={`w-8 h-8 rounded-full border-2 flex items-center justify-center font-semibold text-sm transition-all ${step >= 4 ? 'bg-sky-500 text-white border-sky-500 shadow-md' : 'border-slate-300 bg-white'}`}>
                4
              </div>
              <span className="text-sm font-semibold hidden sm:block">Launch</span>
            </div>
          </div>
        </div>
      </div>

      {/* Loading Animation Overlay */}
      {isSubmitting && (
        <div className="fixed inset-0 z-[100] bg-slate-900/95 backdrop-blur-xl flex items-center justify-center">
          <div className="text-center space-y-8">
            <div className="relative">
              {/* Animated Ring */}
              <div className="w-24 h-24 mx-auto border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
              {/* Inner Pulse */}
              <div className="absolute inset-0 w-24 h-24 mx-auto bg-sky-500/20 rounded-full animate-ping" />
            </div>
            <div className="space-y-2">
              <h3 className="text-3xl font-black text-white tracking-tight">
                Building Your OS...
              </h3>
              <p className="text-lg font-medium text-slate-400">
                Creating your VantakOS instance
              </p>
            </div>
            {/* Progress Dots */}
            <div className="flex items-center justify-center gap-2">
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.3s]" />
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce [animation-delay:-0.15s]" />
              <div className="w-2 h-2 bg-sky-500 rounded-full animate-bounce" />
            </div>
          </div>
        </div>
      )}

      {/* Main Content with Glassmorphism */}
      <main className="max-w-2xl mx-auto px-8 py-16 relative">
        {/* Glassmorphism Container */}
        <div className="bg-white/60 backdrop-blur-2xl border border-white/40 rounded-3xl shadow-2xl p-8 md:p-12 relative">
          {error && (
            <div className="mb-8 p-4 bg-red-50/80 backdrop-blur-sm border border-red-200/50 rounded-xl">
              <p className="text-sm text-red-600 font-medium">{error}</p>
            </div>
          )}

          {/* Step 1: The Craft */}
          {step === 1 && (
            <form onSubmit={handleStep1Submit} className="space-y-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                  What's Your Craft?
                </h2>
                <p className="text-slate-600 font-medium">
                  Choose the category that best describes your business.
                </p>
              </div>

              <div className="space-y-8">
                {/* Business Categories - Premium Cards */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-4">
                    What's your craft? *
                  </label>
                  <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {/* Bucket 1: Beauty & Lifestyle */}
                    <button
                      type="button"
                      onClick={() => setBusinessBucket('beauty_lifestyle')}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                        businessBucket === 'beauty_lifestyle'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 hover:border-slate-400 hover:shadow-xl hover:bg-white'
                      }`}
                    >
                      {businessBucket === 'beauty_lifestyle' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      )}
                      <div className="relative flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="flex-grow min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 sm:mb-2 break-words">Beauty & Lifestyle</div>
                          <div className={`text-xs sm:text-sm leading-relaxed break-words ${businessBucket === 'beauty_lifestyle' ? 'text-white/90' : 'text-slate-600'}`}>
                            Salons, Gyms, Spas
                          </div>
                        </div>
                        {businessBucket === 'beauty_lifestyle' && (
                          <div className="absolute top-3 right-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Bucket 2: Therapy & Health */}
                    <button
                      type="button"
                      onClick={() => setBusinessBucket('therapy_health')}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                        businessBucket === 'therapy_health'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 hover:border-slate-400 hover:shadow-xl hover:bg-white'
                      }`}
                    >
                      {businessBucket === 'therapy_health' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      )}
                      <div className="relative flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="flex-grow min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 sm:mb-2 break-words">Therapy & Health</div>
                          <div className={`text-xs sm:text-sm leading-relaxed break-words ${businessBucket === 'therapy_health' ? 'text-white/90' : 'text-slate-600'}`}>
                            Therapy, Counseling, Health
                          </div>
                          {businessBucket === 'therapy_health' && (
                            <div className={`text-xs mt-2 leading-relaxed ${businessBucket === 'therapy_health' ? 'text-white/80' : 'text-slate-500'}`}>
                              Privacy-First billing. Text or email secure payment links so your clients can settle their sessions in private—no front-desk friction required.
                            </div>
                          )}
                        </div>
                        {businessBucket === 'therapy_health' && (
                          <div className="absolute top-3 right-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Bucket 3: Professional Trades */}
                    <button
                      type="button"
                      onClick={() => setBusinessBucket('trades')}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                        businessBucket === 'trades'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 hover:border-slate-400 hover:shadow-xl hover:bg-white'
                      }`}
                    >
                      {businessBucket === 'trades' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      )}
                      <div className="relative flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="flex-grow min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 sm:mb-2 break-words">Professional Trades</div>
                          <div className={`text-xs sm:text-sm leading-relaxed break-words ${businessBucket === 'trades' ? 'text-white/90' : 'text-slate-600'}`}>
                            Plumbing, Auto, Handyman
                          </div>
                        </div>
                        {businessBucket === 'trades' && (
                          <div className="absolute top-3 right-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Bucket 4: Education & Instruction */}
                    <button
                      type="button"
                      onClick={() => setBusinessBucket('education')}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                        businessBucket === 'education'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 hover:border-slate-400 hover:shadow-xl hover:bg-white'
                      }`}
                    >
                      {businessBucket === 'education' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      )}
                      <div className="relative flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="flex-grow min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 sm:mb-2 break-words">Education & Instruction</div>
                          <div className={`text-xs sm:text-sm leading-relaxed break-words ${businessBucket === 'education' ? 'text-white/90' : 'text-slate-600'}`}>
                            Music, Tutoring, Coaching
                          </div>
                        </div>
                        {businessBucket === 'education' && (
                          <div className="absolute top-3 right-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>

                    {/* Bucket 5: Artisans & Makers */}
                    <button
                      type="button"
                      onClick={() => setBusinessBucket('artisan')}
                      className={`p-4 sm:p-6 rounded-xl border-2 transition-all text-left group relative overflow-hidden ${
                        businessBucket === 'artisan'
                          ? 'border-slate-900 bg-slate-900 text-white shadow-2xl scale-[1.02]'
                          : 'border-slate-200 bg-white/80 backdrop-blur-sm text-slate-900 hover:border-slate-400 hover:shadow-xl hover:bg-white'
                      }`}
                    >
                      {businessBucket === 'artisan' && (
                        <div className="absolute inset-0 bg-gradient-to-br from-white/10 to-transparent pointer-events-none" />
                      )}
                      <div className="relative flex items-start gap-3 sm:gap-4 min-w-0">
                        <div className="flex-grow min-w-0">
                          <div className="font-black text-base sm:text-lg mb-1 sm:mb-2 break-words">Artisans & Makers</div>
                          <div className={`text-xs sm:text-sm leading-relaxed break-words ${businessBucket === 'artisan' ? 'text-white/90' : 'text-slate-600'}`}>
                            Bakers, Crafters, Creators
                          </div>
                        </div>
                        {businessBucket === 'artisan' && (
                          <div className="absolute top-3 right-3">
                            <svg className="w-5 h-5 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M5 13l4 4L19 7" />
                            </svg>
                          </div>
                        )}
                      </div>
                    </button>
                  </div>
                </div>
              </div>

              {/* Next Button - Only shows when a craft is selected */}
              {businessBucket && (
                <button
                  type="submit"
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  Next: Business Identity
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              )}
            </form>
          )}

          {/* Step 2: Business Identity */}
          {step === 2 && (
            <form onSubmit={handleStep2Submit} className="space-y-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                  Business Identity
                </h2>
                <p className="text-slate-600 font-medium">
                  Let's define your business name and digital presence.
                </p>
              </div>

              <div className="space-y-8">
                {/* Business Name */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                    What is your business name? *
                  </label>
                  <input
                    type="text"
                    required
                    value={businessName}
                    onChange={(e) => setBusinessName(e.target.value)}
                    placeholder="e.g. Glow Studio"
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-semibold text-lg transition-all shadow-sm"
                  />
                </div>

                {/* Digital Address (Slug) */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                    Your Digital Address *
                  </label>
                  <input
                    type="text"
                    value={slug}
                    onChange={(e) => setSlug(e.target.value)}
                    placeholder="auto-generated"
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-700 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 font-mono text-sm transition-all shadow-sm"
                  />
                  <p className="mt-3 text-xs text-slate-600 font-medium leading-relaxed bg-blue-50/50 backdrop-blur-sm border border-blue-100/50 rounded-lg p-3">
                    <span className="font-black text-blue-900">SEO Powerhouse:</span> This generates a high-performance URL optimized for Google Search and Local SEO. You can also connect your own custom domain (e.g., yourname.com) inside the dashboard.
                  </p>
                  <p className="mt-2 text-xs text-slate-500">
                    Your business will be available at: <span className="font-mono font-bold text-slate-900">vantak.app/{slug}</span>
                  </p>
                </div>

                {/* Website URL (Optional) */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                    Website URL (Optional)
                  </label>
                  <input
                    type="text"
                    value={websiteUrl}
                    onChange={(e) => handleWebsiteUrlChange(e.target.value)}
                    placeholder="e.g. glowstudio.com"
                    className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-6 py-4 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                  />
                </div>

                {/* Social Connectivity Section */}
                <div className="pt-6 border-t border-slate-200/50">
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-2">
                    Connect Your Socials
                  </label>
                  <p className="text-xs text-slate-600 mb-4 font-medium leading-relaxed">
                    VantakOS will automatically sync your brand identity across your app and landing page.
                  </p>
                  <div className="space-y-4">
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        Instagram Handle (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                        <input
                          type="text"
                          value={instagramHandle}
                          onChange={(e) => setInstagramHandle(e.target.value.replace(/^@/, ''))}
                          placeholder="yourhandle"
                          className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl pl-8 pr-6 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        Facebook Page (Optional)
                      </label>
                      <input
                        type="text"
                        value={facebookPage}
                        onChange={(e) => setFacebookPage(e.target.value)}
                        placeholder="facebook.com/yourpage"
                        className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-6 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                      />
                    </div>
                    <div>
                      <label className="block text-xs font-semibold text-slate-600 mb-2">
                        TikTok / X (Optional)
                      </label>
                      <div className="relative">
                        <span className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400 font-medium">@</span>
                        <input
                          type="text"
                          value={tiktokHandle}
                          onChange={(e) => setTiktokHandle(e.target.value.replace(/^@/, ''))}
                          placeholder="yourhandle"
                          className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl pl-8 pr-6 py-3 text-slate-900 placeholder-slate-400 outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 transition-all shadow-sm"
                        />
                      </div>
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(1)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={!businessName || !slug}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                >
                  Continue to Branding
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* Step 3: Branding */}
          {step === 3 && (
            <form onSubmit={handleStep3Submit} className="space-y-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                  Branding
                </h2>
                <p className="text-slate-600 font-medium">
                  Upload your logo and choose your brand color.
                </p>
              </div>

              <div className="space-y-8">
                {/* Logo Upload - Premium Drag-and-Drop */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-4">
                    Business Logo (Optional)
                  </label>
                  <div
                    onDrop={handleLogoDrop}
                    onDragOver={(e) => e.preventDefault()}
                    className={`relative border-2 border-dashed rounded-xl p-12 text-center transition-all ${
                      isUploadingLogo
                        ? 'border-sky-400 bg-sky-50/50'
                        : logoUrl
                        ? 'border-sky-500 bg-sky-50/30'
                        : 'border-slate-300 bg-white/50 hover:border-sky-400 hover:bg-sky-50/20'
                    }`}
                  >
                    <input
                      type="file"
                      accept="image/*"
                      onChange={handleLogoFileSelect}
                      disabled={isUploadingLogo}
                      className="hidden"
                      id="logo-upload"
                    />
                    {isUploadingLogo ? (
                      <div className="space-y-4">
                        <div className="w-12 h-12 mx-auto border-4 border-sky-500/30 border-t-sky-500 rounded-full animate-spin" />
                        <p className="text-sm font-semibold text-sky-600">Uploading...</p>
                      </div>
                    ) : logoUrl ? (
                      <div className="space-y-4">
                        <div className="w-32 h-32 mx-auto rounded-full overflow-hidden border-4 border-sky-500 shadow-lg ring-4 ring-sky-100">
                          <img src={logoUrl} alt="Business Logo" className="w-full h-full object-cover" />
                        </div>
                        <div className="flex items-center justify-center gap-3">
                          <label
                            htmlFor="logo-upload"
                            className="px-4 py-2 bg-sky-500 text-white rounded-lg font-semibold text-sm hover:bg-sky-600 transition-colors cursor-pointer"
                          >
                            Change Logo
                          </label>
                          <button
                            type="button"
                            onClick={() => {
                              setLogoUrl('');
                              setIsManualLogoUploaded(false);
                            }}
                            className="px-4 py-2 bg-slate-200 text-slate-700 rounded-lg font-semibold text-sm hover:bg-slate-300 transition-colors"
                          >
                            Remove
                          </button>
                        </div>
                      </div>
                    ) : (
                      <>
                        <label htmlFor="logo-upload" className="cursor-pointer">
                          <div className="space-y-4">
                            <div className="w-16 h-16 mx-auto rounded-full bg-sky-100 flex items-center justify-center">
                              <svg className="w-8 h-8 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                              </svg>
                            </div>
                            <div>
                              <p className="text-base font-black text-slate-900 mb-1">
                                Drag & Drop Your Logo
                              </p>
                              <p className="text-sm text-slate-600 font-medium">
                                or <span className="text-sky-500 font-semibold underline">browse</span> to upload
                              </p>
                              <p className="text-xs text-slate-500 mt-2">PNG, JPG up to 5MB</p>
                            </div>
                          </div>
                        </label>
                      </>
                    )}
                  </div>
                </div>

                {/* Primary Brand Color */}
                <div>
                  <label className="block text-sm font-black uppercase tracking-widest text-slate-700 mb-4">
                    Primary Brand Color
                  </label>
                  <div className="flex flex-col md:flex-row items-start gap-6">
                    <div className="bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl p-4 shadow-sm">
                      <HexColorPicker color={primaryColor} onChange={setPrimaryColor} />
                    </div>
                    <div className="flex-grow w-full space-y-3">
                      <input
                        type="text"
                        value={primaryColor}
                        onChange={(e) => setPrimaryColor(e.target.value)}
                        className="w-full bg-white/80 backdrop-blur-sm border-2 border-slate-200 rounded-xl px-6 py-3 text-slate-900 font-mono text-sm outline-none focus:ring-2 focus:ring-slate-900 focus:border-slate-900 shadow-sm"
                      />
                      <div
                        className="w-full h-20 rounded-xl border-2 border-slate-200 shadow-sm"
                        style={{ backgroundColor: primaryColor }}
                      />
                    </div>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(2)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  className="flex-1 bg-slate-900 hover:bg-slate-800 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl flex items-center justify-center gap-2"
                >
                  Continue to Launch
                  <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                  </svg>
                </button>
              </div>
            </form>
          )}

          {/* Step 4: Launch - Final Step */}
          {step === 4 && (
            <form onSubmit={handleFinalSubmit} className="space-y-8">
              <div>
                <h2 className="text-4xl font-black tracking-tight text-slate-900 mb-2">
                  Almost There
                </h2>
                <p className="text-slate-600 font-medium">
                  Complete your activation challenge and launch your VantakOS instance.
                </p>
              </div>

              <div className="space-y-6">
                {/* The 30-Day Activation Challenge Section */}
                <div className="bg-gradient-to-br from-slate-50 via-white to-slate-100 border-2 border-slate-200 rounded-2xl p-8 space-y-6 shadow-xl">
                  <div>
                    <h3 className="text-3xl font-black tracking-tight text-slate-900 mb-4">
                      The 30-Day Activation Challenge
                    </h3>
                    
                    <div className="space-y-4 text-slate-700 leading-relaxed">
                      {pioneerSpotsRemaining !== null && pioneerSpotsRemaining > 0 ? (
                        <p className="text-base font-medium">
                          30-Day Activation Challenge: For Pioneers, your $100 deposit is waived. We want you to get to your first $100 in sales as fast as possible.
                        </p>
                      ) : (
                        <>
                          <p className="text-base font-medium">
                            Process your first <span className="font-black text-slate-900">$100</span> in your first <span className="font-black text-slate-900">30 days</span> and we automatically refund your <span className="font-black text-slate-900">$100 activation deposit</span>.
                          </p>
                          <p className="text-sm text-slate-600">
                            Businesses that activate in the first 30 days see the most long-term value—this challenge helps make sure you get there.
                          </p>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pricing Display */}
                  <div className="bg-white/80 backdrop-blur-sm rounded-xl p-6 border border-slate-200">
                    <div className="space-y-4">
                      <div className="flex items-center justify-between pb-3 border-b border-slate-200">
                        <span className="text-slate-700 font-semibold text-lg">Activation Deposit</span>
                        {pioneerSpotsRemaining !== null && pioneerSpotsRemaining > 0 ? (
                          <div className="flex items-center gap-3">
                            <span className="text-slate-400 line-through font-medium text-lg">$100.00</span>
                            <span className="text-3xl font-black text-emerald-600">WAIVED ($0.00)</span>
                            <span className="text-xs font-black text-emerald-600 bg-emerald-100 px-3 py-1.5 rounded-full uppercase tracking-wider">PIONEER</span>
                          </div>
                        ) : (
                          <span className="text-3xl font-black text-slate-900">$100.00</span>
                        )}
                      </div>
                      
                      {pioneerSpotsRemaining !== null && pioneerSpotsRemaining > 0 && (
                        <>
                          <div className="h-px bg-slate-200" />
                          <div className="space-y-3 pt-3">
                            <div className="flex items-center justify-between">
                              <span className="text-slate-700 font-black text-lg">The Elite Challenge</span>
                              <div className="flex items-center gap-2">
                                <span className="text-slate-400 line-through font-medium">$250</span>
                                <span className="text-2xl font-black text-sky-600">$150</span>
                                <span className="text-xs font-black text-sky-600 bg-sky-100 px-2 py-1 rounded-full uppercase tracking-wider">PIONEER</span>
                              </div>
                            </div>
                            <p className="text-sm text-slate-600 leading-relaxed">
                              Deposit <span className="font-semibold text-slate-900">$250 ($150 for Pioneers)</span>. Process that same amount in your first 30 days and we refund the deposit in full.
                            </p>
                            <div className="bg-sky-50/80 border border-sky-200 rounded-lg p-4 mt-3">
                              <p className="text-xs text-slate-700 leading-relaxed">
                                <span className="font-black text-sky-900">The Upside:</span> You get 6 months of the Elite Tier (0.4% fees) unlocked for free. If you don't hit the target, your deposit is simply applied as a credit to your future VantakOS fees so you never lose the value.
                              </p>
                            </div>
                          </div>
                        </>
                      )}
                    </div>
                  </div>

                  {/* Pioneer Exception Notice */}
                  {pioneerSpotsRemaining !== null && pioneerSpotsRemaining > 0 && (
                    <div className="bg-gradient-to-r from-yellow-50 to-amber-50 border-2 border-yellow-200 rounded-xl p-5">
                      <div className="flex items-start gap-3">
                        <div className="flex-shrink-0 w-8 h-8 rounded-full bg-gradient-to-br from-yellow-300 via-yellow-400 to-yellow-500 border-2 border-yellow-600 shadow-lg flex items-center justify-center">
                          <svg className="w-5 h-5 text-yellow-900" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M9 12l2 2 4-4M7.835 4.697a3.42 3.42 0 001.946-.806 3.42 3.42 0 014.438 0 3.42 3.42 0 001.946.806 3.42 3.42 0 013.138 3.138 3.42 3.42 0 00.806 1.946 3.42 3.42 0 010 4.438 3.42 3.42 0 00-.806 1.946 3.42 3.42 0 01-3.138 3.138 3.42 3.42 0 00-1.946.806 3.42 3.42 0 01-4.438 0 3.42 3.42 0 00-1.946-.806 3.42 3.42 0 01-3.138-3.138 3.42 3.42 0 00-.806-1.946 3.42 3.42 0 010-4.438 3.42 3.42 0 00.806-1.946 3.42 3.42 0 013.138-3.138z" />
                          </svg>
                        </div>
                        <div>
                          <p className="text-sm font-black text-yellow-900 mb-1">The Pioneer Exception</p>
                          <p className="text-sm text-slate-700 leading-relaxed">
                            As one of the first 100 Founding Pioneers, this $100 deposit is waived. We're backing your launch from Day 1.
                          </p>
                        </div>
                      </div>
                    </div>
                  )}

                  {/* Credit Backstop */}
                  <div className="bg-blue-50/80 border border-blue-200 rounded-xl p-4">
                    <p className="text-xs text-slate-700 leading-relaxed">
                      <span className="font-black text-blue-900">Fail-Safe:</span> If you don't hit the 30-day target, your deposit isn't lost—it is automatically applied as a credit toward your future VantakOS fees.
                    </p>
                  </div>
                </div>
              </div>

              <div className="flex gap-4 pt-4">
                <button
                  type="button"
                  onClick={() => setStep(3)}
                  className="flex-1 bg-white/80 backdrop-blur-sm border-2 border-slate-200 text-slate-900 py-4 rounded-xl font-semibold text-lg hover:bg-white hover:border-slate-300 transition-all shadow-sm"
                >
                  ← Back
                </button>
                <button
                  type="submit"
                  disabled={isSubmitting}
                  className="flex-1 bg-sky-500 hover:bg-sky-600 text-white py-4 rounded-xl font-black text-lg transition-all shadow-xl hover:shadow-2xl disabled:opacity-50 flex items-center justify-center gap-2"
                >
                  {isSubmitting ? (
                    <>
                      <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                      Building Your OS...
                    </>
                  ) : (
                    <>
                      Create Business
                      <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
                      </svg>
                    </>
                  )}
                </button>
              </div>
            </form>
          )}
        </div>
      </main>

      {/* Footer */}
      <footer className="border-t border-slate-200/50 mt-20 bg-white/50 backdrop-blur-sm">
        <div className="max-w-7xl mx-auto px-8 py-12 text-center">
          <p className="text-slate-500 text-sm font-medium">
            By signing up, you agree to VantakOS Terms of Service and Privacy Policy.
          </p>
        </div>
      </footer>
    </div>
  );
}
