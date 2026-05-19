import React from 'react';
import { Outlet } from 'react-router-dom';
import OwnerNav from './OwnerNav';

const OwnerShell: React.FC = () => (
  <div className="flex flex-col min-h-screen bg-nz-bg">
    <OwnerNav />
    <main className="flex-1 overflow-y-auto">
      <div className="max-w-5xl mx-auto px-6 lg:px-8 py-8 pb-16">
        <Outlet />
      </div>
    </main>
  </div>
);

export default OwnerShell;
