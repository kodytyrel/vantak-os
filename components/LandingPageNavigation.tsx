'use client';

import React, { useState, useEffect } from 'react';
import Link from 'next/link';
import { Menu, X } from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

interface LandingPageNavigationProps {
  remainingSpots?: number;
  isPioneerAvailable?: boolean;
}

export const LandingPageNavigation: React.FC<LandingPageNavigationProps> = () => {
  const [remainingSpots, setRemainingSpots] = useState<number | null>(null);
  const [isPioneerAvailable, setIsPioneerAvailable] = useState(true);
  const [isMobileMenuOpen, setIsMobileMenuOpen] = useState(false);
  const [isScrolled, setIsScrolled] = useState(false);

  // Fetch tenant count for Pioneer counter
  useEffect(() => {
    const fetchTenantCount = async () => {
      try {
        const response = await fetch('/api/founding-member/spots', {
          method: 'GET',
          cache: 'no-store'
        });
        const data = await response.json();
        setRemainingSpots(data.remaining || 0);
        setIsPioneerAvailable(data.isPioneerAvailable || false);
      } catch (error) {
        console.error('Failed to fetch tenant count:', error);
        setRemainingSpots(100);
        setIsPioneerAvailable(true);
      }
    };
    fetchTenantCount();
    const interval = setInterval(fetchTenantCount, 30000);
    return () => clearInterval(interval);
  }, []);

  // Track scroll for header styling
  useEffect(() => {
    const handleScroll = () => {
      setIsScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const navLinks = [
    { label: 'Features', href: '#features' },
    { label: 'How it Works', href: '#how-it-works' },
    { label: 'Pricing', href: '#pricing' },
    { label: 'Our Mission', href: '#mission' },
  ];

  const handleNavClick = (e: React.MouseEvent<HTMLAnchorElement>, href: string) => {
    e.preventDefault();
    if (href.startsWith('#')) {
      const element = document.querySelector(href);
      if (element) {
        const headerOffset = 100;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: 'smooth',
        });
      }
    }
    setIsMobileMenuOpen(false);
  };

  return (
    <>
      <nav 
        className={`sticky top-0 z-[100] transition-all duration-300 ${
          isScrolled 
            ? 'bg-white/90 backdrop-blur-md border-b border-slate-200/50 shadow-sm' 
            : 'bg-white/70 backdrop-blur-md border-b border-slate-200/30'
        }`}
      >
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16 md:h-20">
            {/* Logo */}
            <div className="flex items-center flex-shrink-0">
              <Link href="/" className="flex items-center">
                <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                  <img
                    src="/logo.png"
                    alt="VantakOS - No more gatekeeping"
                    className="h-6 md:h-8 w-auto"
                  />
                </div>
              </Link>
            </div>

            {/* Desktop Navigation Links - Center */}
            <div className="hidden lg:flex items-center justify-center flex-1">
              <ul className="flex items-center gap-8">
                {navLinks.map((link) => (
                  <li key={link.href}>
                    <a
                      href={link.href}
                      onClick={(e) => handleNavClick(e, link.href)}
                      className="text-sm font-semibold text-slate-700 hover:text-slate-900 transition-colors relative group"
                    >
                      {link.label}
                      <span className="absolute bottom-0 left-0 w-0 h-0.5 bg-sky-500 transition-all group-hover:w-full" />
                    </a>
                  </li>
                ))}
              </ul>
            </div>

            {/* CTA Button - Right */}
            <div className="hidden lg:flex items-center gap-4">
              {isPioneerAvailable && remainingSpots !== null && remainingSpots > 0 && remainingSpots <= 100 && (
                <div className="text-xs text-slate-600 font-medium">
                  <span className="text-sky-500 font-black">{remainingSpots}</span> spots left
                </div>
              )}
              <Link
                href="/login"
                className="px-6 py-2.5 text-slate-700 hover:text-slate-900 font-semibold text-sm transition-colors"
              >
                Log in
              </Link>
              <Link
                href="/signup"
                className="px-6 py-2.5 bg-slate-900 hover:bg-slate-800 text-white font-semibold text-sm rounded-lg transition-all shadow-sm hover:shadow-md"
              >
                Launch Your App
              </Link>
            </div>

            {/* Mobile Menu Button */}
            <button
              onClick={() => setIsMobileMenuOpen(!isMobileMenuOpen)}
              className="lg:hidden p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
              aria-label="Toggle menu"
            >
              {isMobileMenuOpen ? (
                <X className="w-6 h-6" />
              ) : (
                <Menu className="w-6 h-6" />
              )}
            </button>
          </div>
        </div>
      </nav>

      {/* Mobile Menu - Glassmorphism Slide-in */}
      <AnimatePresence>
        {isMobileMenuOpen && (
          <>
            {/* Backdrop */}
            <motion.div
              initial={{ opacity: 0 }}
              animate={{ opacity: 1 }}
              exit={{ opacity: 0 }}
              onClick={() => setIsMobileMenuOpen(false)}
              className="fixed inset-0 bg-black/20 backdrop-blur-sm z-[99] lg:hidden"
            />
            
            {/* Mobile Menu Panel */}
            <motion.div
              initial={{ x: '100%' }}
              animate={{ x: 0 }}
              exit={{ x: '100%' }}
              transition={{ type: 'spring', damping: 25, stiffness: 200 }}
              className="fixed top-0 right-0 h-full w-80 max-w-[85vw] bg-white/90 backdrop-blur-xl border-l border-slate-200/50 shadow-2xl z-[100] lg:hidden overflow-y-auto"
            >
              <div className="p-6 space-y-8">
                {/* Mobile Header */}
                <div className="flex items-center justify-between mb-8">
                  <div className="bg-white/10 backdrop-blur-md rounded-lg p-2 border border-white/20">
                    <img
                      src="/logo.png"
                      alt="VantakOS"
                      className="h-8 w-auto"
                    />
                  </div>
                  <button
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="p-2 rounded-lg text-slate-700 hover:bg-slate-100 transition-colors"
                  >
                    <X className="w-6 h-6" />
                  </button>
                </div>

                {/* Pioneer Counter - Mobile */}
                {isPioneerAvailable && remainingSpots !== null && remainingSpots > 0 && remainingSpots <= 100 && (
                  <div className="bg-gradient-to-br from-sky-50 to-purple-50 rounded-xl p-4 border-2 border-sky-200">
                    <p className="text-sm font-medium text-slate-700 mb-1">
                      {remainingSpots === 100 ? 'Be the First' : remainingSpots < 10 ? 'Hurry! Only' : 'Only'}{' '}
                      <span className="text-sky-500 font-black text-lg">{remainingSpots}</span>{' '}
                      {remainingSpots === 1 ? 'Pioneer Spot' : 'Pioneer Spots'} Remaining
                    </p>
                  </div>
                )}

                {/* Navigation Links */}
                <ul className="space-y-4">
                  {navLinks.map((link) => (
                    <li key={link.href}>
                      <a
                        href={link.href}
                        onClick={(e) => handleNavClick(e, link.href)}
                        className="block text-base font-semibold text-slate-900 hover:text-sky-500 transition-colors py-2 border-b border-slate-100"
                      >
                        {link.label}
                      </a>
                    </li>
                  ))}
                </ul>

                {/* Mobile CTA */}
                <div className="pt-6 border-t border-slate-200 space-y-3">
                  <Link
                    href="/login"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-6 py-3 text-slate-700 hover:text-slate-900 font-semibold rounded-lg border-2 border-slate-200 hover:border-slate-300 transition-all"
                  >
                    Log in
                  </Link>
                  <Link
                    href="/signup"
                    onClick={() => setIsMobileMenuOpen(false)}
                    className="block w-full text-center px-6 py-3 bg-slate-900 hover:bg-slate-800 text-white font-semibold rounded-lg transition-all shadow-sm hover:shadow-md"
                  >
                    Launch Your App
                  </Link>
                </div>
              </div>
            </motion.div>
          </>
        )}
      </AnimatePresence>
    </>
  );
};

