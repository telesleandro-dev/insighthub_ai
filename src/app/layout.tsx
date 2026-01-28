import { AuthProvider } from '@/context/AuthContext'
import './globals.css'

export const metadata = {
  title: 'InsightHub AI',
  description: 'Inteligência Artificial para Infoprodutores',
}

export default function RootLayout({
  children,
}: {
  children: React.ReactNode
}) {
  return (
    <html lang="pt-br" className="dark">
      <body className="bg-[#020617] text-white">
        <AuthProvider>
          {children}
        </AuthProvider>
      </body>
    </html>
  )
}