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
  created_at: Date;
  updated_at: Date;
}

export interface Order {
  id: number;
  order_number: string;
  mongo_user_id: string;
  status: 'pending' | 'confirmed' | 'shipped' | 'delivered' | 'cancelled';
  total_amount: string;
  shipping_address: Record<string, unknown>;
  created_at: Date;
  updated_at: Date;
}

export interface OrderItem {
  id: number;
  order_id: number;
  product_id: number;
  quantity: number;
  unit_price: string;
  subtotal: string;
}

export interface Payment {
  id: number;
  order_id: number;
  method: 'card' | 'blik' | 'transfer' | 'cash_on_delivery';
  status: 'pending' | 'completed' | 'failed' | 'refunded';
  amount: string;
  transaction_ref: string | null;
  paid_at: Date | null;
  created_at: Date;
}

export interface CreateOrderInput {
  mongoUserId: string;
  items: { productId: number; quantity: number }[];
  shippingAddress: Record<string, unknown>;
  paymentMethod: Payment['method'];
}
