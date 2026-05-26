import { useState, useEffect } from 'react';
import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';
import { companyApi } from '../api/companyApi';
import { useAuthStore } from '../store/useAuthStore';
import CreateCompanyModal from '../components/common/CreateCompanyModal';

const DashboardLayout = () => {
  const { user } = useAuthStore();
  const [isModalOpen, setIsModalOpen] = useState(false);

  useEffect(() => {
    if (!user) return;
    const role = user.role?.toLowerCase();
    const isSpecialRole = (role === "customer" || role === "drivers" || role === "driver" || user.is_customer || user.is_driver) && !user.is_superuser && !user.is_staff;

    if (!isSpecialRole) {
      const checkCompanies = async () => {
        try {
          const companies = await companyApi.getCompanies();
          if (companies.length === 0) {
            setIsModalOpen(true);
          }
        } catch (err) {
          console.error("Failed to check companies in DashboardLayout:", err);
        }
      };
      checkCompanies();
    }
  }, [user]);

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
