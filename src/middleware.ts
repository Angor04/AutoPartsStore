// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { getSupabaseAdmin } from './lib/supabase';

export const onRequest = defineMiddleware(
  async (context, next) => {
    // Rutas que requieren autenticación de admin
    const protectedRoutes = ['/admin'];
    const loginRoute = '/admin/login';

    // Obtener pathname de forma segura
    const pathname = new URL(context.request.url).pathname;

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route) &&
      !pathname.startsWith(loginRoute)
    );

    // Si es una ruta protegida
    if (isProtectedRoute) {
      // Obtener el token de sesión de Supabase
      const authToken = context.cookies.get('sb-auth-token')?.value;

      if (!authToken) {
        // No hay sesión, redirigir a login
        console.log('Sin token, redirigiendo a login');
        return context.redirect('/admin/login');
      }

      // Verificar inactividad de 1 hora
      const lastActivity = context.cookies.get('sb-last-activity')?.value;
      if (lastActivity) {
        const lastActivityTime = parseInt(lastActivity, 10);
        const now = new Date().getTime();
        const timeDiff = now - lastActivityTime;
        const oneHourMs = 60 * 60 * 1000;

        if (timeDiff > oneHourMs) {
          // Más de 1 hora sin actividad
          console.log('Sesión expirada por inactividad');
          context.cookies.delete('sb-auth-token');
          context.cookies.delete('sb-last-activity');
          return context.redirect('/admin/login?error=Sesi%F3n%20expirada%20por%20inactividad');
        }

        // Actualizar timestamp de última actividad
        const newTime = new Date().getTime().toString();
        context.cookies.set('sb-last-activity', newTime, {
          httpOnly: true,
          secure: true,
          sameSite: 'lax',
          path: '/',
        });
      }

      try {
        // Verificar que el usuario esté autenticado
        const supabaseAdmin = getSupabaseAdmin();

        const { data: { user }, error } = await supabaseAdmin.auth.getUser(authToken);

        if (error || !user) {
          console.error('Token inválido:', error?.message);
          return context.redirect('/admin/login');
        }

        console.log('Usuario autenticado:', user.email, user.id);

        // Verificar que sea admin en la tabla admin_users
        const { data: adminUserData, error: adminError } = await (supabaseAdmin as any)
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .single();

        const adminUser = adminUserData as any;
        if (adminError || !adminUser) {
          console.error('Usuario NO es admin:', adminError?.message);
          return context.redirect('/admin/login');
        }

        if (!adminUser.activo) {
          console.error('Admin desactivado');
          return context.redirect('/admin/login');
        }

        console.log('Admin verificado:', adminUser.email);

        context.locals.user = user;
        context.locals.admin = adminUser;

      } catch (error) {
        console.error('Error en middleware:', error);
        return context.redirect('/admin/login');
      }
    }

    return next();
  }
);
