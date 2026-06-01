import { Link } from 'react-router-dom';
import { useCart } from '../context/CartContext';

export function CartPage() {
  const { items, updateQuantity, removeItem, totalPrice } = useCart();

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-7xl px-4 py-20 text-center sm:px-6">
        <p className="text-6xl">🛒</p>
        <h1 className="mt-4 text-2xl font-bold">Koszyk jest pusty</h1>
        <Link to="/" className="mt-6 inline-block text-pitch-400 hover:underline">
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Koszyk</h1>
      <ul className="mt-8 space-y-4">
        {items.map(({ product, quantity }) => (
          <li
            key={product.id}
            className="flex flex-col gap-4 rounded-2xl border border-white/10 bg-white/5 p-4 sm:flex-row sm:items-center"
          >
            <div className="flex-1">
              <p className="font-semibold">{product.name}</p>
              <p className="text-sm text-white/50">
                {Number(product.price).toFixed(2)} zł / {product.unit}
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                type="button"
                onClick={() => updateQuantity(product.id, quantity - 1)}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/15"
              >
                −
              </button>
              <span className="w-8 text-center font-medium">{quantity}</span>
              <button
                type="button"
                onClick={() => updateQuantity(product.id, quantity + 1)}
                disabled={quantity >= product.stock}
                className="h-9 w-9 rounded-lg bg-white/10 hover:bg-white/15 disabled:opacity-40"
              >
                +
              </button>
            </div>
            <p className="font-bold text-pitch-400">
              {(Number(product.price) * quantity).toFixed(2)} zł
            </p>
            <button
              type="button"
              onClick={() => removeItem(product.id)}
              className="text-sm text-white/40 hover:text-red-400"
            >
              Usuń
            </button>
          </li>
        ))}
      </ul>

      <div className="mt-8 rounded-2xl border border-white/10 bg-white/5 p-6">
        <div className="flex justify-between text-lg font-bold">
          <span>Razem</span>
          <span className="text-pitch-400">{totalPrice.toFixed(2)} zł</span>
        </div>
        <Link
          to="/zamowienie"
          className="mt-6 block w-full rounded-xl bg-pitch-500 py-3 text-center font-semibold text-pitch-950 hover:bg-pitch-400"
        >
          Przejdź do zamówienia
        </Link>
      </div>
    </div>
  );
}
