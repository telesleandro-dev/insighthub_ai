import { useState, useEffect } from 'react';

export interface Product {
    id: string;
    user_id: string;
    external_id: string;
    name: string;
    description?: string;
    target_audience?: string;
    price?: number;
    currency?: string;
    created_at: string;
    updated_at: string;
}

export function useProducts(userId?: string) {
    const [products, setProducts] = useState<Product[]>([]);
    const [loading, setLoading] = useState(true);
    const [error, setError] = useState<string | null>(null);

    const fetchProducts = async () => {
        if (!userId) {
            setLoading(false);
            return;
        }

        try {
            setLoading(true);
            const response = await fetch(`/api/products?user_id=${userId}`);
            const data = await response.json();

            if (!response.ok) throw new Error(data.error);

            setProducts(data.products || []);
            setError(null);
        } catch (err: any) {
            setError(err.message);
            setProducts([]);
        } finally {
            setLoading(false);
        }
    };

    useEffect(() => {
        fetchProducts();
    }, [userId]);

    const createProduct = async (productData: Omit<Product, 'id' | 'created_at' | 'updated_at'>) => {
        try {
            const response = await fetch('/api/products', {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(productData),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            await fetchProducts(); // Refresh list
            return data.product;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const updateProduct = async (id: string, updates: Partial<Product>) => {
        try {
            const response = await fetch('/api/products', {
                method: 'PUT',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ id, user_id: userId, ...updates }),
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            await fetchProducts();
            return data.product;
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    const deleteProduct = async (id: string) => {
        try {
            const response = await fetch(`/api/products?id=${id}&user_id=${userId}`, {
                method: 'DELETE',
            });

            const data = await response.json();
            if (!response.ok) throw new Error(data.error);

            await fetchProducts();
        } catch (err: any) {
            throw new Error(err.message);
        }
    };

    return {
        products,
        loading,
        error,
        fetchProducts,
        createProduct,
        updateProduct,
        deleteProduct,
    };
}
