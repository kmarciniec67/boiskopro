import type { Product } from '../types';
import { CATEGORY_LABELS } from '../types';
import { resolveImageUrl } from '../utils/imageUrl';

interface ProductCardProps {
  product: Product;
  onSelect: (product: Product) => void;
  onAddToCart: (product: Product) => void;
}

export function ProductCard({ product, onSelect, onAddToCart }: ProductCardProps) {
  const price = Number(product.price).toFixed(2);
  const imageSrc = resolveImageUrl(product.image_url);
  const icon =
    product.category === 'korki' ? '👟' : product.category === 'pilki' ? '⚽' : '👕';

  return (
    <article className="group flex flex-col overflow-hidden rounded-2xl border border-white/10 bg-white/5 transition hover:border-pitch-500/40 hover:shadow-lg hover:shadow-pitch-500/10">
      <button
        type="button"
        onClick={() => onSelect(product)}
        className="relative flex h-36 items-center justify-center overflow-hidden bg-gradient-to-br from-pitch-800/80 to-pitch-900/50"
      >
        {imageSrc ? (
          <img
            src={imageSrc}
            alt=""
            className="h-full w-full object-cover transition group-hover:scale-105"
          />
        ) : (
          <span className="text-5xl transition group-hover:scale-110">{icon}</span>
        )}
        <span className="absolute left-3 top-3 rounded-lg bg-pitch-950/80 px-2 py-1 text-xs font-medium text-pitch-400">
          {CATEGORY_LABELS[product.category] ?? product.category}
        </span>
      </button>

      <div className="flex flex-1 flex-col p-5">
        <button type="button" onClick={() => onSelect(product)} className="text-left">
          <h3 className="font-semibold leading-snug hover:text-pitch-400">{product.name}</h3>
        </button>
        <p className="mt-2 line-clamp-2 flex-1 text-sm text-white/50">{product.description}</p>
        <div className="mt-4 flex items-end justify-between gap-2">
          <div>
            <p className="text-2xl font-bold text-pitch-400">{price} zł</p>
            <p className="text-xs text-white/40">
              {product.stock > 0 ? `${product.stock} dostępnych` : 'Brak na stanie'}
            </p>
          </div>
          <button
            type="button"
            disabled={product.stock < 1}
            onClick={() => onAddToCart(product)}
            className="rounded-xl bg-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-950 disabled:opacity-40 hover:bg-pitch-400"
          >
            Do koszyka
          </button>
        </div>
      </div>
    </article>
  );
}
