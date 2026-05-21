import React from 'react';
import { Navigate, Outlet } from 'react-router-dom';
import { useAuthStore } from '../../store/useAuthStore';

interface ProtectedRouteProps {
  children?: React.ReactNode;
}

const ProtectedRoute: React.FC<ProtectedRouteProps> = ({ children }) => {
  const { isAuthenticated, user } = useAuthStore();

  if (!isAuthenticated) {
    // Redirect to login if not authenticated
    return <Navigate to="/login" replace />;
  }

  const roleLower = user?.role?.toLowerCase();
  const isDriver = roleLower === "drivers" || roleLower === "driver";

  // Double check that the authenticated user is authorized for the web app
  if (user && !user.is_erp_user && !user.is_superuser && !user.is_staff && !user.is_customer && !isDriver) {
    // Redirect back to login if they are completely unclassified
    return <Navigate to="/login" replace />;
  }

  // If authenticated and authorized, render the children or the nested route outlet
  return children ? <>{children}</> : <Outlet />;
};

export default ProtectedRoute;
