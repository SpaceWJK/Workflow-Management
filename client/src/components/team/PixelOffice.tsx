import { useMemo, useState } from 'react';
import {
  Monitor, Laptop, Coffee, Plane, Car, Moon,
  Clock, Palmtree, MessageCircle, Home, Users,
} from 'lucide-react';
import type { User } from '../../types';
import { TEAM_STATUS_MAP, type TeamStatus } from '../../types';

interface PixelOfficeProps {
  members: User[];
  onMemberClick: (member: User) => void;
}

/* ── 상태 설정 ── */
const STATUS_CFG: Record<TeamStatus, {
  opacity: number;
  grayscale: boolean;
  icon: React.ElementType | null;
  deskType: 'monitor' | 'laptop' | 'empty' | 'none';
}> = {
  AVAILABLE:     { opacity: 1,    grayscale: false, icon: Coffee,        deskType: 'monitor' },
  IN_MEETING:    { opacity: 1,    grayscale: false, icon: MessageCircle, deskType: 'monitor' },
  AWAY:          { opacity: 0.45, grayscale: false, icon: null,          deskType: 'empty' },
  ON_LEAVE:      { opacity: 0.35, grayscale: true,  icon: Palmtree,     deskType: 'none' },
  HALF_DAY:      { opacity: 0.7,  grayscale: false, icon: Clock,        deskType: 'monitor' },
  REMOTE:        { opacity: 1,    grayscale: false, icon: Home,         deskType: 'laptop' },
  BUSINESS_TRIP: { opacity: 0.35, grayscale: true,  icon: Plane,        deskType: 'none' },
  FIELD_WORK:    { opacity: 0.35, grayscale: true,  icon: Car,          deskType: 'none' },
  OFF_WORK:      { opacity: 0.25, grayscale: false, icon: Moon,         deskType: 'empty' },
};

/* ── 역할 아바타 ── */
const ROLE_AVATAR: Record<string, { bg: string; border: string; badge: string }> = {
  ADMIN:       { bg: '#ef4444', border: '#fca5a5', badge: 'A' },
  QA_MANAGER:  { bg: '#8b5cf6', border: '#c4b5fd', badge: 'M' },
  QA_MEMBER:   { bg: '#3b82f6', border: '#93c5fd', badge: 'Q' },
  VIEWER:      { bg: '#6b7280', border: '#d1d5db', badge: 'V' },
};

const TOTAL_DESKS = 18;
const ROLE_ORDER: Record<string, number> = { ADMIN: 0, QA_MANAGER: 1, QA_MEMBER: 2, VIEWER: 3 };

export default function PixelOffice({ members, onMemberClick }: PixelOfficeProps) {
  const sorted = useMemo(() =>
    [...members].sort((a, b) => (ROLE_ORDER[a.role] ?? 9) - (ROLE_ORDER[b.role] ?? 9)),
    [members]
  );

  const slots = useMemo(() => {
    const arr: (User | null)[] = [];
    for (let i = 0; i < TOTAL_DESKS; i++) arr.push(i < sorted.length ? sorted[i] : null);
    return arr;
  }, [sorted]);

  const activeCount = members.filter((m) =>
    ['AVAILABLE', 'IN_MEETING', 'HALF_DAY', 'REMOTE'].includes(m.teamStatus)
  ).length;

  if (members.length === 0) {
    return (
      <div className="rounded-xl p-8 flex flex-col items-center justify-center gap-2"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', minHeight: 160 }}>
        <Users className="w-8 h-8" style={{ color: 'var(--color-text-secondary)', opacity: 0.4 }} />
        <span className="text-sm" style={{ color: 'var(--color-text-secondary)' }}>출근한 팀원이 없습니다</span>
      </div>
    );
  }

  return (
    <div className="rounded-xl overflow-hidden"
      style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}>

      {/* 헤더 */}
      <div className="px-5 py-3 flex items-center justify-between" style={{ borderBottom: '1px solid var(--color-border)' }}>
        <div className="flex items-center gap-3">
          <span className="text-sm font-semibold" style={{ color: 'var(--color-text-secondary)' }}>Pixel Office</span>
          <span className="text-xs px-2 py-0.5 rounded-full font-medium"
            style={{ backgroundColor: 'color-mix(in srgb, var(--color-success) 20%, transparent)', color: 'var(--color-success)' }}>
            {activeCount}/{members.length}명 근무중
          </span>
        </div>
        <div className="flex items-center gap-4">
          {[
            { l: '관리자', c: '#ef4444' }, { l: '매니저', c: '#8b5cf6' },
            { l: '멤버', c: '#3b82f6' }, { l: '뷰어', c: '#6b7280' },
          ].map((r) => (
            <div key={r.l} className="flex items-center gap-1.5">
              <div className="w-2.5 h-2.5 rounded-sm" style={{ backgroundColor: r.c }} />
              <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{r.l}</span>
            </div>
          ))}
        </div>
      </div>

      {/* 오피스 — 1개 방, 18석 그리드 (6열 x 3행) */}
      <div className="p-6" style={{
        backgroundImage: 'radial-gradient(circle at 1px 1px, color-mix(in srgb, var(--color-border) 15%, transparent) 1px, transparent 0)',
        backgroundSize: '24px 24px',
      }}>
        <div className="grid grid-cols-6 gap-4 max-w-[780px] mx-auto">
          {slots.map((slot, i) => (
            <DeskSlot key={i} member={slot} onMemberClick={onMemberClick} />
          ))}
        </div>
      </div>
    </div>
  );
}

