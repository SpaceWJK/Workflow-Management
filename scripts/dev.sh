#!/bin/bash
# QA Workflow dev server 시작/중지/상태 스크립트
# 사용법: bash scripts/dev.sh [start|stop|status]

PROJECT_DIR="$(cd "$(dirname "$0")/.." && pwd)"
SERVER_PID_FILE="$PROJECT_DIR/.server.pid"
CLIENT_PID_FILE="$PROJECT_DIR/.client.pid"

start() {
  # 이미 실행 중인지 확인
  if [ -f "$SERVER_PID_FILE" ] && kill -0 $(cat "$SERVER_PID_FILE") 2>/dev/null; then
    echo "Server already running (PID: $(cat $SERVER_PID_FILE))"
  else
    cd "$PROJECT_DIR/server"
    nohup npx tsx src/index.ts > "$PROJECT_DIR/logs/server.log" 2>&1 &
    echo $! > "$SERVER_PID_FILE"
    echo "Server started (PID: $!)"
  fi

  if [ -f "$CLIENT_PID_FILE" ] && kill -0 $(cat "$CLIENT_PID_FILE") 2>/dev/null; then
    echo "Client already running (PID: $(cat $CLIENT_PID_FILE))"
  else
    cd "$PROJECT_DIR/client"
    nohup npx vite --port 5176 --host > "$PROJECT_DIR/logs/client.log" 2>&1 &
    echo $! > "$CLIENT_PID_FILE"
    echo "Client started (PID: $!)"
  fi

  sleep 3
  status
}

stop() {
  if [ -f "$SERVER_PID_FILE" ]; then
    kill $(cat "$SERVER_PID_FILE") 2>/dev/null && echo "Server stopped" || echo "Server was not running"
    rm -f "$SERVER_PID_FILE"
  fi
  if [ -f "$CLIENT_PID_FILE" ]; then
    kill $(cat "$CLIENT_PID_FILE") 2>/dev/null && echo "Client stopped" || echo "Client was not running"
    rm -f "$CLIENT_PID_FILE"
  fi
}

status() {
  echo "=== QA Workflow Dev Servers ==="
  if [ -f "$SERVER_PID_FILE" ] && kill -0 $(cat "$SERVER_PID_FILE") 2>/dev/null; then
    echo "Server: RUNNING (PID: $(cat $SERVER_PID_FILE), http://localhost:4000)"
  else
    echo "Server: STOPPED"
  fi
  if [ -f "$CLIENT_PID_FILE" ] && kill -0 $(cat "$CLIENT_PID_FILE") 2>/dev/null; then
    echo "Client: RUNNING (PID: $(cat $CLIENT_PID_FILE), http://localhost:5176)"
  else
    echo "Client: STOPPED"
  fi
}

# logs 디렉토리 생성
mkdir -p "$PROJECT_DIR/logs"

case "${1:-status}" in
  start)  start ;;
  stop)   stop ;;
  status) status ;;
  restart) stop; sleep 2; start ;;
  *) echo "Usage: bash scripts/dev.sh [start|stop|status|restart]" ;;
esac
