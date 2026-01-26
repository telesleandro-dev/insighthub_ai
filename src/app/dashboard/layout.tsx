'use client';

export default function DashboardLayout({ children }: { children: React.ReactNode }) {
  return (
    // "fixed inset-0" impede que a tela se repita ou quebre
    <div className="fixed inset-0 flex h-screen w-screen bg-[#f8f9fc] overflow-hidden">
      {children}
    </div>
  );
}