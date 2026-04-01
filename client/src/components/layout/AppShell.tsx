import { Outlet } from 'react-router-dom';
import Sidebar from './Sidebar';
import Header from './Header';
import { useSocket } from '../../hooks/useSocket';

export default function AppShell() {
  const { connected } = useSocket();

  return (
    <div
      className="grid h-screen"
      style={{
        gridTemplateColumns: 'auto 1fr',
        gridTemplateRows: 'auto 1fr',
      }}
    >
      {/* Sidebar spans full height */}
      <div className="row-span-2">
        <Sidebar />
      </div>

      {/* Header */}
      <Header connected={connected} />

      {/* Main content */}
      <main
        className="overflow-auto p-6"
        style={{ backgroundColor: 'var(--color-bg)' }}
      >
        <Outlet />
      </main>
    </div>
  );
}
