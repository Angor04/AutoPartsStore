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
  id: number;
  nombre: string;
  slug: string;
  descripcion?: string;
  icono?: string;
  imagen?: string;
  created_at: string;
  updated_at: string;
}

export type CategoryInsert = Omit<Category, 'id' | 'creada_en' | 'actualizada_en'>;
export type CategoryUpdate = Partial<CategoryInsert>;

// Products
export interface Product {
  id: number;
  nombre: string;
  slug?: string;
  descripcion: string;
  precio: number;
  precio_original?: number;
  stock: number;
  categoria_id: number;
  urls_imagenes: string[];
  destacado: boolean;
  created_at: string;
  updated_at: string;
  marca?: string;
  sku?: string;
  especificaciones?: Record<string, string>;
}

export type ProductInsert = Omit<Product, 'id' | 'creado_en' | 'actualizado_en'>;
export type ProductUpdate = Partial<ProductInsert>;

// Orders - AMPLIADO
export interface Order {
  id: string;
  numero_orden: string;
  usuario_id: string;
  estado: 'PENDIENTE' | 'PAGADO' | 'ENVIADO' | 'ENTREGADO' | 'CANCELADO';
  estado_pago: 'PENDIENTE' | 'COMPLETADO' | 'FALLIDO' | 'REEMBOLSADO';
  subtotal: number;
  impuestos: number;
  costo_envio: number;
  descuento_aplicado: number;
  cupon_id?: string;
  total: number;
  direccion_envio?: Record<string, string>;
  telefono_envio?: string;
  fecha_creacion: string;
  fecha_pago?: string;
  fecha_envio?: string;
  fecha_entrega?: string;
  fecha_cancelacion?: string;
  numero_seguimiento?: string;
  solicitud_devolucion_id?: string;
  created_at: string;
  updated_at: string;
}

export interface OrderItem {
  id: string;
  orden_id: string;
  producto_id: number;
  cantidad: number;
  precio_unitario: number;
  subtotal: number;
  created_at: string;
}

// Newsletter
export interface NewsletterSubscriber {
  id: string;
  email: string;
  usuario_id?: string;
  estado_suscripcion: boolean;
  recibe_ofertas: boolean;
  codigo_descuento_otorgado?: string;
  fecha_suscripcion: string;
  fecha_confirmacion?: string;
  created_at: string;
  updated_at: string;
}

// Cupones
export interface Cupon {
  id: string;
  codigo: string;
  descripcion?: string;
  tipo_descuento: 'porcentaje' | 'cantidad_fija';
  valor_descuento: number;
  descuento_maximo?: number;
  cantidad_minima_compra: number;
  uso_unico: boolean;
  usos_totales: number;
  limite_usos?: number;
  activo: boolean;
  fecha_inicio: string;
  fecha_expiracion: string;
  categorias_aplica?: string[];
  creado_por?: string;
  created_at: string;
  updated_at: string;
}

// Solicitudes de Devolución
export interface SolicitudDevolucion {
  id: string;
  orden_id: string;
  usuario_id: string;
  estado: 'SOLICITADA' | 'ACEPTADA' | 'RECHAZADA' | 'COMPLETADA';
  motivo?: string;
  descripcion?: string;
  numero_etiqueta_devolucion?: string;
  fecha_solicitud: string;
  fecha_aceptacion?: string;
  fecha_recepcion?: string;
  fecha_reembolso?: string;
  monto_reembolso?: number;
  numero_seguimiento_devolucion?: string;
  created_at: string;
  updated_at: string;
}

export type OrderInsert = Omit<Order, 'id' | 'creada_en' | 'actualizada_en'>;
export type OrderUpdate = Partial<OrderInsert>;

// Settings
export interface Setting {
  id: number;
  clave: string;
  valor: string | boolean | number | Record<string, any>;
  descripcion?: string;
  updated_at: string;
}

export type SettingInsert = Omit<Setting, 'id' | 'actualizada_en'>;
export type SettingUpdate = Partial<SettingInsert>;

// Cart
export interface CartItem {
  product_id?: string;
  id?: string;
  quantity?: number;
  cantidad?: number;
  precio: number;
  nombre: string;
  urls_imagenes?: string[];
  imagen?: string;
  stock?: number; // Stock disponible del producto
}

export interface Cart {
  items: CartItem[];
  total: number;
  itemCount: number;
}

// Admin User
export interface AdminUser {
  id: string;
  email: string;
  nombre: string;
  created_at: string;
  updated_at: string;
}
