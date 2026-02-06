'use client';

import { useState } from 'react';
import { motion } from 'framer-motion';
import { TenantConfig, Service, Product } from '@/types';
import { NewsletterPopup } from '@/components/NewsletterPopup';
import { getTerminology } from '@/lib/terminology';
import { LimitedOfferBanner } from '@/components/LimitedOfferBanner';
import { PublicSupportBot } from '@/components/PublicSupportBot';
import { CustomSolutionsSection } from '@/components/CustomSolutionsSection';

interface ClientLandingPageProps {
  tenant: TenantConfig;
  services: Service[];
  products: Product[];
}

export default function ClientLandingPage({
  tenant,
  services,
  products,
}: ClientLandingPageProps) {
  const [activeTab, setActiveTab] = useState<'services' | 'shop' | 'support'>('services');
  const [isSupportBotOpen, setIsSupportBotOpen] = useState(false);

  const handleBuyNow = async (product: Product) => {
    try {
      const response = await fetch('/api/checkout', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
          slug: tenant.slug,
          type: 'product',
          itemId: product.id,
          customerEmail: '', // Optional - can be collected in a form
        }),
      });

      const data = await response.json();

      if (data.url) {
        window.location.href = data.url;
      } else {
        throw new Error(data.error || 'Failed to create checkout session');
      }
    } catch (err: any) {
      console.error('Checkout Error:', err);
      alert(`Payment Error: ${err.message || 'Please try again.'}`);
    }
  };

  const handleSelectService = (service: Service) => {
    // Navigate to booking flow or handle service selection
    window.location.href = `/?tenant=${tenant.slug}&service=${service.id}`;
  };

  const backgroundImageUrl = (tenant as any).background_image_url;
  const hasBackground = !!backgroundImageUrl;
  const terms = getTerminology(tenant.business_type);

  return (
    <div className={`min-h-screen ${hasBackground ? '' : 'bg-white'}`} style={hasBackground ? { backgroundImage: `url(${backgroundImageUrl})`, backgroundSize: 'cover', backgroundPosition: 'center', backgroundAttachment: 'fixed' } : {}}>
      {/* Header */}
      <header className={`${hasBackground ? 'bg-white/10 backdrop-blur-lg border-white/20' : 'bg-white border-slate-200'} border-b sticky top-0 z-40`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-10 h-10 rounded-full object-cover"
            />
            <span className={`font-bold text-lg hidden sm:block ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
              {tenant.name}
            </span>
          </div>
          <nav className="flex items-center gap-4">
            <button
              onClick={() => setActiveTab('services')}
              className={`text-sm font-medium transition-colors ${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              {terms.services}
            </button>
            {tenant.features?.enableShop && (
              <button
                onClick={() => setActiveTab('shop')}
                className={`text-sm font-medium transition-colors ${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
              >
                {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
              </button>
            )}
            <a
              href="#custom-solutions"
              className={`text-sm font-medium transition-colors ${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-600 hover:text-slate-900'}`}
            >
              Custom Solutions
            </a>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-6 py-2.5 rounded-lg text-sm font-semibold transition-all ${hasBackground ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white hover:bg-white/30' : 'bg-slate-900 text-white hover:bg-slate-800'}`}
            >
              {terms.bookNow}
            </button>
          </nav>
        </div>
      </header>

      {/* Hero Section */}
      <section className={`${hasBackground ? '' : 'bg-white'} py-20 md:py-32 relative`}>
        <div className="max-w-6xl mx-auto px-4 sm:px-6 text-center relative z-10">
          <div className={`${hasBackground ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-white border border-slate-200'} rounded-lg inline-block p-3 mb-8`}>
            <img
              src={tenant.logoUrl}
              alt={tenant.name}
              className="w-20 h-20 rounded-lg mx-auto object-cover"
            />
          </div>
          <h1 className={`text-5xl sm:text-6xl md:text-7xl font-black mb-6 tracking-tighter leading-[0.9] ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
            {tenant.name}
          </h1>
          <p className={`text-xl sm:text-2xl font-medium max-w-2xl mx-auto leading-relaxed ${hasBackground ? 'text-white/90' : 'text-slate-600'}`}>
            {tenant.seo.description}
          </p>
        </div>
      </section>

      {/* Main Content */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 py-16 relative z-10">
        {/* Limited Offer Banner (Only show if not already a founding member) */}
        {!tenant.is_founding_member && (
          <LimitedOfferBanner 
            tenant={{
              slug: tenant.slug,
              is_founding_member: tenant.is_founding_member,
            }}
            hasBackground={hasBackground}
          />
        )}

        {/* Segmented Control / Tabs */}
        <div className="mb-12">
          <div className={`inline-flex rounded-lg p-1 ${hasBackground ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-white border border-slate-200'}`}>
            <button
              onClick={() => setActiveTab('services')}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'services'
                  ? hasBackground ? 'bg-white/20 backdrop-blur-lg text-white border border-white/30' : 'bg-slate-900 text-white'
                  : hasBackground ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              {terms.services}
            </button>
            {tenant.features?.enableShop && (
              <button
                onClick={() => setActiveTab('shop')}
                className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all ${
                  activeTab === 'shop'
                    ? hasBackground ? 'bg-white/20 backdrop-blur-lg text-white border border-white/30' : 'bg-slate-900 text-white'
                    : hasBackground ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'
                }`}
              >
                {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
              </button>
            )}
            <button
              onClick={() => {
                setActiveTab('support');
                setIsSupportBotOpen(true);
              }}
              className={`px-8 py-3 rounded-lg font-semibold text-sm transition-all ${
                activeTab === 'support'
                  ? hasBackground ? 'bg-white/20 backdrop-blur-lg text-white border border-white/30' : 'bg-slate-900 text-white'
                  : hasBackground ? 'text-white/80 hover:text-white' : 'text-slate-600 hover:text-slate-900'
              }`}
            >
              Support
            </button>
          </div>
        </div>

        {/* Services View */}
        {activeTab === 'services' && (
          <motion.div {...({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}>
            <div>
              <h2 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-4 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                {terms.services}
              </h2>
              {services.length === 0 ? (
                <div className="text-center py-20">
                  <p className={`font-medium text-lg ${hasBackground ? 'text-white/80' : 'text-slate-500'}`}>
                    No {terms.services.toLowerCase()} available at the moment.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {services.map((service) => (
                    <div
                      key={service.id}
                      onClick={() => handleSelectService(service)}
                      className={`group rounded-lg overflow-hidden cursor-pointer transition-all ${
                        hasBackground 
                          ? 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20' 
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {service.imageUrl && (
                        <div className="aspect-video bg-slate-100 overflow-hidden">
                          <img
                            src={service.imageUrl}
                            alt={service.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        </div>
                      )}
                      <div className="p-6 space-y-3">
                        <h3 className={`text-xl font-black group-hover:opacity-80 transition-opacity ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                          {service.name}
                        </h3>
                        <p className={`text-sm line-clamp-2 ${hasBackground ? 'text-white/80' : 'text-slate-500'}`}>
                          {service.description}
                        </p>
                        <div className={`flex items-center justify-between pt-2 ${hasBackground ? 'border-t border-white/20' : 'border-t border-slate-100'}`}>
                          <span className={`text-2xl font-black ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                            ${service.price.toFixed(2)}
                          </span>
                          <span className={`text-xs font-bold uppercase tracking-wider ${hasBackground ? 'text-white/70' : 'text-slate-400'}`}>
                            {service.durationMinutes} mins
                          </span>
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}

        {/* Shop View */}
        {activeTab === 'shop' && tenant.features?.enableShop && (
          <motion.div {...({ initial: { opacity: 0, y: 20 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}>
            <div>
              <h2 className={`text-4xl sm:text-5xl font-black tracking-tighter mb-4 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
              </h2>
              {products.length === 0 ? (
                <div className="text-center py-20">
                  <div className={`w-20 h-20 mx-auto rounded-full flex items-center justify-center mb-6 ${hasBackground ? 'bg-white/10 backdrop-blur-lg border border-white/20' : 'bg-slate-100'}`}>
                    <svg
                      className={`w-10 h-10 ${hasBackground ? 'text-white/80' : 'text-slate-400'}`}
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2"
                        d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                      />
                    </svg>
                  </div>
                  <p className={`font-medium text-lg ${hasBackground ? 'text-white/80' : 'text-slate-500'}`}>
                    No {tenant.business_type === 'education' ? 'lesson packs' : 'products'} available yet.
                  </p>
                </div>
              ) : (
                <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-6">
                  {products.map((product) => (
                    <div
                      key={product.id}
                      className={`group rounded-lg overflow-hidden transition-all ${
                        hasBackground 
                          ? 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20' 
                          : 'bg-white border border-slate-200 hover:border-slate-300'
                      }`}
                    >
                      {/* Product Image */}
                      <div className="aspect-square bg-slate-100 overflow-hidden relative">
                        {product.imageUrl ? (
                          <img
                            src={product.imageUrl}
                            alt={product.name}
                            className="w-full h-full object-cover group-hover:scale-105 transition-transform duration-300"
                          />
                        ) : (
                          <div className="w-full h-full flex items-center justify-center">
                            <svg
                              className="w-16 h-16 text-slate-300"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
                              />
                            </svg>
                          </div>
                        )}
                        {/* Price Badge */}
                        <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg ${hasBackground ? 'bg-white/20 backdrop-blur-lg border border-white/30' : 'bg-white border border-slate-200'}`}>
                          <span className={`text-lg font-black ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                            ${product.price.toFixed(2)}
                          </span>
                        </div>
                      </div>

                      {/* Product Info */}
                      <div className="p-6 space-y-4">
                        <div>
                          <h3 className={`text-xl font-black mb-2 group-hover:opacity-80 transition-opacity ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                            {product.name}
                          </h3>
                          {product.description && (
                            <p className={`text-sm line-clamp-2 ${hasBackground ? 'text-white/80' : 'text-slate-500'}`}>
                              {product.description}
                            </p>
                          )}
                        </div>

                        {/* Buy Now Button */}
                        <button
                          onClick={() => handleBuyNow(product)}
                          className={`w-full py-4 rounded-lg font-semibold text-sm text-white transition-all ${
                            hasBackground 
                              ? 'bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30' 
                              : 'bg-slate-900 hover:bg-slate-800'
                          }`}
                        >
                          {tenant.business_type === 'education' ? 'Purchase Pack' : 'Buy Now'}
                        </button>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </main>

      {/* Custom Solutions Section */}
      <CustomSolutionsSection tenant={tenant} hasBackground={hasBackground} />

      {/* Footer */}
      <footer className={`${hasBackground ? 'bg-white/10 backdrop-blur-lg border-white/20' : 'bg-white border-slate-200'} border-t py-12 px-4 sm:px-6 mt-20 relative z-10`}>
        <div className="max-w-6xl mx-auto">
          <div className="flex flex-wrap gap-8 justify-center md:justify-between mb-12 text-center md:text-left">
            {/* Business Info - Only show if there's content */}
            {(tenant.address || tenant.city || tenant.contactPhone) && (
              <div className="flex-1 min-w-[200px]">
                <h3 className={`font-bold text-xl mb-4 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                  {tenant.name}
                </h3>
                <p className={`text-sm leading-relaxed ${hasBackground ? 'text-white/80' : 'text-slate-500'}`}>
                  {tenant.address && (
                    <>
                      {tenant.address}
                      <br />
                    </>
                  )}
                  {tenant.city && tenant.state && (
                    <>
                      {tenant.city}, {tenant.state}
                      <br />
                    </>
                  )}
                  {tenant.contactPhone}
                </p>
              </div>
            )}
            
            {/* Quick Links */}
            <div className="flex-1 min-w-[200px]">
              <h4 className={`font-semibold mb-4 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>Quick Links</h4>
              <ul className={`space-y-2 text-sm ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
                <li>
                  <button
                    onClick={() => setActiveTab('services')}
                    className={`${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-900'} hover:opacity-70 transition-opacity`}
                  >
                    {terms.bookService}
                  </button>
                </li>
                {tenant.features?.enableShop && (
                  <li>
                    <button
                      onClick={() => setActiveTab('shop')}
                      className={`${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-900'} hover:opacity-70 transition-opacity`}
                    >
                      {tenant.business_type === 'education' ? 'Lesson Packs' : 'Shop'}
                    </button>
                  </li>
                )}
              </ul>
            </div>
            
            {/* Contact - Only show if there's contact info */}
            {(tenant.contactEmail || tenant.contactPhone) && (
              <div className="flex-1 min-w-[200px]">
                <h4 className={`font-semibold mb-4 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>Contact</h4>
                <ul className={`space-y-2 text-sm ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
                  {tenant.contactEmail && (
                    <li>
                      <a
                        href={`mailto:${tenant.contactEmail}`}
                        className={`${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-900'} hover:opacity-70 transition-opacity`}
                      >
                        {tenant.contactEmail}
                      </a>
                    </li>
                  )}
                  {tenant.contactPhone && (
                    <li>
                      <a
                        href={`tel:${tenant.contactPhone}`}
                        className={`${hasBackground ? 'text-white/90 hover:text-white' : 'text-slate-900'} hover:opacity-70 transition-opacity`}
                      >
                        {tenant.contactPhone}
                      </a>
                    </li>
                  )}
                </ul>
              </div>
            )}
          </div>
        </div>
        <div className={`max-w-6xl mx-auto pt-8 border-t text-center text-xs ${hasBackground ? 'text-white/60 border-white/20' : 'text-slate-400 border-slate-200'}`}>
          © {new Date().getFullYear()} {tenant.name}. Powered by VantakOS.
        </div>
      </footer>

      {/* Newsletter Popup (Marketing Engine - Pro/Elite Only) */}
      <NewsletterPopup
        tenantId={tenant.id}
        businessName={tenant.name}
        primaryColor={tenant.primaryColor}
        logoUrl={tenant.logoUrl}
        tenantTier={tenant.tier}
      />

      {/* Support Bot Modal */}
      <PublicSupportBot
        tenant={tenant}
        isOpen={isSupportBotOpen}
        onClose={() => {
          setIsSupportBotOpen(false);
          if (activeTab === 'support') {
            setActiveTab('services');
          }
        }}
      />
    </div>
  );
}

