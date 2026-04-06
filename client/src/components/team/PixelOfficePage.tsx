import { useState, useMemo, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft } from 'lucide-react';
import dayjs from 'dayjs';
import { useTeam } from '../../hooks/useTeam';
import { useDailyAttendance } from '../../hooks/useAttendance';
import { useMyCurrentMeeting } from '../../hooks/useMeetingRooms';
import { useAuthStore } from '../../stores/authStore';
import type { User, ChatMessage, MeetingParticipant } from '../../types';
import PixelOffice from './PixelOffice';
import MemberProfileModal from './MemberProfileModal';
import MeetingRoomList from './meeting/MeetingRoomList';
import MeetingChatPanel from './meeting/MeetingChatPanel';
import LoadingSpinner from '../common/LoadingSpinner';

export default function PixelOfficePage() {
  const navigate = useNavigate();
  const today = dayjs().format('YYYY-MM-DD');
  const user = useAuthStore((s) => s.user);
  const { data: members = [], isLoading: teamLoading } = useTeam();
  const { data: attendance, isLoading: attLoading } = useDailyAttendance(today);
  const { data: currentMeeting } = useMyCurrentMeeting();
  const [selectedMember, setSelectedMember] = useState<User | null>(null);

  // 현재 참여 중인 회의실
  const [activeRoomId, setActiveRoomId] = useState<number | null>(null);
  const [chatMessages, setChatMessages] = useState<ChatMessage[]>([]);
  const [chatParticipants, setChatParticipants] = useState<MeetingParticipant[]>([]);
  const [chatTitle, setChatTitle] = useState('');

  // 새로고침 시 기존 회의실 복원
  useEffect(() => {
    if (currentMeeting) {
      setActiveRoomId(currentMeeting.room.id);
      setChatMessages(currentMeeting.messages);
      setChatParticipants(currentMeeting.participants);
      setChatTitle(currentMeeting.room.title);
    }
  }, [currentMeeting]);

  // 출근자 필터 (VIEWER 제외)
  const presentMembers = useMemo(() => {
    const filtered = members.filter((m) => m.role !== 'VIEWER');
    if (!attendance?.records) return filtered;
    const presentIds = new Set(
      attendance.records.filter((r) => r.clockIn !== null).map((r) => r.userId)
    );
    return filtered.filter((m) => presentIds.has(m.id));
  }, [members, attendance]);

  const handleJoined = (roomId: number) => {
    setActiveRoomId(roomId);
    // 새 방으로 전환 시 채팅 state 초기화 (remount via key)
    setChatMessages([]);
    setChatParticipants([]);
    setChatTitle('');
  };

  const handleLeft = () => {
    setActiveRoomId(null);
    setChatMessages([]);
    setChatParticipants([]);
    setChatTitle('');
  };

  if (teamLoading || attLoading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <motion.div
      className="flex flex-col gap-4"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* 헤더 */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate('/team')}
          className="p-1.5 rounded-lg cursor-pointer transition-colors hover:bg-[var(--color-surface-hover)]"
          style={{ color: 'var(--color-text-secondary)' }}
        >
          <ArrowLeft className="w-5 h-5" />
        </button>
        <h1 className="text-xl font-bold">Pixel Office</h1>
        <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
          출근자 {presentMembers.length}명 / 전체 {members.filter((m) => m.role !== 'VIEWER').length}명
        </span>
      </div>

      {/* 좌우 레이아웃: 좌=오피스, 우=회의실 */}
      <div className="flex gap-4">
        {/* 좌측: 오피스 */}
        <div className="flex-1 min-w-0">
          <PixelOffice
            members={presentMembers}
            onMemberClick={(m) => setSelectedMember(m)}
          />
        </div>

        {/* 우측: 회의실 패널 (w-80) */}
        <div className="w-80 shrink-0 flex flex-col gap-4">
          {/* 회의실 목록 */}
          <div className="rounded-xl p-4" style={{
            backgroundColor: 'var(--color-surface)',
            border: '1px solid var(--color-border)',
          }}>
            <MeetingRoomList
              presentMembers={presentMembers}
              currentRoomId={activeRoomId}
              onJoined={handleJoined}
              onRoomCreated={handleJoined}
            />
          </div>

          {/* 채팅 패널 (참여 중일 때만, key로 remount) */}
          {activeRoomId && (
            <MeetingChatPanel
              key={activeRoomId}
              roomId={activeRoomId}
              roomTitle={chatTitle || currentMeeting?.room.title || ''}
              initialMessages={chatMessages.length > 0 ? chatMessages : currentMeeting?.messages || []}
              participants={chatParticipants.length > 0 ? chatParticipants : currentMeeting?.participants || []}
              onLeft={handleLeft}
            />
          )}
        </div>
      </div>

      {/* 프로필 모달 */}
      <MemberProfileModal
        member={selectedMember}
        onClose={() => setSelectedMember(null)}
      />
    </motion.div>
  );
}
