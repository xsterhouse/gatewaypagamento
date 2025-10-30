import { BrowserRouter as Router, Routes, Route } from 'react-router-dom'
import { AuthProvider } from './contexts/AuthContext'
import { ImpersonationProvider } from './contexts/ImpersonationContext'
import { ThemeProvider } from './contexts/ThemeContext'
import { ProtectedRoute } from './components/ProtectedRoute'
import { PublicRoute } from './components/PublicRoute'
import { Toaster } from './components/ui/toast'
import { Layout } from './components/Layout'
import { LogoutLoadingScreen } from './components/LogoutLoadingScreen'
import { InstallPWA } from './components/InstallPWA'
import { Dashboard } from './pages/Dashboard'
import { Gerente } from './pages/Gerente'
import { Financeiro } from './pages/Financeiro'
import { Relatorios } from './pages/Relatorios'
import { Premiacoes } from './pages/Premiacoes'
import { Checkout } from './pages/Checkout'
import { Ajuda } from './pages/Ajuda'
import { Configuracoes } from './pages/Configuracoes'
import { Login } from './pages/Login'
import { Register } from './pages/Register'
import { ForgotPassword } from './pages/ForgotPassword'
import { ResetPassword } from './pages/ResetPassword'
import { Extrato } from './pages/Extrato'
import { KYCManagement } from './pages/KYCManagement'
import { AdminPanel } from './pages/AdminPanel'
import { MigrateUsers } from './pages/MigrateUsers'
import { CreateAdmin } from './pages/CreateAdmin'
import { AdminDashboard } from './pages/AdminDashboard'
import { SystemSettings } from './pages/SystemSettings'
import { SupportTickets } from './pages/SupportTickets'
import { TransactionsManagement } from './pages/TransactionsManagement'
import { ActivityLogs } from './pages/ActivityLogs'
import { Wallets } from './pages/Wallets'
import { Exchange } from './pages/Exchange'
import { Deposits } from './pages/Deposits'
import { AdminWallets } from './pages/AdminWallets'
import { AdminExchange } from './pages/AdminExchange'
import { AdminDeposits } from './pages/AdminDeposits'
import { Documents } from './pages/Documents'
import { FullCalendar } from './pages/FullCalendar'
import { ConfiguracoesAvancadas } from './pages/ConfiguracoesAvancadas'
import { AdminInvoices } from './pages/AdminInvoices'

function App() {
  return (
    <ThemeProvider>
      <AuthProvider>
        <ImpersonationProvider>
          <LogoutLoadingScreen />
          <Router future={{ v7_startTransition: true, v7_relativeSplatPath: true }}>
        <Routes>
          <Route path="/login" element={<PublicRoute><Login /></PublicRoute>} />
          <Route path="/register" element={<PublicRoute><Register /></PublicRoute>} />
          <Route path="/forgot-password" element={<PublicRoute><ForgotPassword /></PublicRoute>} />
          <Route path="/reset-password" element={<PublicRoute><ResetPassword /></PublicRoute>} />
          <Route path="/migrate" element={<MigrateUsers />} />
          <Route path="/create-admin" element={<CreateAdmin />} />
          
          <Route
            path="/"
            element={
              <ProtectedRoute>
                <Layout />
              </ProtectedRoute>
            }
          >
            <Route index element={<Dashboard />} />
            <Route path="gerente" element={<Gerente />} />
            <Route path="financeiro" element={<Financeiro />} />
            <Route path="relatorios" element={<Relatorios />} />
            <Route path="premiacoes" element={<Premiacoes />} />
            <Route path="checkout" element={<Checkout />} />
            <Route path="ajuda" element={<Ajuda />} />
            <Route path="configuracoes" element={<Configuracoes />} />
            <Route path="extrato" element={<Extrato />} />
            <Route path="kyc" element={<KYCManagement />} />
            <Route path="admin" element={<AdminPanel />} />
            <Route path="admin/dashboard" element={<AdminDashboard />} />
            <Route path="admin/settings" element={<SystemSettings />} />
            <Route path="admin/configuracoes-avancadas" element={<ConfiguracoesAvancadas />} />
            <Route path="admin/tickets" element={<SupportTickets />} />
            <Route path="admin/transactions" element={<TransactionsManagement />} />
            <Route path="admin/logs" element={<ActivityLogs />} />
            <Route path="admin/wallets" element={<AdminWallets />} />
            <Route path="admin/exchange" element={<AdminExchange />} />
            <Route path="admin/deposits" element={<AdminDeposits />} />
            <Route path="admin/invoices" element={<AdminInvoices />} />
            <Route path="wallets" element={<Wallets />} />
            <Route path="exchange" element={<Exchange />} />
            <Route path="deposits" element={<Deposits />} />
            <Route path="documents" element={<Documents />} />
            <Route path="calendar" element={<FullCalendar />} />
          </Route>
        </Routes>
        <Toaster />
        <InstallPWA />
        </Router>
      </ImpersonationProvider>
    </AuthProvider>
    </ThemeProvider>
  )
}

export default App
