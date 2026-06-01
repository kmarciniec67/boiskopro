import { FormEvent, useEffect, useState } from 'react';
import { createReview, getReviews } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';
import type { Product, Review } from '../types';
import { resolveImageUrl } from '../utils/imageUrl';

interface ProductModalProps {
  product: Product | null;
  onClose: () => void;
  onReviewAdded?: () => void;
}

export function ProductModal({ product, onClose, onReviewAdded }: ProductModalProps) {
  const { user } = useAuth();
  const { addItem } = useCart();
  const [reviews, setReviews] = useState<Review[]>([]);
  const [loading, setLoading] = useState(false);
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState('');
  const [rating, setRating] = useState(5);
  const [title, setTitle] = useState('');
  const [comment, setComment] = useState('');

  const loadReviews = () => {
    if (!product) return;
    setLoading(true);
    getReviews(product.id)
      .then(setReviews)
      .catch(() => setReviews([]))
      .finally(() => setLoading(false));
  };

  useEffect(() => {
    loadReviews();
  }, [product?.id]);

  useEffect(() => {
    const onKey = (e: KeyboardEvent) => e.key === 'Escape' && onClose();
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [onClose]);

  const handleReview = async (e: FormEvent) => {
    e.preventDefault();
    if (!product || !user) return;
    setSubmitting(true);
    setError('');
    try {
      await createReview({ productId: product.id, rating, title, comment });
      setTitle('');
      setComment('');
      setRating(5);
      loadReviews();
      onReviewAdded?.();
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Nie udało się dodać opinii');
    } finally {
      setSubmitting(false);
    }
  };

  if (!product) return null;

  const imageSrc = resolveImageUrl(product.image_url);

  return (
    <div
      className="fixed inset-0 z-[100] flex items-end justify-center bg-black/70 p-4 backdrop-blur-sm sm:items-center"
      onClick={onClose}
      role="presentation"
    >
      <div
        className="max-h-[90vh] w-full max-w-2xl overflow-y-auto rounded-2xl border border-white/10 bg-pitch-900 shadow-2xl"
        onClick={(e) => e.stopPropagation()}
        role="dialog"
      >
        <div className="sticky top-0 flex items-center justify-between border-b border-white/10 bg-pitch-900/95 px-6 py-4">
          <h2 className="text-lg font-bold">{product.name}</h2>
          <button type="button" onClick={onClose} className="rounded-lg p-2 hover:bg-white/10">
            ✕
          </button>
        </div>

        <div className="p-6">
          {imageSrc && (
            <img
              src={imageSrc}
              alt={product.name}
              className="mb-4 max-h-56 w-full rounded-xl object-cover"
            />
          )}
          <p className="text-white/60">{product.description}</p>
          <p className="mt-2 text-2xl font-bold text-pitch-400">
            {Number(product.price).toFixed(2)} zł
          </p>
          <button
            type="button"
            disabled={product.stock < 1}
            onClick={() => {
              addItem(product);
              onClose();
            }}
            className="mt-4 w-full rounded-xl bg-pitch-500 py-3 font-semibold text-pitch-950 disabled:opacity-40 hover:bg-pitch-400"
          >
            Dodaj do koszyka
          </button>

          <h3 className="mt-8 font-semibold">Opinie ({reviews.length})</h3>
          {loading && <p className="mt-2 text-sm text-white/40">Ładowanie…</p>}
          <ul className="mt-4 space-y-3">
            {reviews.map((r) => (
              <li key={r._id} className="rounded-xl border border-white/10 bg-white/5 p-4">
                <p className="text-accent">{'★'.repeat(r.rating)}</p>
                <p className="font-medium">{r.title}</p>
                <p className="mt-1 text-sm text-white/60">{r.comment}</p>
                {r.userId && (
                  <p className="mt-1 text-xs text-white/40">
                    {r.userId.firstName} {r.userId.lastName}
                  </p>
                )}
              </li>
            ))}
          </ul>

          {user ? (
            <form onSubmit={handleReview} className="mt-6 space-y-3 border-t border-white/10 pt-6">
              <p className="font-medium">Dodaj opinię</p>
              {error && <p className="text-sm text-red-400">{error}</p>}
              <div className="flex gap-1">
                {[1, 2, 3, 4, 5].map((n) => (
                  <button
                    key={n}
                    type="button"
                    onClick={() => setRating(n)}
                    className={`text-2xl ${n <= rating ? 'text-accent' : 'text-white/20'}`}
                  >
                    ★
                  </button>
                ))}
              </div>
              <input
                required
                placeholder="Tytuł opinii"
                value={title}
                onChange={(e) => setTitle(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
              />
              <textarea
                required
                rows={3}
                placeholder="Twoja opinia…"
                value={comment}
                onChange={(e) => setComment(e.target.value)}
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-2 outline-none focus:border-pitch-500"
              />
              <button
                type="submit"
                disabled={submitting}
                className="rounded-xl bg-white/10 px-4 py-2 font-medium hover:bg-white/15 disabled:opacity-50"
              >
                {submitting ? 'Wysyłanie…' : 'Opublikuj opinię'}
              </button>
            </form>
          ) : (
            <p className="mt-4 text-sm text-white/40">Zaloguj się, aby dodać opinię.</p>
          )}
        </div>
      </div>
    </div>
  );
}
