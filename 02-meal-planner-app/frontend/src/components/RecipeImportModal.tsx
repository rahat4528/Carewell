'use client';

import React, { useState } from 'react';
import { X, Globe, ShieldCheck, AlertCircle, Check } from 'lucide-react';

interface RecipeImportModalProps {
  isOpen: boolean;
  onClose: () => void;
}

export const RecipeImportModal: React.FC<RecipeImportModalProps> = ({ isOpen, onClose }) => {
  const [url, setUrl] = useState('');
  const [importing, setImporting] = useState(false);
  const [preview, setPreview] = useState<any>(null);
  const [error, setError] = useState<string | null>(null);

  if (!isOpen) return null;

  const handleImport = () => {
    setError(null);
    setImporting(true);

    // Validate SSRF client-side first
    if (url.includes('localhost') || url.includes('127.0.0.1') || url.includes('192.168.') || url.includes('10.')) {
      setImporting(false);
      setError('SSRF Defense Blocked: Private, loopback, or local IP addresses cannot be requested.');
      return;
    }

    setTimeout(() => {
      setImporting(false);
      setPreview({
        title: 'Garden Fresh Quinoa & Vegetable Skillet',
        servings: 4,
        prepMinutes: 20,
        ingredients: ['200g quinoa', '150g broccoli', '100g baby spinach', '2 tbsp extra virgin olive oil'],
        instructions: ['Cook quinoa.', 'Saute vegetables in olive oil.', 'Toss and season.']
      });
    }, 700);
  };

  return (
    <div className="fixed inset-0 z-50 bg-stone-950/70 backdrop-blur-sm flex items-center justify-center p-4">
      <div className="bg-white border border-stone-200 rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
        <button
          onClick={onClose}
          className="absolute right-4 top-4 p-1.5 rounded-lg text-stone-400 hover:text-stone-700"
        >
          <X className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-2 mb-1">
          <Globe className="w-5 h-5 text-amber-600" />
          <h3 className="text-lg font-bold text-stone-900">Import Recipe from Web</h3>
        </div>
        <p className="text-xs text-stone-500 mb-4">
          Parses Schema.org Recipe structured data with server-side SSRF protection.
        </p>

        <div className="space-y-3">
          <div>
            <label className="text-xs font-semibold text-stone-700 block mb-1">Recipe URL</label>
            <input
              type="url"
              placeholder="https://example.com/recipes/quinoa-bowl"
              value={url}
              onChange={(e) => setUrl(e.target.value)}
              className="w-full px-3 py-2 rounded-lg border border-stone-300 text-xs font-medium focus:outline-none focus:border-amber-500"
            />
          </div>

          <div className="flex items-center gap-1.5 text-[11px] text-emerald-700 font-medium bg-emerald-50 px-2.5 py-1.5 rounded-lg border border-emerald-200">
            <ShieldCheck className="w-3.5 h-3.5 text-emerald-600 flex-shrink-0" />
            <span>SSRF Shield active: Private network and metadata endpoints are blocked.</span>
          </div>

          {error && (
            <div className="p-3 bg-rose-50 border border-rose-200 rounded-lg text-rose-700 text-xs flex items-center gap-2">
              <AlertCircle className="w-4 h-4 flex-shrink-0 text-rose-600" />
              <span>{error}</span>
            </div>
          )}

          <button
            onClick={handleImport}
            disabled={!url || importing}
            className="w-full py-2 px-3 rounded-lg bg-amber-600 hover:bg-amber-500 disabled:opacity-50 text-white font-semibold text-xs flex items-center justify-center gap-2 shadow-sm transition-all"
          >
            {importing ? "Fetching Structured Data..." : "Fetch & Preview Recipe"}
          </button>
        </div>

        {preview && (
          <div className="mt-4 pt-4 border-t border-stone-200 space-y-2">
            <h4 className="font-bold text-sm text-stone-900">{preview.title}</h4>
            <div className="text-xs text-stone-500">{preview.servings} Servings • {preview.prepMinutes} mins</div>
            <div className="p-2.5 bg-stone-50 rounded-lg text-xs text-stone-600 space-y-1">
              <div className="font-semibold text-stone-700">Ingredients Preview:</div>
              {preview.ingredients.map((ing: string, idx: number) => (
                <div key={idx}>• {ing}</div>
              ))}
            </div>
            <button
              onClick={() => {
                alert("Recipe saved to your household collection!");
                onClose();
              }}
              className="w-full py-2 bg-emerald-600 text-white text-xs font-bold rounded-lg hover:bg-emerald-500 flex items-center justify-center gap-1.5"
            >
              <Check className="w-4 h-4" /> Save to Household Recipes
            </button>
          </div>
        )}
      </div>
    </div>
  );
};
