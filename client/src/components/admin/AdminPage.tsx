import { useState } from 'react';
import { motion } from 'framer-motion';
import { useQuery, useMutation, useQueryClient } from '@tanstack/react-query';
import { Shield, UserCheck, UserX, ChevronDown, KeyRound, Loader2, Trash2 } from 'lucide-react';
import { api } from '../../lib/api';
import { useProjects } from '../../hooks/useProjects';
import { formatDate } from '../../lib/utils';
import LoadingSpinner from '../common/LoadingSpinner';
import EmptyState from '../common/EmptyState';

interface AdminUser {
  id: number;
  name: string;
  email: string;
  role: string;
  teamStatus: string;
  team?: string;
  isActive: boolean;
  createdAt: string;
  projectIds?: number[];
  _count: { assignedTasks: number };
}

const ROLE_OPTIONS = [
  { value: 'ADMIN', label: '관리자' },
  { value: 'QA_MANAGER', label: 'QA 매니저' },
  { value: 'QA_MEMBER', label: 'QA 멤버' },
  { value: 'VIEWER', label: '뷰어' },
];

const ROLE_LABEL: Record<string, string> = {
  ADMIN: '관리자',
  QA_MANAGER: 'QA 매니저',
  QA_MEMBER: 'QA 멤버',
  MANAGER: '매니저',
  MEMBER: '멤버',
  VIEWER: '뷰어',
};

