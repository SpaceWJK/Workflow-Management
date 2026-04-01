import { useState, useRef, useEffect, useCallback } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Activity, LogIn, Mail, ShieldCheck, UserPlus, ArrowLeft, Loader2, CheckCircle2 } from 'lucide-react';
import { useAuth } from '../hooks/useAuth';
import { sendVerificationCode, verifyEmailCode, signup } from '../lib/api';

type Mode = 'login' | 'signup';
type SignupStep = 1 | 2 | 3;

const fadeVariants = {
  initial: { opacity: 0, y: 12 },
  animate: { opacity: 1, y: 0 },
  exit: { opacity: 0, y: -12 },
};

function StepIndicator({ current }: { current: SignupStep }) {
  return (
    <div className="flex items-center justify-center gap-2 mb-6">
      {([1, 2, 3] as const).map((step) => (
        <div key={step} className="flex items-center gap-2">
          <div
            className="w-7 h-7 rounded-full flex items-center justify-center text-xs font-semibold transition-colors"
            style={{
              backgroundColor: step <= current ? 'var(--color-primary)' : 'var(--color-bg)',
              color: step <= current ? '#fff' : 'var(--color-text-secondary)',
            }}
          >
            {step < current ? <CheckCircle2 className="w-4 h-4" /> : step}
          </div>
          {step < 3 && (
            <div
              className="w-8 h-0.5 rounded"
              style={{
                backgroundColor: step < current ? 'var(--color-primary)' : 'var(--color-border)',
              }}
            />
          )}
        </div>
      ))}
    </div>
  );
}

function CodeInput({
  value,
  onChange,
  disabled,
}: {
  value: string;
  onChange: (code: string) => void;
  disabled: boolean;
}) {
  const inputRefs = useRef<(HTMLInputElement | null)[]>([]);
  const digits = value.padEnd(6, '').split('').slice(0, 6);

  const handleChange = (index: number, char: string) => {
    if (disabled) return;
    const sanitized = char.replace(/[^0-9]/g, '');
    if (!sanitized && !char) {
      // backspace
      const newDigits = [...digits];
      newDigits[index] = '';
      onChange(newDigits.join(''));
      if (index > 0) inputRefs.current[index - 1]?.focus();
      return;
    }
    if (!sanitized) return;
    const newDigits = [...digits];
    newDigits[index] = sanitized[0];
    const newCode = newDigits.join('');
    onChange(newCode);
    if (index < 5) inputRefs.current[index + 1]?.focus();
  };

  const handleKeyDown = (index: number, e: React.KeyboardEvent) => {
    if (e.key === 'Backspace' && !digits[index]) {
      if (index > 0) inputRefs.current[index - 1]?.focus();
    }
  };

  const handlePaste = (e: React.ClipboardEvent) => {
    e.preventDefault();
    const pasted = e.clipboardData.getData('text').replace(/[^0-9]/g, '').slice(0, 6);
    if (pasted) {
      onChange(pasted);
      const focusIndex = Math.min(pasted.length, 5);
      inputRefs.current[focusIndex]?.focus();
    }
  };

  return (
    <div className="flex justify-center gap-2">
      {digits.map((digit, i) => (
        <input
          key={i}
          ref={(el) => { inputRefs.current[i] = el; }}
          type="text"
          inputMode="numeric"
          maxLength={1}
          value={digit}
          disabled={disabled}
          onChange={(e) => handleChange(i, e.target.value)}
          onKeyDown={(e) => handleKeyDown(i, e)}
          onPaste={i === 0 ? handlePaste : undefined}
          className="w-10 h-12 text-center text-lg font-mono rounded-lg border-none outline-none focus:ring-2 focus:ring-blue-500 disabled:opacity-50"
          style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
        />
      ))}
    </div>
  );
}

