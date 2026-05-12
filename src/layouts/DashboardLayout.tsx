import { Outlet } from 'react-router-dom';
import Sidebar from '../components/layout/Sidebar';
import Navbar from '../components/layout/Navbar';

const DashboardLayout = () => {
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
    </div>
  );
};

export default DashboardLayout;
