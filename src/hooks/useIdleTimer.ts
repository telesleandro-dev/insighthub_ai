'use client';

import { useEffect, useRef } from 'react';
import { useRouter } from 'next/navigation';
import { supabase } from '@/lib/supabase';

interface UseIdleTimerOptions {
    timeoutMinutes?: number; // Tempo em minutos até logout (padrão: 60)
    onIdle?: () => void; // Callback opcional ao ficar idle
}

/**
 * Hook para detectar inatividade do usuário e fazer logout automático
 * 
 * @param timeoutMinutes - Tempo em minutos até logout (padrão: 60)
 * @param onIdle - Callback opcional executado ao ficar idle
 * 
 * @example
 * ```tsx
 * function Dashboard() {
 *   useIdleTimer({ timeoutMinutes: 60 });
 *   // ...
 * }
 * ```
 */
export function useIdleTimer({
    timeoutMinutes = 60,
    onIdle
}: UseIdleTimerOptions = {}) {
    const router = useRouter();
    const timeoutRef = useRef<NodeJS.Timeout | null>(null);
    const timeoutMs = timeoutMinutes * 60 * 1000; // Converter minutos para ms

    const handleLogout = async () => {
        console.log('⏱️ Usuário inativo por', timeoutMinutes, 'minutos. Fazendo logout...');

        try {
            await supabase.auth.signOut();

            // Execute callback se fornecido
            if (onIdle) {
                onIdle();
            }

            // Redireciona para login
            router.push('/login');
        } catch (error) {
            console.error('Erro ao fazer logout:', error);
        }
    };

    const resetTimer = () => {
        // Limpa timer anterior
        if (timeoutRef.current) {
            clearTimeout(timeoutRef.current);
        }

        // Inicia novo timer
        timeoutRef.current = setTimeout(handleLogout, timeoutMs);
    };

    useEffect(() => {
        // Eventos que indicam atividade do usuário
        const events = [
            'mousedown',
            'mousemove',
            'keydown',
            'scroll',
            'touchstart',
            'click',
        ];

        // Adiciona listeners
        events.forEach(event => {
            window.addEventListener(event, resetTimer);
        });

        // Inicia timer pela primeira vez
        resetTimer();

        // Cleanup
        return () => {
            if (timeoutRef.current) {
                clearTimeout(timeoutRef.current);
            }
            events.forEach(event => {
                window.removeEventListener(event, resetTimer);
            });
        };
    }, [timeoutMs]); // Re-executa se timeout mudar
}
