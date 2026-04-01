import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LogIn, UserPlus, ArrowLeft, Loader2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { signup } from '../lib/api';

type Mode = 'login' | 'signup';

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function ErrorMessage({ message }: { message: string }) {
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-danger) 15%, transparent)',
        color: 'var(--color-danger)',
      }}
    >
      {message}
    </div>
  );
}

function SuccessMessage({ message }: { message: string }) {
  return (
    <div
      className="text-xs px-3 py-2 rounded-lg"
      style={{
        backgroundColor: 'color-mix(in srgb, var(--color-success, #22c55e) 15%, transparent)',
        color: 'var(--color-success, #22c55e)',
      }}
    >
      {message}
    </div>
  );
}

export default function LoginPage() {
  const { login } = useAuth();
  const [mode, setMode] = useState<Mode>('login');

  // Login state
  const [loginName, setLoginName] = useState('');
  const [loginPassword, setLoginPassword] = useState('');
  const [loginError, setLoginError] = useState('');
  const [loginLoading, setLoginLoading] = useState(false);

  // Signup state
  const [signupName, setSignupName] = useState('');
  const [signupEmail, setSignupEmail] = useState('');
  const [signupPassword, setSignupPassword] = useState('');
  const [signupPasswordConfirm, setSignupPasswordConfirm] = useState('');
  const [signupError, setSignupError] = useState('');
  const [signupSuccess, setSignupSuccess] = useState('');
  const [signupLoading, setSignupLoading] = useState(false);

  const handleLogin = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoginError('');
    setLoginLoading(true);
    const result = await login(loginName, loginPassword);
    if (!result.success) {
      setLoginError(result.message || '로그인에 실패했습니다.');
    }
    setLoginLoading(false);
  };

  const handleSignup = async (e: React.FormEvent) => {
    e.preventDefault();
    setSignupError('');

    if (signupName.trim().length < 2) {
      setSignupError('이름은 최소 2자 이상이어야 합니다.');
      return;
    }
    if (!/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(signupEmail)) {
      setSignupError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    if (signupPassword.length < 6) {
      setSignupError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (signupPassword !== signupPasswordConfirm) {
      setSignupError('비밀번호가 일치하지 않습니다.');
      return;
    }

    setSignupLoading(true);
    try {
      const res = await signup({ name: signupName.trim(), email: signupEmail, password: signupPassword });
      if (res.success) {
        setSignupSuccess('가입 완료! 로그인해주세요.');
        setTimeout(() => {
          setMode('login');
          setLoginName(signupName.trim());
          setSignupSuccess('');
        }, 1500);
      } else {
        setSignupError(res.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setSignupError('서버 연결에 실패했습니다.');
    }
    setSignupLoading(false);
  };

  const switchToSignup = () => { setMode('signup'); setLoginError(''); };
  const switchToLogin = () => { setMode('login'); setSignupError(''); setSignupSuccess(''); };

  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--color-bg)' }}>
      <motion.div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{ backgroundColor: 'var(--color-surface)', border: '1px solid var(--color-border)' }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          <span className="text-xl font-bold" style={{ color: 'var(--color-text)' }}>QA Workflow</span>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div key="login" {...fadeVariants} transition={{ duration: 0.25 }}>
              <form onSubmit={handleLogin} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>이름</label>
                  <input
                    type="text"
                    value={loginName}
                    onChange={(e) => setLoginName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="이름 입력"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>비밀번호</label>
                  <input
                    type="password"
                    value={loginPassword}
                    onChange={(e) => setLoginPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="비밀번호 입력"
                    required
                  />
                </div>

                {loginError && <ErrorMessage message={loginError} />}

                <button
                  type="submit"
                  disabled={loginLoading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {loginLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loginLoading ? '로그인 중...' : '로그인'}
                </button>
              </form>

              <div className="text-center mt-6">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>계정이 없으신가요? </span>
                <button
                  type="button"
                  onClick={switchToSignup}
                  className="text-xs font-semibold underline cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--color-primary)' }}
                >
                  회원가입
                </button>
              </div>
            </motion.div>
          ) : (
            <motion.div key="signup" {...fadeVariants} transition={{ duration: 0.25 }}>
              <form onSubmit={handleSignup} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>이름</label>
                  <input
                    type="text"
                    value={signupName}
                    onChange={(e) => setSignupName(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="이름 입력 (최소 2자)"
                    autoFocus
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>이메일</label>
                  <input
                    type="email"
                    value={signupEmail}
                    onChange={(e) => setSignupEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>비밀번호</label>
                  <input
                    type="password"
                    value={signupPassword}
                    onChange={(e) => setSignupPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="최소 6자 이상"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>비밀번호 확인</label>
                  <input
                    type="password"
                    value={signupPasswordConfirm}
                    onChange={(e) => setSignupPasswordConfirm(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="비밀번호 재입력"
                    required
                  />
                  {signupPasswordConfirm && signupPassword !== signupPasswordConfirm && (
                    <span className="text-xs mt-0.5" style={{ color: 'var(--color-danger)' }}>비밀번호가 일치하지 않습니다</span>
                  )}
                </div>

                {signupError && <ErrorMessage message={signupError} />}
                {signupSuccess && <SuccessMessage message={signupSuccess} />}

                <button
                  type="submit"
                  disabled={signupLoading || signupPassword !== signupPasswordConfirm}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {signupLoading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                  {signupLoading ? '가입 중...' : '회원가입'}
                </button>
              </form>

              <div className="text-center mt-6">
                <button
                  type="button"
                  onClick={switchToLogin}
                  className="flex items-center justify-center gap-1 mx-auto text-xs cursor-pointer hover:opacity-80"
                  style={{ color: 'var(--color-text-secondary)' }}
                >
                  <ArrowLeft className="w-3 h-3" />
                  <span>
                    이미 계정이 있으신가요?{' '}
                    <span className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>로그인</span>
                  </span>
                </button>
              </div>
            </motion.div>
          )}
        </AnimatePresence>
      </motion.div>
    </div>
  );
}
