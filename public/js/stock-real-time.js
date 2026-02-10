/**
 * Stock Real Time - Polling AGRESIVO cada 1 segundo
 * Mantiene sincronizado el stock con la BD sin recargar
 */

let productosActualesStockSync = {};
let stockPollingInterval = null;
let productIdsPendientesSync = new Set();
let ultimaActualizacion = {};

// Iniciar polling INMEDIATAMENTE
(function () {
    // Esperar un momento a que cargue el DOM y scripts principales
    setTimeout(() => {
        iniciarStockPolling();
    }, 500);
})();

function iniciarStockPolling() {
    console.log('[Stock Polling] ⚡ Iniciando sincronización AGRESIVA cada 1 segundo...');

    if (stockPollingInterval) {
        clearInterval(stockPollingInterval);
    }

    // Polling cada 1 segundo
    stockPollingInterval = setInterval(() => {
        if (productIdsPendientesSync.size > 0) {
            actualizarStockEnTiempoReal();
        }
    }, 1000);
}

function registrarProductosParaSync(productos) {
    if (!Array.isArray(productos)) return;

    productos.forEach(p => {
        if (!p.id) return;
        productosActualesStockSync[p.id] = p;
        productIdsPendientesSync.add(p.id);
        ultimaActualizacion[p.id] = p.stock;
    });

    console.log(`[Stock Polling] ✓ ${productIdsPendientesSync.size} productos registrados para sync`);

    // Primera actualización rápida
    actualizarStockEnTiempoReal();
}

async function actualizarStockEnTiempoReal() {
    if (productIdsPendientesSync.size === 0) return;

    try {
        const ids = Array.from(productIdsPendientesSync).join(',');

        // Agregar timestamp para evitar caché agresivo del navegador
        const timestamp = new Date().getTime();
        const response = await fetch(`/api/get-real-stock?ids=${ids}&_t=${timestamp}`, {
            method: 'GET',
            headers: {
                'Cache-Control': 'no-cache, no-store, must-revalidate',
                'Pragma': 'no-cache',
                'Expires': '0'
            }
        });

        if (!response.ok) return;

        const data = await response.json();
        if (!data.success || !data.stock) return;

        // Detectar cambios
        let cambiosDetectados = false;

        Object.entries(data.stock).forEach(([productId, stockInfo]) => {
            const idNum = parseInt(productId);
            // Referencia al objeto producto local (que puede estar siendo usado por otros scripts)
            const productoLocal = productosActualesStockSync[idNum];
            const ultimoStock = ultimaActualizacion[idNum];

            // Si el stock cambió respecto a nuestra última comprobación
            if (productoLocal && ultimoStock !== stockInfo.stock) {
                console.log(`[Stock Polling] 🔄 CAMBIO DETECTADO: ${stockInfo.nombre} (${ultimoStock} → ${stockInfo.stock})`);

                // Actualizar nuestro registro local
                productoLocal.stock = stockInfo.stock;
                ultimaActualizacion[idNum] = stockInfo.stock;
                cambiosDetectados = true;

                // Actualizar UI específica si existe
                actualizarBadgeUI(idNum, stockInfo.stock);
            }
        });

        // Disparar evento global por si otros componentes necesitan re-renderizar
        if (cambiosDetectados) {
            window.dispatchEvent(new CustomEvent('stock-updated', {
                detail: { stock: data.stock }
            }));
        }

    } catch (error) {
        console.warn('[Stock Polling] Warning:', error.message);
    }
}

