// src/types/index.ts

export type Database = {
  public: {
    Tables: {
      categorias: {
        Row: Category;
        Insert: CategoryInsert;
        Update: CategoryUpdate;
      };
      productos: {
        Row: Product;
        Insert: ProductInsert;
        Update: ProductUpdate;
      };
      ordenes: {
        Row: Order;
        Insert: OrderInsert;
        Update: OrderUpdate;
      };
      configuracion: {
        Row: Setting;
        Insert: SettingInsert;
        Update: SettingUpdate;
      };
    };
  };
};

// Categories
export interface Category {
  id: string;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  imagen?: string;
  creada_en: string;
  actualizada_en: string;
}

export type CategoryInsert = Omit<Category, 'id' | 'creada_en' | 'actualizada_en'>;
export type CategoryUpdate = Partial<CategoryInsert>;

// Products
export interface Product {
  id: string;
  nombre: string;
  slug?: string;
  descripcion: string;
  precio: number;
  precio_original?: number;
  stock: number;
  categoria_id: string;
  urls_imagenes: string[];
  destacado: boolean;
  creado_en: string;
  actualizado_en: string;
  marca?: string;
  sku?: string;
}

export type ProductInsert = Omit<Product, 'id' | 'creado_en' | 'actualizado_en'>;
export type ProductUpdate = Partial<ProductInsert>;

// Orders
export interface Order {
  id: string;
  numero_orden: string;
  usuario_id?: string;
  email_cliente: string;
  estado: 'pendiente' | 'procesando' | 'enviado' | 'entregado' | 'cancelado';
  total: number;
  creada_en: string;
  actualizada_en: string;
}

export type OrderInsert = Omit<Order, 'id' | 'creada_en' | 'actualizada_en'>;
export type OrderUpdate = Partial<OrderInsert>;

// Settings
export interface Setting {
  id: string;
  clave: string;
  valor: string | boolean | number | Record<string, any>;
  descripcion?: string;
  actualizada_en: string;
}

export type SettingInsert = Omit<Setting, 'id' | 'actualizada_en'>;
export type SettingUpdate = Partial<SettingInsert>;

// Cart
export interface CartItem {
  product_id: string;
  quantity: number;
  precio: number;
  nombre: string;
  urls_imagenes: string[];
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}
