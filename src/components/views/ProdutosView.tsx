'use client';

import { useState } from 'react';
import { useAuth } from '@/hooks/useAuth';
import { useProducts } from '@/hooks/useProducts';
import {
    Package, Plus, Trash2, Edit2, Save, X, Loader2,
    HelpCircle, CheckCircle, AlertCircle
} from 'lucide-react';

export default function ProdutosView() {
    const { user } = useAuth();
    const { products, loading, createProduct, updateProduct, deleteProduct } = useProducts(user?.id);

    const [showForm, setShowForm] = useState(false);
    const [editingId, setEditingId] = useState<string | null>(null);
    const [formData, setFormData] = useState({
        external_id: '',
        name: '',
        description: '',
        target_audience: '',
        price: '',
    });
    const [submitting, setSubmitting] = useState(false);
    const [formError, setFormError] = useState('');

    const resetForm = () => {
        setFormData({
            external_id: '',
            name: '',
            description: '',
            target_audience: '',
            price: '',
        });
        setShowForm(false);
        setEditingId(null);
        setFormError('');
    };

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setFormError('');
        setSubmitting(true);

        try {
            if (!formData.external_id || !formData.name) {
                throw new Error('ID do Produto e Nome são obrigatórios');
            }

            const productData = {
                user_id: user!.id,
                external_id: formData.external_id,
                name: formData.name,
                description: formData.description || undefined,
                target_audience: formData.target_audience || undefined,
                price: formData.price ? parseFloat(formData.price) : undefined,
            };

            if (editingId) {
                await updateProduct(editingId, productData);
            } else {
                await createProduct(productData);
            }

            resetForm();
        } catch (error: any) {
            setFormError(error.message);
        } finally {
            setSubmitting(false);
        }
    };

    const handleEdit = (product: any) => {
        setEditingId(product.id);
        setFormData({
            external_id: product.external_id,
            name: product.name,
            description: product.description || '',
            target_audience: product.target_audience || '',
            price: product.price?.toString() || '',
        });
        setShowForm(true);
    };

    const handleDelete = async (id: string) => {
        if (confirm('Tem certeza que deseja excluir este produto?')) {
            try {
                await deleteProduct(id);
            } catch (error: any) {
                alert('Erro ao excluir produto: ' + error.message);
            }
        }
    };

    if (loading && products.length === 0) {
        return (
            <div className="min-h-[60vh] flex items-center justify-center">
                <Loader2 className="animate-spin text-purple-600" size={32} />
            </div>
        );
    }

    return (
        <div className="p-4 md:p-8 space-y-6 max-w-7xl mx-auto">
            {/* Header */}
            <div className="flex items-center justify-between">
                <div className="flex items-center gap-3">
                    <div className="bg-purple-100 p-3 rounded-xl">
                        <Package className="text-purple-600" size={24} />
                    </div>
                    <div>
                        <h1 className="text-2xl font-bold text-slate-900">Produtos</h1>
                        <p className="text-sm text-slate-500">Gerencie seus produtos e configure a gest de emails</p>
                    </div>
                </div>

                <button
                    onClick={() => setShowForm(true)}
                    className="bg-purple-600 hover:bg-purple-700 text-white px-4 py-2 rounded-lg flex items-center gap-2 font-medium transition-colors"
                >
                    <Plus size={18} />
                    Novo Produto
                </button>
            </div>

            {/* Form Modal */}
            {showForm && (
                <div className="fixed inset-0 bg-black/50 flex items-center justify-center z-50 p-4">
                    <div className="bg-white rounded-2xl shadow-2xl max-w-2xl w-full max-h-[90vh] overflow-y-auto">
                        <div className="p-6 border-b border-slate-200 flex items-center justify-between sticky top-0 bg-white">
                            <h2 className="text-xl font-bold text-slate-900">
                                {editingId ? 'Editar Produto' : 'Novo Produto'}
                            </h2>
                            <button onClick={resetForm} className="text-slate-400 hover:text-slate-600">
                                <X size={24} />
                            </button>
                        </div>

                        <form onSubmit={handleSubmit} className="p-6 space-y-4">
                            {formError && (
                                <div className="bg-red-50 border border-red-200 rounded-lg p-3 flex items-start gap-2">
                                    <AlertCircle className="text-red-600 shrink-0 mt-0.5" size={18} />
                                    <span className="text-sm text-red-700">{formError}</span>
                                </div>
                            )}

                            {/* External ID */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2 flex items-center gap-2">
                                    ID do Produto na Plataforma de Vendas
                                    <div className="group relative">
                                        <HelpCircle size={16} className="text-slate-400 cursor-help" />
                                        <div className="hidden group-hover:block absolute left-0 top-6 bg-slate-900 text-white text-xs rounded-lg p-3 w-64 z-10">
                                            <p className="font-bold mb-1">Onde encontrar o ID:</p>
                                            <p><strong>Kiwify:</strong> Vá em Produtos → clique no produto → copie o ID da URL</p>
                                            <p className="mt-1"><strong>Hotmart:</strong> Em Produtos, copie o código do produto</p>
                                        </div>
                                    </div>
                                </label>
                                <input
                                    type="text"
                                    value={formData.external_id}
                                    onChange={(e) => setFormData({ ...formData, external_id: e.target.value })}
                                    placeholder="Ex: prod_abc123"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
                                    required
                                    disabled={editingId !== null} // Cannot change external_id on edit
                                />
                            </div>

                            {/* Nome */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Nome do Produto *
                                </label>
                                <input
                                    type="text"
                                    value={formData.name}
                                    onChange={(e) => setFormData({ ...formData, name: e.target.value })}
                                    placeholder="Ex: Curso Completo de Excel"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
                                    required
                                />
                            </div>

                            {/* Descrição */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Descrição (Para IA)
                                </label>
                                <textarea
                                    value={formData.description}
                                    onChange={(e) => setFormData({ ...formData, description: e.target.value })}
                                    placeholder="Ex: Curso online que ensina Excel do básico ao avançado, com foco em fórmulas, tabelas dinâmicas e automação..."
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 min-h-[100px] text-slate-900 placeholder:text-slate-400"
                                    rows={4}
                                />
                                <p className="text-xs text-slate-500 mt-1">
                                    A IA usará esta descrição para dar respostas mais precisas aos leads
                                </p>
                            </div>

                            {/* Público-alvo */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Público-Alvo
                                </label>
                                <input
                                    type="text"
                                    value={formData.target_audience}
                                    onChange={(e) => setFormData({ ...formData, target_audience: e.target.value })}
                                    placeholder="Ex: Profissionais que trabalham com planilhas, analistas, gestores"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Preço */}
                            <div>
                                <label className="block text-sm font-bold text-slate-700 mb-2">
                                    Preço (R$)
                                </label>
                                <input
                                    type="number"
                                    step="0.01"
                                    value={formData.price}
                                    onChange={(e) => setFormData({ ...formData, price: e.target.value })}
                                    placeholder="Ex: 197.00"
                                    className="w-full px-4 py-2 border border-slate-300 rounded-lg focus:outline-none focus:ring-2 focus:ring-purple-500 text-slate-900 placeholder:text-slate-400"
                                />
                            </div>

                            {/* Actions */}
                            <div className="flex gap-3 pt-4">
                                <button
                                    type="submit"
                                    disabled={submitting}
                                    className="flex-1 bg-purple-600 hover:bg-purple-700 text-white py-2 rounded-lg font-medium flex items-center justify-center gap-2 disabled:opacity-50"
                                >
                                    {submitting ? (
                                        <>
                                            <Loader2 className="animate-spin" size={18} />
                                            Salvando...
                                        </>
                                    ) : (
                                        <>
                                            <Save size={18} />
                                            Salvar Produto
                                        </>
                                    )}
                                </button>
                                <button
                                    type="button"
                                    onClick={resetForm}
                                    className="px-6 border border-slate-300 hover:bg-slate-50 text-slate-700 py-2 rounded-lg font-medium transition-colors"
                                >
                                    Cancelar
                                </button>
                            </div>
                        </form>
                    </div>
                </div>
            )}

            {/* Products List */}
            {products.length === 0 ? (
                <div className="bg-slate-50 border-2 border-dashed border-slate-300 rounded-2xl p-12 text-center">
                    <Package className="mx-auto text-slate-300 mb-4" size={48} />
                    <h3 className="text-lg font-bold text-slate-700 mb-2">Nenhum produto cadastrado</h3>
                    <p className="text-sm text-slate-500 mb-4">
                        Cadastre seus produtos para começar a receber análises inteligentes de emails
                    </p>
                    <button
                        onClick={() => setShowForm(true)}
                        className="bg-purple-600 hover:bg-purple-700 text-white px-6 py-2 rounded-lg font-medium inline-flex items-center gap-2"
                    >
                        <Plus size={18} />
                        Cadastrar Primeiro Produto
                    </button>
                </div>
            ) : (
                <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
                    {products.map((product) => (
                        <div
                            key={product.id}
                            className="bg-white border border-slate-200 rounded-xl p-5 hover:shadow-md transition-shadow"
                        >
                            <div className="flex items-start justify-between mb-3">
                                <div className="flex-1">
                                    <h3 className="font-bold text-slate-900 text-lg mb-1">{product.name}</h3>
                                    <p className="text-xs text-slate-500 font-mono bg-slate-100 px-2 py-1 rounded inline-block">
                                        ID: {product.external_id}
                                    </p>
                                </div>
                            </div>

                            {product.description && (
                                <p className="text-sm text-slate-600 mb-3 line-clamp-2">{product.description}</p>
                            )}

                            {product.target_audience && (
                                <div className="text-xs text-slate-500 mb-3">
                                    <strong>Público:</strong> {product.target_audience}
                                </div>
                            )}

                            {product.price && (
                                <div className="text-sm font-bold text-green-600 mb-4">
                                    R$ {product.price.toFixed(2)}
                                </div>
                            )}

                            <div className="flex gap-2 pt-3 border-t border-slate-100">
                                <button
                                    onClick={() => handleEdit(product)}
                                    className="flex-1 text-blue-600 hover:bg-blue-50 border border-blue-200 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Edit2 size={14} />
                                    Editar
                                </button>
                                <button
                                    onClick={() => handleDelete(product.id)}
                                    className="flex-1 text-red-600 hover:bg-red-50 border border-red-200 py-1.5 rounded-lg text-sm font-medium flex items-center justify-center gap-1.5 transition-colors"
                                >
                                    <Trash2 size={14} />
                                    Excluir
                                </button>
                            </div>
                        </div>
                    ))}
                </div>
            )}
        </div>
    );
}
