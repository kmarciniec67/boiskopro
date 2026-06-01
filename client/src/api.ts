import type { Order, OrderItem, Product, Review, User } from './types';

const TOKEN_KEY = 'boiskopro_token';

export function getToken(): string | null {
  return localStorage.getItem(TOKEN_KEY);
}

export function setToken(token: string | null): void {
  if (token) localStorage.setItem(TOKEN_KEY, token);
  else localStorage.removeItem(TOKEN_KEY);
}

async function api<T>(
  url: string,
  options: RequestInit = {}
): Promise<T> {
  const token = getToken();
  const headers: Record<string, string> = {
    'Content-Type': 'application/json',
    ...(options.headers as Record<string, string>),
  };
  if (token) headers.Authorization = `Bearer ${token}`;

  const res = await fetch(url, { ...options, headers });
  const json = await res.json().catch(() => ({}));

  if (!res.ok) {
    throw new Error(json.error ?? `Błąd ${res.status}`);
  }
  return json.data as T;
}

export function getProducts(category?: string): Promise<Product[]> {
  const url =
    category && category !== 'all'
      ? `/api/products/category/${category}`
      : '/api/products';
  return api<Product[]>(url);
}

export function login(email: string, password: string) {
  return api<{ token: string; user: User }>('/api/auth/login', {
    method: 'POST',
    body: JSON.stringify({ email, password }),
  });
}

export function register(data: {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
}) {
  return api<{ token: string; user: User }>('/api/auth/register', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMe(): Promise<User> {
  return api<User>('/api/auth/me');
}

export function getReviews(productId: number): Promise<Review[]> {
  return api<Review[]>(`/api/reviews/product/${productId}`);
}

export function createReview(data: {
  productId: number;
  rating: number;
  title: string;
  comment: string;
}) {
  return api<Review>('/api/reviews', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function createOrder(data: {
  items: { productId: number; quantity: number }[];
  shippingAddress: { street: string; city: string; postalCode: string; country?: string };
  paymentMethod: string;
}) {
  return api<{ order: Order; items: OrderItem[] }>('/api/orders', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getMyOrders(): Promise<Order[]> {
  return api<Order[]>('/api/orders/mine');
}

export function createProduct(data: {
  sku: string;
  name: string;
  description?: string;
  category: 'korki' | 'pilki' | 'stroje';
  price: number;
  stock: number;
  unit: string;
  imageUrl?: string | null;
}) {
  return api<Product>('/api/admin/products', {
    method: 'POST',
    body: JSON.stringify(data),
  });
}

export function getAdminProducts(): Promise<Product[]> {
  return api<Product[]>('/api/admin/products');
}

export function deleteAdminProduct(id: number) {
  return api<{ deleted: boolean }>(`/api/admin/products/${id}`, { method: 'DELETE' });
}

export function updateProduct(
  id: number,
  data: {
    sku?: string;
    name?: string;
    description?: string | null;
    category?: 'korki' | 'pilki' | 'stroje';
    price?: number;
    stock?: number;
    unit?: string;
    imageUrl?: string | null;
    isActive?: boolean;
  }
) {
  return api<Product>(`/api/admin/products/${id}`, {
    method: 'PATCH',
    body: JSON.stringify(data),
  });
}

export async function uploadProductImage(file: File): Promise<string> {
  const token = getToken();
  const form = new FormData();
  form.append('image', file);
  const res = await fetch('/api/admin/upload', {
    method: 'POST',
    headers: token ? { Authorization: `Bearer ${token}` } : {},
    body: form,
  });
  const json = await res.json().catch(() => ({}));
  if (!res.ok) {
    throw new Error(json.error ?? `Błąd ${res.status}`);
  }
  return (json.data as { url: string }).url;
}

export function getAdminOrders(): Promise<{ order: Order; items: OrderItem[] }[]> {
  return api<{ order: Order; items: OrderItem[] }[]>('/api/admin/orders');
}

export function updateOrderStatus(orderId: number, status: string) {
  return api<Order>(`/api/admin/orders/${orderId}/status`, {
    method: 'PATCH',
    body: JSON.stringify({ status }),
  });
}

export function getAdminUsers(): Promise<User[]> {
  return api<User[]>('/api/admin/users');
}

export function getAdminUserOrders(
  userId: string
): Promise<{ order: Order; items: OrderItem[] }[]> {
  return api<{ order: Order; items: OrderItem[] }[]>(`/api/admin/users/${userId}/orders`);
}

export function deleteAdminUser(userId: string) {
  return api<{ deleted: boolean }>(`/api/admin/users/${userId}`, { method: 'DELETE' });
}
