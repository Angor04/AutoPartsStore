// src/components/islands/CartDisplay.tsx

import React, { useEffect, useState } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore, removeFromCart, updateCartItem, loadCart } from '@/stores/cart';
import { formatPrice } from '@/lib/utils';
import type { CartItem } from '@/types';

export default function CartDisplay() {
  const items = useStore(cartStore);
  const [cartItems, setCartItems] = useState<CartItem[]>([]);
  const [mounted, setMounted] = useState(false);
  const [messages, setMessages] = useState<Record<string, string>>({});

  useEffect(() => {
    // Al montar, cargar el carrito
    if (typeof window !== 'undefined') {
      loadCart().then(() => {
        console.log('Carrito cargado');
        setMounted(true);
      }).catch((err) => {
        console.error('Error cargando carrito:', err);
        setMounted(true);
      });
    } else {
      setMounted(true);
    }
  }, []);

  useEffect(() => {
    // Cuando cambian los items en el store, actualizar el state local
    setCartItems(Array.isArray(items) ? items : []);
  }, [items]);

  if (!mounted) {
    return <div className="text-center text-charcoal-500 py-8">Cargando carrito...</div>;
  }

  const total = cartItems.reduce((sum, item) => sum + (item.precio * item.quantity), 0);

  const handleRemove = (productId: string) => {
    removeFromCart(productId);
  };

  const handleQuantityChange = (productId: string, newQuantity: number) => {
    const item = cartItems.find(i => i.product_id === productId);
    const maxStock = item?.stock || 0;
    
    if (newQuantity > maxStock) {
      setMessages(prev => ({
        ...prev,
        [productId]: `No puedes añadir más de ${maxStock} unidades`
      }));
      setTimeout(() => {
        setMessages(prev => ({
          ...prev,
          [productId]: ''
        }));
      }, 2000);
      return;
    }
    
    if (newQuantity > 0) {
      updateCartItem(productId, newQuantity);
    } else {
      removeFromCart(productId);
    }
  };

  if (cartItems.length === 0) {
    return (
      <div className="text-center text-charcoal-500 py-8">
        <p>El carrito está vacío</p>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      {cartItems.map((item) => (
        <div key={item.product_id} className="flex gap-4 pb-4 border-b border-charcoal-100">
          {/* Imagen */}
          <div className="w-24 h-24 bg-gray-100 rounded-lg overflow-hidden flex-shrink-0">
            {item.urls_imagenes?.[0] ? (
              <img
                src={item.urls_imagenes[0]}
                alt={item.nombre}
                className="w-full h-full object-cover"
              />
            ) : (
              <div className="w-full h-full flex items-center justify-center text-charcoal-400">
                <svg className="w-8 h-8" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                </svg>
              </div>
            )}
          </div>

          {/* Detalles */}
          <div className="flex-1">
            <h4 className="font-medium text-charcoal-900 text-sm mb-1 line-clamp-2">
              {item.nombre}
            </h4>
            <p className="text-red-600 font-semibold mb-2">{formatPrice(item.precio)}</p>
            
            {/* Cantidad */}
            <div className="flex items-center gap-2 mb-2">
              <button
                onClick={() => handleQuantityChange(item.product_id, item.quantity - 1)}
                className="p-1 hover:bg-charcoal-100 rounded transition-colors"
                aria-label="Disminuir cantidad"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M20 12H4" />
                </svg>
              </button>
              <span className="px-2 py-1 bg-charcoal-100 rounded text-sm font-medium w-8 text-center">
                {item.quantity}
              </span>
              <button
                onClick={() => handleQuantityChange(item.product_id, item.quantity + 1)}
                disabled={item.quantity >= (item.stock || 0)}
                className="p-1 hover:bg-charcoal-100 rounded transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
                aria-label="Aumentar cantidad"
              >
                <svg className="w-4 h-4" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 4v16m8-8H4" />
                </svg>
              </button>
            </div>
            {messages[item.product_id] && (
              <p className="text-xs text-red-600 font-medium mb-2">{messages[item.product_id]}</p>
            )}

            {/* Subtotal */}
            <p className="text-sm text-charcoal-600">
              Subtotal: {formatPrice(item.precio * item.quantity)}
            </p>
          </div>

          {/* Eliminar */}
          <button
            onClick={() => handleRemove(item.product_id)}
            className="text-red-600 hover:text-red-700 transition-colors pt-1"
            aria-label="Eliminar del carrito"
          >
            <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
            </svg>
          </button>
        </div>
      ))}

      {/* Total */}
      <div className="pt-4 border-t border-charcoal-200">
        <div className="flex justify-between items-center">
          <span className="font-semibold text-charcoal-900">Total:</span>
          <span className="text-2xl font-bold text-red-600">{formatPrice(total)}</span>
        </div>
      </div>

      {/* Script para notificar cambios al carrito */}
      <script>
        {typeof window !== 'undefined' && window.dispatchEvent(new CustomEvent('cartUpdated'))}
      </script>
    </div>
  );
}
