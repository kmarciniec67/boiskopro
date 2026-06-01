import { useEffect, useState } from 'react';
import { Link, useLocation } from 'react-router-dom';
import { getMyOrders } from '../api';
import { useAuth } from '../context/AuthContext';
import type { Order } from '../types';

const statusLabels: Record<string, string> = {
  pending: 'Oczekuje',
  confirmed: 'Potwierdzone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

export function OrdersPage() {
  const { user } = useAuth();
  const location = useLocation();
  const [orders, setOrders] = useState<Order[]>([]);
  const [loading, setLoading] = useState(true);
  const message = (location.state as { message?: string })?.message;

  useEffect(() => {
    if (!user) return;
    getMyOrders()
      .then(setOrders)
      .catch(() => setOrders([]))
      .finally(() => setLoading(false));
  }, [user]);

  if (!user) {
    return (
      <div className="mx-auto max-w-lg px-4 py-20 text-center">
        <p>Zaloguj się, aby zobaczyć zamówienia.</p>
        <Link to="/" className="mt-4 text-pitch-400">
          Wróć do sklepu
        </Link>
      </div>
    );
  }

  return (
    <div className="mx-auto max-w-3xl px-4 py-12 sm:px-6">
      <h1 className="text-3xl font-bold">Moje zamówienia</h1>
      {message && (
        <p className="mt-4 rounded-xl border border-pitch-500/30 bg-pitch-500/10 px-4 py-3 text-pitch-400">
          {message}
        </p>
      )}

      {loading && <p className="mt-8 text-white/50">Ładowanie…</p>}
      {!loading && orders.length === 0 && (
        <p className="mt-8 text-white/50">Nie masz jeszcze zamówień.</p>
      )}

      <ul className="mt-8 space-y-4">
        {orders.map((order) => (
          <li
            key={order.id}
            className="rounded-2xl border border-white/10 bg-white/5 p-5"
          >
            <div className="flex flex-wrap items-start justify-between gap-2">
              <div>
                <p className="font-mono text-sm text-pitch-400">{order.order_number}</p>
                <p className="mt-1 text-sm text-white/50">
                  {new Date(order.created_at).toLocaleDateString('pl-PL')}
                </p>
              </div>
              <span className="rounded-lg bg-white/10 px-3 py-1 text-sm">
                {statusLabels[order.status] ?? order.status}
              </span>
            </div>
            <p className="mt-3 text-lg font-bold">{Number(order.total_amount).toFixed(2)} zł</p>
            <p className="mt-1 text-sm text-white/50">
              {(order.shipping_address as { street: string; city: string }).street},{' '}
              {(order.shipping_address as { city: string }).city}
            </p>
          </li>
        ))}
      </ul>
    </div>
  );
}
