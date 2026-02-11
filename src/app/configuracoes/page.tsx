'use client';

import { useIdleTimer } from '@/hooks/useIdleTimer';
import DashboardLayout from '@/components/DashboardLayout';
import ConfiguracoesView from '@/components/views/ConfiguracoesView';

export default function ConfiguracoesPage() {
    useIdleTimer({ timeoutMinutes: 60 });

    return (
        <DashboardLayout>
            <ConfiguracoesView />
        </DashboardLayout>
    );
}
