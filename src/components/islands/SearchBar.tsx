
import React, { useState, useEffect, useRef } from 'react';
import { formatPrice } from '@/lib/utils';

interface SearchResult {
    id: number;
    nombre: string;
    precio: number;
    urls_imagenes: string[];
    categoria_id: number;
}

export default function SearchBar() {
    const [query, setQuery] = useState('');
    const [results, setResults] = useState<SearchResult[]>([]);
    const [isOpen, setIsOpen] = useState(false);
    const [isLoading, setIsLoading] = useState(false);
    const wrapperRef = useRef<HTMLDivElement>(null);

    useEffect(() => {
        const timer = setTimeout(async () => {
            if (query.trim().length >= 1) {
                setIsLoading(true);
                try {
                    const res = await fetch(`/api/search?q=${encodeURIComponent(query)}`);
                    if (res.ok) {
                        const data = await res.json();
                        setResults(Array.isArray(data) ? data : []);
                        setIsOpen(true);
                    }
                } catch (error) {
                    console.error('Search error:', error);
                    setResults([]);
                } finally {
                    setIsLoading(false);
                }
            } else {
                setResults([]);
                setIsOpen(false);
            }
        }, 300);

        return () => clearTimeout(timer);
    }, [query]);

    useEffect(() => {
        function handleClickOutside(event: MouseEvent) {
            if (wrapperRef.current && !wrapperRef.current.contains(event.target as Node)) {
                setIsOpen(false);
            }
        }
        document.addEventListener("mousedown", handleClickOutside);
        return () => document.removeEventListener("mousedown", handleClickOutside);
    }, [wrapperRef]);

    // Real-time updates for visibility
    useEffect(() => {
        const handleVisibilityChange = (event: CustomEvent) => {
            const { id, visible } = event.detail;
            console.log('[SearchBar] Visibility change:', id, visible);

            if (!visible) {
                setResults(prev => prev.filter(p => p.id !== id));
            } else {
                // Determine if we should re-fetch to include it? 
                // Only if query matches? 
                // For now, simple re-trigger next debounce if query exists
                // Or just ignore "show" since hiding is the priority.
            }
        };

        window.addEventListener('product-visibility-change', handleVisibilityChange as any);
        return () => window.removeEventListener('product-visibility-change', handleVisibilityChange as any);
    }, []);

    return (
        <div ref={wrapperRef} className="w-full relative">
            <form action="/productos" method="get" className="relative">
                <input
                    type="text"
                    name="q"
                    value={query}
                    onInput={(e) => setQuery((e.target as HTMLInputElement).value)}
                    placeholder="Buscar recambios..."
                    className="w-full px-4 py-2 border border-charcoal-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-red-500"
                    autoComplete="off"
                />
                <button type="submit" className="absolute right-3 top-1/2 transform -translate-y-1/2 text-charcoal-400 hover:text-red-600">
                    <svg className="w-5 h-5" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                        <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M21 21l-6-6m2-5a7 7 0 11-14 0 7 7 0 0114 0z" />
                    </svg>
                </button>
            </form>

            {isOpen && (
                <div className="absolute top-full left-0 right-0 bg-white shadow-xl rounded-lg border border-charcoal-100 mt-2 z-50 overflow-hidden max-h-96 overflow-y-auto">
                    {isLoading ? (
                        <div className="p-4 text-center text-charcoal-500 text-sm">Buscando...</div>
                    ) : results.length > 0 ? (
                        <>
                            {results.map((product) => (
                                <a
                                    href={`/productos/${product.id}`}
                                    key={product.id}
                                    className="flex items-center gap-3 px-4 py-3 hover:bg-gray-50 border-b border-gray-100 last:border-0 transition-colors"
                                    onClick={() => setIsOpen(false)}
                                >
                                    {product.urls_imagenes && product.urls_imagenes[0] ? (
                                        <img src={product.urls_imagenes[0]} alt={product.nombre} className="w-12 h-12 object-cover rounded bg-gray-100" />
                                    ) : (
                                        <div className="w-12 h-12 bg-gray-100 rounded flex items-center justify-center text-gray-400">
                                            <svg className="w-6 h-6" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                                                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth="2" d="M4 16l4.586-4.586a2 2 0 012.828 0L16 16m-2-2l1.586-1.586a2 2 0 012.828 0L20 14m-6-6h.01M6 20h12a2 2 0 002-2V6a2 2 0 00-2-2H6a2 2 0 00-2 2v12a2 2 0 002 2z" />
                                            </svg>
                                        </div>
                                    )}
                                    <div>
                                        <p className="text-sm font-medium text-charcoal-900 line-clamp-1">{product.nombre}</p>
                                        <p className="text-sm text-red-600 font-bold">{formatPrice(product.precio)}</p>
                                    </div>
                                </a>
                            ))}
                            <a
                                href={`/productos?q=${encodeURIComponent(query)}`}
                                className="block px-4 py-2 bg-gray-50 text-center text-xs font-medium text-charcoal-600 hover:text-red-600 hover:bg-gray-100 transition-colors"
                            >
                                Ver todos los resultados
                            </a>
                        </>
                    ) : (
                        <div className="p-4 text-center text-charcoal-500 text-sm">
                            No se encontraron productos que empiecen por "{query}"
                        </div>
                    )}
                </div>
            )}
        </div>
    );
}
