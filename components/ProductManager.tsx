import React, { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Product } from '../types';
import { supabase } from '../services/supabase';
import { TenantConfig } from '../types';
import { getTerminology } from '../lib/terminology';

interface ProductManagerProps {
  tenant: TenantConfig;
}

export const ProductManager: React.FC<ProductManagerProps> = ({ tenant }) => {
  const [products, setProducts] = useState<Product[]>([]);
  const [isModalOpen, setIsModalOpen] = useState(false);
  const [isLoading, setIsLoading] = useState(false);
  const [uploading, setUploading] = useState(false);
  const terms = getTerminology(tenant.business_type);
  
  // Form state
  const [formData, setFormData] = useState({
    name: '',
    description: '',
    price: '',
    stockQuantity: '',
    imageFile: null as File | null,
  });
  const [imagePreview, setImagePreview] = useState<string | null>(null);

  useEffect(() => {
    fetchProducts();
  }, [tenant.id]);

  const fetchProducts = async () => {
    const { data, error } = await supabase
      .from('products')
      .select('*')
      .eq('tenant_id', tenant.id)
      .order('created_at', { ascending: false });

    if (error) {
      console.error('Error fetching products:', error);
    } else {
      // Transform data to match Product interface
      setProducts(
        (data || []).map((p: any) => ({
          id: p.id,
          tenantId: p.tenant_id,
          name: p.name,
          description: p.description,
          price: p.price / 100, // Convert cents to dollars
          imageUrl: p.image_url,
          sku: p.sku,
        }))
      );
    }
  };

  const handleImageChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (file) {
      setFormData({ ...formData, imageFile: file });
      const reader = new FileReader();
      reader.onloadend = () => {
        setImagePreview(reader.result as string);
      };
      reader.readAsDataURL(file);
    }
  };

  const uploadImage = async (file: File): Promise<string | null> => {
    setUploading(true);
    try {
      const fileExt = file.name.split('.').pop();
      const fileName = `${tenant.id}/${Date.now()}.${fileExt}`;

      const { data, error } = await supabase.storage
        .from('logos')
        .upload(fileName, file, {
          cacheControl: '3600',
          upsert: false,
        });

      if (error) throw error;

      const { data: { publicUrl } } = supabase.storage
        .from('logos')
        .getPublicUrl(fileName);

      return publicUrl;
    } catch (error: any) {
      console.error('Error uploading image:', error);
      alert('Failed to upload image: ' + error.message);
      return null;
    } finally {
      setUploading(false);
    }
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setIsLoading(true);

    try {
      let imageUrl = null;

      // Upload image if provided
      if (formData.imageFile) {
        imageUrl = await uploadImage(formData.imageFile);
        if (!imageUrl) {
          setIsLoading(false);
          return;
        }
      }

      // Convert price to cents
      const priceInCents = Math.round(parseFloat(formData.price) * 100);

      const { error } = await supabase.from('products').insert([
        {
          tenant_id: tenant.id,
          name: formData.name,
          description: formData.description,
          price: priceInCents,
          stock_quantity: parseInt(formData.stockQuantity) || 0,
          image_url: imageUrl,
          created_at: new Date().toISOString(),
        },
      ]);

      if (error) throw error;

      // Reset form and close modal
      setFormData({
        name: '',
        description: '',
        price: '',
        stockQuantity: '',
        imageFile: null,
      });
      setImagePreview(null);
      setIsModalOpen(false);

      // Refresh products list
      await fetchProducts();
    } catch (error: any) {
      console.error('Error creating product:', error);
      alert('Failed to create product: ' + error.message);
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <motion.div
      {...({ initial: { opacity: 0, y: 10 }, animate: { opacity: 1, y: 0 }, className: "space-y-8" } as any)}
    >
      {/* Header */}
      <div className="flex items-center justify-between">
        <div>
          <h2 className="text-3xl font-black text-slate-900 tracking-tight mb-2">
            {tenant.business_type === 'education' ? 'Lesson Pack Manager' : tenant.business_type === 'retail' ? 'Catalog Manager' : 'Product Manager'}
          </h2>
          <p className="text-slate-500 font-medium">
            {tenant.business_type === 'education' ? 'Create and manage lesson packages (e.g., "Buy 4 lessons, get 1 free")' : tenant.business_type === 'retail' ? 'Manage your catalog and product listings' : 'Manage your inventory and product listings'}
          </p>
        </div>
        <button
          onClick={() => setIsModalOpen(true)}
          className="bg-slate-900 hover:bg-black text-white px-6 py-3 rounded-xl font-bold text-sm transition-all shadow-lg hover:shadow-xl"
        >
          + List New Ware
        </button>
      </div>

      {/* Products Grid */}
      {products.length === 0 ? (
        <div className="bg-white rounded-3xl border-2 border-dashed border-slate-200 p-16 text-center">
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
                d="M20 7l-8-4-8 4m16 0l-8 4m8-4v10l-8 4m0-10L4 7m8 4v10M4 7v10l8 4"
              />
            </svg>
          </div>
          <h3 className="text-xl font-black text-slate-900 mb-2">
            No products yet
          </h3>
          <p className="text-slate-500 mb-6">
            Start by listing your first product
          </p>
          <button
            onClick={() => setIsModalOpen(true)}
            className="bg-slate-900 hover:bg-black text-white px-8 py-4 rounded-xl font-bold transition-all"
          >
            List Your First Product
          </button>
        </div>
      ) : (
        <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
          {products.map((product) => (
            <div
              key={product.id}
              className="bg-white rounded-2xl border border-slate-200 overflow-hidden hover:shadow-lg transition-shadow"
            >
              {/* Image */}
              <div className="aspect-square bg-slate-100 overflow-hidden">
                {product.imageUrl ? (
                  <img
                    src={product.imageUrl}
                    alt={product.name}
                    className="w-full h-full object-cover"
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
              </div>

              {/* Info */}
              <div className="p-5 space-y-3">
                <div>
                  <h3 className="font-black text-lg text-slate-900 mb-1">
                    {product.name}
                  </h3>
                  <p className="text-sm text-slate-500 line-clamp-2">
                    {product.description}
                  </p>
                </div>
                <div className="flex items-center justify-between pt-2 border-t border-slate-100">
                  <span className="text-2xl font-black text-slate-900">
                    ${product.price.toFixed(2)}
                  </span>
                  <span className="text-xs font-bold text-slate-400 uppercase tracking-wider">
                    In Stock
                  </span>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}

      {/* Modal */}
      <AnimatePresence>
        {isModalOpen && (
          <div className="fixed inset-0 z-[300] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm">
            <motion.div
              {...({ initial: { opacity: 0, scale: 0.95 }, animate: { opacity: 1, scale: 1 }, exit: { opacity: 0, scale: 0.95 }, className: "bg-white rounded-3xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto" } as any)}
            >
              <div className="p-8">
                {/* Header */}
                <div className="flex items-center justify-between mb-8">
                  <h3 className="text-2xl font-black text-slate-900">
                    {tenant.business_type === 'education' ? 'Create Lesson Pack' : 'List New Product'}
                  </h3>
                  <button
                    onClick={() => setIsModalOpen(false)}
                    className="w-10 h-10 rounded-full bg-slate-100 hover:bg-slate-200 flex items-center justify-center transition-colors"
                  >
                    <svg
                      className="w-5 h-5 text-slate-600"
                      fill="none"
                      stroke="currentColor"
                      viewBox="0 0 24 24"
                    >
                      <path
                        strokeLinecap="round"
                        strokeLinejoin="round"
                        strokeWidth="2.5"
                        d="M6 18L18 6M6 6l12 12"
                      />
                    </svg>
                  </button>
                </div>

                {/* Form */}
                <form onSubmit={handleSubmit} className="space-y-6">
                  {/* Image Upload */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-3">
                      Product Image
                    </label>
                    <div className="space-y-4">
                      {imagePreview ? (
                        <div className="relative">
                          <img
                            src={imagePreview}
                            alt="Preview"
                            className="w-full h-64 object-cover rounded-2xl border-2 border-slate-200"
                          />
                          <button
                            type="button"
                            onClick={() => {
                              setImagePreview(null);
                              setFormData({ ...formData, imageFile: null });
                            }}
                            className="absolute top-4 right-4 bg-white/90 hover:bg-white px-4 py-2 rounded-xl font-bold text-sm shadow-lg transition-all"
                          >
                            Remove
                          </button>
                        </div>
                      ) : (
                        <label className="block cursor-pointer">
                          <div className="border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center hover:border-slate-400 transition-colors">
                            <svg
                              className="w-12 h-12 mx-auto text-slate-400 mb-3"
                              fill="none"
                              stroke="currentColor"
                              viewBox="0 0 24 24"
                            >
                              <path
                                strokeLinecap="round"
                                strokeLinejoin="round"
                                strokeWidth="2"
                                d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z"
                              />
                            </svg>
                            <p className="text-slate-600 font-medium mb-1">
                              Click to upload image
                            </p>
                            <p className="text-xs text-slate-400">
                              PNG, JPG up to 10MB
                            </p>
                          </div>
                          <input
                            type="file"
                            accept="image/*"
                            onChange={handleImageChange}
                            className="hidden"
                          />
                        </label>
                      )}
                    </div>
                  </div>

                  {/* Name */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      {tenant.business_type === 'education' ? 'Pack Name' : 'Product Name'} *
                    </label>
                    <input
                      type="text"
                      required
                      value={formData.name}
                      onChange={(e) =>
                        setFormData({ ...formData, name: e.target.value })
                      }
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:bg-white outline-none transition-all font-medium"
                      placeholder={tenant.business_type === 'education' ? 'e.g. Monthly Piano Pass (4 Lessons)' : 'e.g. Premium Candle Set'}
                    />
                  </div>

                  {/* Description */}
                  <div>
                    <label className="block text-sm font-bold text-slate-700 mb-2">
                      Description *
                    </label>
                    <textarea
                      required
                      value={formData.description}
                      onChange={(e) =>
                        setFormData({
                          ...formData,
                          description: e.target.value,
                        })
                      }
                      rows={4}
                      className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:bg-white outline-none transition-all font-medium resize-none"
                      placeholder="Describe your product..."
                    />
                  </div>

                  {/* Price & Stock */}
                  <div className="grid grid-cols-2 gap-4">
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Price ($) *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        step="0.01"
                        value={formData.price}
                        onChange={(e) =>
                          setFormData({ ...formData, price: e.target.value })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:bg-white outline-none transition-all font-medium"
                        placeholder="0.00"
                      />
                    </div>
                    <div>
                      <label className="block text-sm font-bold text-slate-700 mb-2">
                        Stock Quantity *
                      </label>
                      <input
                        type="number"
                        required
                        min="0"
                        value={formData.stockQuantity}
                        onChange={(e) =>
                          setFormData({
                            ...formData,
                            stockQuantity: e.target.value,
                          })
                        }
                        className="w-full px-4 py-3 bg-slate-50 border-2 border-slate-200 rounded-xl focus:border-slate-900 focus:bg-white outline-none transition-all font-medium"
                        placeholder="0"
                      />
                    </div>
                  </div>

                  {/* Actions */}
                  <div className="flex gap-4 pt-4">
                    <button
                      type="button"
                      onClick={() => setIsModalOpen(false)}
                      className="flex-1 px-6 py-4 bg-slate-100 hover:bg-slate-200 text-slate-700 rounded-xl font-bold transition-all"
                    >
                      Cancel
                    </button>
                    <button
                      type="submit"
                      disabled={isLoading || uploading}
                      className="flex-1 px-6 py-4 bg-slate-900 hover:bg-black text-white rounded-xl font-bold transition-all disabled:opacity-50 disabled:cursor-not-allowed"
                    >
                      {isLoading || uploading
                        ? 'Creating...'
                        : 'List Product'}
                    </button>
                  </div>
                </form>
              </div>
            </motion.div>
          </div>
        )}
      </AnimatePresence>
    </motion.div>
  );
};


