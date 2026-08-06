export interface Category {
  id: string;
  name: string;
  icon?: string | null;
  icon_asset?: string | null;
  icon_url?: string | null;
  sort_order: number;
  is_active: boolean;
  created_at?: string;
}

export interface CategoryStat {
  id: string;
  name: string;
  is_active: boolean;
  product_count: number;
  featured_count: number;
}

export interface Product {
  id: string;
  category_id: string;
  name: string;
  spec?: string | null;
  description?: string | null;
  price: number;
  original_price?: number | null;
  rating?: number;
  reviews_count?: number;
  badge?: string | null;
  image_asset?: string | null;
  image_url?: string | null;
  images?: string[];
  weight_options?: any[];
  is_active: boolean;
  is_featured: boolean;
  stock: number;
  sort_order: number;
  created_at?: string;
  updated_at?: string;
  categories?: {
    name: string;
  };
}

export interface NeedRequest {
  id: string;
  product_name: string;
  category_id?: string | null;
  description?: string | null;
  quantity?: number;
  city?: string | null;
  budget?: number | null;
  image_url?: string | null;
  status: 'pending' | 'reviewing' | 'fulfilled' | 'rejected';
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
  categories?: {
    name: string;
  };
}

export interface OrderItem {
  id?: string;
  product_id?: string;
  name: string;
  price: number;
  quantity: number;
  image_url?: string | null;
}

export type OrderStatus = 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';

export interface Order {
  id: string;
  user_id?: string | null;
  customer_name: string;
  customer_phone: string;
  city?: string | null;
  address?: string | null;
  items: OrderItem[];
  subtotal: number;
  delivery_fee: number;
  total: number;
  total_price?: number;
  status: 'pending' | 'processing' | 'shipped' | 'delivered' | 'cancelled';
  payment_method?: string | null;
  notes?: string | null;
  admin_notes?: string | null;
  created_at: string;
  updated_at?: string;
}

export interface AppSetting {
  key: string;
  value: string;
  label?: string | null;
  updated_at?: string;
}

export interface Banner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  action_url?: string | null;
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
}

export interface PharmacyProduct {
  id: string;
  name: string;
  spec?: string | null; // التركيز أو المواصفات
  description?: string | null;
  price: number;
  original_price?: number | null;
  discount_percentage?: number | null;
  badge?: string | null; // 15% خصم أو الأكثر مبيعاً
  image_url?: string | null;
  subcategory: string; // أدوية، فيتامينات، عناية بالبشرة، مستلزمات طبية، إلخ
  is_active: boolean;
  sort_order: number;
  stock?: number;
  created_at?: string;
  updated_at?: string;
}

export interface PromoBanner {
  id: string;
  title?: string | null;
  subtitle?: string | null;
  image_url: string;
  action_type?: 'category' | 'product' | 'offers' | 'url' | string;
  action_url?: string | null; // توجيه النقر (قسم محدد / منتج / شاشة العروض)
  auto_slide_seconds?: number; // مدة الانتقال التلقائي (3 أو 5 ثواني)
  sort_order: number;
  is_active: boolean;
  starts_at?: string | null;
  ends_at?: string | null;
  created_at?: string;
}

export interface UserProfile {
  id: string;
  full_name: string;
  email: string;
  phone?: string | null;
  auth_provider?: 'email' | 'google' | 'phone' | string;
  avatar_url?: string | null;
  orders_count?: number;
  total_spent?: number;
  is_disabled: boolean;
  created_at: string;
  updated_at?: string;
}

export interface CategoryDiscount {
  id?: string;
  category_id: string;
  category_name?: string;
  discount_percentage: number;
  badge_text?: string;
  is_active: boolean;
  created_at?: string;
}

export interface UserNotification {
  id: string;
  user_id?: string | null;
  order_id?: string | null;
  title: string;
  body: string;
  type?: string;
  is_read: boolean;
  created_at: string;
}

export interface AdminNotification {
  id: string;
  type: 'new_order' | 'need_request' | 'review' | 'system';
  title: string;
  body?: string | null;
  ref_id?: string | null;
  is_read: boolean;
  created_at: string;
}

