import React, { useState } from 'react';
import { motion } from 'framer-motion';
import { Product } from '../../types';

interface ShopListProps {
  products: Product[];
  onBuyNow: (product: Product) => void;
  primaryColor: string;
  businessType?: 'service' | 'education' | 'retail' | 'professional' | 'beauty_lifestyle' | 'therapy_health';
  hasBackground?: boolean;
}

export const ShopList: React.FC<ShopListProps> = ({ products, onBuyNow, primaryColor, businessType = 'service', hasBackground = false }) => {
  const [loadingProductId, setLoadingProductId] = useState<string | null>(null);

  const handleBuyNow = async (product: Product) => {
    setLoadingProductId(product.id);
    try {
      onBuyNow(product);
    } finally {
      setLoadingProductId(null);
    }
  };

  if (products.length === 0) {
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
              d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
            />
          </svg>
        </div>
        <p className="text-slate-500 font-medium text-lg">No products available yet.</p>
        <p className="text-slate-400 text-sm mt-2">Check back soon for new items!</p>
      </div>
    );
  }

  return (
    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
      {products.map((product, index) => (
        <motion.div
          key={product.id}
          {...({ initial: { opacity: 0, y: 20 }, whileInView: { opacity: 1, y: 0 }, viewport: { once: true }, transition: { delay: index * 0.1 }, className: `group rounded-lg overflow-hidden transition-all ${
            hasBackground 
              ? 'bg-white/10 backdrop-blur-lg border border-white/20 hover:bg-white/20' 
              : 'bg-white border border-slate-200 hover:border-slate-300'
          }` } as any)}
        >
          {/* Product Image */}
          <div className="relative aspect-square bg-slate-50 overflow-hidden">
            {product.imageUrl ? (
              <img
                src={product.imageUrl}
                alt={product.name}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center bg-slate-50">
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
            <div className={`absolute top-4 right-4 px-4 py-2 rounded-lg ${
              hasBackground 
                ? 'bg-white/20 backdrop-blur-lg border border-white/30' 
                : 'bg-white border border-slate-200'
            }`}>
              <span className={`text-lg font-black ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                ${product.price}
              </span>
            </div>
          </div>

          {/* Product Info */}
          <div className="p-6 space-y-4">
            <div>
              <h3 className={`text-xl font-black mb-2 ${hasBackground ? 'text-white' : 'text-slate-900'}`}>
                {product.name}
              </h3>
              {product.description && (
                <p className={`text-sm font-medium line-clamp-2 ${hasBackground ? 'text-white/80' : 'text-slate-600'}`}>
                  {product.description}
                </p>
              )}
            </div>

            {/* Buy Now Button */}
            <button
              onClick={() => handleBuyNow(product)}
              disabled={loadingProductId === product.id}
              className={`w-full py-4 rounded-lg font-semibold text-sm text-white transition-all disabled:opacity-50 disabled:cursor-not-allowed ${
                hasBackground 
                  ? 'bg-white/20 backdrop-blur-lg border border-white/30 hover:bg-white/30' 
                  : 'bg-slate-900 hover:bg-slate-800'
              }`}
            >
              {loadingProductId === product.id ? (
                <span className="flex items-center justify-center gap-2">
                  <svg
                    className="animate-spin h-4 w-4 text-white"
                    fill="none"
                    viewBox="0 0 24 24"
                  >
                    <circle
                      className="opacity-25"
                      cx="12"
                      cy="12"
                      r="10"
                      stroke="currentColor"
                      strokeWidth="4"
                    />
                    <path
                      className="opacity-75"
                      fill="currentColor"
                      d="M4 12a8 8 0 018-8V0C5.373 0 0 5.373 0 12h4zm2 5.291A7.962 7.962 0 014 12H0c0 3.042 1.135 5.824 3 7.938l3-2.647z"
                    />
                  </svg>
                  Processing...
                </span>
              ) : (
                businessType === 'education' ? 'Purchase Pack' : 
                businessType === 'therapy_health' ? 'Schedule Session' : 
                'Buy Now'
              )}
            </button>
          </div>
        </motion.div>
      ))}
    </div>
  );
};


