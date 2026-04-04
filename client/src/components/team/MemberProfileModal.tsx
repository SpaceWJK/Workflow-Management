import { motion, AnimatePresence } from 'framer-motion';
import { Mail, Phone, FileText } from 'lucide-react';
import type { User } from '../../types';
import { TEAM_STATUS_MAP } from '../../types';
import { getInitials } from '../../lib/utils';
import StatusBadge from '../common/StatusBadge';

interface MemberProfileModalProps {
  member: User | null;
  onClose: () => void;
}

export default function MemberProfileModal({ member, onClose }: MemberProfileModalProps) {
  const statusMeta = member ? TEAM_STATUS_MAP[member.teamStatus] : null;

  return (
    <AnimatePresence>
      {member && (
        <motion.div
          className="fixed inset-0 z-50 flex items-center justify-center"
          initial={{ opacity: 0 }}
          animate={{ opacity: 1 }}
          exit={{ opacity: 0 }}
        >
          <div className="absolute inset-0" style={{ backgroundColor: 'rgba(0,0,0,0.6)' }} onClick={onClose} />

          <motion.div
            className="relative rounded-xl w-full max-w-sm overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
            initial={{ scale: 0.9, opacity: 0 }}
            animate={{ scale: 1, opacity: 1 }}
            exit={{ scale: 0.9, opacity: 0 }}
          >
            <div className="flex flex-col items-center px-6 pt-6 pb-6">
              <button
                onClick={onClose}
                className="absolute top-3 right-3 cursor-pointer text-lg"
                style={{ color: 'var(--color-text-secondary)' }}
              >✕</button>
              {member.avatarUrl ? (
                <img
                  src={member.avatarUrl}
                  alt={member.name}
                  className="w-20 h-20 rounded-full object-cover border-4"
                  style={{ borderColor: 'var(--color-surface)' }}
                />
              ) : (
                <div
                  className="w-20 h-20 rounded-full flex items-center justify-center text-2xl font-bold border-4"
                  style={{ backgroundColor: 'var(--color-primary)', color: '#fff', borderColor: 'var(--color-surface)' }}
                >
                  {getInitials(member.name)}
                </div>
              )}

              <h3 className="text-lg font-bold mt-3">{member.name}</h3>
              <div className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>{member.role}</div>
              {statusMeta && (
                <div className="mt-2">
                  <StatusBadge status={member.teamStatus} />
                </div>
              )}

              {/* 정보 목록 */}
              <div className="w-full mt-5 flex flex-col gap-3">
                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <Mail className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>이메일</div>
                    <div className="text-sm truncate">{member.email}</div>
                  </div>
                </div>

                <div className="flex items-center gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <Phone className="w-4 h-4 flex-shrink-0" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>연락처</div>
                    <div className="text-sm">{member.phone || '미등록'}</div>
                  </div>
                </div>

                <div className="flex items-start gap-3 px-3 py-2.5 rounded-lg" style={{ backgroundColor: 'var(--color-bg)' }}>
                  <FileText className="w-4 h-4 flex-shrink-0 mt-0.5" style={{ color: 'var(--color-text-secondary)' }} />
                  <div className="flex-1 min-w-0">
                    <div className="text-[10px] font-medium" style={{ color: 'var(--color-text-secondary)' }}>소개</div>
                    <div className="text-sm">{member.bio || '미등록'}</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </motion.div>
      )}
    </AnimatePresence>
  );
}
