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
import FinancePage from "./features/finance/pages/FinancePage";
import HRPage from "./features/hr/pages/HRPage";
import SystemSettingsPage from "./features/administration/pages/SystemSettingsPage";
import LoginPage from "./features/auth/LoginPage";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./styles/App.css";
import { useAuthStore } from "./store/useAuthStore";
import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

import CustomerDashboard from "./features/dashboard/pages/CustomerDashboard";
import DriverDashboard from "./features/dashboard/pages/DriverDashboard";
import DriverPayrollPage from "./features/dashboard/pages/DriverPayrollPage";
import CustomerSubscriptionsPage from "./features/subscriptions/pages/CustomerSubscriptionsPage";
import CustomerOrdersPage from "./features/orders/pages/CustomerOrdersPage";
import CustomerBillsPage from "./features/finance/pages/CustomerBillsPage";
import CustomerContainerLedger from "./features/customers/pages/CustomerContainerLedger";

function App() {
  const { isAuthenticated, user } = useAuthStore();

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
              <Route
                path="/"
                element={
                  user?.is_customer ? (
                    <CustomerDashboard />
                  ) : user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver" ? (
                    <DriverDashboard />
                  ) : (
                    <OverviewPage />
                  )
                }
              />
              
              {/* Customer Routes */}
              <Route path="/my-subscriptions" element={<CustomerSubscriptionsPage />} />
              <Route path="/my-orders" element={<CustomerOrdersPage />} />
              <Route path="/my-bills" element={<CustomerBillsPage />} />
              <Route path="/my-containers" element={<CustomerContainerLedger />} />
              <Route path="/my-payroll" element={<DriverPayrollPage />} />

              {/* Admin-only Routes */}
              <Route path="/tenants" element={user?.is_customer ? <Navigate to="/" replace /> : <TenantPage />} />
              <Route path="/logistics" element={user?.is_customer ? <Navigate to="/" replace /> : <LogisticsPage />} />
              <Route element={<TrackingProvider />}>
                <Route path="/tracking" element={user?.is_customer ? <Navigate to="/" replace /> : <TrackingPage />} />
                <Route path="/tracking/map" element={user?.is_customer ? <Navigate to="/" replace /> : <TrackingFullscreenMapPage />} />
              </Route>
              <Route path="/inventory" element={user?.is_customer ? <Navigate to="/" replace /> : <InventoryPage />} />
              <Route path="/orders" element={user?.is_customer ? <Navigate to="/" replace /> : <OrderPage />} />
              <Route path="/finance" element={user?.is_customer ? <Navigate to="/" replace /> : <FinancePage />} />
              <Route path="/hr" element={user?.is_customer ? <Navigate to="/" replace /> : <HRPage />} />
              <Route path="/customers" element={user?.is_customer ? <Navigate to="/" replace /> : <CustomerPage />} />
              <Route path="/drivers" element={user?.is_customer ? <Navigate to="/" replace /> : <DriverPage />} />
              <Route
                path="/reports"
                element={
                  user?.is_customer ? (
                    <Navigate to="/" replace />
                  ) : (
                    <div className="p-8">
                      <h1 className="text-2xl font-bold">Business Reports</h1>
                      <p className="text-charcoal/60 mt-2">
                        Coming soon: Data-driven insights for your dairy business.
                      </p>
                    </div>
                  )
                }
              />
              <Route path="/settings" element={user?.is_customer ? <Navigate to="/" replace /> : <SystemSettingsPage />} />
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
