import React, { useState, useEffect, useRef } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { TenantConfig } from '../types';
import { supabase } from '../services/supabase';

interface Expense {
  id: string;
  amount: number;
  category: string;
  description: string | null;
  notes: string | null;
  image_url: string | null;
  date: string;
  created_at: string;
}

interface ExpenseTrackerProps {
  tenant: TenantConfig;
}

const EXPENSE_CATEGORIES = [
  { value: 'gas', label: 'Gas/Fuel', icon: '⛽' },
  { value: 'supplies', label: 'Supplies', icon: '📦' },
  { value: 'rent', label: 'Rent', icon: '🏢' },
  { value: 'utilities', label: 'Utilities', icon: '💡' },
  { value: 'meals', label: 'Meals & Entertainment', icon: '🍽️' },
  { value: 'equipment', label: 'Equipment', icon: '🛠️' },
  { value: 'other', label: 'Other', icon: '📝' },
];

export const ExpenseTracker: React.FC<ExpenseTrackerProps> = ({ tenant }) => {
  const [expenses, setExpenses] = useState<Expense[]>([]);
  const [isAdding, setIsAdding] = useState(false);
  const [isUploading, setIsUploading] = useState(false);
  const [selectedImage, setSelectedImage] = useState<string | null>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  
  const [formData, setFormData] = useState({
    amount: '',
    category: 'gas',
    description: '',
    notes: '',
    date: new Date().toISOString().split('T')[0],
  });
  
  const [expandedNotes, setExpandedNotes] = useState<Set<string>>(new Set());

  useEffect(() => {
    fetchExpenses();
  }, [tenant.id]);

  const fetchExpenses = async () => {
    const { data, error } = await supabase
      .from('expenses')
      .select('id, amount, category, description, notes, image_url, date, created_at')
      .eq('tenant_id', tenant.id)
      .order('date', { ascending: false });

    if (error) {
      console.error('Error fetching expenses:', error);
    } else {
      setExpenses(data || []);
    }
  };

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

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    
    try {
      const { error } = await supabase
        .from('expenses')
        .insert([{
          tenant_id: tenant.id,
          amount: parseFloat(formData.amount),
          category: formData.category,
          description: formData.description || null,
          notes: formData.notes || null,
          image_url: selectedImage,
          date: formData.date,
        }]);

      if (error) throw error;

      // Reset form
      setFormData({
        amount: '',
        category: 'gas',
        description: '',
        notes: '',
        date: new Date().toISOString().split('T')[0],
      });
      setSelectedImage(null);
      setIsAdding(false);
      
      // Refresh list
      fetchExpenses();
    } catch (err: any) {
      console.error('Error saving expense:', err);
      alert('Failed to save expense. Please try again.');
    }
  };

  const handleDelete = async (id: string) => {
    if (!confirm('Delete this expense?')) return;

    try {
      const { error } = await supabase
        .from('expenses')
        .delete()
        .eq('id', id);

      if (error) throw error;

      fetchExpenses();
    } catch (err: any) {
      console.error('Error deleting expense:', err);
      alert('Failed to delete expense.');
    }
  };

  const totalExpenses = expenses.reduce((sum, e) => sum + e.amount, 0);
  const thisMonthTotal = expenses
    .filter(e => {
      const expenseDate = new Date(e.date);
      const now = new Date();
      return expenseDate.getMonth() === now.getMonth() && 
             expenseDate.getFullYear() === now.getFullYear();
    })
    .reduce((sum, e) => sum + e.amount, 0);

  return (
    <div className="space-y-6">
      {/* Stats */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-4 mb-6">
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Total Expenses
          </div>
          <div className="text-3xl font-black text-emerald-600">${totalExpenses.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            This Month
          </div>
          <div className="text-3xl font-black text-emerald-600">${thisMonthTotal.toFixed(2)}</div>
        </div>
        <div className="bg-white p-6 rounded-xl border-2 border-slate-300 shadow-sm">
          <div className="text-[10px] font-black text-slate-400 uppercase tracking-widest mb-2">
            Total Receipts
          </div>
          <div className="text-3xl font-black text-slate-900">{expenses.length}</div>
        </div>
      </div>
      
      {/* Info Note */}
      <div className="bg-blue-50 border-2 border-blue-200 rounded-xl p-4 mb-6">
        <p className="text-sm text-blue-800 font-medium">
          <span className="font-bold">Private Vault:</span> Your business documentation stored securely. Log expenses for supply runs, equipment purchases, rent, and other business costs. Every receipt is organized and ready whenever you need it.
        </p>
      </div>

      {/* Add Expense Button */}
      <button
        onClick={() => setIsAdding(true)}
        className="w-full py-4 bg-white hover:bg-slate-50 text-slate-900 rounded-xl font-black transition-all shadow-md hover:shadow-lg flex items-center justify-center gap-3 border-2 border-slate-300"
      >
        <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
          <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
        </svg>
        Scan Receipt
      </button>

      {/* Add Expense Form Modal */}
      <AnimatePresence>
        {isAdding && (
          <div className="fixed inset-0 z-[200] flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm">
            <motion.div
              {...({ initial: { opacity: 0, scale: 0.9 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.9 }, className: "bg-white rounded-3xl shadow-2xl max-w-lg w-full max-h-[90vh] overflow-y-auto" } as any)}
            >
              <div className="p-8">
                <div className="flex items-center justify-between mb-6">
                  <h3 className="text-2xl font-black text-slate-900">Add Expense</h3>
                  <button
                    onClick={() => {
                      setIsAdding(false);
                      setSelectedImage(null);
                    }}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <svg className="w-5 h-5 text-slate-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                      <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2.5" d="M6 18L18 6M6 6l12 12" />
                    </svg>
                  </button>
                </div>

                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Receipt Photo
                    </label>
                    {selectedImage ? (
                      <div className="relative">
                        <img src={selectedImage} alt="Receipt" className="w-full h-48 object-contain rounded-xl border-2 border-slate-200" />
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedImage(null);
                            if (fileInputRef.current) fileInputRef.current.value = '';
                          }}
                          className="absolute top-2 right-2 w-8 h-8 bg-red-500 text-white rounded-full flex items-center justify-center"
                        >
                          <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                            <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M6 18L18 6M6 6l12 12" />
                          </svg>
                        </button>
                      </div>
                    ) : (
                      <button
                        type="button"
                        onClick={() => fileInputRef.current?.click()}
                        disabled={isUploading}
                        className="w-full py-12 border-2 border-dashed border-slate-300 rounded-xl hover:border-slate-400 transition-colors flex flex-col items-center justify-center gap-3 disabled:opacity-50"
                      >
                        {isUploading ? (
                          <>
                            <div className="w-8 h-8 border-2 border-slate-400 border-t-transparent rounded-full animate-spin" />
                            <span className="text-slate-500 font-medium">Uploading...</span>
                          </>
                        ) : (
                          <>
                            <svg className="w-12 h-12 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M3 9a2 2 0 012-2h.93a2 2 0 001.664-.89l.812-1.22A2 2 0 0110.07 4h3.86a2 2 0 011.664.89l.812 1.22A2 2 0 0018.07 7H19a2 2 0 012 2v9a2 2 0 01-2 2H5a2 2 0 01-2-2V9z" />
                              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M15 13a3 3 0 11-6 0 3 3 0 016 0z" />
                            </svg>
                            <span className="text-slate-600 font-bold">Tap to take photo</span>
                            <span className="text-xs text-slate-400">or select from gallery</span>
                          </>
                        )}
                      </button>
                    )}
                    <input
                      ref={fileInputRef}
                      type="file"
                      accept="image/*"
                      onChange={handleImageSelect}
                      className="hidden"
                      capture="environment"
                    />
                  </div>

                  {/* Amount */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Amount</label>
                    <input
                      type="number"
                      step="0.01"
                      value={formData.amount}
                      onChange={(e) => setFormData({ ...formData, amount: e.target.value })}
                      placeholder="0.00"
                      required
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-bold text-lg"
                    />
                  </div>

                  {/* Category */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Category</label>
                    <select
                      value={formData.category}
                      onChange={(e) => setFormData({ ...formData, category: e.target.value })}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium"
                    >
                      {EXPENSE_CATEGORIES.map(cat => (
                        <option key={cat.value} value={cat.value}>
                          {cat.icon} {cat.label}
                        </option>
                      ))}
                    </select>
                  </div>

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

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">Description (optional)</label>
                    <textarea
                      value={formData.description}
                      onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                      placeholder="Brief description..."
                      rows={2}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium resize-none"
                    />
                  </div>

                  {/* Notes */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Notes
                    </label>
                    <textarea
                      value={formData.notes}
                      onChange={(e) => setFormData({ ...formData, notes: e.target.value })}
                      placeholder="What was this for? (e.g., Supplies for the Smith wedding)"
                      rows={3}
                      className="w-full px-4 py-3 rounded-xl border-2 border-slate-200 focus:border-slate-900 focus:outline-none transition-colors font-medium resize-none"
                    />
                  </div>

                  <button
                    type="submit"
                    className="w-full py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-black transition-all shadow-lg"
                  >
                    Save Expense
                  </button>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>

      {/* Expenses List */}
      <div className="bg-white rounded-xl border-2 border-slate-300 shadow-sm overflow-hidden">
        <div className="p-6 border-b-2 border-slate-200 bg-slate-50">
          <h3 className="text-lg font-black text-slate-900">Recent Expenses</h3>
        </div>
        <div className="divide-y divide-slate-200">
          {expenses.length === 0 ? (
            <div className="p-12 text-center">
              <div className="w-16 h-16 mx-auto bg-slate-100 rounded-full flex items-center justify-center mb-4">
                <svg className="w-8 h-8 text-slate-400" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M9 12h6m-6 4h6m2 5H7a2 2 0 01-2-2V5a2 2 0 012-2h5.586a1 1 0 01.707.293l5.414 5.414a1 1 0 01.293.707V19a2 2 0 01-2 2z" />
                </svg>
              </div>
              <p className="text-slate-500 font-medium">No expenses yet</p>
              <p className="text-sm text-slate-400 mt-2">Start tracking by adding your first receipt</p>
            </div>
          ) : (
            expenses.map((expense) => {
              const category = EXPENSE_CATEGORIES.find(c => c.value === expense.category);
              return (
                <div key={expense.id} className="p-6 hover:bg-slate-50 transition-colors border-l-4 border-slate-200">
                  <div className="flex items-start justify-between gap-4">
                    <div className="flex items-start gap-4 flex-1">
                      {expense.image_url && (
                        <img
                          src={expense.image_url}
                          alt="Receipt"
                          className="w-20 h-20 object-cover rounded-lg border-2 border-slate-300"
                        />
                      )}
                      <div className="flex-1">
                        <div className="flex items-center gap-3 mb-1">
                          <span className="text-2xl">{category?.icon}</span>
                          <span className="font-bold text-slate-900">{category?.label}</span>
                          <span className="text-xs text-slate-500 font-medium bg-slate-100 px-2 py-1 rounded">
                            {new Date(expense.date).toLocaleDateString()}
                          </span>
                        </div>
                        {expense.description && (
                          <p className="text-sm text-slate-600 mb-1">{expense.description}</p>
                        )}
                        {expense.notes && (
                          <div className="mb-2">
                            {expandedNotes.has(expense.id) ? (
                              <p className="text-sm text-slate-600 leading-relaxed">{expense.notes}</p>
                            ) : (
                              <p className="text-sm text-slate-600">
                                {expense.notes.length > 40 ? (
                                  <>
                                    {expense.notes.substring(0, 40)}...
                                    <button
                                      onClick={() => setExpandedNotes(new Set(expandedNotes).add(expense.id))}
                                      className="ml-1 text-blue-600 hover:text-blue-800 font-medium underline"
                                    >
                                      Read more
                                    </button>
                                  </>
                                ) : (
                                  expense.notes
                                )}
                              </p>
                            )}
                            {expandedNotes.has(expense.id) && (
                              <button
                                onClick={() => {
                                  const newExpanded = new Set(expandedNotes);
                                  newExpanded.delete(expense.id);
                                  setExpandedNotes(newExpanded);
                                }}
                                className="mt-1 text-blue-600 hover:text-blue-800 font-medium text-xs underline"
                              >
                                Show less
                              </button>
                            )}
                          </div>
                        )}
                        <div className="text-2xl font-black text-emerald-600">
                          ${expense.amount.toFixed(2)}
                        </div>
                      </div>
                    </div>
                    <button
                      onClick={() => handleDelete(expense.id)}
                      className="w-8 h-8 rounded-lg bg-red-50 hover:bg-red-100 text-red-600 flex items-center justify-center transition-colors border border-red-200"
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

