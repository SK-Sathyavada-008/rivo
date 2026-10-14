import React, { useState, useEffect } from 'react';
import { Outlet, useLocation } from 'react-router-dom';
import { Navbar } from './Navbar.js';
import { Sidebar } from './Sidebar.js';
import { MobileBottomNav } from './MobileBottomNav.js';
import { apiFetch } from '../../lib/api.js';

export const AppLayout: React.FC = () => {
  const [exceptionCount, setExceptionCount] = useState(0);
  const location = useLocation();

  const fetchExceptionsCount = async () => {
    try {
      const res = await apiFetch<{ exceptions: any[] }>('/exceptions?status=open');
      setExceptionCount(res.exceptions?.length || 0);
    } catch (e) {
      // ignore
    }
  };

  useEffect(() => {
    fetchExceptionsCount();
  }, [location.pathname]);

  return (
    <div className="min-h-screen flex flex-col bg-[#F7FCF9]">
      <Navbar onRefresh={fetchExceptionsCount} />
      <div className="flex flex-1">
        <Sidebar exceptionCount={exceptionCount} />
        <main className="flex-1 p-4 sm:p-6 lg:p-8 max-w-7xl w-full mx-auto pb-24 lg:pb-12 overflow-x-hidden">
          <Outlet />
        </main>
      </div>
      <MobileBottomNav exceptionCount={exceptionCount} />
    </div>
  );
};
