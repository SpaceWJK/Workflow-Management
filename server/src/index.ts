// ============================================================
// 서버 진입점
// ============================================================

import 'dotenv/config';
import { createServer } from 'http';
import { createApp } from './app.js';
import { initializeSocket } from './socket.js';

const PORT = parseInt(process.env.PORT || '4000', 10);

async function main() {
  const app = createApp();
  const httpServer = createServer(app);

  // Socket.io 초기화
  initializeSocket(httpServer);

  httpServer.listen(PORT, () => {
    console.log(`[Server] Running on http://localhost:${PORT}`);
    console.log(`[Server] Environment: ${process.env.NODE_ENV || 'development'}`);
    console.log(`[Server] Client URL: ${process.env.CLIENT_URL || 'http://localhost:5173'}`);
  });

  // Graceful shutdown
  const shutdown = async (signal: string) => {
    console.log(`\n[Server] ${signal} received. Shutting down...`);

    httpServer.close(() => {
      console.log('[Server] HTTP server closed');
      process.exit(0);
    });

    // 10초 후 강제 종료
    setTimeout(() => {
      console.error('[Server] Forced shutdown after timeout');
      process.exit(1);
    }, 10_000);
  };

  process.on('SIGTERM', () => shutdown('SIGTERM'));
  process.on('SIGINT', () => shutdown('SIGINT'));
}

main().catch((err) => {
  console.error('[Server] Failed to start:', err);
  process.exit(1);
});
