// src/components/islands/CartSummary.tsx
// Componente React para mostrar el resumen del carrito

import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, loadCart } from '@/stores/cart';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

export default function CartSummary() {
  const items = useStore(cartStore);
  const [mounted, setMounted] = useState(false);

  useEffect(() => {
    // Al montar, cargar el carrito
    if (typeof window !== 'undefined') {
      loadCart().then(() => {
        setMounted(true);
      }).catch(() => {
        setMounted(true);
      });
    } else {
      setMounted(true);
    }
  }, []);

  const cartItems = Array.isArray(items) ? items : [];
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);
  const subtotal = cartItems.reduce((sum, item) => sum + ((item.precio || 0) * (item.quantity || 0)), 0);

  if (!mounted) {
    return (
      <div className="bg-white rounded-lg shadow-sm p-8 h-fit sticky top-24">
        <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">Resumen</h2>
        <div className="text-center text-charcoal-500 py-4">Cargando...</div>
      </div>
    );
  }

  return (
    <div className="bg-white rounded-lg shadow-sm p-8 h-fit sticky top-24">
      <h2 className="text-xl font-serif font-bold text-charcoal-900 mb-6">Resumen</h2>

      <div className="space-y-4 mb-6">
        <div className="flex justify-between text-charcoal-700">
          <span>Subtotal:</span>
          <span className="font-semibold">{formatPrice(subtotal)}</span>
        </div>
        <div className="flex justify-between text-charcoal-700">
          <span>Envío:</span>
          <span className="font-semibold">{subtotal >= 50 ? 'Gratis' : '4,99 €'}</span>
        </div>
        <div className="flex justify-between text-charcoal-700">
          <span>Impuestos:</span>
          <span className="font-semibold">Incluidos</span>
        </div>
      </div>

      <div className="border-t border-charcoal-100 pt-4 mb-6">
        <div className="flex justify-between text-lg">
          <span className="font-bold text-charcoal-900">Total:</span>
          <span className="font-bold text-red-600">
            {formatPrice(subtotal >= 50 ? subtotal : subtotal + 4.99)}
          </span>
        </div>
      </div>

      <a 
        href="/checkout" 
        className="block w-full bg-red-600 hover:bg-red-700 text-white text-center py-3 rounded-lg font-medium transition-colors mb-3"
      >
        Proceder al Pago
      </a>

      <a 
        href="/productos" 
        className="block w-full text-red-600 hover:text-red-700 text-center py-3 font-medium transition-colors"
      >
        Continuar Comprando
      </a>
    </div>
  );
}

// Componente para el contador de productos
export function CartItemCount() {
  const items = useStore(cartStore);
  const cartItems = Array.isArray(items) ? items : [];
  const itemCount = cartItems.reduce((sum, item) => sum + (item.quantity || 0), 0);

  return (
    <span className="bg-red-100 text-red-700 px-4 py-2 rounded-lg font-semibold text-sm">
      {itemCount} {itemCount === 1 ? 'producto' : 'productos'}
    </span>
  );
}
