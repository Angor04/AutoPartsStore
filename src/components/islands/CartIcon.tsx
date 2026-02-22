// src/components/islands/CartIcon.tsx

import React, { useState, useEffect } from 'react';
import { useStore } from '@nanostores/react';
import { cartStore } from '@/stores/cart';

export default function CartIcon() {
  const items = useStore(cartStore);
  const [isOpen, setIsOpen] = useState(false);

  // Escuchar cambios en el carrito
  useEffect(() => {
    const handleCartCleared = () => {
      // El useStore ya se actualiza automáticamente
    };
    
    window.addEventListener('cart-cleared', handleCartCleared);
    
    return () => {
      window.removeEventListener('cart-cleared', handleCartCleared);
    };
  }, []);

  // Calcular el contador directamente del store
  const itemCount = Array.isArray(items) 
    ? items.reduce((sum: number, item: any) => sum + (item.quantity || 0), 0)
    : 0;


  const handleOpenCart = () => {
    if (typeof window !== 'undefined' && (window as any).openCart) {
      (window as any).openCart();
    }
  };

  return (
    <button
      onClick={handleOpenCart}
      className="relative p-2 text-charcoal-700 hover:text-navy-500 transition-colors"
      aria-label="Abrir carrito de compra"
      data-cart-count={itemCount}
    >
      <svg
        className="w-6 h-6"
        fill="none"
        stroke="currentColor"
        viewBox="0 0 24 24"
      >
        <path
          strokeLinecap="round"
          strokeLinejoin="round"
          strokeWidth={2}
          d="M16 11V7a4 4 0 00-8 0v4M5 9h14l1 12H4L5 9z"
        />
      </svg>

      {itemCount > 0 && (
        <span className="absolute -top-2 -right-2 inline-flex items-center justify-center px-2 py-1 text-xs font-bold leading-none text-white bg-red-600 rounded-full">
          {itemCount}
        </span>
      )}
    </button>
  );
}
