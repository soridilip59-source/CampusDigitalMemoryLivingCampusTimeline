import { Navigate, Outlet, useLocation } from 'react-router-dom';
import useAuth from '../../hooks/useAuth';
import { PageLoader } from '../common/Loader';

/** <ProtectedRoute/> = logged-in only. <ProtectedRoute admin/> = admins only. */
export default function ProtectedRoute({ admin = false }) {
  const { user, loading, isAdmin } = useAuth();
  const location = useLocation();
  if (loading) return <PageLoader />;
  if (!user) return <Navigate to="/login" state={{ from: location }} replace />;
  if (admin && !isAdmin) return <Navigate to="/" replace />;
  return <Outlet />;
}