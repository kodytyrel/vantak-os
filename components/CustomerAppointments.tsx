'use client';

import React, { useState, useEffect } from 'react';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';
import { getTerminology } from '../lib/terminology';

interface CustomerAppointmentsProps {
  tenant: TenantConfig;
  customerEmail: string;
}

interface AppointmentWithService {
  id: string;
  startTime: string;
  status: string;
  lesson_notes?: string;
  service: {
    name: string;
    price: number;
    durationMinutes: number;
  } | null;
}

export const CustomerAppointments: React.FC<CustomerAppointmentsProps> = ({ tenant, customerEmail }) => {
  const [appointments, setAppointments] = useState<AppointmentWithService[]>([]);
  const [isLoading, setIsLoading] = useState(true);
  const terms = getTerminology(tenant.business_type);

  useEffect(() => {
    if (customerEmail) {
      fetchAppointments();
    }
  }, [customerEmail, tenant.id]);

  const fetchAppointments = async () => {
    setIsLoading(true);
    try {
      // Fetch appointments for this customer
      const { data: apps, error: appsError } = await supabase
        .from('appointments')
        .select('*')
        .eq('tenantId', tenant.id)
        .eq('customer_email', customerEmail)
        .order('startTime', { ascending: false });

      if (appsError) throw appsError;

      if (apps && apps.length > 0) {
        // Fetch services for all appointments
        const serviceIds = apps.map((app: any) => app.serviceId).filter(Boolean);
        const { data: servs } = await supabase
          .from('services')
          .select('*')
          .in('id', serviceIds);

        const servicesMap = new Map((servs || []).map((s: any) => [s.id, s]));

        const formatted: AppointmentWithService[] = apps.map((app: any) => {
          const service = servicesMap.get(app.serviceId);
          return {
            id: app.id,
            startTime: app.startTime,
            status: app.status,
            lesson_notes: app.lesson_notes,
            service: service ? {
              name: service.name,
              price: (service.price || 0) / 100,
              durationMinutes: service.duration_minutes || 30
            } : null
          };
        });
        setAppointments(formatted);
      } else {
        setAppointments([]);
      }
    } catch (err) {
      console.error('Error fetching appointments:', err);
      setAppointments([]);
    } finally {
      setIsLoading(false);
    }
  };

  if (isLoading) {
    return (
      <div className="flex items-center justify-center py-20">
        <div className="w-8 h-8 border-2 border-brand-primary border-t-transparent rounded-full animate-spin" />
      </div>
    );
  }

  return (
    <div className="space-y-6">
      <div>
        <h2 className="text-4xl font-black text-slate-900 tracking-tighter mb-2">
          My Appointments
        </h2>
        <p className="text-slate-500 font-medium">
          View your appointment history{tenant.business_type === 'education' ? ' and notes from your teacher' : ''}.
        </p>
      </div>

      {appointments.length === 0 ? (
        <div className="text-center py-20 bg-white rounded-3xl border border-slate-200">
          <p className="text-lg text-slate-400 font-medium">
            No appointments yet
          </p>
        </div>
      ) : (
        <div className="space-y-4">
          {appointments.map((appointment) => (
            <div key={appointment.id} className="bg-white rounded-3xl border border-slate-200 shadow-sm p-6 space-y-4">
              <div className="flex justify-between items-start">
                <div>
                  <h3 className="text-xl font-black text-slate-900 mb-2">
                    {appointment.service?.name || 'Service'}
                  </h3>
                  <p className="text-sm text-slate-500">
                    {new Date(appointment.startTime).toLocaleDateString('en-US', {
                      weekday: 'long',
                      month: 'long',
                      day: 'numeric',
                      year: 'numeric'
                    })} at {new Date(appointment.startTime).toLocaleTimeString('en-US', {
                      hour: 'numeric',
                      minute: '2-digit'
                    })}
                  </p>
                  {appointment.service && (
                    <p className="text-sm text-slate-500 mt-1">
                      Duration: {appointment.service.durationMinutes} minutes
                    </p>
                  )}
                </div>
                <div className="text-right">
                  <p className="text-2xl font-black text-brand-primary">
                    ${appointment.service?.price || 0}
                  </p>
                  <span className={`inline-block mt-2 px-3 py-1 rounded-full text-[10px] font-black uppercase tracking-wider ${
                    appointment.status === 'CONFIRMED' ? 'bg-emerald-50 text-emerald-600' :
                    appointment.status === 'COMPLETED' ? 'bg-blue-50 text-blue-600' :
                    appointment.status === 'CANCELLED' ? 'bg-red-50 text-red-600' :
                    'bg-yellow-50 text-yellow-600'
                  }`}>
                    {appointment.status}
                  </span>
                </div>
              </div>

              {/* Lesson Notes Display for Education Mode */}
              {tenant.business_type === 'education' && appointment.lesson_notes && (
                <div className="pt-4 border-t border-slate-200">
                  <div className="flex items-center gap-2 mb-3">
                    <svg className="w-5 h-5 text-sky-500" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z"/>
                    </svg>
                    <label className="text-sm font-black text-slate-900 uppercase tracking-wider">
                      Lesson Notes from Your Teacher
                    </label>
                  </div>
                  <div className="bg-sky-50 border border-sky-200 rounded-xl p-5">
                    <p className="text-sm text-slate-700 font-medium leading-relaxed whitespace-pre-wrap">
                      {appointment.lesson_notes}
                    </p>
                  </div>
                </div>
              )}
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

