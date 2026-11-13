import { BrowserRouter, Routes, Route } from 'react-router-dom';
import AuthProvider from './context/AuthProvider';
import { PublicOnly, RequireManager, RequireAdmin } from './components/auth/RouteGuards';
import AppShell from './components/layout/AppShell';
import Login from './pages/auth/Login';
import Register from './pages/auth/Register';
import ForgotPassword from './pages/auth/ForgotPassword';
import AdminHome from './pages/admin/AdminHome';
import ManagerActivity from './pages/admin/ManagerActivity';
import './App.css';

export default function App() {
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
      <AuthProvider>
        <Routes>
          {/* Public pages */}
          <Route path="/login" element={<PublicOnly><Login /></PublicOnly>} />
          <Route path="/register" element={<PublicOnly><Register /></PublicOnly>} />
          <Route path="/forgot-password" element={<PublicOnly><ForgotPassword /></PublicOnly>} />

          {/* Admin area */}
          <Route path="/admin" element={<RequireAdmin><AdminHome /></RequireAdmin>} />
          <Route path="/admin/managers/:id" element={<RequireAdmin><ManagerActivity /></RequireAdmin>} />

          {/* The squad app: active managers only */}
          <Route path="/*" element={<RequireManager><AppShell /></RequireManager>} />
        </Routes>
      </AuthProvider>
    </BrowserRouter>
  );
}
