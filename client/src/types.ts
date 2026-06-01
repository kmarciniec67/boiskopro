export interface Product {
  id: number;
  sku: string;
  name: string;
  description: string | null;
  category: string;
  price: string;
  stock: number;
  unit: string;
  image_url: string | null;
  is_active: boolean;
}

export interface User {
  id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone?: string;
  role: 'customer' | 'admin';
  preferences?: {
    newsletter: boolean;
    favoriteCategories: string[];
  };
}

export interface Review {
  _id: string;
  productId: number;
  rating: number;
  title: string;
  comment: string;
  verifiedPurchase: boolean;
  userId?: {
    _id: string;
    firstName: string;
    lastName: string;
  };
}

export interface Order {
  id: number;
  order_number: string;
  mongo_user_id: string;
  status: string;
  total_amount: string;
  shipping_address: {
    street: string;
    city: string;
    postalCode: string;
    country: string;
  };
  created_at: string;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface CartItem {
  product: Product;
  quantity: number;
}

export type Category = 'all' | 'korki' | 'pilki' | 'stroje';

export const CATEGORIES: { id: Category; label: string; icon: string }[] = [
  { id: 'all', label: 'Wszystko', icon: '⚽' },
  { id: 'korki', label: 'Korki', icon: '👟' },
  { id: 'pilki', label: 'Piłki', icon: '⚽' },
  { id: 'stroje', label: 'Stroje', icon: '👕' },
];

export const CATEGORY_LABELS: Record<string, string> = {
  korki: 'Korki',
  pilki: 'Piłki',
  stroje: 'Stroje',
};
