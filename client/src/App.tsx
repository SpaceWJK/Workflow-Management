import { useEffect } from 'react';
import { BrowserRouter, Routes, Route, Navigate, Outlet } from 'react-router-dom';
import { QueryClient, QueryClientProvider } from '@tanstack/react-query';
import { useAuthStore } from './stores/authStore';
import { api } from './lib/api';
import type { User } from './types';

import AppShell from './components/layout/AppShell';
import LoginPage from './pages/LoginPage';
import DashboardPage from './components/dashboard/DashboardPage';
import TaskListPage from './components/tasks/TaskListPage';
import TaskFormPage from './components/tasks/TaskFormPage';
import TaskDetailPage from './components/tasks/TaskDetailPage';
import ProjectListPage from './components/projects/ProjectListPage';
import ProjectDetailPage from './components/projects/ProjectDetailPage';
import CalendarPage from './components/calendar/CalendarPage';
import TeamPage from './components/team/TeamPage';
import PixelOfficePage from './components/team/PixelOfficePage';
import SettingsPage from './components/settings/SettingsPage';
import AdminPage from './components/admin/AdminPage';
import BuildListPage from './components/builds/BuildListPage';
import BuildFormPage from './components/builds/BuildFormPage';
import BuildDetailPage from './components/builds/BuildDetailPage';
import ProfilePage from './components/profile/ProfilePage';
import StatusPage from './components/profile/StatusPage';
import ClockPage from './components/profile/ClockPage';
import TodayTasksPage from './components/profile/TodayTasksPage';
import PasswordPage from './components/profile/PasswordPage';
import AttendancePage from './components/attendance/AttendancePage';

const queryClient = new QueryClient({
  defaultOptions: {
    queries: {
      staleTime: 30_000,
      retry: 1,
      refetchOnWindowFocus: false,
    },
  },
});

function useRestoreUser() {
  const token = useAuthStore((s) => s.token);
  const user = useAuthStore((s) => s.user);
  const setUser = useAuthStore((s) => s.setUser);
  const logout = useAuthStore((s) => s.logout);

  useEffect(() => {
    if (token && !user) {
      api.get<User>('/api/auth/me').then((res) => {
        if (res.success && res.data) {
          setUser(res.data);
        } else {
          logout();
        }
      });
    }
  }, [token, user, setUser, logout]);
}

function ProtectedRoute() {
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);
  if (!isAuthenticated) return <Navigate to="/login" replace />;
  return <Outlet />;
}

function AppInner() {
  useRestoreUser();
  return (
    <BrowserRouter basename={import.meta.env.BASE_URL}>
        <Routes>
          <Route path="/login" element={<LoginPage />} />
          <Route element={<ProtectedRoute />}>
            <Route element={<AppShell />}>
              <Route path="/" element={<DashboardPage />} />
              <Route path="/tasks" element={<TaskListPage />} />
              <Route path="/tasks/new" element={<TaskFormPage />} />
              <Route path="/tasks/:id" element={<TaskDetailPage />} />
              <Route path="/tasks/:id/edit" element={<TaskFormPage />} />
              <Route path="/projects" element={<ProjectListPage />} />
              <Route path="/projects/:id" element={<ProjectDetailPage />} />
              <Route path="/builds" element={<BuildListPage />} />
              <Route path="/builds/new" element={<BuildFormPage />} />
              <Route path="/builds/:id" element={<BuildDetailPage />} />
              <Route path="/builds/:id/edit" element={<BuildFormPage />} />
              <Route path="/calendar" element={<CalendarPage />} />
              <Route path="/team" element={<TeamPage />} />
              <Route path="/team/pixel-office" element={<PixelOfficePage />} />
              <Route path="/settings" element={<SettingsPage />} />
              <Route path="/admin" element={<AdminPage />} />
              <Route path="/attendance" element={<AttendancePage />} />
              <Route path="/profile" element={<ProfilePage />} />
              <Route path="/profile/status" element={<StatusPage />} />
              <Route path="/profile/clock" element={<ClockPage />} />
              <Route path="/profile/today" element={<TodayTasksPage />} />
              <Route path="/profile/password" element={<PasswordPage />} />
            </Route>
          </Route>
          <Route path="*" element={<Navigate to="/" replace />} />
        </Routes>
      </BrowserRouter>
  );
}

export default function App() {
  return (
    <QueryClientProvider client={queryClient}>
      <AppInner />
    </QueryClientProvider>
  );
}
