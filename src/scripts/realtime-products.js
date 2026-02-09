
/**
 * Real-time Product Visibility Handler
 * Subscribes to Supabase changes on 'productos' table to hide/show products instantly.
 */

import { createClient } from 'https://esm.sh/@supabase/supabase-js@2';

const SUPABASE_URL = import.meta.env.PUBLIC_SUPABASE_URL;
const SUPABASE_KEY = import.meta.env.PUBLIC_SUPABASE_ANON_KEY;

if (SUPABASE_URL && SUPABASE_KEY) {
    const client = createClient(SUPABASE_URL, SUPABASE_KEY);

    console.log('[Realtime] Initializing product visibility listener...');

    const channel = client
        .channel('public:productos')
        .on(
            'postgres_changes',
            { event: 'UPDATE', schema: 'public', table: 'productos' },
            (payload) => {
                console.log('[Realtime] Product update received:', payload);
                const { new: newProduct } = payload;

                if (newProduct) {
                    handleProductUpdate(newProduct);
                }
            }
        )
        .subscribe((status) => {
            console.log('[Realtime] Subscription status:', status);
        });

    function handleProductUpdate(product) {
        // Find all elements representing this product
        // Selector for ProductCard container
        const cards = document.querySelectorAll(`[data-product-id="${product.id}"]`);

        cards.forEach(card => {
            if (product.activo === false) {
                // If inactive, hide it
                // We could remove it, but hiding is safer to avoid layout shifts if we want to animate
                // For now, simple removal or display:none
                card.style.display = 'none';
                console.log(`[Realtime] Hid inactive product ${product.id}`);
            } else {
                // If active, show it (if it was hidden)
                // Note: This only works if the element was ALREADY in the DOM and we just hid it.
                // It won't insert new products that weren't there on load.
                card.style.display = '';
                console.log(`[Realtime] Showed active product ${product.id}`);
            }
        });

        // Also handle the Product Detail page if we are on it
        // The detailed view might not have data-product-id on the body, 
        // but we can check the URL or a specific element
        if (window.location.pathname.includes(`/productos/${product.id}`) ||
            window.location.pathname.includes(`/productos/${product.slug}`)) {

            if (product.activo === false) {
                // Redirect or show a message?
                // For "real-time disappearance", maybe blur it or show a toast "Product no longer available"
                // Or just reload to trigger the 404/redirect logic
                alert('Este producto acaba de ser desactivado.');
                window.location.href = '/productos';
            }
        }
    }
} else {
    console.error('[Realtime] Missing Supabase credentials.');
}
