'use client';

import { useState, useEffect } from 'react';
import { supabase } from '@/lib/supabase';
import { useRouter } from 'next/navigation';
import { Eye, EyeOff, Lock, CheckCircle, Loader2, AlertCircle, BrainCircuit } from 'lucide-react';
import { useAuth } from '@/hooks/useAuth';

export default function DefinirSenhaPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const [password, setPassword] = useState('');
    const [confirmPassword, setConfirmPassword] = useState('');
    const [showPassword, setShowPassword] = useState(false);
    const [loading, setLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);
    const [success, setSuccess] = useState(false);

    // Check if user is authenticated after auth completes loading
    useEffect(() => {
        if (!authLoading && !user) {
            console.error('❌ [DEFINIR SENHA] Usuário não autenticado');
            setError('Sessão não encontrada. Por favor, clique novamente no link enviado por e-mail.');
        } else if (user) {
            console.log('✅ [DEFINIR SENHA] Usuário autenticado:', user.email);
        }
    }, [authLoading, user]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError(null);

        if (!user) {
            setError('Você precisa estar autenticado. Clique novamente no link do e-mail.');
            return;
        }

        if (password.length < 6) {
            setError('A senha deve ter pelo menos 6 caracteres.');
            return;
        }

        if (password !== confirmPassword) {
            setError('As senhas não coincidem.');
            return;
        }

        setLoading(true);

        try {
            const { error } = await supabase.auth.updateUser({
                password: password
            });

            if (error) throw error;

            setSuccess(true);
            setTimeout(() => {
                router.push('/dashboard');
            }, 3000);

        } catch (err: any) {
            setError(err.message || 'Erro ao atualizar senha.');
        } finally {
            setLoading(false);
        }
    };

    if (authLoading) {
        return (
            <div className="min-h-screen bg-[#020617] flex items-center justify-center">
                <Loader2 className="animate-spin text-blue-600" size={48} />
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-[#020617] flex items-center justify-center p-4 font-sans">
            <div className="w-full max-w-md">
                {/* Logo */}
                <div className="flex items-center justify-center gap-3 mb-8 animate-in fade-in slide-in-from-top-4 duration-700">
                    <div className="bg-blue-600 p-2.5 rounded-xl shadow-lg shadow-blue-600/20">
                        <BrainCircuit size={32} className="text-white" />
                    </div>
                    <span className="text-2xl font-black italic text-white tracking-tighter">InsightHub <span className="text-blue-500">AI</span></span>
                </div>

                <div className="bg-white rounded-3xl shadow-2xl overflow-hidden border border-slate-200 animate-in fade-in zoom-in-95 duration-500">
                    <div className="p-8">
                        <h1 className="text-2xl font-bold text-slate-900 mb-2">Configurar sua Senha</h1>
                        <p className="text-sm text-slate-500 mb-8">Defina uma senha segura para acessar sua conta no InsightHub.</p>

                        {success ? (
                            <div className="py-8 text-center space-y-4 animate-in fade-in zoom-in-95">
                                <div className="w-16 h-16 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                                    <CheckCircle size={32} />
                                </div>
                                <div>
                                    <h2 className="text-xl font-bold text-slate-900">Senha Definida!</h2>
                                    <p className="text-sm text-slate-500 mt-2">Sua conta está pronta. Redirecionando para o dashboard...</p>
                                </div>
                                <Loader2 className="animate-spin mx-auto text-blue-600 mt-4" size={24} />
                            </div>
                        ) : (
                            <form onSubmit={handleSubmit} className="space-y-6">
                                {error && (
                                    <div className="bg-red-50 text-red-600 text-xs px-4 py-3 rounded-xl flex items-center gap-3 border border-red-100 animate-in shake-1">
                                        <AlertCircle size={18} />
                                        <span>{error}</span>
                                    </div>
                                )}

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Nova Senha</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={password}
                                            onChange={(e) => setPassword(e.target.value)}
                                            className="w-full pl-12 pr-12 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900"
                                            placeholder="••••••••"
                                        />
                                        <button
                                            type="button"
                                            onClick={() => setShowPassword(!showPassword)}
                                            className="absolute right-4 top-1/2 -translate-y-1/2 text-slate-400 hover:text-slate-600 transition-colors"
                                        >
                                            {showPassword ? <EyeOff size={18} /> : <Eye size={18} />}
                                        </button>
                                    </div>
                                </div>

                                <div className="space-y-2">
                                    <label className="text-xs font-bold text-slate-700 uppercase tracking-widest ml-1">Confirmar Senha</label>
                                    <div className="relative">
                                        <div className="absolute left-4 top-1/2 -translate-y-1/2 text-slate-400">
                                            <Lock size={18} />
                                        </div>
                                        <input
                                            type={showPassword ? 'text' : 'password'}
                                            required
                                            value={confirmPassword}
                                            onChange={(e) => setConfirmPassword(e.target.value)}
                                            className="w-full pl-12 pr-4 py-3.5 bg-slate-50 border border-slate-200 rounded-2xl outline-none focus:border-blue-500 focus:ring-4 focus:ring-blue-500/5 transition-all text-slate-900"
                                            placeholder="••••••••"
                                        />
                                    </div>
                                </div>

                                <button
                                    type="submit"
                                    disabled={loading}
                                    className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-4 rounded-2xl shadow-lg shadow-blue-600/30 transition-all flex items-center justify-center gap-3 active:scale-[0.98] disabled:opacity-50"
                                >
                                    {loading ? (
                                        <>
                                            <Loader2 size={20} className="animate-spin" />
                                            <span>Salvando...</span>
                                        </>
                                    ) : (
                                        <span>Confirmar Nova Senha</span>
                                    )}
                                </button>
                            </form>
                        )}
                    </div>

                    <div className="bg-slate-50 p-6 text-center border-t border-slate-100">
                        <p className="text-xs text-slate-500">
                            Ao definir sua senha, você aceita nossos <span className="text-blue-600 font-bold cursor-pointer underline">Termos de Uso</span>.
                        </p>
                    </div>
                </div>
            </div>
        </div>
    );
}
