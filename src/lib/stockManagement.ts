// src/lib/stockManagement.ts
// Funciones para gestionar stock usando RPCs

import { supabaseClient } from './supabase';
import type { UUID } from '@/types';

/**
 * 1. Verificar disponibilidad de producto
 * Retorna si hay stock suficiente y el stock actual
 */
export async function checkProductAvailability(
  productId: string | number,
  quantity: number
) {
  try {
    const { data, error } = await (supabaseClient as any).rpc(
      'check_product_availability',
      {
        p_product_id: productId,
        p_quantity: quantity,
      }
    );

    if (error) {
      console.error('Error checking availability:', error);
      return {
        available: false,
        currentStock: 0,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        available: false,
        currentStock: 0,
        error: 'Producto no encontrado',
      };
    }

    return {
      available: data[0].available,
      currentStock: data[0].current_stock,
      error: null,
    };
  } catch (err) {
    console.error('Error in checkProductAvailability:', err);
    return {
      available: false,
      currentStock: 0,
      error: 'Error al verificar stock',
    };
  }
}

/**
 * 2. Actualizar stock después de compra
 * Reduce el stock del producto y retorna el nuevo stock
 */
export async function updateStockAfterPurchase(
  productId: UUID | string,
  quantity: number
) {
  try {
    const { data, error } = await (supabaseClient as any).rpc(
      'update_stock_after_purchase',
      {
        p_product_id: productId,
        p_quantity: quantity,
      }
    );

    if (error) {
      console.error('Error updating stock:', error);
      return {
        success: false,
        newStock: 0,
        error: error.message,
      };
    }

    if (!data || data.length === 0) {
      return {
        success: false,
        newStock: 0,
        error: 'No hay respuesta de la base de datos',
      };
    }

    const result = data[0];

    return {
      success: result.success,
      newStock: result.new_stock,
      error: result.error_message || null,
    };
  } catch (err) {
    console.error('Error in updateStockAfterPurchase:', err);
    return {
      success: false,
      newStock: 0,
      error: 'Error al actualizar stock',
    };
  }
}

/**
 * 3. Obtener alertas de bajo stock (solo admin)
 * Retorna productos con stock bajo
 */
export async function getLowStockAlerts(threshold: number = 10) {
  try {
    const { data, error } = await (supabaseClient as any)
      .from('productos')
      .select('id, nombre, stock, urls_imagenes')
      .lt('stock', threshold)
      .gt('stock', 0)
      .eq('activo', true)
      .order('stock', { ascending: true });

    if (error) {
      console.error('Error getting low stock alerts:', error);
      return {
        alerts: [],
        error: error.message,
      };
    }

    return {
      alerts: data || [],
      error: null,
    };
  } catch (err) {
    console.error('Error in getLowStockAlerts:', err);
    return {
      alerts: [],
      error: 'Error al obtener alertas de stock bajo',
    };
  }
}
