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
    };
  }, [isAuthenticated, queryClient]);

  return { connected };
}
