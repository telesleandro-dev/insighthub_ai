'use client';

import { useIdleTimer } from '@/hooks/useIdleTimer';
import DashboardLayout from '@/components/DashboardLayout';
import AdminUsersView from '@/components/views/AdminUsersView';

export default function AdminPage() {
    useIdleTimer({ timeoutMinutes: 60 });

    return (
        <DashboardLayout>
            <AdminUsersView />
        </DashboardLayout>
    );
}
