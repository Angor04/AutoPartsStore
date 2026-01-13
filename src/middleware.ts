// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { supabaseClient } from './lib/supabase';

export const onRequest = defineMiddleware(
  async (context, next) => {
    // Rutas que requieren autenticación
    const protectedRoutes = ['/admin'];

    const isProtectedRoute = protectedRoutes.some((route) =>
      context.request.url.includes(route)
    );

    // Si es una ruta protegida
    if (isProtectedRoute) {
      // Aquí iría la verificación de sesión
      // Por ahora, permitimos el acceso para desarrollo
      // En producción, verificar el token de Supabase

      const authHeader = context.request.headers.get('authorization');

      if (!authHeader) {
        // Redirigir a login si no hay sesión
        if (!context.request.url.includes('/admin/login')) {
          return context.redirect('/admin/login');
        }
      }
    }

    return next();
  }
);
