import React, { useState, useEffect, useRef } from 'react';
import { motion } from 'framer-motion';
import { TenantConfig } from '../../types';
import { supabase } from '../../services/supabase';

interface MileageEntry {
  id: string;
  date: string;
  purpose: string;
  start_miles: number | null;
  end_miles: number | null;
  total_miles: number | null;
  notes: string | null;
  image_url: string | null;
  created_at: string;
}

interface MileageLogProps {
  tenant: TenantConfig;
  onEntrySaved?: () => void;
}

// Most common trips - 2-3 buttons for one-second logging
const QUICK_TRIPS = [
  { purpose: 'Supply Run', miles: 8 },
  { purpose: 'Client Visit', miles: 15 },
  { purpose: 'Bank Deposit', miles: 5 },
];

export const MileageLog: React.FC<MileageLogProps> = ({ tenant, onEntrySaved }) => {
  const [entries, setEntries] = useState<MileageEntry[]>([]);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [monthlyTotal, setMonthlyTotal] = useState<number>(0);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    date: new Date().toISOString().split('T')[0],
    purpose: '',
    start_odometer: '',
    end_odometer: '',
    notes: '',
  });

  const [totalMiles, setTotalMiles] = useState<number | null>(null);
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchRecentEntries();
    fetchMonthlyTotal();
  }, [tenant.id]);

  useEffect(() => {
    // Auto-calculate total miles when odometer readings are entered
    if (formData.start_odometer && formData.end_odometer) {
      const start = parseFloat(formData.start_odometer);
      const end = parseFloat(formData.end_odometer);
      if (!isNaN(start) && !isNaN(end) && end >= start) {
        setTotalMiles(end - start);
      } else {
        setTotalMiles(null);
      }
    } else {
      setTotalMiles(null);
    }
  }, [formData.start_odometer, formData.end_odometer]);

  const handleImageSelect = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file) return;

    setIsUploading(true);
    try {
      // Upload to Supabase Storage 'vault' bucket (Private Vault)
      const fileExt = file.name.split('.').pop();
      const uniqueFileName = `${Date.now()}-${Math.random().toString(36).substring(2, 9)}.${fileExt}`;
      const filePath = `${tenant.id}/${uniqueFileName}`;

      const { data: uploadData, error: uploadError } = await supabase.storage
        .from('vault')
        .upload(filePath, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (uploadError) throw uploadError;

      // Get public URL
      const { data: { publicUrl } } = supabase.storage
        .from('vault')
        .getPublicUrl(filePath);

      setSelectedImage(publicUrl);
    } catch (err: any) {
      console.error('Image upload error:', err);
      alert('Failed to upload image. Please try again.');
    } finally {
      setIsUploading(false);
    }
  };

  const fetchRecentEntries = async () => {
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('id, date, purpose, start_miles, end_miles, total_miles, notes, image_url, created_at')
      .eq('tenant_id', tenant.id)
      .order('date', { ascending: false })
      .order('created_at', { ascending: false })
      .limit(10);

    if (error) {
      console.error('Error fetching mileage entries:', error);
    } else {
      setEntries(data || []);
      
      // Calculate monthly total
      const now = new Date();
      const currentMonth = now.getMonth();
      const currentYear = now.getFullYear();
      
      const monthlyEntries = (data || []).filter(entry => {
        const entryDate = new Date(entry.date);
        return entryDate.getMonth() === currentMonth && 
               entryDate.getFullYear() === currentYear &&
               entry.total_miles !== null;
      });
      
      const total = monthlyEntries.reduce((sum, entry) => sum + (entry.total_miles || 0), 0);
      setMonthlyTotal(total);
    }
  };
  
  const fetchMonthlyTotal = async () => {
    const now = new Date();
    const startOfMonth = new Date(now.getFullYear(), now.getMonth(), 1).toISOString().split('T')[0];
    const endOfMonth = new Date(now.getFullYear(), now.getMonth() + 1, 0).toISOString().split('T')[0];
    
    const { data, error } = await supabase
      .from('mileage_logs')
      .select('total_miles')
      .eq('tenant_id', tenant.id)
      .gte('date', startOfMonth)
      .lte('date', endOfMonth);

    if (!error && data) {
      const total = data
        .filter(entry => entry.total_miles !== null)
        .reduce((sum, entry) => sum + (entry.total_miles || 0), 0);
      setMonthlyTotal(total);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    if (!formData.purpose || !formData.start_odometer || !formData.end_odometer) {
      alert('Please fill in all fields');
      return;
    }

    const startMiles = parseFloat(formData.start_odometer);
    const endMiles = parseFloat(formData.end_odometer);

    if (isNaN(startMiles) || isNaN(endMiles)) {
      alert('Please enter valid odometer readings');
      return;
    }

    if (endMiles < startMiles) {
      alert('Ending odometer must be greater than or equal to starting odometer');
      return;
    }

    setIsSubmitting(true);
    try {
      const { error } = await supabase
        .from('mileage_logs')
        .insert([{
          tenant_id: tenant.id,
          date: formData.date,
          purpose: formData.purpose,
          start_miles: startMiles,
          end_miles: endMiles,
          notes: formData.notes || null,
          image_url: selectedImage || null,
          // total_miles is auto-calculated by the database (generated column)
        }]);

      if (error) throw error;

      // Reset form but keep today's date
      setFormData({
        date: new Date().toISOString().split('T')[0],
        purpose: '',
        start_odometer: '',
        end_odometer: '',
        notes: '',
      });
      setTotalMiles(null);
      setSelectedImage(null);
      if (fileInputRef.current) fileInputRef.current.value = '';

      // Refresh list and monthly total
      fetchRecentEntries();
      fetchMonthlyTotal();
      
      // Notify parent component to refresh its monthly total
      if (onEntrySaved) {
        onEntrySaved();
      }
    } catch (err: any) {
      console.error('Error saving mileage entry:', err);
      alert('Failed to save mileage log. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleQuickLog = async (quickTrip: { purpose: string; miles: number }) => {
    setIsSubmitting(true);
    try {
      // For quick log, we'll use a simple approach: assume start is 0 and end is the miles
      // In a real scenario, you might want to track odometer readings differently
      // For now, we'll save it as if start_miles was 0 and end_miles is the miles value
      const today = new Date().toISOString().split('T')[0];
      
      const { error } = await supabase
        .from('mileage_logs')
        .insert([{
          tenant_id: tenant.id,
          date: today,
          purpose: quickTrip.purpose,
          start_miles: 0, // Quick log doesn't require exact odometer readings
          end_miles: quickTrip.miles,
          notes: null, // Quick log doesn't include notes
          image_url: null, // Quick log doesn't include photos
          // total_miles will be auto-calculated by the database
        }]);

      if (error) throw error;

      // Refresh list and monthly total
      fetchRecentEntries();
      fetchMonthlyTotal();
      
      // Notify parent component to refresh its monthly total
      if (onEntrySaved) {
        onEntrySaved();
      }
    } catch (err: any) {
      console.error('Error saving quick trip:', err);
      alert('Failed to save quick trip. Please try again.');
    } finally {
      setIsSubmitting(false);
    }
  };

  const getCurrentMonthName = () => {
    return new Date().toLocaleDateString('en-US', { month: 'long' });
  };

  return (
    <div className="space-y-6">
      {/* Monthly Tally - Big Number at Top */}
      <motion.div
        {...({ initial: { opacity: 0, y: -10 }, animate: { opacity: 1, y: 0 }, className: "bg-gradient-to-r from-sky-500 to-blue-600 rounded-2xl p-8 text-white shadow-lg" } as any)}
      >
        <div className="text-center">
          <p className="text-lg font-bold text-sky-100 uppercase tracking-wider mb-2">
            {getCurrentMonthName()} Total
          </p>
          <p className="text-6xl font-black mb-1">{monthlyTotal.toFixed(0)}</p>
          <p className="text-xl text-sky-100 font-bold">Miles</p>
        </div>
      </motion.div>

      {/* Quick Log Buttons - One-Second Logging */}
      <div>
        <h4 className="text-sm font-bold text-slate-700 mb-3">Quick Log</h4>
        <div className="grid grid-cols-3 gap-3">
          {QUICK_TRIPS.map((trip, index) => (
            <button
              key={index}
              onClick={() => handleQuickLog(trip)}
              disabled={isSubmitting}
              className="px-4 py-4 bg-white hover:bg-slate-50 border-2 border-slate-300 rounded-xl font-bold text-sm transition-all shadow-sm hover:shadow-md disabled:opacity-50 disabled:cursor-not-allowed"
            >
              <div className="text-slate-900 font-black">{trip.purpose}</div>
              <div className="text-xs text-emerald-600 font-black mt-2">{trip.miles} miles</div>
            </button>
          ))}
        </div>
      </div>

      {/* Mobile-First Form */}
      <motion.div
        {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden" } as any)}
      >
        <div className="p-6 bg-slate-50 border-b-2 border-slate-200">
          <h3 className="text-xl font-black text-slate-900 mb-1">Log a Trip</h3>
          <p className="text-sm text-slate-500">Quick entry while you're in your car</p>
        </div>

        <form onSubmit={handleSubmit} className="p-6 space-y-5">
          {/* Date */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Date
            </label>
            <input
              type="date"
              value={formData.date}
              onChange={(e) => setFormData({ ...formData, date: e.target.value })}
              required
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none transition-colors font-medium text-lg"
            />
          </div>

          {/* Purpose */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Purpose
            </label>
            <input
              type="text"
              value={formData.purpose}
              onChange={(e) => setFormData({ ...formData, purpose: e.target.value })}
              placeholder="e.g., Picked up supplies, Drove to client"
              required
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none transition-colors font-medium text-lg"
            />
          </div>

          {/* Odometer Readings */}
          <div className="grid grid-cols-2 gap-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                Start Miles
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.start_odometer}
                onChange={(e) => setFormData({ ...formData, start_odometer: e.target.value })}
                placeholder="0.0"
                required
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none transition-colors font-medium text-lg"
              />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-2">
                End Miles
              </label>
              <input
                type="number"
                step="0.1"
                value={formData.end_odometer}
                onChange={(e) => setFormData({ ...formData, end_odometer: e.target.value })}
                placeholder="0.0"
                required
                className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none transition-colors font-medium text-lg"
              />
            </div>
          </div>

          {/* Notes */}
          <div>
            <label className="block text-sm font-bold text-slate-700 mb-2">
              Notes
            </label>
            <textarea
              value={formData.notes}
              onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
              placeholder="Additional details (e.g., Traffic was heavy, took alternate route)"
              rows={3}
              className="w-full px-4 py-4 rounded-xl border-2 border-slate-300 focus:border-slate-900 focus:outline-none transition-colors font-medium text-lg resize-none"
            />
          </div>

          {/* Odometer Math - Instant Calculation Display */}
          {totalMiles !== null && (
            <motion.div
              {...({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, className: "bg-gradient-to-r from-emerald-50 to-green-50 border-4 border-emerald-300 rounded-2xl p-6 shadow-lg" } as any)}
            >
              <div className="text-center">
                <p className="text-sm font-bold text-emerald-800 uppercase tracking-wider mb-2">
                  Total
                </p>
                <p className="text-5xl font-black text-emerald-600 mb-1">
                  {totalMiles.toFixed(1)}
                </p>
                <p className="text-lg font-bold text-emerald-700">miles</p>
              </div>
            </motion.div>
          )}

          {/* Submit Button */}
          <button
            type="submit"
            disabled={isSubmitting || !formData.purpose || !formData.start_odometer || !formData.end_odometer}
            className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black text-lg transition-all shadow-lg hover:shadow-xl disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-3"
          >
            {isSubmitting ? (
              <>
                <div className="w-5 h-5 border-2 border-white/30 border-t-white rounded-full animate-spin" />
                Saving...
              </>
            ) : (
              <>
                <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M5 13l4 4L19 7" />
                </svg>
                Save Trip
              </>
            )}
          </button>
        </form>
      </motion.div>

      {/* Recent Trips List */}
      <div className="bg-white rounded-2xl border-2 border-slate-300 shadow-sm overflow-hidden">
        <div className="p-6 bg-slate-50 border-b-2 border-slate-200">
          <h3 className="text-xl font-black text-slate-900">Recent Trips</h3>
          <p className="text-sm text-slate-500 mt-1">Last 10 trips</p>
        </div>

        {entries.length === 0 ? (
          <div className="p-12 text-center">
            <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
              <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M13 7l5 5m0 0l-5 5m5-5H6" />
              </svg>
            </div>
            <p className="text-slate-500 font-medium">No trips logged yet</p>
            <p className="text-sm text-slate-400 mt-2">Log your first trip above</p>
          </div>
        ) : (
          <div className="divide-y divide-slate-200">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="p-6 hover:bg-slate-50 transition-colors border-l-4 border-slate-200"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="flex items-start gap-4 flex-1 min-w-0">
                    {entry.image_url && (
                      <img
                        src={entry.image_url}
                        alt="Mileage photo"
                        className="w-20 h-20 object-cover rounded-lg border-2 border-slate-300 flex-shrink-0"
                      />
                    )}
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center gap-3 mb-2">
                        <span className="text-lg font-black text-slate-900 truncate">
                          {entry.purpose}
                        </span>
                        <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded whitespace-nowrap">
                          {new Date(entry.date).toLocaleDateString('en-US', {
                            month: 'short',
                            day: 'numeric',
                          })}
                        </span>
                      </div>
                      <div className="flex items-center gap-4 text-sm text-slate-600 mb-2">
                        <span>
                          <span className="font-medium">Start:</span> {entry.start_miles?.toFixed(1) || '—'}
                        </span>
                        <span className="text-slate-300">→</span>
                        <span>
                          <span className="font-medium">End:</span> {entry.end_miles?.toFixed(1) || '—'}
                        </span>
                      </div>
                      {entry.notes && (
                        <div className="mt-2">
                          {expandedNotes.has(entry.id) ? (
                            <p className="text-sm text-slate-600 leading-relaxed">{entry.notes}</p>
                          ) : (
                            <p className="text-sm text-slate-600">
                              {entry.notes.length > 40 ? (
                                <>
                                  {entry.notes.substring(0, 40)}...
                                  <button
                                    onClick={() => setExpandedNotes(new Set(expandedNotes).add(entry.id))}
                                    className="ml-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                  >
                                    Read more
                                  </button>
                                </>
                              ) : (
                                entry.notes
                              )}
                            </p>
                          )}
                          {expandedNotes.has(entry.id) && (
                            <button
                              onClick={() => {
                                const newExpanded = new Set(expandedNotes);
                                newExpanded.delete(entry.id);
                                setExpandedNotes(newExpanded);
                              }}
                              className="mt-1 text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                            >
                              Show less
                            </button>
                          )}
                        </div>
                      )}
                    </div>
                  </div>
                  <div className="flex-shrink-0 text-right">
                    {entry.total_miles !== null && (
                      <div className="text-2xl font-black text-emerald-600">
                        {entry.total_miles.toFixed(1)}
                      </div>
                    )}
                    <div className="text-xs text-slate-400 font-medium mt-1">miles</div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
};

