import { Outlet } from 'react-router-dom';
import Navbar from './Navbar';
import Footer from './Footer';
import useRealtimeToasts from '../../hooks/useRealtimeToasts';

export default function MainLayout() {
  useRealtimeToasts();
  return (
    <div className="flex min-h-screen flex-col">
      <Navbar />
      <main className="flex-1"><Outlet /></main>
      <Footer />
    </div>
  );
}
