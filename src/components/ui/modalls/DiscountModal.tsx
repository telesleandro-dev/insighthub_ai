'use client';

import React, { useState } from 'react';
import { Tag, Save, X, CheckCircle, Loader2 } from 'lucide-react';

interface DiscountModalProps {
  lead: any;
  onClose: () => void;
  onSave: (newLink: string) => void;
}

// O 'export' aqui resolve o erro 2305
export const DiscountModal = ({ lead, onClose, onSave }: DiscountModalProps) => {
  const [link, setLink] = useState(lead.custom_discount_link || '');
  const [loading, setLoading] = useState(false);
  const [saved, setSaved] = useState(false);

  // No arquivo DiscountModal.tsx, dentro da função handleSave:

  const handleSave = async () => {
    setLoading(true);
    try {
      // Sincronizando com o seu caminho real: update-link
      const response = await fetch('/api/leads/update-link', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({ leadId: lead.id, discountLink: link }),
      });

      const data = await response.json();

      if (response.ok && data.success) {
        setSaved(true); // Ativa a mensagem de confirmação

        // Delay de 1.5s para o usuário ver o "Salvo!" antes de fechar
        setTimeout(() => {
          onSave(link);
          onClose();
        }, 1500);
      } else {
        alert("Erro ao salvar: " + (data.error || "Verifique a conexão"));
      }
    } catch (error) {
      console.error("Erro técnico:", error);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="fixed inset-0 bg-black/60 flex items-center justify-center z-[100] p-4 backdrop-blur-sm">
      <div className="bg-white rounded-2xl shadow-2xl w-full max-w-md overflow-hidden border border-slate-200">
        <div className="bg-slate-50 p-4 border-b flex justify-between items-center">
          <div className="flex items-center gap-2">
            <Tag className="text-blue-600 w-5 h-5" />
            <h3 className="font-bold text-slate-800 tracking-tight">Oferta Especial</h3>
          </div>
          <button onClick={onClose} className="text-slate-400 hover:text-slate-600 p-1">
            <X size={20} />
          </button>
        </div>

        <div className="p-6 space-y-4">
          <div>
            <p className="text-xs font-bold text-slate-400 uppercase tracking-widest mb-1">Cliente</p>
            <p className="text-sm font-semibold text-slate-700">{lead.customer_name}</p>
          </div>

          <div className="space-y-2">
            <label className="text-sm font-bold text-slate-700">Link de Desconto</label>
            <textarea
              className="w-full border-2 border-slate-100 rounded-xl p-3 text-sm font-medium text-slate-900 bg-white placeholder:text-slate-400 focus:border-blue-500 focus:ring-4 focus:ring-blue-500/10 outline-none h-28 resize-none transition-all"
              placeholder="Cole o link personalizado aqui..."
              value={link}
              onChange={(e) => setLink(e.target.value)}
            />
          </div>
        </div>

        <div className="p-4 bg-slate-50 border-t flex gap-3">
          <button onClick={onClose} className="flex-1 px-4 py-2 text-sm font-bold text-slate-500 hover:bg-slate-200 rounded-xl transition-all">
            Cancelar
          </button>
          <button
            onClick={handleSave}
            disabled={loading}
            className="flex-1 bg-blue-600 hover:bg-blue-700 text-white px-4 py-2 rounded-xl text-sm font-bold flex items-center justify-center gap-2 transition-all shadow-lg shadow-blue-600/20 disabled:opacity-50"
          >
            {loading ? <Loader2 className="animate-spin" size={18} /> : saved ? <CheckCircle size={18} /> : <Save size={18} />}
            {saved ? 'Salvo!' : 'Salvar Link'}
          </button>
        </div>
      </div>
    </div >
  );
};