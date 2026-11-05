import { lazy, Suspense } from 'react';
import { Route, Routes } from 'react-router-dom';
import MainLayout from '../components/layout/MainLayout';
import AuthLayout from '../components/layout/AuthLayout';
import ProtectedRoute from '../components/routes/ProtectedRoute';
import { PageLoader } from '../components/common/Loader';

// every page is its own chunk: first load stays small even on slow campus Wi-Fi
const Home = lazy(() => import('../pages/Home'));
const Login = lazy(() => import('../pages/auth/Login'));
const Register = lazy(() => import('../pages/auth/Register'));
const SubmitMemory = lazy(() => import('../pages/SubmitMemory'));
const MySubmissions = lazy(() => import('../pages/MySubmissions'));
const Admin = lazy(() => import('../pages/Admin'));
const NotFound = lazy(() => import('../pages/NotFound'));

export default function AppRoutes() {
  return (
    <Suspense fallback={<PageLoader />}>
      <Routes>
        <Route element={<MainLayout />}>
          <Route index element={<Home />} />
          <Route element={<ProtectedRoute />}>
            <Route path="submit" element={<SubmitMemory />} />
            <Route path="my-submissions" element={<MySubmissions />} />
          </Route>
          <Route element={<ProtectedRoute admin />}>
            <Route path="admin" element={<Admin />} />
          </Route>
          <Route path="*" element={<NotFound />} />
        </Route>
        <Route element={<AuthLayout />}>
          <Route path="login" element={<Login />} />
          <Route path="register" element={<Register />} />
        </Route>
      </Routes>
    </Suspense>
  );
}