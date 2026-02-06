
import React, { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig, Service } from '../types';
import { MOCK_SERVICES } from '../constants';
import { supabase } from '../services/supabase';
import { hasMarketingEngineAccess, hasProAccess } from '../lib/tierGating';
import { UpgradeModal } from './UpgradeModal';
import { getTerminology } from '../lib/terminology';

interface BookingFlowProps {
  tenant: TenantConfig;
}

export const BookingFlow: React.FC<BookingFlowProps> = ({ tenant }) => {
  const [step, setStep] = useState(1);
  const [selectedService, setSelectedService] = useState<Service | null>(null);
  const [selectedDate, setSelectedDate] = useState<string>('');
  const [selectedTime, setSelectedTime] = useState<string>('');
  const [isLoading, setIsLoading] = useState(false);
  const [customerEmail, setCustomerEmail] = useState<string>('');
  const [subscribeToNewsletter, setSubscribeToNewsletter] = useState<boolean>(false);
  const [isRecurring, setIsRecurring] = useState<boolean>(false);
  const [recurringEndDate, setRecurringEndDate] = useState<string>('');
  const [showUpgradeModal, setShowUpgradeModal] = useState<boolean>(false);

  const services = MOCK_SERVICES[tenant.id] || [];
  const timeSlots = ['09:00 AM', '10:30 AM', '11:45 AM', '01:00 PM', '02:30 PM', '04:00 PM', '05:30 PM'];
  const terms = getTerminology(tenant.business_type);

  const handleSelectService = (s: Service) => {
    setSelectedService(s);
    setStep(2);
  };

  const handleRecurringToggle = () => {
    if (!hasProAccess(tenant.tier)) {
      setShowUpgradeModal(true);
      return;
    }
    setIsRecurring(!isRecurring);
    if (!isRecurring && selectedDate) {
      // Set default end date to 16 weeks (semester)
      const endDate = new Date(selectedDate);
      endDate.setDate(endDate.getDate() + (16 * 7));
      setRecurringEndDate(endDate.toISOString().split('T')[0]);
    }
  };

  const handleFinalize = async () => {
    if (!selectedService || !selectedDate || !selectedTime) return;
    
    // If recurring is selected but user doesn't have Pro access, show upgrade modal
    if (isRecurring && !hasProAccess(tenant.tier)) {
      setShowUpgradeModal(true);
      return;
    }
    
    setIsLoading(true);
    try {
      if (isRecurring && hasProAccess(tenant.tier) && recurringEndDate) {
        // Create recurring appointments via API
        const response = await fetch('/api/appointments/create-recurring', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            tenantId: tenant.id,
            serviceId: selectedService.id,
            startDate: selectedDate,
            startTime: selectedTime.split(' ')[0],
            recurringPattern: 'weekly',
            endDate: recurringEndDate,
            customerEmail: customerEmail || 'guest@example.com',
            subscribeToNewsletter: subscribeToNewsletter && customerEmail ? true : false,
            slug: tenant.slug
          }),
        });

        const data = await response.json();
        
        if (data.error) {
          throw new Error(data.error);
        }

        // Redirect to checkout for the first appointment
        if (data.checkoutUrl) {
          window.location.href = data.checkoutUrl;
        } else {
          throw new Error('Failed to create recurring appointments');
        }
      } else {
        // Single appointment (existing flow)
        const { data: appointment, error: dbError } = await supabase
          .from('appointments')
          .insert([{
            tenantId: tenant.id,
            serviceId: selectedService.id,
            startTime: `${selectedDate}T${selectedTime.split(' ')[0]}:00`,
            status: 'PENDING',
            paid: false,
            customer_email: customerEmail || 'guest@example.com'
          }])
          .select()
          .single();

        if (dbError) throw dbError;

        // 2. Initiate the Multi-Tenant Stripe Checkout Session via secure API
        const response = await fetch('/api/checkout', {
          method: 'POST',
          headers: { 'Content-Type': 'application/json' },
          body: JSON.stringify({
            slug: tenant.slug,
            type: 'service',
            itemId: selectedService.id,
            appointmentId: appointment.id,
            customerEmail: customerEmail || undefined,
            subscribeToNewsletter: subscribeToNewsletter && customerEmail ? true : false
          }),
        });

        const data = await response.json();
        
        if (data.url) {
          window.location.href = data.url;
        } else {
          throw new Error(data.error || 'Vantak Engine: Failed to generate checkout URL');
        }
      }
    } catch (err: any) {
      console.error("Checkout Failure:", err);
      alert(`VantakOS Payment Error: ${err.message || 'Please try again.'}`);
    } finally {
      setIsLoading(false);
    }
  };

  const slideVariants = {
    initial: { x: 50, opacity: 0 },
    animate: { x: 0, opacity: 1 },
    exit: { x: -50, opacity: 0 },
  };

  const stepProgress = (step / 3) * 100;

  return (
    <div className="min-h-[calc(100vh-64px)] bg-white flex flex-col">
      <div className="bg-white border-b border-slate-200 sticky top-16 z-40">
        <div className="h-1 bg-slate-100 w-full overflow-hidden">
          <motion.div 
            {...({ className: "h-full bg-slate-900", initial: { width: 0 }, animate: { width: `${stepProgress}%` }, transition: { type: 'spring', stiffness: 50, damping: 20 } } as any)}
          />
        </div>
        <div className="max-w-2xl mx-auto px-6 py-4 flex justify-between items-center">
          <button 
            onClick={() => setStep(Math.max(1, step - 1))}
            disabled={isLoading}
            className={`text-sm font-semibold flex items-center gap-1 transition-opacity ${step === 1 ? 'opacity-0 pointer-events-none' : 'opacity-100 text-slate-600 hover:text-slate-900'}`}
          >
            <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 19l-7-7 7-7"/></svg>
            Back
          </button>
          <span className="text-xs font-semibold uppercase tracking-widest text-slate-500">Step {step} of 3</span>
          <div className="w-12"></div>
        </div>
      </div>

      <div className="flex-grow flex flex-col items-center py-8 bg-white">
        <div className="w-full max-w-2xl px-6">
          <AnimatePresence mode="wait">
            {step === 1 && (
              <motion.div key="step1" variants={slideVariants} initial="initial" animate="animate" exit="exit" {...({ className: "space-y-6" } as any)}>
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight text-slate-900">Select a {terms.service}</h2>
                  <p className="text-slate-600 font-medium">Choose the {terms.service.toLowerCase()} that fits your needs.</p>
                </div>
                <div className="grid gap-4">
                  {services.map(service => (
                    <motion.button 
                      key={service.id} 
                      {...({ whileTap: { scale: 0.98 }, onClick: () => handleSelectService(service), className: "group p-6 text-left border border-slate-200 rounded-lg bg-white hover:border-slate-300 transition-all flex justify-between items-center" } as any)}
                    >
                      <div className="flex-grow pr-4">
                        <h3 className="font-bold text-xl mb-1 text-slate-900">{service.name}</h3>
                        <p className="text-slate-600 text-sm line-clamp-2">{service.description}</p>
                        <div className="mt-4 flex items-center gap-3 text-xs font-semibold text-slate-500">
                          <span className="flex items-center gap-1"><svg className="w-3 h-3" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>{service.durationMinutes} MIN</span>
                        </div>
                      </div>
                      <div className="flex flex-col items-end">
                        <span className="text-xl font-black text-slate-900">${service.price}</span>
                      </div>
                    </motion.button>
                  ))}
                </div>
              </motion.div>
            )}

            {step === 2 && (
              <motion.div key="step2" variants={slideVariants} initial="initial" animate="animate" exit="exit" {...({ className: "space-y-8" } as any)}>
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight text-slate-900">Pick a Time</h2>
                  <p className="text-slate-600">Let's find a slot for your <strong className="text-slate-900">{selectedService?.name}</strong>.</p>
                </div>
                <div className="space-y-6">
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Select Date</label>
                    <input type="date" className="w-full p-5 bg-white border border-slate-200 rounded-lg focus:border-slate-900 focus:ring-2 focus:ring-slate-900 outline-none transition-all font-semibold text-lg" onChange={(e) => setSelectedDate(e.target.value)} />
                  </div>
                  <div>
                    <label className="block text-xs font-semibold text-slate-500 uppercase tracking-widest mb-3">Available Sessions</label>
                    <div className="grid grid-cols-2 sm:grid-cols-3 gap-3">
                      {timeSlots.map(time => (
                        <motion.button key={time} {...({ whileTap: { scale: 0.95 }, onClick: () => setSelectedTime(time), className: `p-4 text-sm font-semibold rounded-lg border transition-all ${selectedTime === time ? 'bg-slate-900 text-white border-slate-900' : 'bg-white border-slate-200 hover:border-slate-300 text-slate-900'}` } as any)}>{time}</motion.button>
                      ))}
                    </div>
                  </div>
                </div>
                <motion.button {...({ disabled: !selectedDate || !selectedTime, whileTap: { scale: 0.98 }, onClick: () => setStep(3), className: "w-full bg-slate-900 text-white py-5 rounded-lg font-semibold text-lg disabled:opacity-30 hover:bg-slate-800 transition-all" } as any)}>Confirm Availability</motion.button>
              </motion.div>
            )}

            {step === 3 && (
              <motion.div key="step3" variants={slideVariants} initial="initial" animate="animate" exit="exit" {...({ className: "space-y-8" } as any)}>
                <div>
                  <h2 className="text-3xl font-black mb-2 tracking-tight text-slate-900">Booking Details</h2>
                  <p className="text-slate-600">Review your appointment summary.</p>
                </div>
                <div className="bg-white rounded-lg border border-slate-200 overflow-hidden">
                  <div className="p-8 space-y-6">
                    <div className="flex justify-between items-start">
                      <div>
                        <span className="text-[10px] font-semibold text-slate-500 uppercase tracking-tighter">{terms.service}</span>
                        <h4 className="text-xl font-bold leading-tight text-slate-900">{selectedService?.name}</h4>
                        <p className="text-sm text-slate-500 font-medium">Duration: {selectedService?.durationMinutes} mins</p>
                      </div>
                      <div className="text-right"><span className="text-2xl font-black text-slate-900">${selectedService?.price}</span></div>
                    </div>
                    <div className="flex gap-4 p-4 bg-slate-50 rounded-lg border border-slate-200">
                      <div className="w-12 h-12 rounded-lg bg-slate-100 flex items-center justify-center text-slate-900">
                        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M8 7V3m8 4V3m-9 8h10M5 21h14a2 2 0 002-2V7a2 2 0 00-2-2H5a2 2 0 00-2 2v12a2 2 0 002 2z"/></svg>
                      </div>
                      <div>
                        <p className="text-xs font-semibold text-slate-500 uppercase">Appointment Time</p>
                        <p className="font-bold text-slate-900">{selectedDate ? new Date(selectedDate).toLocaleDateString('en-US', { month: 'long', day: 'numeric', year: 'numeric' }) : ''}</p>
                        <p className="font-bold text-slate-900">{selectedTime}</p>
                      </div>
                    </div>
                    <div className="space-y-4 pt-4 border-t border-slate-200">
                      <div>
                        <label className="block text-sm font-semibold text-slate-900 mb-2">Email Address</label>
                        <input
                          type="email"
                          value={customerEmail}
                          onChange={(e) => setCustomerEmail(e.target.value)}
                          placeholder="your@email.com"
                          className="w-full px-4 py-3 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-colors"
                        />
                      </div>
                      {/* Recurring Appointment Toggle (Pro Tier Only) */}
                      <div className="border border-slate-200 rounded-lg p-4 bg-white">
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={isRecurring}
                            onChange={handleRecurringToggle}
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                          <div className="flex-1">
                            <div className="flex items-center gap-2">
                              <span className="text-sm font-semibold text-slate-900">
                                Repeat Weekly
                              </span>
                              {!hasProAccess(tenant.tier) && (
                                <span className="text-[10px] font-semibold uppercase tracking-wider bg-slate-100 text-slate-700 px-2 py-0.5 rounded-lg border border-slate-200">
                                  Pro
                                </span>
                              )}
                            </div>
                            <p className="text-xs text-slate-600 mt-0.5">
                              {hasProAccess(tenant.tier) 
                                ? "Set it and forget it. We'll handle reminders and billing for the whole semester."
                                : 'Upgrade to Pro to automatically book recurring appointments.'}
                            </p>
                            {isRecurring && hasProAccess(tenant.tier) && (
                              <div className="mt-3">
                                <label className="block text-xs font-semibold text-slate-700 mb-1">End Date (Semester)</label>
                                <input
                                  type="date"
                                  value={recurringEndDate}
                                  onChange={(e) => setRecurringEndDate(e.target.value)}
                                  min={selectedDate}
                                  className="w-full px-3 py-2 rounded-lg border border-slate-200 focus:border-slate-900 focus:ring-2 focus:ring-slate-900 focus:outline-none transition-colors text-sm"
                                />
                              </div>
                            )}
                          </div>
                        </label>
                      </div>
                      {hasMarketingEngineAccess(tenant.tier) && (
                        <label className="flex items-start gap-3 cursor-pointer group">
                          <input
                            type="checkbox"
                            checked={subscribeToNewsletter}
                            onChange={(e) => setSubscribeToNewsletter(e.target.checked)}
                            className="mt-1 w-5 h-5 rounded border-slate-300 text-slate-900 focus:ring-slate-900 cursor-pointer"
                          />
                          <div>
                            <span className="text-sm font-semibold text-slate-900">
                              Join Newsletter
                            </span>
                            <p className="text-xs text-slate-600 mt-0.5">
                              Get updates on new services and special offers
                            </p>
                          </div>
                        </label>
                      )}
                    </div>
                  </div>
                </div>
                <motion.button {...({ whileTap: { scale: 0.98 }, disabled: isLoading, onClick: handleFinalize, className: "w-full bg-slate-900 text-white py-5 rounded-lg font-semibold text-lg flex items-center justify-center gap-3 transition-all hover:bg-slate-800 disabled:opacity-50" } as any)}>
                  {isLoading ? <div className="w-6 h-6 border-2 border-white border-t-transparent rounded-full animate-spin" /> : <><span>Complete {terms.bookService}</span><svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 15v2m-6 4h12a2 2 0 002-2v-6a2 2 0 00-2-2H6a2 2 0 00-2 2v6a2 2 0 002 2zm10-10V7a4 4 0 00-8 0v4h8z"/></svg></>}
                </motion.button>
              </motion.div>
            )}
          </AnimatePresence>
        </div>
      </div>
      
      {/* Upgrade Modal */}
      <UpgradeModal
        isOpen={showUpgradeModal}
        onClose={() => setShowUpgradeModal(false)}
        featureName="Recurring Appointments"
        currentTier={tenant.tier}
        targetTier="Vantak Pro"
        benefits={[
          'Set it and forget it - automatic weekly bookings',
          'Automated reminders for you and your customers',
          'Seamless billing for the entire semester',
          'Save hours of manual booking time'
        ]}
        price="$29"
      />
    </div>
  );
};
