import React from 'react';
import Navbar from './Navbar';
import Sidebar from './Sidebar';

interface MainLayoutProps {
  children: React.ReactNode;
}

const MainLayout: React.FC<MainLayoutProps> = ({ children }) => {
  return (
    <div className="h-screen w-screen bg-background grid grid-rows-[64px_1fr] overflow-hidden">
      {/* Fixed Navbar */}
      <Navbar />
      
      <div className="grid lg:grid-cols-[256px_1fr] overflow-hidden">
        {/* Sidebar */}
        <Sidebar />
        
        {/* Main Content */}
        <main className="overflow-y-auto overflow-x-hidden">
          <div className="w-full px-6 md:px-10 py-6">
            {children}
          </div>
        </main>
      </div>
    </div>
  );
};

export default MainLayout;