
import React from 'react';
import { motion } from 'framer-motion';
import { Service } from '../../types';

interface ServiceListProps {
  services: Service[];
  onSelect: (service: Service) => void;
  hasBackground?: boolean;
}

export const ServiceList: React.FC<ServiceListProps> = ({ services, onSelect, hasBackground = false }) => {
  if (services.length === 0) {
    return (
      <div className="text-center py-20">
        <div className="w-20 h-20 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-6">
          <svg
            className="w-10 h-10 text-slate-400"
            fill="none"
            stroke="currentColor"
            viewBox="0 0 24 24"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth="2"
              d="M9 5H7a2 2 0 00-2 2v12a2 2 0 002 2h10a2 2 0 002-2V7a2 2 0 00-2-2h-2M9 5a2 2 0 002 2h2a2 2 0 002-2M9 5a2 2 0 012-2h2a2 2 0 012 2"
            />
          </svg>
        </div>
        <p className="text-slate-500 font-medium text-lg">No services available yet.</p>
        <p className="text-slate-400 text-sm mt-2">Check back soon for new offerings!</p>
      </div>
    );
  }

  return (
    <div className="grid gap-6">
      {services.map((service, index) => (
        <motion.div
          key={service.id}
          {...({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 }, onClick: () => onSelect(service), className: `group p-6 md:p-8 rounded-lg transition-all cursor-pointer flex flex-col md:flex-row md:items-center justify-between gap-6 ${
            hasBackground 
              ? 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20' 
              : 'bg-white border border-slate-200 hover:border-slate-300'
          }` } as any)}
        >
          <div className="space-y-3 flex-grow">
            <div className="flex flex-wrap items-center gap-3">
              <h4 className={`text-2xl font-black ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                {service.name}
              </h4>
              <span className={`text-[10px] font-semibold uppercase tracking-widest px-2.5 py-1 rounded-lg border ${
                hasBackground 
                  ? 'bg-white/10 backdrop-blur-lg text-white/90 border-white/20' 
                  : 'bg-slate-50 text-slate-600 border-slate-200'
              }`}>
                Next Available: Today 3:00 PM
              </span>
            </div>
            <p className={`font-medium max-w-xl leading-relaxed ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
              {service.description}
            </p>
            <div className={`flex items-center gap-4 text-xs font-semibold ${hasBackground ? 'text-white/70' : 'text-slate-500'}`}>
              <span className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg border uppercase tracking-wider text-[10px] ${
                hasBackground 
                  ? 'bg-white/10 backdrop-blur-lg text-white/90 border-white/20' 
                  : 'bg-slate-50 border-slate-200'
              }`}>
                <svg className="w-3.5 h-3.5" fill="none" stroke="currentColor" viewBox="0 0 24 24"><path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 8v4l3 3m6-3a9 9 0 11-18 0 9 9 0 0118 0z"/></svg>
                {service.durationMinutes} Mins
              </span>
            </div>
          </div>

          <div className="flex items-center justify-between md:flex-col md:items-end gap-4 shrink-0">
            <div className={`text-3xl font-black tracking-tight ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
              <span className={`text-sm font-semibold mr-1 ${hasBackground ? 'text-white/70' : 'text-slate-500'}`}>$</span>
              {service.price}
            </div>
            <button className={`px-8 py-3.5 rounded-lg font-semibold text-xs uppercase tracking-widest transition-all ${
              hasBackground 
                ? 'bg-white/20 backdrop-blur-lg border border-white/30 text-white hover:bg-white/30' 
                : 'bg-slate-900 text-white hover:bg-slate-800'
            }`}>
              Select
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};
