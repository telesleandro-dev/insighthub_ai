'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import {
    Users, UserPlus, Shield, Mail, Search,
    MoreVertical, CheckCircle, Loader2, X, AlertCircle
} from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function AdminUsersPage() {
    const router = useRouter();
    const [users, setUsers] = useState<any[]>([]);
    const [loading, setLoading] = useState(true);
    const [searchTerm, setSearchTerm] = useState('');

    // Invite Modal State
    const [isInviteOpen, setIsInviteOpen] = useState(false);
    const [inviteData, setInviteData] = useState({ name: '', email: '', handle: '' });
    const [inviteLoading, setInviteLoading] = useState(false);
    const [inviteError, setInviteError] = useState<string | null>(null);
    const [inviteSuccess, setInviteSuccess] = useState(false);

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
            // Handle format: add @insighthubai.com suffix automatically if missing, 
            // but let's assume the input is just the prefix for UX.
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
                    insighthub_email: fullHandle
                })
            });

            const data = await res.json();

            if (!res.ok) {
                throw new Error(data.error || 'Erro ao convidar usuário');
            }

            setInviteSuccess(true);
            fetchUsers(); // Refresh list
            setTimeout(() => {
                setIsInviteOpen(false);
                setInviteData({ name: '', email: '', handle: '' });
                setInviteSuccess(false);
            }, 2000);

        } catch (err: any) {
            setInviteError(err.message);
        } finally {
            setInviteLoading(false);
        }
    };

    const filteredUsers = users.filter(u =>
        u.name?.toLowerCase().includes(searchTerm.toLowerCase()) ||
        u.email?.toLowerCase().includes(searchTerm.toLowerCase())
    );

    return (
        <div className="min-h-screen bg-slate-50 p-8 font-sans">

            {/* Header */}
            <div className="max-w-6xl mx-auto flex flex-col md:flex-row justify-between items-start md:items-center gap-4 mb-8">
                <div>
                    <h1 className="text-2xl font-bold text-slate-900 flex items-center gap-2">
                        <Shield className="text-blue-600" /> Gestão de Usuários
                    </h1>
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
            <div className="max-w-6xl mx-auto bg-white rounded-2xl border border-slate-200 shadow-sm overflow-hidden">

                {/* Toolbar */}
                <div className="p-4 border-b border-slate-100 flex gap-4">
                    <div className="relative flex-1 max-w-md">
                        <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400" size={16} />
                        <input
                            type="text"
                            placeholder="Buscar por nome ou e-mail..."
                            className="w-full pl-10 pr-4 py-2 bg-slate-50 border border-slate-200 rounded-lg text-sm outline-none focus:ring-2 focus:ring-blue-100"
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
                                                    {user.name?.[0] || user.email[0].toUpperCase()}
                                                </div>
                                                <div>
                                                    <p className="text-sm font-bold text-slate-900">{user.name || 'Sem nome'}</p>
                                                    <p className="text-xs text-slate-500">{user.email}</p>
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
                                            <button className="text-slate-400 hover:text-slate-600 p-2 rounded-lg hover:bg-slate-100">
                                                <MoreVertical size={16} />
                                            </button>
                                        </td>
                                    </tr>
                                ))
                            )}
                        </tbody>
                    </table>
                </div>
            </div>

            {/* Invite Modal */}
            {isInviteOpen && (
                <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
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
                                        className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
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
                                            className="w-full pl-10 pr-4 py-2.5 bg-slate-50 border border-slate-200 rounded-xl text-sm outline-none focus:border-blue-500 transition-all"
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
                                            className="w-full px-4 py-2.5 bg-slate-50 border border-slate-200 rounded-l-xl text-sm outline-none focus:border-blue-500 transition-all text-right pr-1"
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
