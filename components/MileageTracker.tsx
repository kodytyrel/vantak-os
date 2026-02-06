import React, { useState, useEffect } from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';

interface MileageLog {
  id: string;
  date: string;
  purpose: string;
  start_location: string | null;
  end_location: string | null;
  start_miles: number | null;
  end_miles: number | null;
  total_miles: number | null;
  notes: string | null;
  created_at: string;
}

interface MileageTrackerProps {
  tenant: TenantConfig;
}

const MILEAGE_PURPOSES = [
  { value: 'client_visit', label: 'Client Visit' },
  { value: 'supply_run', label: 'Supply Run' },
  { value: 'meeting', label: 'Business Meeting' },
  { value: 'delivery', label: 'Delivery' },
  { value: 'other', label: 'Other' },
];

// Purpose: Track business travel mileage for record keeping

export const MileageTracker: React.FC<MileageTrackerProps> = ({ tenant }) => {
  const [logs, setLogs] = useState<MileageLog[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isGettingLocation, setIsGettingLocation] = useState(false);
  const [currentOdometer, setCurrentOdometer] = useState<number | null>(null);

  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: 'client_visit',
    start_location: '',
    end_location: '',
    start_miles: '',
    end_miles: '',
    notes: '',
  });

  useEffect(() => {
    fetchLogs();
    // Load saved odometer reading
    const saved = localStorage.getItem(`odometer_${tenant.id}`);
    if (saved) {
      setCurrentOdometer(parseFloat(saved));
      setFormData(prev => ({ ...prev, start_miles: saved }));
    }
  }, [tenant.id]);

  const fetchLogs = async () => {
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching mileage logs:', error);
    } else {
      setLogs(data || []);
    }
  };

  const getCurrentLocation = async () => {
    if (!navigator.geolocation) {
      alert('Geolocation is not supported by your browser.');
      return;
    }

    setIsGettingLocation(true);
    navigator.geolocation.getCurrentPosition(
      async (position) => {
        const { latitude, longitude } = position.coords;
        
        // Reverse geocode to get address (using a free service)
        try {
          const response = await fetch(
            `https://nominatim.openstreetmap.org/reverse?format=json&lat=${latitude}&lon=${longitude}`
          );
          const data = await response.json();
          const address = data.display_name || `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          
          if (!formData.start_location) {
            setFormData(prev => ({ ...prev, start_location: address }));
          } else if (!formData.end_location) {
            setFormData(prev => ({ ...prev, end_location: address }));
          }
        } catch (err) {
          const address = `${latitude.toFixed(4)}, ${longitude.toFixed(4)}`;
          if (!formData.start_location) {
            setFormData(prev => ({ ...prev, start_location: address }));
          } else if (!formData.end_location) {
            setFormData(prev => ({ ...prev, end_location: address }));
          }
        }
        setIsGettingLocation(false);
      },
      (error) => {
        console.error('Geolocation error:', error);
        alert('Could not get your location. Please enter manually.');
        setIsGettingLocation(false);
      }
    );
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const startMiles = formData.start_miles ? parseFloat(formData.start_miles) : null;
      const endMiles = formData.end_miles ? parseFloat(formData.end_miles) : null;

      const { error } = await supabase
        .from('mileage_logs')
        .insert([{
          tenant_id: tenant.id,
          date: formData.date,
          purpose: formData.purpose,
          start_location: formData.start_location || null,
          end_location: formData.end_location || null,
          start_miles: startMiles,
          end_miles: endMiles,
          notes: formData.notes || null,
        }]);

      if (error) throw error;

      // Save end miles as new starting point
      if (endMiles) {
        setCurrentOdometer(endMiles);
        localStorage.setItem(`odometer_${tenant.id}`, endMiles.toString());
      }

      // Reset form
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purpose: 'client_visit',
        start_location: '',
        end_location: '',
        start_miles: endMiles ? endMiles.toString() : '',
        end_miles: '',
        notes: '',
      });
      setIsAdding(false);
      
      fetchLogs();
    } catch (err: any) {
      console.error('Error saving mileage log:', err);
      alert('Failed to save mileage log. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this mileage log?')) return;

    try {
      const { error } = await supabase
        .from('mileage_logs')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchLogs();
    } catch (err: any) {
      console.error('Error deleting mileage log:', err);
      alert('Failed to delete mileage log.');
    }
  };

  const totalMiles = logs
    .filter(log => log.total_miles !== null)
    .reduce((sum, log) => sum + (log.total_miles || 0), 0);

  const thisYearTotal = logs
    .filter(log => {
      const logDate = new Date(log.date);
      const now = new Date();
      return logDate.getFullYear() === now.getFullYear() && log.total_miles !== null;
    })
    .reduce((sum, log) => sum + (log.total_miles || 0), 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Total Miles
          </div>
          <div className="text-3xl font-black text-emerald-600">{totalMiles.toFixed(1)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            This Year
          </div>
          <div className="text-3xl font-black text-emerald-600">{thisYearTotal.toFixed(1)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Current Odometer
          </div>
          <div className="text-3xl font-black text-slate-900">
            {currentOdometer !== null ? currentOdometer.toFixed(0) : '—'}
          </div>
        </div>
      </div>
      
      {/* Info Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium">
          <span className="font-bold">Business Travel Tracking:</span> Log mileage for client visits, supply runs, meetings, and other business travel. Keep accurate records for your business organization and record keeping.
        </p>
      </div>

      {/* Add Log Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 border-2 border-slate-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M12 4v16m8-8H4" />
        </svg>
        Log Mileage
      </button>

      {/* Add Log Form Modal */}
      {isAdding && (
        <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
          <motion.div
            {...({ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, className: "bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" } as any)}
          >
            <div className="p-8">
              <div className="flex items-center justify-between mb-6">
                <h3 className="text-2xl font-black text-slate-900">Log Mileage</h3>
                <button
                  onClick={() => setIsAdding(false)}
                  className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                >
                  <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                    <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                  </svg>
                </button>
              </div>

              <form onSubmit={handleSubmit} className="space-y-6">
                {/* Date */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Date</label>
                  <input
                    type="date"
                    value={formData.date}
                    onChange={(e) => setFormData({ ...formData, date: e.target.value })}
                    required
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                  />
                </div>

                {/* Purpose */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Purpose</label>
                  <select
                    value={formData.purpose}
                    onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                  >
                    {MILEAGE_PURPOSES.map(p => (
                      <option key={p.value} value={p.value}>{p.label}</option>
                    ))}
                  </select>
                </div>

                {/* Location with GPS */}
                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">Start Location</label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use GPS
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.start_location}
                    onChange={(e) => setFormData({ ...formData, start_location: e.target.value })}
                    placeholder="Starting address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                  />
                </div>

                <div>
                  <div className="flex items-center justify-between mb-2">
                    <label className="block text-sm font-bold text-slate-700">End Location</label>
                    <button
                      type="button"
                      onClick={getCurrentLocation}
                      disabled={isGettingLocation}
                      className="text-xs font-bold text-slate-600 hover:text-slate-900 flex items-center gap-1 disabled:opacity-50"
                    >
                      {isGettingLocation ? (
                        <>
                          <div className="w-3 h-3 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                          Getting location...
                        </>
                      ) : (
                        <>
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M17.657 16.657L13.414 20.9a1.998 1.998 0 01-2.827 0l-4.244-4.243a8 8 0 1111.314 0z" />
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 11a3 3 0 11-6 0 3 3 0 016 0z" />
                          </svg>
                          Use GPS
                        </>
                      )}
                    </button>
                  </div>
                  <input
                    type="text"
                    value={formData.end_location}
                    onChange={(e) => setFormData({ ...formData, end_location: e.target.value })}
                    placeholder="Ending address"
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                  />
                </div>

                {/* Odometer Reading */}
                <div className="grid grid-cols-2 gap-4">
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Start Miles</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.start_miles}
                      onChange={(e) => setFormData({ ...formData, start_miles: e.target.value })}
                      placeholder="0.0"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">End Miles</label>
                    <input
                      type="number"
                      step="0.1"
                      value={formData.end_miles}
                      onChange={(e) => setFormData({ ...formData, end_miles: e.target.value })}
                      placeholder="0.0"
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                    />
                  </div>
                </div>

                {/* Notes */}
                <div>
                  <label className="block text-sm font-bold text-slate-700 mb-2">Notes (optional)</label>
                  <textarea
                    value={formData.notes}
                    onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                    placeholder="Add any notes..."
                    rows={3}
                    className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium resize-none"
                  />
                </div>

                <button
                  type="submit"
                  className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black transition-all shadow-lg"
                >
                  Save Mileage Entry
                </button>
              </form>
            </div>
          </motion.div>
        </div>
      )}

      {/* Logs List */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
        <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">Mileage Logs</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {logs.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7h8m0 0v8m0-8l-8 8-4-4-6 6" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No mileage logs yet</p>
              <p className="text-sm text-slate-400 mt-2">Start tracking your business mileage</p>
            </div>
          ) : (
            logs.map((log) => {
              const purpose = MILEAGE_PURPOSES.find(p => p.value === log.purpose);
              return (
                <div key={log.id} className="p-6 hover:bg-slate-50 transition-colors">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex-1">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="font-bold text-slate-900">{purpose?.label}</span>
                        <span className="text-xs text-slate-400">
                          {new Date(log.date).toLocaleDateString()}
                        </span>
                      </div>
                      {(log.start_location || log.end_location) && (
                        <div className="text-sm text-slate-600 mb-2">
                          {log.start_location && <div>📍 {log.start_location}</div>}
                          {log.end_location && <div>🎯 {log.end_location}</div>}
                        </div>
                      )}
                      {log.total_miles !== null && (
                        <div className="text-2xl font-black text-emerald-600">
                          {log.total_miles.toFixed(1)} miles
                        </div>
                      )}
                      {log.notes && (
                        <p className="text-sm text-slate-500 mt-2">{log.notes}</p>
                      )}
                    </div>
                    <button
                      onClick={() => handleDelete(log.id)}
                      className="w-8 h-8 rounded-full bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors"
                    >
                      <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                      </svg>
                    </button>
                  </div>
                </div>
              );
            })
          )}
        </div>
      </div>
    </div>
  );
};

