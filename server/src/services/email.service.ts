// ============================================================
// 이메일 발송 서비스
// Resend API 키가 있으면 실제 발송, 없으면 콘솔 로그 폴백
// ============================================================

export async function sendVerificationEmail(email: string, code: string): Promise<void> {
  const apiKey = process.env.RESEND_API_KEY;

  if (!apiKey) {
    console.log(`[EMAIL-DEV] 인증코드: ${code} → ${email}`);
    return;
  }

  const res = await fetch('https://api.resend.com/emails', {
    method: 'POST',
    headers: {
      'Authorization': `Bearer ${apiKey}`,
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({
      from: process.env.EMAIL_FROM || 'QA Workflow <onboarding@resend.dev>',
      to: email,
      subject: '[QA Workflow] 이메일 인증 코드',
      html: `<div style="font-family: sans-serif; padding: 20px;">
        <h2>QA Workflow 이메일 인증</h2>
        <p>아래 6자리 코드를 입력해주세요:</p>
        <div style="font-size: 32px; font-weight: bold; letter-spacing: 8px; padding: 20px; background: #f0f0f0; text-align: center; border-radius: 8px;">${code}</div>
        <p style="color: #666; margin-top: 16px;">이 코드는 10분간 유효합니다.</p>
      </div>`,
    }),
  });

  if (!res.ok) {
    const errorText = await res.text();
    console.error('[EMAIL] Resend 발송 실패:', errorText);
    console.log(`[EMAIL-FALLBACK] 인증코드: ${code} → ${email}`);
    // 발송 실패해도 에러를 던지지 않음 — 로그에서 코드 확인 가능
    return;
  }
}
