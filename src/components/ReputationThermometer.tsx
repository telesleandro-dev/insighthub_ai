import React from 'react';
import { ThermometerSun, TrendingUp, TrendingDown, Minus } from 'lucide-react';

interface ReputationThermometerProps {
    score: number; // 0-100
    label: 'Ruim' | 'Neutro' | 'Bom' | 'Excelente';
    totalMessages?: number;
}

export default function ReputationThermometer({ score, label, totalMessages }: ReputationThermometerProps) {
    // Se não há mensagens, mostra estado vazio
    const hasData = totalMessages !== undefined && totalMessages > 0;

    // Determina cor baseada no score
    const getColor = () => {
        if (score >= 76) return { bg: 'bg-green-500', text: 'text-green-600', border: 'border-green-200' };
        if (score >= 51) return { bg: 'bg-yellow-500', text: 'text-yellow-600', border: 'border-yellow-200' };
        if (score >= 26) return { bg: 'bg-orange-500', text: 'text-orange-600', border: 'border-orange-200' };
        return { bg: 'bg-red-500', text: 'text-red-600', border: 'border-red-200' };
    };

    const getIcon = () => {
        if (score >= 76) return <TrendingUp className="text-green-600" size={24} />;
        if (score >= 51) return <Minus className="text-yellow-600" size={24} />;
        if (score >= 26) return <TrendingDown className="text-orange-600" size={24} />;
        return <TrendingDown className="text-red-600" size={24} />;
    };

    const colors = getColor();

    // Estado vazio - sem dados
    if (!hasData) {
        return (
            <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col items-center justify-center">
                {/* Header */}
                <div className="flex items-center gap-2 mb-6">
                    <ThermometerSun className="text-slate-400" size={20} />
                    <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                        Reputação Geral
                    </h3>
                </div>

                {/* Empty State */}
                <div className="text-center py-12">
                    <div className="bg-slate-100 w-24 h-24 rounded-full flex items-center justify-center mx-auto mb-4">
                        <ThermometerSun className="text-slate-300" size={48} />
                    </div>
                    <h4 className="text-slate-600 font-bold mb-2">Sem dados ainda</h4>
                    <p className="text-xs text-slate-500 max-w-xs">
                        Nenhum email recebido para este produto ainda.
                    </p>
                </div>
            </div>
        );
    }

    return (
        <div className="bg-white rounded-2xl border border-slate-200 p-6 h-full flex flex-col items-center justify-center">
            {/* Header */}
            <div className="flex items-center gap-2 mb-6">
                <ThermometerSun className="text-slate-400" size={20} />
                <h3 className="text-sm font-bold text-slate-500 uppercase tracking-widest">
                    Reputação Geral
                </h3>
            </div>

            {/* Thermometer Visual */}
            <div className="relative w-24 h-64 bg-slate-100 rounded-full overflow-hidden mb-6 border-4 border-slate-200">
                {/* Fill */}
                <div
                    className={`absolute bottom-0 left-0 right-0 ${colors.bg} transition-all duration-700 ease-out`}
                    style={{ height: `${score}%` }}
                >
                    {/* Bubble animation */}
                    <div className="absolute top-0 left-1/2 -translate-x-1/2 w-12 h-12 bg-white/20 rounded-full animate-bounce"></div>
                </div>

                {/* Markers */}
                <div className="absolute inset-0 flex flex-col justify-between py-2 px-1">
                    {[100, 75, 50, 25, 0].map((mark) => (
                        <div key={mark} className="flex items-center justify-end">
                            <span className="text-[9px] font-bold text-slate-400 bg-white px-1 rounded">
                                {mark}
                            </span>
                        </div>
                    ))}
                </div>
            </div>

            {/* Score Display */}
            <div className="text-center mb-4">
                <div className={`text-5xl font-black ${colors.text} mb-1`}>
                    {score}
                </div>
                <div className="text-xs text-slate-400 uppercase tracking-wider font-bold">
                    de 100
                </div>
            </div>

            {/* Label Badge */}
            <div className={`${colors.text} bg-${colors.bg.replace('bg-', '')}-50 border ${colors.border} px-6 py-3 rounded-xl flex items-center gap-2 mb-3`}>
                {getIcon()}
                <span className="font-bold text-sm uppercase tracking-wider">{label}</span>
            </div>

            {/* Total Messages */}
            <div className="text-xs text-slate-500">
                Baseado em <strong>{totalMessages}</strong> email{totalMessages !== 1 ? 's' : ''}
            </div>
        </div>
    );
}
