import OverviewPage from "./features/dashboard/pages/OverviewPage";
import TenantPage from "./features/tenant/pages/TenantPage";
import CustomerPage from "./features/customers/pages/CustomerPage";
import LogisticsPage from "./features/deliveries/pages/LogisticsPage";
import DriverPage from "./features/drivers/pages/DriverPage";
import TrackingPage from "./features/tracking/pages/TrackingPage";
import { TrackingProvider } from "./features/tracking/context/TrackingContext";
import TrackingFullscreenMapPage from "./features/tracking/pages/TrackingFullscreenMapPage";
import InventoryPage from "./features/inventory/pages/InventoryPage";
import OrderPage from "./features/orders/pages/OrderPage";
import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./styles/App.css";
import { useAuthStore } from "./store/useAuthStore";
import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

function App() {
  const { isAuthenticated } = useAuthStore();

  return (
    <Router>
      <div className="font-sans">
        <Routes>
          {/* Public Routes */}
          <Route
            path="/login"
            element={
              isAuthenticated ? <Navigate to="/" replace /> : <LoginPage />
            }
          />

          {/* Protected Routes */}
          <Route element={<ProtectedRoute />}>
            <Route element={<DashboardLayout />}>
              <Route path="/" element={<OverviewPage />} />
              <Route path="/tenants" element={<TenantPage />} />
              <Route path="/logistics" element={<LogisticsPage />} />
              <Route element={<TrackingProvider />}>
                <Route path="/tracking" element={<TrackingPage />} />
                <Route path="/tracking/map" element={<TrackingFullscreenMapPage />} />
              </Route>
              <Route path="/inventory" element={<InventoryPage />} />
              <Route path="/orders" element={<OrderPage />} />
              <Route path="/customers" element={<CustomerPage />} />
              <Route path="/drivers" element={<DriverPage />} />
              <Route
                path="/reports"
                element={
                  <div className="p-8">
                    <h1 className="text-2xl font-bold">Business Reports</h1>
                    <p className="text-charcoal/60 mt-2">
                      Coming soon: Data-driven insights for your dairy business.
                    </p>
                  </div>
                }
              />
            </Route>
          </Route>

          {/* Fallback */}
          <Route
            path="*"
            element={<Navigate to={isAuthenticated ? "/" : "/login"} replace />}
          />
        </Routes>
      </div>
    </Router>
  );
}

export default App;
