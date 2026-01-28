'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users, UserPlus, Shield, Mail, Search,
    MoreVertical, CheckCircle, Loader2, X, AlertCircle,
    Trash2, Edit, Save
} from 'lucide-react';

import { useAuth } from '@/hooks/useAuth';

export default function AdminUsersView() {
    const { user: currentUser } = useAuth();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Invite Modal State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', handle: '', role: 'user' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);

    // Edit/Delete State
    // Removed openMenuId as we are using direct buttons
    const [editingUser, setEditingUser] = useState<any | null>(null);
    const [deletingUser, setDeletingUser] = useState<any | null>(null);
    const [actionLoading, setActionLoading] = useState(false);

    useEffect(() => {
        fetchUsers();
    }, []);

    const fetchUsers = async () => {
        try {
            const { data, error } = await supabase
                .from('profiles')
                .select('*')
                .order('created_at', { ascending: false });

            if (error) throw error;
            setUsers(data || []);
        } catch (err) {
            console.error('Error fetching users:', err);
        } finally {
            setLoading(false);
        }
    };

    const handleInvite = async (e: React.FormEvent) => {
        e.preventDefault();
        setInviteLoading(true);
        setInviteError(null);
        setInviteSuccess(false);

        try {
            const fullHandle = `${inviteData.handle.split('@')[0]}@insighthubai.com`;

            const res = await fetch('/api/admin/users/invite', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    email: inviteData.email,
                    name: inviteData.name,
                    insighthub_email: fullHandle,
                    role: inviteData.role
                })
            });

            let data;
            const contentType = res.headers.get("content-type");
            if (contentType && contentType.indexOf("application/json") !== -1) {
                data = await res.json();
            } else {
                const text = await res.text();
                throw new Error(text || `Erro do servidor (${res.status})`);
            }

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao convidar usuário');
            }

            setInviteSuccess(true);
            fetchUsers();
            setTimeout(() => {
                setIsInviteOpen(false);
                setInviteData({ name: '', email: '', handle: '', role: 'user' });
                setInviteSuccess(false);
            }, 2000);

        } catch (err: any) {
            console.error("Invite Error:", err);
            setInviteError(err.message || "Ocorreu um erro inesperado");
        } finally {
            setInviteLoading(false);
        }
    };

    // Actions
    const handleDeleteUser = async () => {
        if (!deletingUser) return;
        setActionLoading(true);
        try {
            const res = await fetch('/api/admin/users/delete', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({ userId: deletingUser.id })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao excluir usuário');
            }

            setUsers(prev => prev.filter(u => u.id !== deletingUser.id));
            setDeletingUser(null);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const handleUpdateUser = async (e: React.FormEvent) => {
        e.preventDefault();
        if (!editingUser) return;
        setActionLoading(true);

        try {
            const res = await fetch('/api/admin/users/update', {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json',
                    'Authorization': `Bearer ${(await supabase.auth.getSession()).data.session?.access_token}`
                },
                body: JSON.stringify({
                    userId: editingUser.id,
                    name: editingUser.name,
                    role: editingUser.role,
                    email: editingUser.email,
                    insighthub_email: editingUser.insighthub_email
                })
            });

            if (!res.ok) {
                const data = await res.json();
                throw new Error(data.error || 'Erro ao atualizar usuário');
            }

            setUsers(prev => prev.map(u => u.id === editingUser.id ? editingUser : u));
            setEditingUser(null);
        } catch (error: any) {
            alert(error.message);
        } finally {
            setActionLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="p-8 space-y-6 animate-in fade-in duration-500 bg-[#f8f9fc] min-h-full">
            {/* Header */}
            <div className="flex flex-col md:flex-row justify-between items-start md:items-center gap-4">
                <div>
                    <h2 className="text-2xl font-bold text-slate-900 tracking-tight flex items-center gap-2">
                        <Shield className="text-blue-600" /> Gestão de Usuários
                    </h2>
                    <p className="text-sm text-slate-500">Administre o acesso e permissões do InsightHub.</p>
                </div>
                <button
                    onClick={() => setIsInviteOpen(true)}
                    className="bg-blue-600 hover:bg-blue-700 text-white px-5 py-2.5 rounded-xl font-bold text-sm flex items-center gap-2 shadow-lg shadow-blue-600/20 active:scale-95 transition-all"
                >
                    <UserPlus size={18} /> Novo Usuário
                </button>
            </div>

            {/* Content */}
            <div className="bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">
                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100 text-slate-900"
                            value={searchTerm}
                            onChange={(e) => setSearchTerm(e.target.value)}
                        />
                    </div>
                </div>

                {/* Table */}
                <div className="overflow-x-auto">
                    <table className="w-full text-left">
                        <thead className="bg-slate-50 border-b border-slate-100">
                            <tr>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Usuário</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Perfil</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Handle InsightHub</th>
                                <th className="px-6 py-4 text-xs font-bold text-slate-500 uppercase tracking-wider">Status</th>
                                <th className="px-6 py-4 text-right"></th>
                            </tr>
                        </thead>
                        <tbody className="divide-y divide-slate-50">
                            {loading ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        <Loader2 className="animate-spin mx-auto mb-2" /> Carregando usuários...
                                    </td>
                                </tr>
                            ) : filteredUsers.length === 0 ? (
                                <tr>
                                    <td colSpan={5} className="p-8 text-center text-slate-500">
                                        Nenhum usuário encontrado.
                                    </td>
                                </tr>
                            ) : (
                                filteredUsers.map((user) => (
                                    <tr key={user.id} className="hover:bg-slate-50/50 transition-colors">
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-3">
                                                <div className="w-8 h-8 rounded-full bg-blue-100 text-blue-600 flex items-center justify-center font-bold text-xs">
                                                    {user.name?.[0] || user.email?.[0]?.toUpperCase() || '?'}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{user.name || 'Sem nome'}</p>
                                                    <p className="text-xs text-slate-500">{user.email || '-'}</p>
                                                </div>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4">
                                            <span className={`px-2 py-1 rounded-md text-[10px] font-bold uppercase tracking-wider ${user.role === 'admin'
                                                ? 'bg-purple-100 text-purple-700 border border-purple-200'
                                                : 'bg-slate-100 text-slate-600 border border-slate-200'
                                                }`}>
                                                {user.role}
                                            </span>
                                        </td>
                                        <td className="px-6 py-4">
                                            <code className="text-xs text-slate-600 bg-slate-50 px-2 py-1 rounded border border-slate-200 font-mono">
                                                {user.insighthub_email || '-'}
                                            </code>
                                        </td>
                                        <td className="px-6 py-4">
                                            <div className="flex items-center gap-1.5">
                                                <div className="w-2 h-2 rounded-full bg-emerald-500"></div>
                                                <span className="text-xs font-medium text-emerald-700">Ativo</span>
                                            </div>
                                        </td>
                                        <td className="px-6 py-4 text-right">
                                            <div className="flex items-center justify-end gap-2">
                                                <button
                                                    onClick={() => setEditingUser(user)}
                                                    className="text-slate-400 hover:text-blue-600 p-2 rounded-lg hover:bg-blue-50 transition-colors"
                                                    title="Editar Usuário"
                                                >
                                                    <Edit size={16} />
                                                </button>
                                                {currentUser?.id !== user.id && (
                                                    <button
                                                        onClick={() => setDeletingUser(user)}
                                                        className="text-slate-400 hover:text-red-600 p-2 rounded-lg hover:bg-red-50 transition-colors"
                                                        title="Excluir Usuário"
                                                    >
                                                        <Trash2 size={16} />
                                                    </button>
                                                )}
                                            </div>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Delete Confirmation Modal */}
            {deletingUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-sm w-full animate-in zoom-in-95">
                        <div className="w-12 h-12 bg-red-100 rounded-full flex items-center justify-center mx-auto text-red-600 mb-4">
                            <Trash2 size={24} />
                        </div>
                        <h3 className="text-lg font-bold text-center text-slate-900">Excluir Usuário?</h3>
                        <p className="text-sm text-center text-slate-500 mt-2 mb-6">
                            Tem certeza que deseja remover <b>{deletingUser.name}</b>? Essa ação não pode ser desfeita.
                        </p>
                        <div className="flex gap-3">
                            <button
                                onClick={() => setDeletingUser(null)}
                                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-slate-600 hover:bg-slate-100 transition-colors"
                            >
                                Cancelar
                            </button>
                            <button
                                onClick={handleDeleteUser}
                                disabled={actionLoading}
                                className="flex-1 py-2.5 rounded-xl font-bold text-xs text-white bg-red-600 hover:bg-red-700 transition-colors flex items-center justify-center gap-2"
                            >
                                {actionLoading ? <Loader2 size={14} className="animate-spin" /> : 'Sim, Excluir'}
                            </button>
                        </div>
                    </div>
                </div>
            )}

            {/* Edit User Modal */}
            {editingUser && (
                <div className="fixed inset-0 z-[70] flex items-center justify-center p-4 bg-slate-900/60 backdrop-blur-sm animate-in fade-in">
                    <div className="bg-white rounded-2xl shadow-2xl p-6 max-w-md w-full animate-in zoom-in-95">
                        <div className="flex justify-between items-center mb-6">
                            <h3 className="text-lg font-bold text-slate-900">Editar Usuário</h3>
                            <button onClick={() => setEditingUser(null)} className="text-slate-400 hover:text-slate-600">
                                <X size={20} />
                            </button>
                        </div>

                        <form onSubmit={handleUpdateUser} className="space-y-4">
                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Nome Completo</label>
                                <input
                                    type="text"
                                    value={editingUser.name || ''}
                                    onChange={e => setEditingUser({ ...editingUser, name: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">E-mail</label>
                                <input
                                    type="email"
                                    value={editingUser.email || ''}
                                    onChange={e => setEditingUser({ ...editingUser, email: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900"
                                />
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Função (Role)</label>
                                <select
                                    value={editingUser.role}
                                    onChange={e => setEditingUser({ ...editingUser, role: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 text-slate-900"
                                >
                                    <option value="user">Usuário</option>
                                    <option value="admin">Administrador</option>
                                </select>
                            </div>

                            <div>
                                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Controle InsightHub</label>
                                <input
                                    type="text"
                                    value={editingUser.insighthub_email || ''}
                                    onChange={e => setEditingUser({ ...editingUser, insighthub_email: e.target.value })}
                                    className="w-full px-4 py-2 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 font-mono text-slate-900"
                                />
                            </div>

                            <button
                                type="submit"
                                disabled={actionLoading}
                                className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3 rounded-xl flex items-center justify-center gap-2 mt-4"
                            >
                                {actionLoading ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                                <span>Salvar Alterações</span>
                            </button>
                        </form>
                    </div>
                </div>
            )}

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-[60] flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
                    <div className="bg-white w-full max-w-md rounded-2xl shadow-xl p-6 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
                        <button
                            onClick={() => setIsInviteOpen(false)}
                            className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
                        >
                            <X size={20} />
                        </button>

                        <h3 className="text-lg font-bold text-slate-900 mb-1">Convidar Novo Usuário</h3>
                        <p className="text-xs text-slate-500 mb-6">O usuário receberá um e-mail para definir a senha.</p>

                        {inviteSuccess ? (
                            <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-6 text-center space-y-3 animate-in fade-in">
                                <div className="w-12 h-12 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                    <CheckCircle size={24} />
                                </div>
                                <div>
                                    <h4 className="font-bold text-emerald-900">Convite Enviado!</h4>
                                    <p className="text-xs text-emerald-700 mt-1">O usuário já pode acessar o e-mail para configurar a conta.</p>
                                </div>
                            </div>
                        ) : (
                            <form onSubmit={handleInvite} className="space-y-4">
                                {inviteError && (
                                    <div className="bg-red-50 text-red-600 text-xs px-3 py-2 rounded-lg flex items-center gap-2">
                                        <AlertCircle size={14} /> {inviteError}
                                    </div>
                                )}

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Nome Completo</label>
                                    <input
                                        type="text"
                                        required
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-sans text-slate-900"
                                        placeholder="Ex: João Silva"
                                        value={inviteData.name}
                                        onChange={e => setInviteData({ ...inviteData, name: e.target.value })}
                                    />
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">E-mail Pessoal (Login)</label>
                                    <div className="relative">
                                        <Mail className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                                        <input
                                            type="email"
                                            required
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all font-sans text-slate-900"
                                            placeholder="joao@gmail.com"
                                            value={inviteData.email}
                                            onChange={e => setInviteData({ ...inviteData, email: e.target.value })}
                                        />
                                    </div>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Handle InsightHub</label>
                                    <div className="flex items-center">
                                        <input
                                            type="text"
                                            required
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl text-sm outline-none focus:border-blue-500 transition-all text-right pr-1 font-sans text-slate-900"
                                            placeholder="joao.suporte"
                                            value={inviteData.handle}
                                            onChange={e => setInviteData({ ...inviteData, handle: e.target.value })}
                                        />
                                        <div className="bg-slate-100 border border-l-0 border-slate-200 px-3 py-2.5 rounded-r-xl text-sm text-slate-500 font-medium">
                                            @insighthubai.com
                                        </div>
                                    </div>
                                    <p className="text-[10px] text-slate-400 ml-1">Usado para análise de inteligência.</p>
                                </div>

                                <div className="space-y-1">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">Função (Role)</label>
                                    <select
                                        value={inviteData.role}
                                        onChange={e => setInviteData({ ...inviteData, role: e.target.value })}
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all text-slate-900"
                                    >
                                        <option value="user">Usuário</option>
                                        <option value="admin">Administrador</option>
                                    </select>
                                    <p className="text-[10px] text-slate-400 ml-1">Administradores podem gerenciar usuários.</p>
                                </div>

                                <button
                                    type="submit"
                                    disabled={inviteLoading}
                                    className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2 mt-4"
                                >
                                    {inviteLoading ? <Loader2 size={18} className="animate-spin" /> : 'Enviar Convite'}
                                </button>
                            </form>
                        )}
                    </div>
                </div>
            )}
        </div>
    );
}
