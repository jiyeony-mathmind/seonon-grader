'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';

export default function NewItemPage() {
  const router = useRouter();
  const [f, setF] = useState({ title: '', grade: '5', item_type: '논술형', domain: '', standard: '', prompt: '', conditions: '단, 답안은 처음-가운데-끝의 구조로 글을 쓰고, 반드시 글의 제목을 쓴다.' });
  const [err, setErr] = useState(''); const [busy, setBusy] = useState(false);
  const set = (k: string, v: string) => setF({ ...f, [k]: v });
  async function save(e: React.FormEvent) {
    e.preventDefault(); setBusy(true); setErr('');
    const r = await fetch('/api/items', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(f) }).then(r => r.json());
    setBusy(false);
    if (!r.ok) { setErr(r.error); return; }
    router.push(`/items/${r.id}`); router.refresh();
  }
  return (
    <>
      <div className="view-head"><div><h1>새 문항 등록</h1><p className="lead">학생에게 제시한 문항을 그대로 입력합니다. 저장 후 루브릭을 생성합니다.</p></div></div>
      <form className="card form" onSubmit={save}>
        <div className="three">
          <div><label htmlFor="title">문항 주제</label><input id="title" value={f.title} onChange={e => set('title', e.target.value)} placeholder="예: 분모가 다른 분수의 크기 비교하기" required /></div>
          <div><label htmlFor="grade">학년</label><select id="grade" value={f.grade} onChange={e => set('grade', e.target.value)}>{['3', '4', '5', '6', '중1', '중2', '중3'].map(g => <option key={g}>{g}</option>)}</select></div>
          <div><label htmlFor="type">문항 유형</label><select id="type" value={f.item_type} onChange={e => set('item_type', e.target.value)}><option>논술형</option><option>서술형</option></select></div>
        </div>
        <div className="two">
          <div><label htmlFor="domain">영역·단원</label><input id="domain" value={f.domain} onChange={e => set('domain', e.target.value)} placeholder="예: 수와 연산" /></div>
          <div><label htmlFor="std">성취기준</label><input id="std" value={f.standard} onChange={e => set('standard', e.target.value)} placeholder="예: [6수01-07] 분모가 다른 분수의 크기를 비교할 수 있다." /></div>
        </div>
        <div><label htmlFor="prompt">문항 본문</label><textarea id="prompt" value={f.prompt} onChange={e => set('prompt', e.target.value)} rows={5} required /></div>
        <div><label htmlFor="cond">조건</label><input id="cond" value={f.conditions} onChange={e => set('conditions', e.target.value)} /></div>
        {err && <div className="err">{err}</div>}
        <div className="row"><button className="btn primary" disabled={busy}>{busy ? '저장 중…' : '저장'}</button><button type="button" className="btn" onClick={() => router.back()}>취소</button></div>
      </form>
    </>
  );
}
