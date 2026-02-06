
import React from 'react';
import { TenantConfig } from '../types';
import { getTerminology } from '../lib/terminology';

interface LayoutProps {
  tenant: TenantConfig;
  children: React.ReactNode;
  onNavigate: (path: string) => void;
}

export const Layout: React.FC<LayoutProps> = ({ tenant, children, onNavigate }) => {
  const terms = getTerminology(tenant.business_type);
  return (
    <div className="min-h-screen flex flex-col bg-brand-background">
      {/* Dynamic Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="max-w-6xl mx-auto px-4 h-16 flex items-center justify-between">
          <div 
            className="flex items-center gap-3 cursor-pointer" 
            onClick={() => onNavigate('home')}
          >
            {tenant.logoUrl ? (
              <img 
                src={tenant.logoUrl} 
                alt={tenant.name} 
                className="w-10 h-10 rounded-full object-cover"
                onError={(e) => {
                  // Hide image if it fails to load
                  (e.target as HTMLImageElement).style.display = 'none';
                }}
              />
            ) : (
              <div className="w-10 h-10 rounded-full bg-slate-200 flex items-center justify-center text-slate-600 font-black text-sm">
                {tenant.name.charAt(0).toUpperCase()}
              </div>
            )}
            <span className="font-bold text-lg hidden sm:block">{tenant.name}</span>
          </div>
          
          <nav className="flex items-center gap-4 sm:gap-8">
            <button onClick={() => onNavigate('home')} className="text-sm font-medium text-gray-600 hover:text-brand-primary">Home</button>
            <button onClick={() => onNavigate('book')} className="text-sm font-medium text-gray-600 hover:text-brand-primary transition-colors">{terms.services}</button>
            <button 
              onClick={() => onNavigate('book')}
              className="bg-brand-primary text-white px-5 py-2 rounded-brand text-sm font-semibold shadow-sm hover:brightness-110 active:scale-95 transition-all"
            >
              {terms.bookNow}
            </button>
          </nav>
        </div>
      </header>

      {/* Main Content */}
      <main className="flex-grow">
        {children}
      </main>

      {/* Dynamic Footer */}
      <footer className="bg-white border-t py-12 px-4">
        <div className="max-w-6xl mx-auto grid grid-cols-1 md:grid-cols-3 gap-8 text-center md:text-left">
          <div>
            <h3 className="font-bold text-xl mb-4 text-brand-primary">{tenant.name}</h3>
            <p className="text-gray-500 text-sm leading-relaxed">
              {tenant.address}<br />
              {tenant.city}, {tenant.state}<br />
              {tenant.contactPhone}
            </p>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900">Quick Links</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><button onClick={() => onNavigate('home')} className="hover:text-brand-primary">Home</button></li>
              <li><button onClick={() => onNavigate('book')} className="hover:text-brand-primary">{terms.bookService}</button></li>
              <li><button onClick={() => onNavigate('contact')} className="hover:text-brand-primary">Contact Us</button></li>
            </ul>
          </div>
          <div>
            <h4 className="font-semibold mb-4 text-slate-900">Account</h4>
            <ul className="space-y-2 text-sm text-gray-600">
              <li><button onClick={() => onNavigate('login')} className="hover:text-brand-primary">{terms.customer} Login</button></li>
              <li><button onClick={() => onNavigate('app')} className="hover:text-brand-primary">My Appointments</button></li>
            </ul>
          </div>
        </div>
        <div className="max-w-6xl mx-auto mt-12 pt-8 border-t text-center text-xs text-gray-400">
          © {new Date().getFullYear()} {tenant.name}. Powered by PlatformX.
        </div>
      </footer>
    </div>
  );
};