export default function AdminPage() {
  const queryClient = useQueryClient();
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [roleDropdownId, setRoleDropdownId] = useState<number | null>(null);
  const [teamEditId, setTeamEditId] = useState<number | null>(null);
  const [teamInput, setTeamInput] = useState('');
  const [projectEditId, setProjectEditId] = useState<number | null>(null);

  const { data: allProjects = [] } = useProjects();

  const { data: users = [], isLoading } = useQuery<AdminUser[]>({
    queryKey: ['admin', 'users'],
    queryFn: async () => {
      const res = await api.get<AdminUser[]>('/api/admin/users');
      return res.success ? res.data : [];
    },
  });

  const pendingUsers = users.filter((u) => !u.isActive);
  const activeUsers = users.filter((u) => u.isActive);

  const mutate = useMutation({
    mutationFn: async ({ action, id, body }: { action: string; id: number; body?: unknown }) => {
      setActionLoading(`${action}-${id}`);
      if (action === 'approve') return api.patch(`/api/admin/users/${id}/approve`, {});
      if (action === 'reject') return api.delete(`/api/admin/users/${id}/reject`);
      if (action === 'role') return api.patch(`/api/admin/users/${id}/role`, body);
      if (action === 'deactivate') return api.patch(`/api/admin/users/${id}/deactivate`, {});
      if (action === 'reset-password') return api.patch(`/api/admin/users/${id}/reset-password`, body);
      if (action === 'delete') return api.delete(`/api/admin/users/${id}`);
      return { success: false };
    },
    onSettled: () => {
      setActionLoading(null);
      setRoleDropdownId(null);
      queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
    },
  });

  const handleTeamSave = async (userId: number) => {
    setActionLoading(`team-${userId}`);
    await api.patch(`/api/admin/users/${userId}/team`, { team: teamInput });
    setActionLoading(null);
    setTeamEditId(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  const handleProjectToggle = async (userId: number, projectId: number, currentIds: number[]) => {
    const next = currentIds.includes(projectId)
      ? currentIds.filter((id) => id !== projectId)
      : [...currentIds, projectId];
    setActionLoading(`project-${userId}`);
    await api.put(`/api/admin/users/${userId}/projects`, { projectIds: next });
    setActionLoading(null);
    queryClient.invalidateQueries({ queryKey: ['admin', 'users'] });
  };

  if (isLoading) return <LoadingSpinner size="lg" className="h-64" />;

  return (
    <motion.div
      className="flex flex-col gap-6"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      <div className="flex items-center gap-2">
        <Shield className="w-5 h-5" style={{ color: 'var(--color-primary)' }} />
        <h1 className="text-xl font-bold">회원 관리</h1>
      </div>

      {/* 가입 대기 섹션 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          가입 대기 ({pendingUsers.length})
        </h2>
        {pendingUsers.length === 0 ? (
          <div
            className="rounded-xl p-6 text-center text-sm"
            style={{ backgroundColor: 'var(--color-surface)', color: 'var(--color-text-secondary)', border: '1px solid var(--color-border)' }}
          >
            대기 중인 가입 요청이 없습니다.
          </div>
        ) : (
          <div className="grid gap-2">
            {pendingUsers.map((u) => (
              <div
                key={u.id}
                className="flex items-center justify-between rounded-xl px-5 py-3"
                style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
              >
                <div className="flex items-center gap-4">
                  <div
                    className="w-9 h-9 rounded-full flex items-center justify-center text-sm font-medium text-white"
                    style={{ backgroundColor: 'var(--color-warning)' }}
                  >
                    {u.name[0]}
                  </div>
                  <div>
                    <div className="text-sm font-medium">{u.name}</div>
                    <div className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                      {u.email} &middot; {formatDate(u.createdAt, 'YYYY-MM-DD HH:mm')}
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-2">
                  <button
                    onClick={() => mutate.mutate({ action: 'approve', id: u.id })}
                    disabled={actionLoading === `approve-${u.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-success)' }}
                  >
                    {actionLoading === `approve-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserCheck className="w-3 h-3" />}
                    승인
                  </button>
                  <button
                    onClick={() => {
                      if (confirm(`'${u.name}' 가입 요청을 거절하시겠습니까?`)) {
                        mutate.mutate({ action: 'reject', id: u.id });
                      }
                    }}
                    disabled={actionLoading === `reject-${u.id}`}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
                    style={{ backgroundColor: 'var(--color-danger)' }}
                  >
                    {actionLoading === `reject-${u.id}` ? <Loader2 className="w-3 h-3 animate-spin" /> : <UserX className="w-3 h-3" />}
                    거절
                  </button>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>

      {/* 전체 회원 목록 */}
      <section>
        <h2 className="text-sm font-semibold mb-3" style={{ color: 'var(--color-text-secondary)' }}>
          전체 회원 ({activeUsers.length})
        </h2>
        {activeUsers.length === 0 ? (
          <EmptyState title="등록된 회원이 없습니다" />
        ) : (
          <div
            className="rounded-xl overflow-hidden"
            style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
          >
            <table className="w-full text-sm">
              <thead>
                <tr style={{ borderBottom: '1px solid var(--color-border)' }}>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>이름</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>이메일</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>역할</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>소속팀</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>담당 프로젝트</th>
                  <th className="text-center px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>진행 일감</th>
                  <th className="text-left px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>가입일</th>
                  <th className="text-right px-5 py-3 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>관리</th>
                </tr>
              </thead>
              <tbody>
                {activeUsers.map((u) => (
                  <tr key={u.id} style={{ borderBottom: '1px solid var(--color-border)' }}>
                    <td className="px-5 py-3">
                      <div className="flex items-center gap-3">
                        <div
                          className="w-8 h-8 rounded-full flex items-center justify-center text-xs font-medium text-white"
                          style={{ backgroundColor: u.role === 'ADMIN' ? 'var(--color-primary)' : 'var(--color-text-secondary)' }}
                        >
                          {u.name[0]}
                        </div>
                        <span className="font-medium">{u.name}</span>
                      </div>
                    </td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{u.email}</td>
                    <td className="px-5 py-3 relative">
                      <button
                        onClick={() => setRoleDropdownId(roleDropdownId === u.id ? null : u.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        {ROLE_LABEL[u.role] || u.role}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                      {roleDropdownId === u.id && (
                        <div
                          className="absolute z-10 mt-1 rounded-lg py-1 shadow-lg min-w-[140px]"
                          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
                        >
                          {ROLE_OPTIONS.map((opt) => (
                            <button
                              key={opt.value}
                              onClick={() => mutate.mutate({ action: 'role', id: u.id, body: { role: opt.value } })}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-hover)] transition-colors"
                              style={{ color: opt.value === u.role ? 'var(--color-primary)' : 'var(--color-text)' }}
                            >
                              {opt.label} {opt.value === u.role && '(현재)'}
                            </button>
                          ))}
                        </div>
                      )}
                    </td>
                    {/* 소속팀 */}
                    <td className="px-5 py-3 relative">
                      {teamEditId === u.id ? (
                        <div className="flex items-center gap-1">
                          <input
                            type="text"
                            value={teamInput}
                            onChange={(e) => setTeamInput(e.target.value)}
                            onKeyDown={(e) => { if (e.key === 'Enter') handleTeamSave(u.id); if (e.key === 'Escape') setTeamEditId(null); }}
                            className="px-2 py-1 rounded text-xs outline-none w-24"
                            style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)', color: 'var(--color-text)' }}
                            placeholder="팀명"
                            autoFocus
                          />
                          <button
                            onClick={() => handleTeamSave(u.id)}
                            disabled={actionLoading === `team-${u.id}`}
                            className="text-xs px-1.5 py-0.5 rounded"
                            style={{ backgroundColor: 'var(--color-primary)', color: '#fff' }}
                          >
                            저장
                          </button>
                          <button onClick={() => setTeamEditId(null)} className="text-xs px-1 py-0.5 rounded hover:bg-[var(--color-surface-hover)]">✕</button>
                        </div>
                      ) : (
                        <button
                          onClick={() => { setTeamEditId(u.id); setTeamInput(u.team ?? ''); }}
                          className="text-xs px-2 py-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                          style={{ color: u.team ? 'var(--color-text)' : 'var(--color-text-secondary)' }}
                        >
                          {u.team || '미지정'}
                        </button>
                      )}
                    </td>

                    {/* 담당 프로젝트 */}
                    <td className="px-5 py-3 relative">
                      {projectEditId === u.id ? (
                        <div
                          className="fixed z-50 w-56 rounded-lg py-1 shadow-lg"
                          style={{
                            backgroundColor: 'var(--color-surface)',
                            border: '1px solid var(--color-border)',
                            top: 'auto',
                            bottom: 'auto',
                            transform: 'translateY(-100%)',
                            marginTop: '-8px',
                          }}
                          ref={(el) => {
                            if (el) {
                              const rect = el.parentElement?.getBoundingClientRect();
                              if (rect) {
                                const spaceBelow = window.innerHeight - rect.bottom;
                                const spaceAbove = rect.top;
                                el.style.left = `${rect.left}px`;
                                if (spaceBelow < 250 && spaceAbove > 250) {
                                  el.style.top = `${rect.top - 8}px`;
                                  el.style.transform = 'translateY(-100%)';
                                } else {
                                  el.style.top = `${rect.bottom + 4}px`;
                                  el.style.transform = 'none';
                                }
                              }
                            }
                          }}
                        >
                          <div className="px-3 py-2 text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                            담당 프로젝트 선택
                          </div>
                          {allProjects.map((p) => {
                            const checked = (u.projectIds ?? []).includes(p.id);
                            return (
                              <label
                                key={p.id}
                                className="flex items-center gap-2 px-3 py-1.5 cursor-pointer hover:bg-[var(--color-surface-hover)] transition-colors"
                              >
                                <input
                                  type="checkbox"
                                  checked={checked}
                                  disabled={actionLoading === `project-${u.id}`}
                                  onChange={() => handleProjectToggle(u.id, p.id, u.projectIds ?? [])}
                                  className="rounded"
                                />
                                <span className="text-xs">{p.name}</span>
                              </label>
                            );
                          })}
                          <div className="border-t mt-1 pt-1" style={{ borderColor: 'var(--color-border)' }}>
                            <button
                              onClick={() => setProjectEditId(null)}
                              className="w-full text-left px-3 py-1.5 text-xs hover:bg-[var(--color-surface-hover)]"
                              style={{ color: 'var(--color-text-secondary)' }}
                            >
                              닫기
                            </button>
                          </div>
                        </div>
                      ) : null}
                      <button
                        onClick={() => setProjectEditId(projectEditId === u.id ? null : u.id)}
                        className="flex items-center gap-1 text-xs px-2 py-1 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                      >
                        {(u.projectIds ?? []).length > 0 ? `${(u.projectIds ?? []).length}개` : '미지정'}
                        <ChevronDown className="w-3 h-3" />
                      </button>
                    </td>

                    <td className="px-5 py-3 text-center">{u._count.assignedTasks}</td>
                    <td className="px-5 py-3" style={{ color: 'var(--color-text-secondary)' }}>{formatDate(u.createdAt)}</td>
                    <td className="px-5 py-3">
                      <div className="flex items-center justify-end gap-1">
                        <button
                          onClick={() => {
                            const pw = prompt(`'${u.name}' 비밀번호 초기화 (새 비밀번호 입력):`);
                            if (pw && pw.length >= 6) {
                              mutate.mutate({ action: 'reset-password', id: u.id, body: { newPassword: pw } });
                            } else if (pw) {
                              alert('비밀번호는 최소 6자 이상이어야 합니다.');
                            }
                          }}
                          className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                          title="비밀번호 초기화"
                        >
                          <KeyRound className="w-3.5 h-3.5" style={{ color: 'var(--color-text-secondary)' }} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`'${u.name}' 계정을 비활성화하시겠습니까?`)) {
                              mutate.mutate({ action: 'deactivate', id: u.id });
                            }
                          }}
                          disabled={actionLoading === `deactivate-${u.id}`}
                          className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                          title="비활성화"
                        >
                          <UserX className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                        </button>
                        <button
                          onClick={() => {
                            if (confirm(`'${u.name}' 계정을 완전히 삭제하시겠습니까?\n할당된 일감은 미할당 상태로 변경됩니다.\n이 작업은 되돌릴 수 없습니다.`)) {
                              mutate.mutate({ action: 'delete', id: u.id });
                            }
                          }}
                          disabled={actionLoading === `delete-${u.id}`}
                          className="p-1.5 rounded-md hover:bg-[var(--color-surface-hover)] transition-colors"
                          title="계정 삭제"
                        >
                          <Trash2 className="w-3.5 h-3.5" style={{ color: 'var(--color-danger)' }} />
                        </button>
                      </div>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </section>
    </motion.div>
  );
}
