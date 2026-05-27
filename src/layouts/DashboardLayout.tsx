import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { useCompanyStore } from '../store/useCompanyStore';
import { useAuthStore } from '../store/useAuthStore';
import CreateCompanyModal from '../components/common/CreateCompanyModal';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const { fetchCompanies } = useCompanyStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    const isSpecialRole = (role === "customer" || role === "drivers" || role === "driver" || user.is_customer || user.is_driver) && !user.is_superuser && !user.is_staff;

    if (!isSpecialRole) {
      // Uses cached data from useCompanyStore — no duplicate API call
      fetchCompanies().then((data) => {
        console.log("DashboardLayout: resolved fetchCompanies with:", data);
        if (data.length === 0) {
          setIsModalOpen(true);
        }
      });
    }
  }, [user, fetchCompanies]);

  const handleSuccess = () => {
    window.location.reload();
  };

  return (
    <div className="flex h-screen bg-milk-white overflow-hidden">
      {/* Permanent Sidebar */}
      <Sidebar />

      {/* Main Content Area */}
      <div className="flex-1 flex flex-col min-w-0">
        {/* Permanent Navbar */}
        <Navbar />

        {/* Dynamic Page Content */}
        <main className="flex-1 overflow-y-auto p-8 relative">
          <Outlet />
        </main>
      </div>

      {/* Auto-Trigger Create Company Modal */}
      <CreateCompanyModal 
        isOpen={isModalOpen}
        onClose={() => setIsModalOpen(false)}
        onSuccess={handleSuccess}
        isDismissible={false}
      />
    </div>
  );
};

export default DashboardLayout;
