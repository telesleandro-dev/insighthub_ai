'use client';

import { Moon, Sun } from 'lucide-react';
import { useTheme } from '@/hooks/useTheme';

export function ThemeToggle() {
    const { theme, toggleTheme } = useTheme();

    return (
        <button
            onClick={toggleTheme}
            className={`
        relative px-3 py-2 rounded-xl text-sm font-medium transition-all w-full flex items-center gap-3
        ${theme === 'dark'
                    ? 'bg-slate-800 text-blue-400 hover:bg-slate-700'
                    : 'bg-slate-100 text-slate-600 hover:bg-slate-200'}
      `}
        >
            {theme === 'dark' ? (
                <>
                    <Moon size={18} />
                    <span>Modo Escuro</span>
                </>
            ) : (
                <>
                    <Sun size={18} />
                    <span>Modo Claro</span>
                </>
            )}
        </button>
    );
}
