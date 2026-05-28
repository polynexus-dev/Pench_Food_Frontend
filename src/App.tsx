import { lazy, Suspense } from "react";
import ProtectedRoute from "./components/common/ProtectedRoute";
import "./styles/App.css";
import { useAuthStore } from "./store/useAuthStore";
import { Navigate, Route, Routes } from "react-router-dom";
import { BrowserRouter as Router } from "react-router-dom";
import DashboardLayout from "./layouts/DashboardLayout";

// Lazy-loaded pages — each becomes a separate JS chunk, only loaded when navigated to
const OverviewPage = lazy(() => import("./features/dashboard/pages/OverviewPage"));
const ReportsPage = lazy(() => import("./features/dashboard/pages/ReportsPage"));
const TenantPage = lazy(() => import("./features/tenant/pages/TenantPage"));
const CustomerPage = lazy(() => import("./features/customers/pages/CustomerPage"));
const LogisticsPage = lazy(() => import("./features/deliveries/pages/LogisticsPage"));
const DriverPage = lazy(() => import("./features/drivers/pages/DriverPage"));
const TrackingPage = lazy(() => import("./features/tracking/pages/TrackingPage"));
const TrackingFullscreenMapPage = lazy(() => import("./features/tracking/pages/TrackingFullscreenMapPage"));
const InventoryPage = lazy(() => import("./features/inventory/pages/InventoryPage"));
const OrderPage = lazy(() => import("./features/orders/pages/OrderPage"));
const FinancePage = lazy(() => import("./features/finance/pages/FinancePage"));
const HRPage = lazy(() => import("./features/hr/pages/HRPage"));
const UserSettingsPage = lazy(() => import("./features/administration/pages/UserSettingsPage"));
const LoginPage = lazy(() => import("./features/auth/LoginPage"));
const CustomerDashboard = lazy(() => import("./features/dashboard/pages/CustomerDashboard"));
const DriverDashboard = lazy(() => import("./features/dashboard/pages/DriverDashboard"));
const DriverPayrollPage = lazy(() => import("./features/dashboard/pages/DriverPayrollPage"));
const CustomerSubscriptionsPage = lazy(() => import("./features/subscriptions/pages/CustomerSubscriptionsPage"));
const CustomerOrdersPage = lazy(() => import("./features/orders/pages/CustomerOrdersPage"));
const CustomerBillsPage = lazy(() => import("./features/finance/pages/CustomerBillsPage"));
const CustomerContainerLedger = lazy(() => import("./features/customers/pages/CustomerContainerLedger"));

// Lazy-load TrackingProvider since it includes WebSocket/context logic only needed on tracking routes
const TrackingProvider = lazy(() => import("./features/tracking/context/TrackingContext").then(m => ({ default: m.TrackingProvider })));

// Page loading fallback
const PageLoader = () => (
  <div className="flex-1 flex items-center justify-center h-full">
    <div className="flex flex-col items-center gap-3">
      <div className="w-8 h-8 border-3 border-primary/20 border-t-primary rounded-full animate-spin"></div>
      <span className="text-xs font-bold text-charcoal/40 uppercase tracking-widest">Loading...</span>
    </div>
  </div>
);

function App() {
  const { isAuthenticated, user } = useAuthStore();

  return (
    <Router>
      <div className="font-sans">
        <Suspense fallback={<PageLoader />}>
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
                    (user?.is_customer && !user?.is_superuser && !user?.is_staff) ? (
                      <CustomerDashboard />
                    ) : ((user?.role?.toLowerCase() === "drivers" || user?.role?.toLowerCase() === "driver") && !user?.is_superuser && !user?.is_staff) ? (
                      <DriverDashboard />
                    ) : (
                      <OverviewPage />
                    )
                  }
                />
                
                {/* Shared Protected Routes */}
                <Route path="/profile/settings" element={<UserSettingsPage />} />

                {/* Customer Routes */}
                <Route path="/my-subscriptions" element={<CustomerSubscriptionsPage />} />
                <Route path="/my-orders" element={<CustomerOrdersPage />} />
                <Route path="/my-bills" element={<CustomerBillsPage />} />
                <Route path="/my-containers" element={<CustomerContainerLedger />} />
                <Route path="/my-payroll" element={<DriverPayrollPage />} />

                {/* Admin-only Routes */}
                <Route path="/tenants" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <TenantPage />} />
                <Route path="/logistics" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <LogisticsPage />} />
                <Route element={<Suspense fallback={<PageLoader />}><TrackingProvider /></Suspense>}>
                  <Route path="/tracking" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <TrackingPage />} />
                  <Route path="/tracking/map" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <TrackingFullscreenMapPage />} />
                </Route>
                <Route path="/inventory" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <InventoryPage />} />
                <Route path="/orders" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <OrderPage />} />
                <Route path="/finance" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <FinancePage />} />
                <Route path="/hr" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <HRPage />} />
                <Route path="/customers" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <CustomerPage />} />
                <Route path="/drivers" element={(user?.is_customer && !user?.is_superuser && !user?.is_staff) ? <Navigate to="/" replace /> : <DriverPage />} />
                <Route
                  path="/reports"
                  element={
                    (user?.is_customer && !user?.is_superuser && !user?.is_staff) ? (
                      <Navigate to="/" replace />
                    ) : (
                      <ReportsPage />
                    )
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
        </Suspense>
      </div>
    </Router>
  );
}

export default App;
