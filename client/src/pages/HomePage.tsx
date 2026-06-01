import { useCallback, useEffect, useState } from 'react';
import { getProducts } from '../api';
import { Hero } from '../components/Hero';
import { ProductCard } from '../components/ProductCard';
import { ProductModal } from '../components/ProductModal';
import { useCart } from '../context/CartContext';
import type { Category, Product } from '../types';
import { CATEGORIES } from '../types';

export function HomePage() {
  const { addItem } = useCart();
  const [products, setProducts] = useState<Product[]>([]);
  const [category, setCategory] = useState<Category>('all');
  const [selected, setSelected] = useState<Product | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');
  const [toast, setToast] = useState('');

  const load = useCallback(async (cat: Category) => {
    setLoading(true);
    setError('');
    try {
      setProducts(await getProducts(cat === 'all' ? undefined : cat));
    } catch {
      setError('Nie udało się załadować produktów. Uruchom serwer: npm run dev');
    } finally {
      setLoading(false);
    }
  }, []);

  useEffect(() => {
    load(category);
  }, [category, load]);

  const showToast = (msg: string) => {
    setToast(msg);
    setTimeout(() => setToast(''), 2500);
  };

  return (
    <>
      <Hero />
      {toast && (
        <div className="fixed bottom-6 left-1/2 z-50 -translate-x-1/2 rounded-xl bg-pitch-500 px-6 py-3 font-medium text-pitch-950 shadow-lg">
          {toast}
        </div>
      )}

      <section id="produkty" className="px-4 py-16 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <h2 className="text-3xl font-bold">Produkty</h2>
          <div className="mt-6 flex flex-wrap gap-2">
            {CATEGORIES.map((cat) => (
              <button
                key={cat.id}
                type="button"
                onClick={() => setCategory(cat.id)}
                className={`rounded-xl px-4 py-2 text-sm font-medium ${
                  category === cat.id
                    ? 'bg-pitch-500 text-pitch-950'
                    : 'bg-white/5 text-white/70 hover:bg-white/10'
                }`}
              >
                {cat.icon} {cat.label}
              </button>
            ))}
          </div>

          {error && <p className="mt-6 text-red-400">{error}</p>}
          {loading && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {[1, 2, 3].map((i) => (
                <div key={i} className="h-80 animate-pulse rounded-2xl bg-white/5" />
              ))}
            </div>
          )}
          {!loading && (
            <div className="mt-8 grid gap-6 sm:grid-cols-2 lg:grid-cols-3">
              {products.map((p) => (
                <ProductCard
                  key={p.id}
                  product={p}
                  onSelect={setSelected}
                  onAddToCart={(prod) => {
                    addItem(prod);
                    showToast('Dodano do koszyka');
                  }}
                />
              ))}
            </div>
          )}
        </div>
      </section>

      <ProductModal product={selected} onClose={() => setSelected(null)} />
    </>
  );
}
