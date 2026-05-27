import React from 'react';
import { Outlet } from 'react-router-dom';
import TopNav from './TopNav';
import BottomNav from './BottomNav';

const AppShell: React.FC = () => (
  <div className="flex flex-col h-screen bg-nz-bg">
    <TopNav />
    <main className="flex-1 overflow-hidden relative min-h-0">
      <Outlet />
    </main>
    <BottomNav />
  </div>
);

export default AppShell;
