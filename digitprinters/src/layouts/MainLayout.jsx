/**
 * Main Layout
 * Wraps authenticated pages with navbar
 */

import { Outlet } from 'react-router-dom';
import Navbar from '../components/common/Navbar';

export default function MainLayout() {
  return (
    <div className="min-h-screen bg-slate-900">
      <Navbar />
      <Outlet />
    </div>
  );
}
