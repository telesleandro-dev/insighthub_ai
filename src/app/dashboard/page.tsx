'use client';

import { useIdleTimer } from '@/hooks/useIdleTimer';
import DashboardLayout from '@/components/DashboardLayout';
import DashboardView from '@/components/views/DashboardView';

export default function DashboardPage() {
  // Auto-logout após 60 minutos de inatividade
  useIdleTimer({ timeoutMinutes: 60 });

  return (
    <DashboardLayout>
      <DashboardView onNavigate={(section) => {
        // Navegação agora via URL direta
        window.location.href = `/${section === 'dashboard' ? 'dashboard' : section}`;
      }} />
    </DashboardLayout>
  );
}