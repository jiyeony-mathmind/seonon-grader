'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';

export default function SetPasswordPage() {
  const router = useRouter();
  const [pw, setPw] = useState(''); const [pw2, setPw2] = useState(''); const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  async function submit(e: React.FormEvent) {
    e.preventDefault(); setErr('');
    if (pw.length < 8) { setErr('비밀번호는 8자 이상이어야 합니다.'); return; }
    if (pw !== pw2) { setErr('두 비밀번호가 다릅니다.'); return; }
    setBusy(true);
    const { error } = await supabaseBrowser().auth.updateUser({ password: pw });
    setBusy(false);
    if (error) { setErr('설정 실패: ' + error.message + ' (초대 링크가 만료되었으면 다시 초대를 요청하세요)'); return; }
    router.replace('/'); router.refresh();
  }
  return (
    <div className="login"><div className="card">
      <h1>비밀번호 설정</h1><p className="muted small" style={{ margin: '4px 0 16px' }}>앞으로 로그인에 사용할 비밀번호를 정하세요.</p>
      <form className="form" onSubmit={submit}>
        <div><label htmlFor="pw">새 비밀번호</label><input id="pw" type="password" value={pw} onChange={e => setPw(e.target.value)} required autoComplete="new-password" /></div>
        <div><label htmlFor="pw2">다시 입력</label><input id="pw2" type="password" value={pw2} onChange={e => setPw2(e.target.value)} required autoComplete="new-password" /></div>
        {err && <div className="err">{err}</div>}
        <button className="btn primary" disabled={busy}>{busy ? '저장 중…' : '저장하고 시작'}</button>
      </form>
    </div></div>
  );
}
