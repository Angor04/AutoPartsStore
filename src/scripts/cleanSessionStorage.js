/**
 * Limpia el sessionStorage de datos innecesarios en nuevas sesiones
 * Se ejecuta inmediatamente antes de cargar Nanostores
 */

(function () {
  if (typeof window === 'undefined') return;

  try {
    // Verificar si esta es una nueva sesión (primera carga)
    const sessionKey = '__appmod_session_init__';
    const hasInitialized = sessionStorage.getItem(sessionKey);

    if (!hasInitialized) {
      // Primera carga de la sesión: limpiar carritos viejos
      const keys = Object.keys(sessionStorage);

      keys.forEach(key => {
        if (key.startsWith('cart-') && key !== `cart-${getNewSessionId()}`) {
          console.log('🧹 Limpiando carrito antiguo:', key);
          sessionStorage.removeItem(key);
        }
      });

      // Limpiar también localStorage de carritos viejos
      const localKeys = Object.keys(localStorage);
      localKeys.forEach(key => {
        if (key.startsWith('autopartsstore-cart')) {
          console.log('🧹 Limpiando carrito de localStorage:', key);
          localStorage.removeItem(key);
        }
      });

      // Marcar que ya se inicializó
      sessionStorage.setItem(sessionKey, 'true');
      console.log('Sesión inicializada - Carritos viejos limpiados');
    }
  } catch (e) {
    console.warn('Error limpiando sessionStorage:', e);
  }
})();

function getNewSessionId() {
  let sessionId = sessionStorage.getItem('guest-session-id');
  if (!sessionId) {
    sessionId = 'guest-' + Math.random().toString(36).substr(2, 9);
    sessionStorage.setItem('guest-session-id', sessionId);
  }
  return sessionId;
}
