// src/lib/utils.ts

/**
 * Formatea un precio decimal a formato legible (€)
 * @param price Cantidad en euros (ej: 119.99)
 * @returns String formateado (ej: "119,99 €")
 */
export function formatPrice(price: number): string {
  const formatted = Number(price || 0).toFixed(2);
  return `${formatted.replace('.', ',')} €`;
}

/**
 * Formatea un número con separadores de miles
 * @param num Número a formatear
 * @returns String formateado (ej: "1,234,567.89")
 */
export function formatNumber(num: number): string {
  return num.toLocaleString('es-ES', {
    minimumFractionDigits: 2,
    maximumFractionDigits: 2,
  });
}

/**
 * Convierte un string a un slug URL-safe
 * @param str String a convertir
 * @returns Slug URL-safe
 */
export function toSlug(str: string): string {
  return str
    .toLowerCase()
    .trim()
    .normalize('NFD')
    .replace(/[\u0300-\u036f]/g, '') // Remover acentos
    .replace(/[^\w\s-]/g, '') // Remover caracteres especiales
    .replace(/\s+/g, '-') // Espacios a guiones
    .replace(/-+/g, '-'); // Guiones múltiples a uno solo
}

/**
 * Calcula el total de un carrito
 * @param items Array de items del carrito
 * @returns Total real (sin conversiones)
 */
export function calculateCartTotal(items: { precio: number; quantity: number }[]): number {
  if (!Array.isArray(items)) return 0;
  const total = items.reduce((sum, item) => sum + (Number(item.precio) || 0) * (item.quantity || 0), 0);
  return Math.round(total * 100) / 100; // Redondear a 2 decimales para evitar problemas de coma flotante
}

/**
 * Obtiene el recuento total de items en el carrito
 * @param items Array de items del carrito
 * @returns Número total de items
 */
export function getCartItemCount(items: { quantity: number }[]): number {
  if (!Array.isArray(items)) return 0;
  return items.reduce((count, item) => count + (item.quantity || 0), 0);
}

/**
 * Valida un email
 * @param email Email a validar
 * @returns True si es válido
 */
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Formatea una fecha a string legible
 * @param date Fecha a formatear
 * @returns String formateado (ej: "15 de enero de 2025")
 */
export function formatDate(date: string | Date): string {
  const d = typeof date === 'string' ? new Date(date) : date;
  const options: Intl.DateTimeFormatOptions = {
    year: 'numeric',
    month: 'long',
    day: 'numeric',
  };
  return d.toLocaleDateString('es-ES', options);
}

/**
 * Obtiene el nombre de un archivo sin extensión
 * @param filename Nombre del archivo
 * @returns Nombre sin extensión
 */
export function getFileNameWithoutExtension(filename: string): string {
  return filename.substring(0, filename.lastIndexOf('.')) || filename;
}

/**
 * Obtiene la extensión de un archivo
 * @param filename Nombre del archivo
 * @returns Extensión del archivo
 */
export function getFileExtension(filename: string): string {
  return filename.substring(filename.lastIndexOf('.') + 1).toLowerCase();
}

/**
 * Debounce para funciones
 * @param func Función a ejecutar
 * @param delay Retardo en ms
 * @returns Función debounced
 */
export function debounce<T extends (...args: any[]) => any>(
  func: T,
  delay: number
): (...args: Parameters<T>) => void {
  let timeoutId: NodeJS.Timeout;

  return function (...args: Parameters<T>) {
    clearTimeout(timeoutId);
    timeoutId = setTimeout(() => func(...args), delay);
  };
}

/**
 * Trunca un string a una longitud máxima
 * @param str String a truncar
 * @param maxLength Longitud máxima
 * @param suffix Sufijo (por defecto "...")
 * @returns String truncado
 */
export function truncate(str: string, maxLength: number, suffix = '...'): string {
  if (str.length <= maxLength) return str;
  return str.substring(0, maxLength - suffix.length) + suffix;
}

/**
 * Genera un ID único
 * @returns ID único
 */
export function generateId(): string {
  return `${Date.now()}-${Math.random().toString(36).substring(2, 9)}`;
}

/**
 * Clasifica una url de imagen por su tamaño
 * @param imageUrl URL de la imagen
 * @param size Tamaño deseado (ej: "thumb", "medium", "large")
 * @returns URL transformada
 */
export function getImageUrl(
  imageUrl: string,
  size: 'thumb' | 'medium' | 'large' = 'medium'
): string {
  // Esta función puede ser extendida para usar un servicio de transformación de imágenes
  // Por ahora, retornamos la URL tal cual
  return imageUrl;
}
