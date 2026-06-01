import { FormEvent, useEffect, useState } from 'react';
import { Link, Navigate } from 'react-router-dom';
import {
  createProduct,
  deleteAdminProduct,
  deleteAdminUser,
  getAdminOrders,
  getAdminProducts,
  getAdminUserOrders,
  getAdminUsers,
  updateOrderStatus,
  updateProduct,
  uploadProductImage,
} from '../api';
import { useAuth } from '../context/AuthContext';
import type { Order, OrderItem, Product, User } from '../types';
import { CATEGORY_LABELS } from '../types';
import { resolveImageUrl } from '../utils/imageUrl';

const statusLabels: Record<string, string> = {
  pending: 'Oczekuje',
  confirmed: 'Potwierdzone',
  shipped: 'Wysłane',
  delivered: 'Dostarczone',
  cancelled: 'Anulowane',
};

const orderStatuses = ['pending', 'confirmed', 'shipped', 'delivered', 'cancelled'] as const;

type Tab = 'orders' | 'products' | 'users';

function ProductImage({ url, category }: { url: string | null; category: string }) {
  const [failed, setFailed] = useState(false);
  const icon =
    category === 'korki' ? '👟' : category === 'pilki' ? '⚽' : '👕';
  const src = resolveImageUrl(url);

  useEffect(() => {
    setFailed(false);
  }, [url]);

  if (!src || failed) {
    return <span className="text-4xl">{icon}</span>;
  }
  return (
    <img
      src={src}
      alt=""
      className="h-full w-full object-cover"
      onError={() => setFailed(true)}
    />
  );
}

