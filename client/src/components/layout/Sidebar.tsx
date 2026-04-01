import { NavLink } from 'react-router-dom';
import {
  LayoutDashboard,
  ListTodo,
  FolderKanban,
  Calendar,
  Users,
  Settings,
  Shield,
  ChevronLeft,
  ChevronRight,
  Activity,
} from 'lucide-react';
import { useUIStore } from '../../stores/uiStore';
import { useAuthStore } from '../../stores/authStore';
import { cn } from '../../lib/utils';

const NAV_ITEMS = [
  { to: '/', icon: LayoutDashboard, label: '대시보드' },
  { to: '/tasks', icon: ListTodo, label: '일감 관리' },
  { to: '/projects', icon: FolderKanban, label: '프로젝트' },
  { to: '/calendar', icon: Calendar, label: '캘린더' },
  { to: '/team', icon: Users, label: '팀원 현황' },
  { to: '/settings', icon: Settings, label: '설정' },
];

const ADMIN_NAV_ITEMS = [
  { to: '/admin', icon: Shield, label: '회원 관리' },
];

export default function Sidebar() {
  const collapsed = useUIStore((s) => s.sidebarCollapsed);
  const toggle = useUIStore((s) => s.toggleSidebar);
  const user = useAuthStore((s) => s.user);
  const isAdmin = user?.role === 'ADMIN';

  const allNavItems = isAdmin ? [...NAV_ITEMS, ...ADMIN_NAV_ITEMS] : NAV_ITEMS;

  return (
    <aside
      className={cn(
        'h-full flex flex-col border-r transition-all duration-300',
        collapsed ? 'w-16' : 'w-60'
      )}
      style={{
        backgroundColor: 'var(--color-surface)',
        borderColor: 'var(--color-border)',
      }}
    >
      {/* Logo */}
      <div
        className="flex items-center gap-2 px-4 h-14 border-b"
        style={{ borderColor: 'var(--color-border)' }}
      >
        <Activity className="w-6 h-6 shrink-0" style={{ color: 'var(--color-primary)' }} />
        {!collapsed && (
          <span className="text-base font-semibold whitespace-nowrap">QA Workflow</span>
        )}
      </div>

      {/* Navigation */}
      <nav className="flex-1 py-2 overflow-y-auto">
        {allNavItems.map((item) => (
          <NavLink
            key={item.to}
            to={item.to}
            end={item.to === '/'}
            className={({ isActive }) =>
              cn(
                'flex items-center gap-3 px-4 py-2.5 mx-2 my-0.5 rounded-lg text-sm transition-colors',
                isActive
                  ? 'font-medium'
                  : 'hover:bg-[var(--color-surface-hover)]'
              )
            }
            style={({ isActive }) => ({
              backgroundColor: isActive ? 'var(--color-primary)' : undefined,
              color: isActive ? '#fff' : 'var(--color-text-secondary)',
            })}
          >
            <item.icon className="w-5 h-5 shrink-0" />
            {!collapsed && <span className="whitespace-nowrap">{item.label}</span>}
          </NavLink>
        ))}
      </nav>

      {/* Collapse toggle */}
      <button
        onClick={toggle}
        className="flex items-center justify-center h-10 border-t transition-colors hover:bg-[var(--color-surface-hover)]"
        style={{ borderColor: 'var(--color-border)', color: 'var(--color-text-secondary)' }}
      >
        {collapsed ? <ChevronRight className="w-4 h-4" /> : <ChevronLeft className="w-4 h-4" />}
      </button>
    </aside>
  );
}
