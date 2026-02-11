'use client';

import { useIdleTimer } from '@/hooks/useIdleTimer';
import DashboardLayout from '@/components/DashboardLayout';
import InteligenciaLeadsView from '@/components/views/InteligenciaLeadsView';

export default function InteligenciaPage() {
    useIdleTimer({ timeoutMinutes: 60 });

    return (
        <DashboardLayout>
            <InteligenciaLeadsView />
        </DashboardLayout>
    );
}
