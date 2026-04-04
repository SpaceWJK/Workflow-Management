import { useEffect, useState } from 'react';
import { useNavigate, useParams } from 'react-router-dom';
import { motion } from 'framer-motion';
import { ArrowLeft, Save, Plus, Trash2 } from 'lucide-react';
import LoadingSpinner from '../common/LoadingSpinner';
import { useBuild, useCreateBuild, useUpdateBuild, useCdnTypes } from '../../hooks/useBuilds';
import { useProjects } from '../../hooks/useProjects';
import type { BuildVersion } from '../../types';
import dayjs from 'dayjs';

interface VersionRow {
  buildType: 'APP' | 'CDN';
  platform: string;
  cdnType: string;
  version: string;
  note: string;
}

interface FormData {
  projectId: string;
  buildOrder: string;
  receivedDate: string;
  updateTarget: string;
  memo: string;
  versions: VersionRow[];
}

const emptyVersion = (): VersionRow => ({
  buildType: 'APP',
  platform: '',
  cdnType: '',
  version: '',
  note: '',
});

const INITIAL: FormData = {
  projectId: '',
  buildOrder: '1',
  receivedDate: dayjs().format('YYYY-MM-DD'),
  updateTarget: '',
  memo: '',
  versions: [],
};

export default function BuildFormPage() {
  const { id } = useParams();
  const navigate = useNavigate();
  const isEdit = !!id;

  const { data: existingBuild, isLoading: buildLoading } = useBuild(id ? Number(id) : undefined);
  const { data: projects = [] } = useProjects();
  const createBuild = useCreateBuild();
  const updateBuild = useUpdateBuild();

  const [form, setForm] = useState<FormData>(INITIAL);
  const [errors, setErrors] = useState<Record<string, string>>({});

  const selectedProjectId = form.projectId ? Number(form.projectId) : undefined;
  const { data: cdnTypes = [] } = useCdnTypes(selectedProjectId);

  useEffect(() => {
    if (isEdit && existingBuild) {
      setForm({
        projectId: String(existingBuild.projectId),
        buildOrder: String(existingBuild.buildOrder),
        receivedDate: existingBuild.receivedDate ? dayjs(existingBuild.receivedDate).format('YYYY-MM-DD') : '',
        updateTarget: existingBuild.updateTarget ? dayjs(existingBuild.updateTarget).format('YYYY-MM-DD') : '',
        memo: existingBuild.memo || '',
        versions: (existingBuild.buildVersions || []).map((bv: BuildVersion) => ({
          buildType: bv.buildType,
          platform: bv.platform || '',
          cdnType: bv.cdnType || '',
          version: bv.version,
          note: bv.note || '',
        })),
      });
    }
  }, [isEdit, existingBuild]);

  const setField = <K extends keyof FormData>(key: K, value: FormData[K]) => {
    setForm((f) => ({ ...f, [key]: value }));
    setErrors((e) => {
      const next = { ...e };
      delete next[key];
      return next;
    });
  };

  const setVersionField = (idx: number, field: keyof VersionRow, value: string) => {
    setForm((f) => {
      const versions = [...f.versions];
      versions[idx] = { ...versions[idx], [field]: value };
      return { ...f, versions };
    });
  };

  const addVersion = () => {
    setForm((f) => ({ ...f, versions: [...f.versions, emptyVersion()] }));
  };

  const removeVersion = (idx: number) => {
    setForm((f) => ({
      ...f,
      versions: f.versions.filter((_, i) => i !== idx),
    }));
  };

  const validate = (): boolean => {
    const errs: Record<string, string> = {};
    if (!form.projectId) errs.projectId = '프로젝트를 선택하세요.';
    if (!form.buildOrder || Number(form.buildOrder) < 1) errs.buildOrder = '차수를 입력하세요.';
    if (!form.receivedDate) errs.receivedDate = '수급일을 입력하세요.';
    if (!form.updateTarget.trim()) errs.updateTarget = '업데이트 타겟을 입력하세요.';
    // Validate each version row
    form.versions.forEach((v, i) => {
      if (!v.version.trim()) errs[`version_${i}`] = '버전을 입력하세요.';
    });
    setErrors(errs);
    return Object.keys(errs).length === 0;
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!validate()) return;

    const payload = {
      projectId: Number(form.projectId),
      buildOrder: Number(form.buildOrder),
      receivedDate: form.receivedDate,
      updateTarget: form.updateTarget,
      memo: form.memo || undefined,
      versions: form.versions.map((v) => ({
        buildType: v.buildType,
        platform: v.buildType === 'APP' ? v.platform : undefined,
        cdnType: v.buildType === 'CDN' ? v.cdnType : undefined,
        version: v.version,
        note: v.note || undefined,
      })),
    };

    try {
      if (isEdit) {
        await updateBuild.mutateAsync({ id: Number(id), ...payload, version: existingBuild?.version ?? 0 });
      } else {
        await createBuild.mutateAsync(payload);
      }
      navigate('/builds');
    } catch {
      // error handled by mutation
    }
  };

  if (isEdit && buildLoading) {
    return <LoadingSpinner size="lg" className="h-64" />;
  }

  const inputClass = 'w-full px-3 py-2 rounded-lg text-sm border-none outline-none';
  const inputStyle = { backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' };

  return (
    <motion.div
      className="flex flex-col gap-6 max-w-3xl"
      initial={{ opacity: 0, y: 10 }}
      animate={{ opacity: 1, y: 0 }}
      transition={{ duration: 0.3 }}
    >
      {/* Header */}
      <div className="flex items-center gap-3">
        <button
          onClick={() => navigate(-1)}
          className="p-1.5 rounded-lg transition-colors hover:bg-[var(--color-surface-hover)]"
        >
          <ArrowLeft className="w-5 h-5" style={{ color: 'var(--color-text-secondary)' }} />
        </button>
        <h1 className="text-xl font-bold">{isEdit ? '빌드 수정' : '빌드 등록'}</h1>
      </div>

      <form onSubmit={handleSubmit} className="flex flex-col gap-6">
        {/* Section: Basic Info */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <h2 className="text-sm font-semibold mb-1">기본 정보</h2>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>프로젝트 *</label>
              <select
                value={form.projectId}
                onChange={(e) => setField('projectId', e.target.value)}
                className={inputClass}
                style={inputStyle}
              >
                <option value="">선택</option>
                {projects.map((p) => (
                  <option key={p.id} value={p.id}>{p.name}</option>
                ))}
              </select>
              {errors.projectId && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.projectId}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>차수 *</label>
              <input
                type="number"
                min={1}
                value={form.buildOrder}
                onChange={(e) => setField('buildOrder', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              {errors.buildOrder && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.buildOrder}</span>}
            </div>
          </div>

          <div className="grid grid-cols-2 gap-4">
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>수급일 *</label>
              <input
                type="date"
                value={form.receivedDate}
                onChange={(e) => setField('receivedDate', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              {errors.receivedDate && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.receivedDate}</span>}
            </div>
            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>업데이트 타겟 *</label>
              <input
                type="date"
                value={form.updateTarget}
                onChange={(e) => setField('updateTarget', e.target.value)}
                className={inputClass}
                style={inputStyle}
              />
              {errors.updateTarget && <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors.updateTarget}</span>}
            </div>
          </div>

          <div className="flex flex-col gap-1">
            <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>메모</label>
            <textarea
              value={form.memo}
              onChange={(e) => setField('memo', e.target.value)}
              className={inputClass}
              style={{ ...inputStyle, minHeight: '60px', resize: 'vertical' }}
              placeholder="메모 (선택사항)"
            />
          </div>
        </div>

        {/* Section: Build Versions */}
        <div
          className="rounded-xl p-5 flex flex-col gap-4"
          style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        >
          <div className="flex items-center justify-between">
            <h2 className="text-sm font-semibold">빌드 버전</h2>
            <button
              type="button"
              onClick={addVersion}
              className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-xs font-medium transition-colors hover:bg-[var(--color-surface-hover)]"
              style={{ color: 'var(--color-primary)' }}
            >
              <Plus className="w-3.5 h-3.5" /> 버전 추가
            </button>
          </div>

          {form.versions.length === 0 && (
            <p className="text-sm text-center py-4" style={{ color: 'var(--color-text-secondary)' }}>
              버전이 없습니다. [+ 버전 추가] 버튼을 눌러 추가하세요.
            </p>
          )}

          {form.versions.map((ver, idx) => (
            <div
              key={idx}
              className="rounded-lg p-4 flex flex-col gap-3"
              style={{ backgroundColor: 'var(--color-bg)', border: '1px solid var(--color-border)' }}
            >
              <div className="flex items-center justify-between">
                <span className="text-xs font-semibold" style={{ color: 'var(--color-text-secondary)' }}>
                  버전 #{idx + 1}
                </span>
                <button
                  type="button"
                  onClick={() => removeVersion(idx)}
                  className="p-1 rounded transition-colors hover:bg-[var(--color-surface-hover)]"
                  style={{ color: 'var(--color-danger)' }}
                >
                  <Trash2 className="w-3.5 h-3.5" />
                </button>
              </div>

              {/* Build type radio */}
              <div className="flex items-center gap-4">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>빌드 유형</label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`buildType_${idx}`}
                    value="APP"
                    checked={ver.buildType === 'APP'}
                    onChange={() => setVersionField(idx, 'buildType', 'APP')}
                  />
                  APP
                </label>
                <label className="flex items-center gap-1.5 text-sm cursor-pointer">
                  <input
                    type="radio"
                    name={`buildType_${idx}`}
                    value="CDN"
                    checked={ver.buildType === 'CDN'}
                    onChange={() => setVersionField(idx, 'buildType', 'CDN')}
                  />
                  CDN
                </label>
              </div>

              {/* Conditional: Platform or CDN type */}
              <div className="grid grid-cols-3 gap-3">
                {ver.buildType === 'APP' ? (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>플랫폼 (복수 선택 가능)</label>
                    <div className="flex items-center gap-3">
                      {(['iOS', 'AOS', 'PC'] as const).map((p) => {
                        const platforms = ver.platform ? ver.platform.split(',') : [];
                        const isChecked = platforms.includes(p);
                        return (
                          <label key={p} className="flex items-center gap-1 text-sm cursor-pointer">
                            <input
                              type="checkbox"
                              value={p}
                              checked={isChecked}
                              onChange={() => {
                                const next = isChecked
                                  ? platforms.filter((x) => x !== p)
                                  : [...platforms, p];
                                setVersionField(idx, 'platform', next.join(','));
                              }}
                            />
                            {p}
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ) : (
                  <div className="flex flex-col gap-1">
                    <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>CDN 종류</label>
                    <input
                      value={ver.cdnType}
                      onChange={(e) => setVersionField(idx, 'cdnType', e.target.value)}
                      className={inputClass}
                      style={inputStyle}
                      placeholder="리소스CDN, 패치CDN..."
                      list={`cdnTypes_${idx}`}
                    />
                    <datalist id={`cdnTypes_${idx}`}>
                      {cdnTypes.map((ct) => (
                        <option key={ct} value={ct} />
                      ))}
                    </datalist>
                  </div>
                )}

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>버전 *</label>
                  <input
                    value={ver.version}
                    onChange={(e) => setVersionField(idx, 'version', e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="1.0.0"
                  />
                  {errors[`version_${idx}`] && (
                    <span className="text-xs" style={{ color: 'var(--color-danger)' }}>{errors[`version_${idx}`]}</span>
                  )}
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>비고</label>
                  <input
                    value={ver.note}
                    onChange={(e) => setVersionField(idx, 'note', e.target.value)}
                    className={inputClass}
                    style={inputStyle}
                    placeholder="선택사항"
                  />
                </div>
              </div>
            </div>
          ))}
        </div>

        {/* Submit */}
        <div className="flex justify-end gap-2">
          <button
            type="button"
            onClick={() => navigate(-1)}
            className="px-4 py-2 rounded-lg text-sm transition-colors hover:bg-[var(--color-surface-hover)]"
            style={{ color: 'var(--color-text-secondary)' }}
          >
            취소
          </button>
          <button
            type="submit"
            disabled={createBuild.isPending || updateBuild.isPending}
            className="flex items-center gap-1.5 px-4 py-2 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
            style={{ backgroundColor: 'var(--color-primary)' }}
          >
            <Save className="w-4 h-4" /> {isEdit ? '수정' : '등록'}
          </button>
        </div>
      </form>
    </motion.div>
  );
}