function actualizarBadgeUI(id, stock) {
    // Buscar elementos en el DOM que muestren el stock de este producto
    // Se asume que tienen data-product-id="ID" y alguna clase específica
    const badgeElements = document.querySelectorAll(`.stock-badge[data-product-id="${id}"]`);

    badgeElements.forEach(el => {
        // Actualizar texto y clases según el nuevo stock
        if (stock === 0) {
            el.textContent = 'Agotado';
            el.className = 'stock-badge badge-agotado';
            el.style.backgroundColor = '#fee2e2';
            el.style.color = '#991b1b';
        } else if (stock <= 5) {
            el.textContent = `¡Solo quedan ${stock}!`;
            el.className = 'stock-badge badge-bajo';
            el.style.backgroundColor = '#fef3c7';
            el.style.color = '#92400e';
        } else {
            el.textContent = 'Disponible';
            el.className = 'stock-badge badge-stock';
            el.style.backgroundColor = '#dcfce7';
            el.style.color = '#166534';
        }
    });

    // También deshabilitar botones de compra si stock es 0
    const btnElements = document.querySelectorAll(`.btn-add-cart[data-product-id="${id}"]`);
    btnElements.forEach(btn => {
        if (stock === 0) {
            btn.disabled = true;
            btn.textContent = 'Agotado';
            btn.style.opacity = '0.5';
            btn.style.cursor = 'not-allowed';
        } else {
            btn.disabled = false;
            // Restaurar texto original si es posible, o poner uno genérico
            if (btn.textContent === 'Agotado') {
                btn.textContent = 'Añadir al Carrito';
                btn.style.opacity = '1';
                btn.style.cursor = 'pointer';
            }
        }
    });
}

function forzarActualizacionStock() {
    console.log('[Stock Polling] 🔁 Forzando actualización inmediata...');
    actualizarStockEnTiempoReal();
}

/**
 * Función global para agregar al carrito con validación de servidor
 */
async function validarYAgregarAlCarrito(producto) {
    if (!producto || !producto.id) return;

    try {
        console.log(`[Carrito] Validando stock para ${producto.nombre}...`);

        const response = await fetch('/api/add-to-cart-validated', {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({
                productId: producto.id,
                cantidad: 1
            })
        });

        const data = await response.json();

        if (!response.ok) {
            alert(data.error || 'No hay suficiente stock');
            // Forzar actualización para que se refleje el stock real
            forzarActualizacionStock();
            return;
        }

        // Si llegamos aquí, el servidor ya restó el stock
        // Ahora actualizamos el carrito local (localStorage) solo para persistencia cliente
        const cart = JSON.parse(localStorage.getItem('carrito') || '[]');
        const existingItem = cart.find(i => i.id === producto.id);

        if (existingItem) {
            existingItem.cantidad += 1;
        } else {
            cart.push({
                id: producto.id,
                nombre: producto.nombre,
                precio: producto.precio,
                precio_original: producto.precio_original,
                imagen: producto.urls_imagenes ? producto.urls_imagenes[0] : (producto.imagen || ''),
                cantidad: 1,
                timestamp: Date.now()
            });
        }

        localStorage.setItem('carrito', JSON.stringify(cart));

        // Disparar evento para actualizar contador del header
        window.dispatchEvent(new Event('storage'));

        // Actualizar UI local inmediatamente con los datos que nos devolvió el servidor
        if (data.producto && typeof data.producto.stockDisponible === 'number') {
            const p = productosActualesStockSync[producto.id];
            if (p) p.stock = data.producto.stockDisponible;
            ultimaActualizacion[producto.id] = data.producto.stockDisponible;
            actualizarBadgeUI(producto.id, data.producto.stockDisponible);
        }

        alert(data.mensaje || 'Agregado al carrito');

        // Forzar sync global por si acaso
        forzarActualizacionStock();

    } catch (error) {
        console.error('[Carrito] Error:', error);
        alert('Error al procesar la solicitud. Intenta nuevamente.');
    }
}

// Exponer funciones globales
window.registrarProductosParaSync = registrarProductosParaSync;
window.actualizarStockEnTiempoReal = actualizarStockEnTiempoReal;
window.forzarActualizacionStock = forzarActualizacionStock;
window.validarYAgregarAlCarrito = validarYAgregarAlCarrito;
