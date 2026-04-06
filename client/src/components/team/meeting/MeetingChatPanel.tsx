import { useState, useEffect, useRef } from 'react';
import { LogOut, Send } from 'lucide-react';
import type { ChatMessage, MeetingParticipant } from '../../../types';
import { useLeaveMeeting } from '../../../hooks/useMeetingRooms';
import { useAuthStore } from '../../../stores/authStore';
import { getSocket } from '../../../lib/socket';

interface Props {
  roomId: number;
  roomTitle: string;
  initialMessages: ChatMessage[];
  participants: MeetingParticipant[];
  onLeft: () => void;
}

export default function MeetingChatPanel({ roomId, roomTitle, initialMessages, participants, onLeft }: Props) {
  const user = useAuthStore((s) => s.user);
  const leaveMeeting = useLeaveMeeting();
  const [messages, setMessages] = useState<ChatMessage[]>(initialMessages);
  const [input, setInput] = useState('');
  const [parts, setParts] = useState<MeetingParticipant[]>(participants);
  const bottomRef = useRef<HTMLDivElement>(null);

  // Socket 이벤트 리스너
  useEffect(() => {
    const socket = getSocket();
    if (!socket.connected) return;

    socket.emit('meeting:join' as string, roomId);

    const handleMessage = (data: { roomId: number; message: ChatMessage }) => {
      if (data.roomId === roomId) {
        setMessages((prev) => [...prev, data.message]);
      }
    };

    const handleJoined = (data: { roomId: number; user: { id: number; name: string } }) => {
      if (data.roomId === roomId) {
        setParts((prev) => {
          if (prev.find((p) => p.id === data.user.id)) return prev;
          return [...prev, { id: data.user.id, name: data.user.name, role: '', avatarUrl: null }];
        });
      }
    };

    const handleLeft = (data: { roomId: number; userId: number }) => {
      if (data.roomId === roomId) {
        setParts((prev) => prev.filter((p) => p.id !== data.userId));
      }
    };

    socket.on('meeting:message' as string, handleMessage);
    socket.on('meeting:joined' as string, handleJoined);
    socket.on('meeting:left' as string, handleLeft);

    return () => {
      socket.off('meeting:message' as string, handleMessage);
      socket.off('meeting:joined' as string, handleJoined);
      socket.off('meeting:left' as string, handleLeft);
    };
  }, [roomId]);

  // 자동 스크롤
  useEffect(() => {
    bottomRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  const sendMessage = () => {
    if (!input.trim()) return;
    const socket = getSocket();
    socket.emit('meeting:sendMessage' as string, { roomId, content: input.trim() });
    setInput('');
  };

  const handleLeave = async () => {
    const socket = getSocket();
    socket.emit('meeting:leave' as string, roomId);
    await leaveMeeting.mutateAsync(roomId);
    onLeft();
  };

  return (
    <div className="flex flex-col rounded-lg overflow-hidden" style={{
      backgroundColor: 'var(--color-bg)',
      border: '1px solid var(--color-border)',
      height: 400,
    }}>
      {/* 헤더 */}
      <div className="px-3 py-2 flex items-center justify-between shrink-0" style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        <div>
          <div className="text-sm font-semibold">{roomTitle}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
            {parts.length}명 참여중
          </div>
        </div>
        <button
          onClick={handleLeave}
          disabled={leaveMeeting.isPending}
          className="flex items-center gap-1 px-2 py-1 rounded-md text-xs cursor-pointer transition-colors"
          style={{ color: 'var(--color-danger)' }}
        >
          <LogOut className="w-3.5 h-3.5" /> 나가기
        </button>
      </div>

      {/* 참여자 바 */}
      <div className="px-3 py-1.5 flex items-center gap-1.5 overflow-x-auto shrink-0" style={{
        borderBottom: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        {parts.map((p) => (
          <span
            key={p.id}
            className="px-2 py-0.5 rounded-full text-xs shrink-0"
            style={{
              backgroundColor: 'color-mix(in srgb, var(--color-primary) 12%, transparent)',
              color: 'var(--color-primary)',
            }}
          >
            {p.name}
          </span>
        ))}
      </div>

      {/* 메시지 영역 */}
      <div className="flex-1 overflow-y-auto px-3 py-2 flex flex-col gap-2">
        {messages.map((msg) => {
          const isMine = msg.userId === user?.id;
          return (
            <div key={msg.id} className={`flex flex-col ${isMine ? 'items-end' : 'items-start'}`}>
              {!isMine && (
                <span className="text-xs font-medium mb-0.5" style={{ color: 'var(--color-text-secondary)' }}>
                  {msg.userName}
                </span>
              )}
              <div
                className="px-3 py-1.5 rounded-lg text-sm max-w-[85%]"
                style={{
                  backgroundColor: isMine ? 'var(--color-primary)' : 'var(--color-surface)',
                  color: isMine ? '#fff' : 'var(--color-text)',
                }}
              >
                {msg.content}
              </div>
              <span className="text-xs mt-0.5" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }}>
                {new Date(msg.createdAt).toLocaleTimeString('ko-KR', { hour: '2-digit', minute: '2-digit' })}
              </span>
            </div>
          );
        })}
        <div ref={bottomRef} />
      </div>

      {/* 입력 */}
      <div className="px-3 py-2 flex items-center gap-2 shrink-0" style={{
        borderTop: '1px solid var(--color-border)',
        backgroundColor: 'var(--color-surface)',
      }}>
        <input
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={(e) => e.key === 'Enter' && !e.shiftKey && sendMessage()}
          placeholder="메시지 입력..."
          className="flex-1 px-3 py-2 rounded-lg text-sm outline-none"
          style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
        />
        <button
          onClick={sendMessage}
          disabled={!input.trim()}
          className="p-2 rounded-lg cursor-pointer disabled:opacity-30 transition-opacity"
          style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
