import { useEffect, useState } from 'react';
import { useQueryClient } from '@tanstack/react-query';
import { getSocket, disconnectSocket } from '../lib/socket';
import { useAuthStore } from '../stores/authStore';

export function useSocket() {
  const [connected, setConnected] = useState(false);
  const queryClient = useQueryClient();
  const isAuthenticated = useAuthStore((s) => s.isAuthenticated);

  useEffect(() => {
    if (!isAuthenticated) {
      disconnectSocket();
      setConnected(false);
      return;
    }

    const socket = getSocket();

    socket.on('connect', () => setConnected(true));
    socket.on('disconnect', () => setConnected(false));

    socket.on('reconnect', () => {
      setConnected(true);
      queryClient.invalidateQueries();
    });

    // Real-time events
    socket.on('task:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
    socket.on('task:created', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
    socket.on('task:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
    socket.on('task:progress', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
    socket.on('task:statusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['tasks'] });
    });
    socket.on('project:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['projects'] });
    });
    socket.on('team:statusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['team'] });
    });
    socket.on('dashboard:refresh', () => {
      queryClient.invalidateQueries();
    });

    // Timer events
    socket.on('timer:started', () => {
      queryClient.invalidateQueries({ queryKey: ['timer'] });
    });
    socket.on('timer:stopped', () => {
      queryClient.invalidateQueries({ queryKey: ['timer'] });
    });

    // Calendar events
    socket.on('calendar:eventCreated', () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    });
    socket.on('calendar:eventUpdated', () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    });
    socket.on('calendar:eventDeleted', () => {
      queryClient.invalidateQueries({ queryKey: ['calendarEvents'] });
    });

    // Build events
    socket.on('build:created', () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    });
    socket.on('build:updated', () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    });
    socket.on('build:deleted', () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    });
    socket.on('build:statusChanged', () => {
      queryClient.invalidateQueries({ queryKey: ['builds'] });
    });

    if (!socket.connected) {
      socket.connect();
    }

    return () => {
      socket.off('connect');
      socket.off('disconnect');
      socket.off('reconnect');
      socket.off('task:updated');
      socket.off('task:created');
      socket.off('task:deleted');
      socket.off('task:progress');
      socket.off('task:statusChanged');
      socket.off('project:updated');
      socket.off('team:statusChanged');
      socket.off('dashboard:refresh');
      socket.off('timer:started');
      socket.off('timer:stopped');
      socket.off('calendar:eventCreated');
      socket.off('calendar:eventUpdated');
      socket.off('calendar:eventDeleted');
      socket.off('build:created');
      socket.off('build:updated');
      socket.off('build:deleted');
      socket.off('build:statusChanged');
    };
  }, [isAuthenticated, queryClient]);

  return { connected };
}
