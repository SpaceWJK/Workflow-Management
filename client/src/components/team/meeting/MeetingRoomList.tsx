import { useState } from 'react';
import { Plus, Lock, Globe, Users, LogIn } from 'lucide-react';
import type { MeetingRoom, User } from '../../../types';
import { useMeetingRooms, useJoinMeeting } from '../../../hooks/useMeetingRooms';
import { useAuthStore } from '../../../stores/authStore';
import CreateMeetingModal from './CreateMeetingModal';
import PasswordModal from './PasswordModal';

interface Props {
  presentMembers: User[];
  currentRoomId: number | null;
  onJoined: (roomId: number) => void;
  onRoomCreated: (roomId: number) => void;
}

export default function MeetingRoomList({ presentMembers, currentRoomId, onJoined, onRoomCreated }: Props) {
  const { data: rooms = [] } = useMeetingRooms();
  const joinMeeting = useJoinMeeting();
  const user = useAuthStore((s) => s.user);
  const [showCreate, setShowCreate] = useState(false);
  const [passwordTarget, setPasswordTarget] = useState<MeetingRoom | null>(null);

  const handleJoin = async (room: MeetingRoom) => {
    if (currentRoomId === room.id) return; // 이미 참여중

    if (room.isPrivate && user?.role !== 'ADMIN') {
      setPasswordTarget(room);
      return;
    }

    try {
      await joinMeeting.mutateAsync({ roomId: room.id });
      onJoined(room.id);
    } catch {
      // 에러는 mutation에서 처리
    }
  };

  const handlePasswordSubmit = async (password: string) => {
    if (!passwordTarget) return;
    try {
      await joinMeeting.mutateAsync({ roomId: passwordTarget.id, password });
      onJoined(passwordTarget.id);
      setPasswordTarget(null);
    } catch {
      // 에러 표시는 PasswordModal에서 처리
      throw new Error('비밀번호가 올바르지 않습니다.');
    }
  };

  return (
    <div className="flex flex-col gap-3">
      {/* 헤더 */}
      <div className="flex items-center justify-between">
        <h3 className="text-sm font-semibold">회의실</h3>
        <button
          onClick={() => setShowCreate(true)}
          className="flex items-center gap-1 px-2.5 py-1.5 rounded-lg text-xs font-medium cursor-pointer transition-colors"
          style={{
            backgroundColor: 'color-mix(in srgb, var(--color-primary) 15%, transparent)',
            color: 'var(--color-primary)',
          }}
        >
          <Plus className="w-3.5 h-3.5" /> 만들기
        </button>
      </div>

      {/* 회의실 목록 */}
      {rooms.length === 0 ? (
        <div className="text-center py-6" style={{ color: 'var(--color-text-secondary)' }}>
          <Users className="w-6 h-6 mx-auto mb-2" style={{ opacity: 0.4 }} />
          <p className="text-xs">활성 회의실이 없습니다</p>
        </div>
      ) : (
        <div className="flex flex-col gap-2">
          {rooms.map((room) => (
            <div
              key={room.id}
              className="p-3 rounded-lg flex items-center gap-3 transition-colors"
              style={{
                backgroundColor: currentRoomId === room.id
                  ? 'color-mix(in srgb, var(--color-primary) 12%, var(--color-surface))'
                  : 'var(--color-bg)',
                border: `1px solid ${currentRoomId === room.id ? 'var(--color-primary)' : 'var(--color-border)'}`,
              }}
            >
              {/* 공개/비공개 아이콘 */}
              {room.isPrivate
                ? <Lock className="w-4 h-4 shrink-0" style={{ color: 'var(--color-warning)' }} />
                : <Globe className="w-4 h-4 shrink-0" style={{ color: 'var(--color-success)' }} />
              }

              {/* 정보 */}
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium truncate">{room.title}</div>
                <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  {room.creatorName} · {room.participantCount}명
                </div>
              </div>

              {/* 참여 버튼 */}
              {currentRoomId !== room.id && (
                <button
                  onClick={() => handleJoin(room)}
                  disabled={joinMeeting.isPending}
                  className="px-2.5 py-1 rounded-md text-xs font-medium cursor-pointer shrink-0 transition-opacity disabled:opacity-50"
                  style={{
                    backgroundColor: 'var(--color-primary)',
                    color: '#fff',
                  }}
                >
                  <LogIn className="w-3.5 h-3.5" />
                </button>
              )}

              {currentRoomId === room.id && (
                <span className="text-xs font-medium shrink-0" style={{ color: 'var(--color-primary)' }}>
                  참여중
                </span>
              )}
            </div>
          ))}
        </div>
      )}

      {/* 생성 모달 */}
      <CreateMeetingModal
        isOpen={showCreate}
        onClose={() => setShowCreate(false)}
        presentMembers={presentMembers}
        currentUserId={user?.id ?? 0}
        onCreated={onRoomCreated}
      />

      {/* 비밀번호 모달 */}
      <PasswordModal
        room={passwordTarget}
        onClose={() => setPasswordTarget(null)}
        onSubmit={handlePasswordSubmit}
      />
    </div>
  );
}
