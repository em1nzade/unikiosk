import { BrowserRouter, Routes, Route } from 'react-router-dom';
import KioskApp from './kiosk/KioskApp';
import { AuthProvider, useAuth } from './admin/AuthContext';
import { I18nProvider } from './shared/i18n';
import LoginPage from './admin/LoginPage';
import AdminDashboard from './admin/AdminDashboard';

function AdminRoute() {
  const { token } = useAuth();
  if (!token) return <LoginPage />;
  return <AdminDashboard />;
}

export default function App() {
  return (
    <BrowserRouter>
      <Routes>
        <Route path="/admin/*" element={<AuthProvider><AdminRoute /></AuthProvider>} />
        <Route path="*" element={<I18nProvider><KioskApp /></I18nProvider>} />
      </Routes>
    </BrowserRouter>
  );
}
