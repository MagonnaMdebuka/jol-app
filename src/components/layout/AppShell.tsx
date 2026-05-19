import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';

const AppShell: React.FC = () => (
  <div className="flex flex-col h-screen bg-nz-bg">
    <TopNav />
    <main className="flex-1 overflow-hidden relative">
      <Outlet />
    </main>
  </div>
);

export default AppShell;
