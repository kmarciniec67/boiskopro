import { FormEvent, useState } from 'react';
import { Link, useNavigate } from 'react-router-dom';
import { createOrder } from '../api';
import { useAuth } from '../context/AuthContext';
import { useCart } from '../context/CartContext';

export function CheckoutPage() {
  const { user } = useAuth();
  const { items, totalPrice, clearCart } = useCart();
  const navigate = useNavigate();
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p className="text-white/60">Zaloguj się, aby złożyć zamówienie.</p>
        <Link to="/" className="mt-4 inline-block text-pitch-400 hover:underline">
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  if (items.length === 0) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>Koszyk jest pusty.</p>
        <Link to="/" className="mt-4 inline-block text-pitch-400">
          Do sklepu
        </Link>
      </div>
    );
  }

  const handleSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setLoading(true);
    setError('');
    const fd = new FormData(e.currentTarget);

    try {
      const result = await createOrder({
        items: items.map((i) => ({ productId: i.product.id, quantity: i.quantity })),
        shippingAddress: {
          street: fd.get('street') as string,
          city: fd.get('city') as string,
          postalCode: fd.get('postalCode') as string,
          country: 'PL',
        },
        paymentMethod: fd.get('paymentMethod') as string,
      });
      clearCart();
      navigate('/zamowienia', {
        state: { message: `Zamówienie ${result.order.order_number} przyjęte!` },
      });
    } catch (err) {
      setError(err instanceof Error ? err.message : 'Błąd składania zamówienia');
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="mx-auto max-w-lg px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Zamówienie</h1>
      <p className="mt-2 text-white/50">
        {items.length} produktów · {totalPrice.toFixed(2)} zł
      </p>

      <form onSubmit={handleSubmit} className="mt-8 space-y-4">
        <input
          name="street"
          required
          placeholder="Ulica i numer"
          className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-pitch-500"
        />
        <div className="grid grid-cols-2 gap-4">
          <input
            name="postalCode"
            required
            placeholder="Kod pocztowy"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-pitch-500"
          />
          <input
            name="city"
            required
            placeholder="Miasto"
            className="rounded-xl border border-white/10 bg-white/5 px-4 py-3 outline-none focus:border-pitch-500"
          />
        </div>
        <select
          name="paymentMethod"
          required
          className="w-full rounded-xl border border-white/10 bg-pitch-900 px-4 py-3 outline-none focus:border-pitch-500"
        >
          <option value="blik">BLIK</option>
          <option value="card">Karta płatnicza</option>
          <option value="transfer">Przelew</option>
          <option value="cash_on_delivery">Za pobraniem</option>
        </select>

        {error && <p className="text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full rounded-xl bg-pitch-500 py-3 font-semibold text-pitch-950 hover:bg-pitch-400 disabled:opacity-50"
        >
          {loading ? 'Składanie zamówienia…' : `Zapłać ${totalPrice.toFixed(2)} zł`}
        </button>
      </form>
    </div>
  );
}
