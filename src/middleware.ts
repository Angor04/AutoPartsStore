// src/middleware.ts

import { defineMiddleware } from 'astro:middleware';
import { getSupabaseAdmin } from './lib/supabase';

export const onRequest = defineMiddleware(
  async (context, next) => {
    // Rutas que requieren autenticación de admin
    const protectedRoutes = ['/admin'];
    const secretLoginRoute = '/acceso-interno-privado';
    const oldLoginRoute = '/admin/login';

    // Obtener pathname de forma segura
    const pathname = new URL(context.request.url).pathname;

    // BLOQUEAR RUTA ANTIGUA POR SEGURIDAD
    if (pathname === oldLoginRoute) {
      return context.redirect('/');
    }

    const isProtectedRoute = protectedRoutes.some((route) =>
      pathname.startsWith(route) &&
      !pathname.startsWith(secretLoginRoute)
    );

    // Si es una ruta protegida
    if (isProtectedRoute) {
      // Obtener el token de sesión de Supabase
      const authToken = context.cookies.get('sb-auth-token')?.value;

      if (!authToken) {
        // No hay sesión, redirigir a la URL SECRETA de login
        return context.redirect(secretLoginRoute);
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
          context.cookies.delete('sb-auth-token');
          context.cookies.delete('sb-last-activity');
          return context.redirect(`/admin/login?error=${encodeURIComponent('Sesión expirada por inactividad')}`);
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

      // Obtener refresh token
      const refreshToken = context.cookies.get('sb-refresh-token')?.value;

      try {
        // Verificar que el usuario esté autenticado
        const supabaseAdmin = getSupabaseAdmin();

        let { data: { user }, error } = await supabaseAdmin.auth.getUser(authToken);

        // Si el token expiró pero tenemos refresh token, intentar renovar
        if ((error || !user) && refreshToken) {
          const { data: refreshData, error: refreshError } = await supabaseAdmin.auth.refreshSession({
            refresh_token: refreshToken,
          });

          if (!refreshError && refreshData.session) {
            user = refreshData.user;

            // Actualizar cookies con los nuevos tokens
            context.cookies.set('sb-auth-token', refreshData.session.access_token, {
              httpOnly: true,
              secure: true,
              sameSite: 'lax',
              path: '/',
            });

            if (refreshData.session.refresh_token) {
              context.cookies.set('sb-refresh-token', refreshData.session.refresh_token, {
                httpOnly: true,
                secure: true,
                sameSite: 'lax',
                maxAge: 60 * 60 * 24 * 30, // 30 días
                path: '/',
              });
            }
          } else {
            console.error('Error al refrescar sesión:', refreshError?.message);
          }
        }

        if (error && !user) { // Si falló el getUser inicial y también falló (o no se intentó) el refresh
          console.error('Token inválido y no se pudo refrescar:', error?.message);
          return context.redirect('/admin/login');
        }

        if (!user) {
          return context.redirect('/admin/login');
        }

        // DEBUG: Check environment and visibility
        const serviceKey = import.meta.env?.SUPABASE_SERVICE_ROLE_KEY || process.env.SUPABASE_SERVICE_ROLE_KEY;

        // Verificar que sea admin en la tabla admin_users
        const { data: adminUserData, error: adminError } = await (supabaseAdmin as any)
          .from('admin_users')
          .select('*')
          .eq('id', user.id)
          .limit(1)
          .maybeSingle();


        const adminUser = adminUserData as any;

        // AUTO-FIX / EMERGENCY BYPASS
        const isMasterAdmin = user.email === 'agonzalezcruces2004@gmail.com';

        if ((adminError || !adminUser) && !isMasterAdmin) {
          console.error('Usuario NO es admin (Middleware):', adminError?.message || 'No record found in admin_users');
          return context.redirect('/admin/login?error=NoAutorizado');
        }

        if (isMasterAdmin && (!adminUser || adminError)) {
          context.locals.admin = { id: user.id, email: user.email, nombre: 'Admin System', activo: true };
          context.locals.user = user;
          return next();
        }

        if (adminUser && !adminUser.activo) {
          console.error('Admin desactivado:', adminUser.email);
          return context.redirect('/admin/login?error=CuentaDesactivada');
        }

        context.locals.user = user;
        context.locals.admin = adminUser;

      } catch (error) {
        console.error('Error en middleware:', error);
        return context.redirect('/admin/login?error=' + encodeURIComponent('Error interno de middleware'));
      }
    } else {
      // console.log('Ruta no protegida:', pathname);
    }

    return next();
  }
);