function SignupForm({ onSwitchToLogin }: { onSwitchToLogin: () => void }) {
  const [step, setStep] = useState<SignupStep>(1);
  const [email, setEmail] = useState('');
  const [code, setCode] = useState('');
  const [name, setName] = useState('');
  const [password, setPassword] = useState('');
  const [passwordConfirm, setPasswordConfirm] = useState('');
  const [error, setError] = useState('');
  const [success, setSuccess] = useState('');
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const [expiresIn, setExpiresIn] = useState(0);
  const cooldownRef = useRef<ReturnType<typeof setInterval>>();
  const expiresRef = useRef<ReturnType<typeof setInterval>>();

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    cooldownRef.current = setInterval(() => {
      setCooldown((prev) => {
        if (prev <= 1) {
          clearInterval(cooldownRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(cooldownRef.current);
  }, [cooldown]);

  // Expiry timer
  useEffect(() => {
    if (expiresIn <= 0) return;
    expiresRef.current = setInterval(() => {
      setExpiresIn((prev) => {
        if (prev <= 1) {
          clearInterval(expiresRef.current);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(expiresRef.current);
  }, [expiresIn]);

  const validateEmail = (email: string) => /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email);

  const formatTime = (seconds: number) => {
    const m = Math.floor(seconds / 60);
    const s = seconds % 60;
    return `${m}:${s.toString().padStart(2, '0')}`;
  };

  const handleSendCode = useCallback(async () => {
    setError('');
    if (!validateEmail(email)) {
      setError('올바른 이메일 형식을 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await sendVerificationCode(email);
      if (res.success) {
        setStep(2);
        setCooldown(60);
        setExpiresIn(600);
        setSuccess('인증코드가 발송되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || '인증코드 발송에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
    setLoading(false);
  }, [email]);

  const handleResendCode = useCallback(async () => {
    if (cooldown > 0) return;
    setError('');
    setLoading(true);
    try {
      const res = await sendVerificationCode(email);
      if (res.success) {
        setCooldown(60);
        setExpiresIn(600);
        setCode('');
        setSuccess('인증코드가 재발송되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || '재발송에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
    setLoading(false);
  }, [email, cooldown]);

  const handleVerifyCode = useCallback(async () => {
    setError('');
    if (code.length !== 6) {
      setError('6자리 인증코드를 입력해주세요.');
      return;
    }
    setLoading(true);
    try {
      const res = await verifyEmailCode(email, code);
      if (res.success) {
        setStep(3);
        setSuccess('이메일 인증이 완료되었습니다.');
        setTimeout(() => setSuccess(''), 3000);
      } else {
        setError(res.message || '인증코드가 일치하지 않습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
    setLoading(false);
  }, [email, code]);

  const handleSignup = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    if (!name.trim()) {
      setError('이름을 입력해주세요.');
      return;
    }
    if (password.length < 6) {
      setError('비밀번호는 최소 6자 이상이어야 합니다.');
      return;
    }
    if (password !== passwordConfirm) {
      setError('비밀번호가 일치하지 않습니다.');
      return;
    }
    setLoading(true);
    try {
      const res = await signup({ name: name.trim(), email, password, code });
      if (res.success) {
        setSuccess('가입 완료! 로그인 페이지로 이동합니다.');
        setTimeout(() => onSwitchToLogin(), 1500);
      } else {
        setError(res.message || '회원가입에 실패했습니다.');
      }
    } catch {
      setError('서버 연결에 실패했습니다.');
    }
    setLoading(false);
  }, [name, email, password, passwordConfirm, code, onSwitchToLogin]);

  return (
    <>
      <StepIndicator current={step} />

      <AnimatePresence mode="wait">
        {/* Step 1: Email + Send Code */}
        {step === 1 && (
          <motion.div key="step1" {...fadeVariants} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                이메일 인증
              </h2>
              <p className="text-xs mt-1" style={{ color: 'var(--color-text-secondary)' }}>
                인증코드를 받을 이메일을 입력해주세요
              </p>
            </div>

            <div className="flex flex-col gap-1">
              <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                이메일
              </label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                onKeyDown={(e) => e.key === 'Enter' && handleSendCode()}
                className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                placeholder="email@example.com"
                autoFocus
              />
            </div>

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            <button
              type="button"
              onClick={handleSendCode}
              disabled={loading || !email}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Mail className="w-4 h-4" />}
              {loading ? '발송 중...' : '인증코드 발송'}
            </button>
          </motion.div>
        )}

        {/* Step 2: Verify Code */}
        {step === 2 && (
          <motion.div key="step2" {...fadeVariants} transition={{ duration: 0.25 }} className="flex flex-col gap-4">
            <div className="text-center mb-2">
              <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                인증코드 입력
              </h2>
              <div className="flex items-center justify-center gap-1 mt-1">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>{email}</span>
                <button
                  type="button"
                  onClick={() => { setStep(1); setCode(''); setError(''); }}
                  className="text-xs underline"
                  style={{ color: 'var(--color-primary)' }}
                >
                  변경
                </button>
              </div>
            </div>

            <CodeInput value={code} onChange={setCode} disabled={loading} />

            {expiresIn > 0 && (
              <div className="text-center text-xs" style={{ color: expiresIn <= 60 ? 'var(--color-danger)' : 'var(--color-text-secondary)' }}>
                남은 시간: {formatTime(expiresIn)}
              </div>
            )}
            {expiresIn === 0 && step === 2 && (
              <div className="text-center text-xs" style={{ color: 'var(--color-danger)' }}>
                인증 시간이 만료되었습니다. 코드를 재발송해주세요.
              </div>
            )}

            {error && <ErrorMessage message={error} />}
            {success && <SuccessMessage message={success} />}

            <button
              type="button"
              onClick={handleVerifyCode}
              disabled={loading || code.length !== 6 || expiresIn === 0}
              className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50"
              style={{ backgroundColor: 'var(--color-primary)' }}
            >
              {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <ShieldCheck className="w-4 h-4" />}
              {loading ? '확인 중...' : '인증 확인'}
            </button>

            <div className="text-center">
              <button
                type="button"
                onClick={handleResendCode}
                disabled={cooldown > 0 || loading}
                className="text-xs underline disabled:opacity-50 disabled:no-underline"
                style={{ color: 'var(--color-primary)' }}
              >
                {cooldown > 0 ? `코드 재발송 (${cooldown}초)` : '코드 재발송'}
              </button>
            </div>
          </motion.div>
        )}

        {/* Step 3: Profile + Password */}
        {step === 3 && (
          <motion.div key="step3" {...fadeVariants} transition={{ duration: 0.25 }}>
            <form onSubmit={handleSignup} className="flex flex-col gap-4">
              <div className="text-center mb-2">
                <h2 className="text-base font-semibold" style={{ color: 'var(--color-text)' }}>
                  회원 정보 입력
                </h2>
              </div>

              {/* Verified email display */}
              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  이메일
                </label>
                <div
                  className="w-full px-3 py-2.5 rounded-lg text-sm flex items-center justify-between"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text-secondary)' }}
                >
                  <span>{email}</span>
                  <CheckCircle2 className="w-4 h-4" style={{ color: 'var(--color-success, #22c55e)' }} />
                </div>
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  이름
                </label>
                <input
                  type="text"
                  value={name}
                  onChange={(e) => setName(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="이름 입력"
                  autoFocus
                  required
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  비밀번호
                </label>
                <input
                  type="password"
                  value={password}
                  onChange={(e) => setPassword(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="최소 6자 이상"
                  required
                  minLength={6}
                />
              </div>

              <div className="flex flex-col gap-1">
                <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                  비밀번호 확인
                </label>
                <input
                  type="password"
                  value={passwordConfirm}
                  onChange={(e) => setPasswordConfirm(e.target.value)}
                  className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                  style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                  placeholder="비밀번호 재입력"
                  required
                />
                {passwordConfirm && password !== passwordConfirm && (
                  <span className="text-xs mt-0.5" style={{ color: 'var(--color-danger)' }}>
                    비밀번호가 일치하지 않습니다
                  </span>
                )}
              </div>

              {error && <ErrorMessage message={error} />}
              {success && <SuccessMessage message={success} />}

              <button
                type="submit"
                disabled={loading || !name.trim() || password.length < 6 || password !== passwordConfirm}
                className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-1"
                style={{ backgroundColor: 'var(--color-primary)' }}
              >
                {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <UserPlus className="w-4 h-4" />}
                {loading ? '가입 중...' : '회원가입'}
              </button>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </>
  );
}

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
  const [email, setEmail] = useState('');
  const [password, setPassword] = useState('');
  const [error, setError] = useState('');
  const [loading, setLoading] = useState(false);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setError('');
    setLoading(true);

    const result = await login(email, password);
    if (!result.success) {
      setError(result.message || '로그인에 실패했습니다.');
    }
    setLoading(false);
  };

  const switchToSignup = () => {
    setMode('signup');
    setError('');
  };

  const switchToLogin = () => {
    setMode('login');
    setError('');
  };

  return (
    <div
      className="min-h-screen flex items-center justify-center"
      style={{ backgroundColor: 'var(--color-bg)' }}
    >
      <motion.div
        className="w-full max-w-sm rounded-2xl p-8"
        style={{
          backgroundColor: 'var(--color-surface)',
          border: '1px solid var(--color-border)',
        }}
        initial={{ opacity: 0, y: 20 }}
        animate={{ opacity: 1, y: 0 }}
        transition={{ duration: 0.4 }}
      >
        {/* Logo */}
        <div className="flex items-center justify-center gap-2 mb-8">
          <Activity className="w-8 h-8" style={{ color: 'var(--color-primary)' }} />
          <span className="text-xl font-bold">QA Workflow</span>
        </div>

        <AnimatePresence mode="wait">
          {mode === 'login' ? (
            <motion.div key="login" {...fadeVariants} transition={{ duration: 0.25 }}>
              <form onSubmit={handleSubmit} className="flex flex-col gap-4">
                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    이메일
                  </label>
                  <input
                    type="email"
                    value={email}
                    onChange={(e) => setEmail(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="email@example.com"
                    required
                  />
                </div>

                <div className="flex flex-col gap-1">
                  <label className="text-xs font-medium" style={{ color: 'var(--color-text-secondary)' }}>
                    비밀번호
                  </label>
                  <input
                    type="password"
                    value={password}
                    onChange={(e) => setPassword(e.target.value)}
                    className="w-full px-3 py-2.5 rounded-lg text-sm border-none outline-none"
                    style={{ backgroundColor: 'var(--color-bg)', color: 'var(--color-text)' }}
                    placeholder="비밀번호 입력"
                    required
                  />
                </div>

                {error && <ErrorMessage message={error} />}

                <button
                  type="submit"
                  disabled={loading}
                  className="flex items-center justify-center gap-2 w-full py-2.5 rounded-lg text-sm font-medium text-white transition-opacity hover:opacity-90 disabled:opacity-50 mt-2"
                  style={{ backgroundColor: 'var(--color-primary)' }}
                >
                  {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <LogIn className="w-4 h-4" />}
                  {loading ? '로그인 중...' : '로그인'}
                </button>
              </form>

              <div className="text-center mt-6">
                <span className="text-xs" style={{ color: 'var(--color-text-secondary)' }}>
                  계정이 없으신가요?{' '}
                </span>
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
              <SignupForm onSwitchToLogin={switchToLogin} />

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
                    <span className="font-semibold underline" style={{ color: 'var(--color-primary)' }}>
                      로그인
                    </span>
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
