import React from 'react';
import { BrowserRouter, Routes, Route, Navigate } from 'react-router-dom';
import { AuthProvider, useAuth } from './context/AuthContext.js';
import { AppLayout } from './components/layout/AppLayout.js';
import { LoginPage } from './pages/LoginPage.js';
import { DashboardPage } from './pages/DashboardPage.js';
import { StudentsPage } from './pages/StudentsPage.js';
import { LedgerPage } from './pages/LedgerPage.js';
import { ShareEvidencePage } from './pages/ShareEvidencePage.js';
import { TransactionsPage } from './pages/TransactionsPage.js';
import { ExceptionsPage } from './pages/ExceptionsPage.js';
import { ReportsPage } from './pages/ReportsPage.js';
import { AuditTrailPage } from './pages/AuditTrailPage.js';

const ProtectedRoute: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { user, loading } = useAuth();

  if (loading) {
    return (
      <div className="min-h-screen bg-[#F7FCF9] flex flex-col items-center justify-center space-y-3">
        <div className="w-10 h-10 border-4 border-[#15966A] border-t-transparent rounded-full animate-spin" />
        <span className="text-xs font-semibold text-[#18392D] tracking-wide">Loading Rivo...</span>
      </div>
    );
  }

  if (!user) {
    return <Navigate to="/login" replace />;
  }

  return <>{children}</>;
};

export function App() {
  return (
    <AuthProvider>
      <BrowserRouter>
        <Routes>
          <Route path="/login" element={<LoginPage />} />

          <Route
            path="/"
            element={
              <ProtectedRoute>
                <AppLayout />
              </ProtectedRoute>
            }
          >
            <Route index element={<DashboardPage />} />
            <Route path="ledger" element={<LedgerPage />} />
            <Route path="students" element={<StudentsPage />} />
            <Route path="evidence" element={<ShareEvidencePage />} />
            <Route path="transactions" element={<TransactionsPage />} />
            <Route path="exceptions" element={<ExceptionsPage />} />
            <Route path="reports" element={<ReportsPage />} />
            <Route path="audit-trail" element={<AuditTrailPage />} />
          </Route>

          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
    </AuthProvider>
  );
}

export default App;