export function AdminPage() {
  const { isAdmin, loading: authLoading } = useAuth();
  const [tab, setTab] = useState<Tab>('orders');
  const [orders, setOrders] = useState<{ order: Order; items: OrderItem[] }[]>([]);
  const [products, setProducts] = useState<Product[]>([]);
  const [users, setUsers] = useState<User[]>([]);
  const [selectedUserId, setSelectedUserId] = useState<string | null>(null);
  const [userOrders, setUserOrders] = useState<{ order: Order; items: OrderItem[] }[]>([]);
  const [editingProduct, setEditingProduct] = useState<Product | null>(null);
  const [creatingProduct, setCreatingProduct] = useState(false);
  const [msg, setMsg] = useState('');
  const [err, setErr] = useState('');
  const [submitting, setSubmitting] = useState(false);
  const [imagePreview, setImagePreview] = useState<string | null>(null);
  const [pendingImageUrl, setPendingImageUrl] = useState<string | null>(null);

  const loadOrders = () => {
    getAdminOrders().then(setOrders).catch(() => setOrders([]));
  };

  const loadProducts = () => {
    getAdminProducts().then(setProducts).catch(() => setProducts([]));
  };

  const loadUsers = () => {
    getAdminUsers().then(setUsers).catch(() => setUsers([]));
  };

  useEffect(() => {
    if (!isAdmin) return;
    loadOrders();
    loadProducts();
    loadUsers();
  }, [isAdmin]);

  useEffect(() => {
    if (!selectedUserId) {
      setUserOrders([]);
      return;
    }
    getAdminUserOrders(selectedUserId)
      .then(setUserOrders)
      .catch(() => setUserOrders([]));
  }, [selectedUserId]);

  useEffect(() => {
    setImagePreview(editingProduct?.image_url ?? pendingImageUrl ?? null);
  }, [editingProduct, pendingImageUrl]);

  if (authLoading) return null;
  if (!isAdmin) return <Navigate to="/" replace />;

  const handleStatusChange = async (orderId: number, status: string) => {
    try {
      await updateOrderStatus(orderId, status);
      loadOrders();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Błąd zmiany statusu');
    }
  };

  const handleImageFile = async (file: File | undefined) => {
    if (!file) return;
    setSubmitting(true);
    setErr('');
    try {
      const url = await uploadProductImage(file);
      setPendingImageUrl(url);
      setImagePreview(url);
      setMsg('Zdjęcie przesłane');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Błąd uploadu');
    } finally {
      setSubmitting(false);
    }
  };

  const resetProductForm = () => {
    setEditingProduct(null);
    setCreatingProduct(false);
    setPendingImageUrl(null);
    setImagePreview(null);
    setMsg('');
    setErr('');
  };

  const handleProductSubmit = async (e: FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    setSubmitting(true);
    setErr('');
    setMsg('');
    const fd = new FormData(e.currentTarget);
    const rawUrl = (fd.get('imageUrl') as string)?.trim();
    const imageUrl = pendingImageUrl ?? (rawUrl || null);
    const payload = {
      sku: fd.get('sku') as string,
      name: fd.get('name') as string,
      description: (fd.get('description') as string) || null,
      category: fd.get('category') as 'korki' | 'pilki' | 'stroje',
      price: Number(fd.get('price')),
      stock: Number(fd.get('stock')),
      unit: (fd.get('unit') as string) || 'szt',
      imageUrl: imageUrl || null,
    };

    try {
      if (editingProduct) {
        await updateProduct(editingProduct.id, {
          ...payload,
          isActive: fd.get('isActive') === 'on',
        });
        setMsg('Produkt zaktualizowany');
      } else {
        await createProduct(payload);
        setMsg('Produkt dodany do sklepu');
        e.currentTarget.reset();
      }
      resetProductForm();
      loadProducts();
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Błąd');
    } finally {
      setSubmitting(false);
    }
  };

  const handleDeleteProduct = async (product: Product) => {
    if (!confirm(`Usunąć produkt „${product.name}”? Tej operacji nie można cofnąć.`)) return;
    setErr('');
    setMsg('');
    try {
      await deleteAdminProduct(product.id);
      if (editingProduct?.id === product.id) resetProductForm();
      loadProducts();
      setMsg('Produkt usunięty');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Błąd usuwania produktu');
    }
  };

  const handleDeleteUser = async (user: User) => {
    if (!confirm(`Usunąć konto ${user.email}?`)) return;
    setErr('');
    try {
      await deleteAdminUser(user.id);
      if (selectedUserId === user.id) setSelectedUserId(null);
      loadUsers();
      setMsg('Konto usunięte');
    } catch (error) {
      setErr(error instanceof Error ? error.message : 'Błąd usuwania');
    }
  };

  const showProductForm = creatingProduct || editingProduct;

  return (
    <div className="mx-auto max-w-5xl px-4 py-12 sm:px-6">
      <div className="flex items-center justify-between">
        <h1 className="text-3xl font-bold">Panel administratora</h1>
        <Link to="/" className="text-sm text-pitch-400 hover:underline">
          ← Sklep
        </Link>
      </div>

      {(msg || err) && (
        <p className={`mt-4 text-sm ${err ? 'text-red-400' : 'text-pitch-400'}`}>
          {err || msg}
        </p>
      )}

      <div className="mt-8 flex flex-wrap gap-2">
        {(
          [
            ['orders', `Zamówienia (${orders.length})`],
            ['products', `Produkty (${products.length})`],
            ['users', `Użytkownicy (${users.length})`],
          ] as const
        ).map(([id, label]) => (
          <button
            key={id}
            type="button"
            onClick={() => {
              setTab(id);
              resetProductForm();
            }}
            className={`rounded-xl px-4 py-2 text-sm font-medium ${
              tab === id ? 'bg-pitch-500 text-pitch-950' : 'bg-white/5'
            }`}
          >
            {label}
          </button>
        ))}
      </div>

      {tab === 'orders' && (
        <div className="mt-8 space-y-4">
          {orders.length === 0 && <p className="text-white/50">Brak zamówień.</p>}
          {orders.map(({ order, items }) => (
            <div
              key={order.id}
              className="rounded-2xl border border-white/10 bg-white/5 p-5"
            >
              <div className="flex flex-wrap items-start justify-between gap-2">
                <p className="font-mono text-pitch-400">{order.order_number}</p>
                <select
                  value={order.status}
                  onChange={(e) => handleStatusChange(order.id, e.target.value)}
                  className="rounded-lg border border-white/10 bg-pitch-900 px-3 py-1.5 text-sm"
                >
                  {orderStatuses.map((s) => (
                    <option key={s} value={s}>
                      {statusLabels[s]}
                    </option>
                  ))}
                </select>
              </div>
              <p className="mt-1 text-xs text-white/40">Użytkownik: {order.mongo_user_id}</p>
              <p className="mt-2 font-bold">{Number(order.total_amount).toFixed(2)} zł</p>
              <p className="text-sm text-white/50">
                {order.shipping_address.street}, {order.shipping_address.postalCode}{' '}
                {order.shipping_address.city}
              </p>
              <ul className="mt-3 space-y-1 text-sm text-white/60">
                {items.map((item) => (
                  <li key={item.id}>
                    Produkt #{item.product_id} × {item.quantity} — {item.subtotal} zł
                  </li>
                ))}
              </ul>
            </div>
          ))}
        </div>
      )}

      {tab === 'products' && (
        <div className="mt-8">
          {!showProductForm && (
            <button
              type="button"
              onClick={() => {
                setCreatingProduct(true);
                setPendingImageUrl(null);
                setImagePreview(null);
              }}
              className="mb-6 rounded-xl bg-pitch-500 px-4 py-2 text-sm font-semibold text-pitch-950"
            >
              + Dodaj produkt
            </button>
          )}

          {showProductForm && (
            <form onSubmit={handleProductSubmit} className="mb-8 max-w-lg space-y-4 rounded-2xl border border-white/10 bg-white/5 p-6">
              <div className="flex items-center justify-between">
                <h2 className="font-semibold">
                  {editingProduct ? 'Edycja produktu' : 'Nowy produkt'}
                </h2>
                <button
                  type="button"
                  onClick={resetProductForm}
                  className="text-sm text-white/50 hover:text-white"
                >
                  Anuluj
                </button>
              </div>

              <div className="flex h-32 w-full items-center justify-center overflow-hidden rounded-xl bg-pitch-800/50">
                <ProductImage
                  url={imagePreview}
                  category={editingProduct?.category ?? 'korki'}
                />
              </div>

              <label className="block text-sm text-white/60">
                Zdjęcie (plik)
                <input
                  type="file"
                  accept="image/*"
                  className="mt-1 w-full text-sm"
                  onChange={(e) => handleImageFile(e.target.files?.[0])}
                />
              </label>
              <input
                name="imageUrl"
                defaultValue={editingProduct?.image_url ?? pendingImageUrl ?? ''}
                placeholder="Lub URL zdjęcia"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />

              <input
                name="sku"
                required
                defaultValue={editingProduct?.sku}
                placeholder="SKU"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />
              <input
                name="name"
                required
                defaultValue={editingProduct?.name}
                placeholder="Nazwa produktu"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />
              <textarea
                name="description"
                rows={2}
                defaultValue={editingProduct?.description ?? ''}
                placeholder="Opis"
                className="w-full rounded-xl border border-white/10 bg-white/5 px-4 py-3"
              />
              <select
                name="category"
                required
                defaultValue={editingProduct?.category ?? 'korki'}
                className="w-full rounded-xl border border-white/10 bg-pitch-900 px-4 py-3"
              >
                {Object.entries(CATEGORY_LABELS).map(([k, v]) => (
                  <option key={k} value={k}>
                    {v}
                  </option>
                ))}
              </select>
              <div className="grid grid-cols-3 gap-4">
                <input
                  name="price"
                  type="number"
                  step="0.01"
                  required
                  defaultValue={editingProduct?.price}
                  placeholder="Cena"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                />
                <input
                  name="stock"
                  type="number"
                  required
                  defaultValue={editingProduct?.stock}
                  placeholder="Stan"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                />
                <input
                  name="unit"
                  defaultValue={editingProduct?.unit ?? 'szt'}
                  placeholder="Jednostka"
                  className="rounded-xl border border-white/10 bg-white/5 px-4 py-3"
                />
              </div>
              {editingProduct && (
                <label className="flex items-center gap-2 text-sm">
                  <input
                    type="checkbox"
                    name="isActive"
                    defaultChecked={editingProduct.is_active}
                  />
                  Aktywny w sklepie
                </label>
              )}
              <button
                type="submit"
                disabled={submitting}
                className="w-full rounded-xl bg-pitch-500 py-3 font-semibold text-pitch-950 disabled:opacity-50"
              >
                {submitting
                  ? 'Zapisywanie…'
                  : editingProduct
                    ? 'Zapisz zmiany'
                    : 'Dodaj produkt'}
              </button>
            </form>
          )}

          <div className="space-y-3">
            {products.map((p) => (
              <div
                key={p.id}
                className="flex gap-4 rounded-2xl border border-white/10 bg-white/5 p-4"
              >
                <div className="flex h-16 w-16 shrink-0 items-center justify-center overflow-hidden rounded-lg bg-pitch-800/50">
                  <ProductImage url={p.image_url} category={p.category} />
                </div>
                <div className="min-w-0 flex-1">
                  <p className="font-medium">{p.name}</p>
                  <p className="text-xs text-white/40">
                    {p.sku} · {CATEGORY_LABELS[p.category]} · {Number(p.price).toFixed(2)} zł ·
                    stan {p.stock}
                    {!p.is_active && ' · nieaktywny'}
                  </p>
                </div>
                <div className="flex shrink-0 flex-col gap-2 self-center">
                  <button
                    type="button"
                    onClick={() => {
                      setEditingProduct(p);
                      setCreatingProduct(false);
                      setPendingImageUrl(p.image_url);
                      setImagePreview(p.image_url);
                    }}
                    className="rounded-lg border border-white/15 px-3 py-1.5 text-sm hover:bg-white/5"
                  >
                    Edytuj
                  </button>
                  <button
                    type="button"
                    onClick={() => handleDeleteProduct(p)}
                    className="rounded-lg border border-red-500/30 px-3 py-1.5 text-sm text-red-400 hover:bg-red-500/10"
                  >
                    Usuń
                  </button>
                </div>
              </div>
            ))}
          </div>
        </div>
      )}

      {tab === 'users' && (
        <div className="mt-8 grid gap-6 lg:grid-cols-2">
          <div className="space-y-2">
            {users.length === 0 && <p className="text-white/50">Brak użytkowników.</p>}
            {users.map((u) => (
              <div
                key={u.id}
                className={`rounded-2xl border p-4 ${
                  selectedUserId === u.id
                    ? 'border-pitch-500/50 bg-pitch-500/10'
                    : 'border-white/10 bg-white/5'
                }`}
              >
                <button
                  type="button"
                  onClick={() => setSelectedUserId(u.id)}
                  className="w-full text-left"
                >
                  <p className="font-medium">
                    {u.firstName} {u.lastName}
                  </p>
                  <p className="text-sm text-white/50">{u.email}</p>
                  <p className="mt-1 text-xs text-white/40">
                    {u.role === 'admin' ? 'Administrator' : 'Klient'}
                  </p>
                </button>
                {u.role !== 'admin' && (
                  <button
                    type="button"
                    onClick={() => handleDeleteUser(u)}
                    className="mt-3 text-sm text-red-400 hover:underline"
                  >
                    Usuń konto
                  </button>
                )}
              </div>
            ))}
          </div>

          <div className="rounded-2xl border border-white/10 bg-white/5 p-5">
            <h2 className="font-semibold">Zamówienia użytkownika</h2>
            {!selectedUserId && (
              <p className="mt-4 text-sm text-white/50">Wybierz użytkownika z listy.</p>
            )}
            {selectedUserId && userOrders.length === 0 && (
              <p className="mt-4 text-sm text-white/50">Brak zamówień.</p>
            )}
            <div className="mt-4 space-y-3">
              {userOrders.map(({ order, items }) => (
                <div key={order.id} className="rounded-xl border border-white/10 p-3 text-sm">
                  <p className="font-mono text-pitch-400">{order.order_number}</p>
                  <p>{statusLabels[order.status] ?? order.status}</p>
                  <p className="font-bold">{Number(order.total_amount).toFixed(2)} zł</p>
                  <ul className="mt-2 text-white/60">
                    {items.map((item) => (
                      <li key={item.id}>
                        #{item.product_id} × {item.quantity}
                      </li>
                    ))}
                  </ul>
                </div>
              ))}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
