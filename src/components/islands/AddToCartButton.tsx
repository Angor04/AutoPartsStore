// src/components/islands/AddToCartButton.tsx

import React, { useState } from 'react';
import { addToCart, getItemQuantity } from '@/stores/cart';
import { useStore } from '@nanostores/react';
import { cartStore } from '@/stores/cart';
import type { CartItem } from '@/types';

interface AddToCartButtonProps {
  productId: string | number;
  productName: string;
  price: number;
  imageUrl: string;
  stock: number;
}

export default function AddToCartButton({
  productId,
  productName,
  price,
  imageUrl,
  stock,
}: AddToCartButtonProps) {
  const items = useStore(cartStore);
  const [quantity, setQuantity] = useState(1);
  const [isAdded, setIsAdded] = useState(false);
  const [message, setMessage] = useState('');

  // Asegurar que items es un array
  const itemsArray = Array.isArray(items) ? items : [];
  const currentQuantity = getItemQuantity(productId, itemsArray);
  const maxAddable = Math.max(0, stock - currentQuantity);
  const isInStock = maxAddable > 0;

  const handleAddToCart = () => {
    if (!isInStock) {
      setMessage('No hay stock disponible');
      return;
    }

    if (quantity > maxAddable) {
      setMessage(`Solo hay ${maxAddable} unidades disponibles`);
      return;
    }

    const cartItem: CartItem = {
      product_id: String(productId),
      quantity,
      precio: price,
      nombre: productName,
      urls_imagenes: [imageUrl],
      stock, // Guardar el stock disponible
    };

    console.log("Agregando al carrito:", cartItem);
    addToCart(cartItem);
    setIsAdded(true);
    setMessage(`${quantity} ${quantity === 1 ? 'artículo' : 'artículos'} añadido al carrito`);

    // Disparar evento para actualizar el carrito en todos lados
    if (typeof window !== 'undefined') {
      console.log("Disparando evento cartUpdated");
      window.dispatchEvent(new CustomEvent('cartUpdated'));
      
      // Log del sessionStorage
      const stored = sessionStorage.getItem('autopartsstore-cart');
      console.log("Contenido del sessionStorage:", stored);
    }

    setTimeout(() => {
      setIsAdded(false);
      setMessage('');
      setQuantity(1);
    }, 2000);
  };

  const handleIncrement = () => {
    if (quantity < maxAddable) {
      setQuantity(quantity + 1);
    } else {
      setMessage(`No puedes añadir más de ${maxAddable} unidades`);
      setTimeout(() => setMessage(''), 2000);
    }
  };

  const handleDecrement = () => {
    if (quantity > 1) {
      setQuantity(quantity - 1);
    }
  };

  return (
    <div className="space-y-4">
      {/* Quantity Selector */}
      <div className="flex items-center gap-4">
        <span className="text-sm font-medium text-charcoal-700">Cantidad:</span>
        <div className="flex items-center border border-charcoal-300 rounded-lg">
          <button
            onClick={handleDecrement}
            disabled={quantity <= 1 || !isInStock}
            className="p-2 hover:bg-charcoal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Disminuir cantidad"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M20 12H4"
              />
            </svg>
          </button>

          <span className="px-4 py-2 font-semibold text-charcoal-900 min-w-[3rem] text-center">
            {quantity}
          </span>

          <button
            onClick={handleIncrement}
            disabled={quantity >= maxAddable || !isInStock}
            className="p-2 hover:bg-charcoal-100 disabled:opacity-50 disabled:cursor-not-allowed transition-colors"
            aria-label="Aumentar cantidad"
          >
            <svg
              className="w-4 h-4"
              fill="none"
              stroke="currentColor"
              viewBox="0 0 24 24"
            >
              <path
                strokeLinecap="round"
                strokeLinejoin="round"
                strokeWidth={2}
                d="M12 4v16m8-8H4"
              />
            </svg>
          </button>
        </div>
      </div>

      {/* Stock Info */}
      {isInStock && (
        <p className="text-xs text-charcoal-500">
          Disponible: {maxAddable} {maxAddable === 1 ? 'unidad' : 'unidades'}
        </p>
      )}

      {/* Add to Cart Button */}
      <button
        onClick={handleAddToCart}
        disabled={!isInStock}
        className={`w-full py-3 px-4 rounded-lg font-medium transition-all duration-200 ${
          isAdded
            ? 'bg-green-500 text-white'
            : isInStock
              ? 'bg-navy-500 text-white hover:bg-navy-600 active:bg-navy-700'
              : 'bg-charcoal-300 text-charcoal-600 cursor-not-allowed'
        }`}
      >
        {isInStock ? (
          <>
            {isAdded ? '✓ Añadido' : 'Añadir al Carrito'}
          </>
        ) : (
          'Agotado'
        )}
      </button>

      {/* Message */}
      {message && (
        <p
          className={`text-sm text-center font-medium ${
            isAdded ? 'text-green-600' : 'text-red-600'
          }`}
        >
          {message}
        </p>
      )}
    </div>
  );
}
