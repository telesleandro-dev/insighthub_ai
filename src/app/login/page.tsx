'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';
import { Lock, Mail, ArrowRight, Loader2, AlertCircle, CheckCircle, X } from 'lucide-react';

export default function LoginPage() {
  const router = useRouter();
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Forgot Password States
  const [isForgotModalOpen, setIsForgotModalOpen] = useState(false);
  const [forgotEmail, setForgotEmail] = useState('');
  const [forgotLoading, setForgotLoading] = useState(false);
  const [forgotMessage, setForgotMessage] = useState<string | null>(null);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    console.log('Tentando login com:', email);
    setLoading(true);
    setError(null);
    try {
      const { data, error } = await supabase.auth.signInWithPassword({
        email,
        password,
      });

      if (error) {
        console.error('Erro retornado pelo Supabase:', error.message);
        throw error;
      }

      console.log('Login bem sucedido! Dados:', data);

      // Login successful, redirect to dashboard
      console.log('Redirecionando para /dashboard...');
      router.push('/dashboard');
    } catch (err: any) {
      console.error('Erro capturado no catch:', err);
      setError('E-mail ou senha incorretos. Tente novamente.');
    } finally {
      console.log('Finalizando processo de login.');
      setLoading(false);
    }
  };

  const handleForgotPassword = async (e: React.FormEvent) => {
    e.preventDefault();
    setForgotLoading(true);
    setForgotMessage(null);

    try {
      // MVP: Always show success message to prevent user enumeration, 
      // but actually trigger the reset if email exists.
      const { error } = await supabase.auth.resetPasswordForEmail(forgotEmail, {
        redirectTo: `${window.location.origin}/auth/callback?next=/update-password`,
      });

      // We don't throw error here to keep the "friendly" message always visible
      // unless it's a critical network error.
      if (error) console.error("Reset error:", error);

      setForgotMessage('Se o e-mail estiver cadastrado, enviaremos um link para redefinir sua senha em instantes.');
    } catch (err) {
      setForgotMessage('Ocorreu um erro ao tentar enviar. Tente novamente mais tarde.');
    } finally {
      setForgotLoading(false);
    }
  };

  return (
    <div className="min-h-screen bg-slate-50 flex flex-col items-center justify-center p-4">

      {/* Brand / Logo Area */}
      <div className="mb-8 text-center animate-in fade-in slide-in-from-bottom-4 duration-500">
        <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-600 text-white shadow-lg shadow-blue-600/20 mb-4">
          <Lock size={24} />
        </div>
        <h1 className="text-2xl font-bold text-slate-900 tracking-tight">InsightHub</h1>
        <p className="text-sm text-slate-500 mt-1">Acesso administrativo</p>
      </div>

      {/* Login Card */}
      <div className="w-full max-w-md bg-white rounded-2xl shadow-xl shadow-slate-200/50 border border-slate-100 overflow-hidden animate-in fade-in zoom-in-95 duration-500 delay-100">
        <div className="p-8">
          <form onSubmit={handleLogin} className="space-y-5">

            {error && (
              <div className="bg-red-50 text-red-600 text-xs font-bold px-4 py-3 rounded-lg flex items-center gap-2 animate-in fade-in slide-in-from-top-2">
                <AlertCircle size={14} />
                {error}
              </div>
            )}

            <div className="space-y-1.5">
              <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">E-mail</label>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Mail size={16} />
                </div>
                <input
                  type="email"
                  value={email}
                  onChange={(e) => setEmail(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="seu@email.com"
                  required
                />
              </div>
            </div>

            <div className="space-y-1.5">
              <div className="flex justify-between items-center ml-1">
                <label className="text-xs font-bold text-slate-700 uppercase tracking-wider">Senha</label>
                <button
                  type="button"
                  onClick={() => setIsForgotModalOpen(true)}
                  className="text-xs font-semibold text-blue-600 hover:text-blue-700 hover:underline"
                >
                  Esqueceu sua senha?
                </button>
              </div>
              <div className="relative">
                <div className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-400">
                  <Lock size={16} />
                </div>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full pl-10 pr-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 placeholder:text-slate-400 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                  placeholder="••••••••"
                  required
                />
              </div>
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full bg-blue-600 hover:bg-blue-700 text-white font-bold py-3.5 rounded-xl shadow-lg shadow-blue-600/20 active:scale-[0.98] transition-all flex items-center justify-center gap-2"
            >
              {loading ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <>
                  Entrar no Dashboard <ArrowRight size={18} />
                </>
              )}
            </button>

          </form>
        </div>

        <div className="bg-slate-50 px-8 py-4 border-t border-slate-100 text-center">
          <p className="text-xs text-slate-500 font-medium">
            O acesso ao InsightHub é feito apenas por convite.
          </p>
        </div>
      </div>

      {/* Forgot Password Modal */}
      {isForgotModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-slate-900/40 backdrop-blur-sm animate-in fade-in duration-200">
          <div className="bg-white w-full max-w-sm rounded-2xl shadow-2xl p-6 relative animate-in zoom-in-95 slide-in-from-bottom-4 duration-300">
            <button
              onClick={() => setIsForgotModalOpen(false)}
              className="absolute right-4 top-4 text-slate-400 hover:text-slate-600 transition-colors"
            >
              <X size={20} />
            </button>

            <div className="mb-6">
              <h3 className="text-lg font-bold text-slate-800">Recuperar Senha</h3>
              <p className="text-xs text-slate-500 mt-1">Digite seu e-mail para receber o link de redefinição.</p>
            </div>

            {!forgotMessage ? (
              <form onSubmit={handleForgotPassword} className="space-y-4">
                <div className="space-y-1.5">
                  <label className="text-xs font-bold text-slate-700 uppercase tracking-wider ml-1">E-mail cadastrado</label>
                  <input
                    type="email"
                    value={forgotEmail}
                    onChange={(e) => setForgotEmail(e.target.value)}
                    className="w-full px-4 py-3 bg-slate-50 border border-slate-200 rounded-xl text-sm font-medium text-slate-900 focus:outline-none focus:ring-2 focus:ring-blue-500/20 focus:border-blue-500 transition-all"
                    placeholder="seu@email.com"
                    required
                    autoFocus
                  />
                </div>
                <button
                  type="submit"
                  disabled={forgotLoading}
                  className="w-full bg-slate-900 hover:bg-slate-800 text-white font-bold py-3 rounded-xl transition-all flex items-center justify-center gap-2"
                >
                  {forgotLoading ? <Loader2 size={16} className="animate-spin" /> : 'Enviar link de redefinição'}
                </button>
              </form>
            ) : (
              <div className="bg-emerald-50 border border-emerald-100 rounded-xl p-4 text-center space-y-3 animate-in fade-in">
                <div className="w-10 h-10 bg-emerald-100 rounded-full flex items-center justify-center mx-auto text-emerald-600">
                  <CheckCircle size={20} />
                </div>
                <p className="text-sm font-medium text-emerald-800 leading-relaxed">
                  {forgotMessage}
                </p>
                <button
                  onClick={() => setIsForgotModalOpen(false)}
                  className="text-xs font-bold text-emerald-700 hover:text-emerald-800 underline mt-2 inline-block"
                >
                  Fechar
                </button>
              </div>
            )}
          </div>
        </div>
      )}

    </div>
  );
}