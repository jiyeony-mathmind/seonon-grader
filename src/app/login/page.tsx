'use client';
import { useState, Suspense } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

function LoginForm() {
  const router = useRouter(); const params = useSearchParams();
  const [email, setEmail] = useState(''); const [pw, setPw] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const reason = params.get('reason');
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const { error } = await supabaseBrowser().auth.signInWithPassword({ email, password: pw });
    setBusy(false);
    if (error) { setErr('이메일 또는 비밀번호가 맞지 않습니다.'); return; }
    router.replace('/'); router.refresh();
  }
  return (
    <div className="login"><div className="card">
      <h1>서논술 채점실</h1><p className="muted small" style={{ margin: '4px 0 16px' }}>선생님 계정으로 로그인하세요</p>
      {reason === 'not_teacher' && <div className="err" style={{ marginBottom: 12 }}>선생님 명단에 등록되지 않은 계정입니다. 원장 선생님에게 등록을 요청하세요.</div>}
      <form className="form" onSubmit={submit}>
        <div><label htmlFor="email">이메일</label><input id="email" type="email" value={email} onChange={e => setEmail(e.target.value)} required autoComplete="email" /></div>
        <div><label htmlFor="pw">비밀번호</label><input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="current-password" /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn primary" disabled={busy}>{busy ? '확인 중…' : '로그인'}</button>
      </form>
      <p className="small muted" style={{ marginTop: 14 }}>처음이라면 초대 메일의 링크로 비밀번호를 먼저 설정하세요.</p>
    </div></div>
  );
}
export default function LoginPage() { return <Suspense><LoginForm /></Suspense>; }