/* ── 개별 데스크 슬롯 ── */
function DeskSlot({ member, onMemberClick }: { member: User | null; onMemberClick: (m: User) => void }) {
  const [hovered, setHovered] = useState(false);

  if (!member) return <EmptyDesk />;

  const status = member.teamStatus || 'AVAILABLE';
  const meta = TEAM_STATUS_MAP[status];
  const cfg = STATUS_CFG[status];
  const avatar = ROLE_AVATAR[member.role] || ROLE_AVATAR.VIEWER;
  const Icon = cfg.icon;

  return (
    <div
      className="relative flex flex-col items-center cursor-pointer select-none rounded-lg p-3 transition-all"
      style={{
        opacity: cfg.opacity,
        filter: cfg.grayscale ? 'grayscale(0.8)' : 'none',
        transform: hovered ? 'scale(1.04)' : 'scale(1)',
        backgroundColor: hovered ? 'color-mix(in srgb, var(--color-primary) 8%, transparent)' : 'color-mix(in srgb, var(--color-bg) 50%, var(--color-surface))',
        border: '1px solid color-mix(in srgb, var(--color-border) 40%, transparent)',
      }}
      onMouseEnter={() => setHovered(true)}
      onMouseLeave={() => setHovered(false)}
      onClick={() => onMemberClick(member)}
    >
      {/* 소품 아이콘 */}
      {Icon && (
        <div className="absolute top-1.5 right-1.5">
          <Icon className="w-3.5 h-3.5" style={{ color: meta.color }} />
        </div>
      )}

      {/* 데스크 + 모니터 */}
      <div className="flex flex-col items-center mb-2">
        {cfg.deskType === 'monitor' && <Monitor className="w-6 h-5" style={{ color: 'var(--color-primary)' }} />}
        {cfg.deskType === 'laptop' && <Laptop className="w-6 h-5" style={{ color: 'var(--color-info)' }} />}
        {cfg.deskType === 'empty' && <Monitor className="w-6 h-5" style={{ color: 'var(--color-text-secondary)', opacity: 0.3 }} />}
        {cfg.deskType === 'none' && <div className="h-5" />}
        <div className="w-full h-1.5 rounded-sm mt-1" style={{
          backgroundColor: 'color-mix(in srgb, var(--color-primary) 30%, var(--color-border))',
        }} />
      </div>

      {/* 아바타 */}
      <div className="w-10 h-10 rounded-lg flex items-center justify-center text-sm font-black overflow-hidden"
        style={{ backgroundColor: avatar.bg, border: `2px solid ${avatar.border}`, color: '#fff' }}>
        {member.avatarUrl
          ? <img src={member.avatarUrl} alt="" className="w-full h-full object-cover" />
          : avatar.badge}
      </div>

      {/* 이름 + 상태 */}
      <div className="flex items-center gap-1 mt-2">
        <div className="w-2 h-2 rounded-full" style={{ backgroundColor: meta.color }} />
        <span className="text-xs font-medium truncate" style={{ maxWidth: 72 }}>{member.name}</span>
      </div>
      <span className="text-xs" style={{ color: meta.color }}>{meta.label}</span>

      {/* 호버 툴팁 */}
      {hovered && (
        <div className="absolute -top-14 left-1/2 -translate-x-1/2 z-40 px-3 py-1.5 rounded-lg text-center whitespace-nowrap pointer-events-none"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)', boxShadow: '0 4px 12px rgba(0,0,0,0.3)' }}>
          <div className="text-sm font-semibold">{member.name}</div>
          <div className="text-xs" style={{ color: meta.color }}>{meta.label}</div>
          <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{member.role}</div>
        </div>
      )}
    </div>
  );
}

/* ── 빈 데스크 ── */
function EmptyDesk() {
  return (
    <div className="flex flex-col items-center p-3 rounded-lg" style={{
      backgroundColor: 'color-mix(in srgb, var(--color-border) 15%, var(--color-surface))',
      border: '1px dashed color-mix(in srgb, var(--color-text-secondary) 40%, transparent)',
    }}>
      <Monitor className="w-6 h-5" style={{ color: 'var(--color-text-secondary)', opacity: 0.6 }} />
      <div className="w-full h-1.5 rounded-sm mt-1" style={{ backgroundColor: 'var(--color-text-secondary)', opacity: 0.25 }} />
      <div className="w-10 h-10 rounded-lg mt-2" style={{ border: '2px dashed color-mix(in srgb, var(--color-text-secondary) 50%, transparent)' }} />
      <span className="text-xs mt-2" style={{ color: 'var(--color-text-secondary)', opacity: 0.7 }}>빈 자리</span>
    </div>
  );
}
