import React from 'react';
import Sidebar from './Sidebar';
import { cn } from '@/lib/utils';

interface DashboardLayoutProps {
  children: React.ReactNode;
  className?: string;
}

const DashboardLayout: React.FC<DashboardLayoutProps> = ({ children, className }) => {
  return (
    <div className="min-h-screen bg-background">
      <Sidebar />
      <main className={cn("ml-64 min-h-screen p-6", className)}>
        {children}
      </main>
    </div>
  );
};

export default DashboardLayout;
