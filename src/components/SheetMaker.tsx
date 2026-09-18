'use client';
import { useState } from 'react';
import type { Answer, Item } from '@/lib/types';

/** 재평가 답안지 만들기: 업로드 답안지와 같은 양식에 문항만 바꿔 PDF (서버에서 한글 글꼴 내장, 텍스트 복사 가능) */
export function SheetMaker({ a, it }: { a: Answer; it: Item | null }) {
  const t = a.reports?.teacher;
  const [open, setOpen] = useState(false); const [busy, setBusy] = useState(false); const [err, setErr] = useState('');
  const [d, setD] = useState({ prompt: t?.reassessment?.prompt || '', grade: a.grade || it?.grade || '', klass: a.klass || '', student: a.student || '', standard: it?.standard || '', domain: it?.domain || '', conditions: it?.conditions || '단, 답안은 처음-가운데-끝의 구조로 글을 쓰고, 반드시 글의 제목을 쓴다.', item_type: it?.item_type || '논술형' });
  const set = (k: string, v: string) => setD({ ...d, [k]: v });
  async function download() {
    setBusy(true); setErr('');
    try {
      const res = await fetch('/api/sheet-pdf', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ ...d, sgrade: d.grade }) });
      if (!res.ok) throw new Error((await res.json().catch(() => ({}))).error || 'PDF 생성 실패');
      const blob = await res.blob(); const url = URL.createObjectURL(blob);
      const link = document.createElement('a'); link.href = url; link.download = `${d.student || '빈양식'}_재평가_답안지.pdf`; link.click(); URL.revokeObjectURL(url);
    } catch (e: any) { setErr(e.message); }
    setBusy(false);
  }
  if (!open) return <div className="row" style={{ marginTop: 12 }}><button className="btn primary sm" onClick={() => setOpen(true)}>이 문항으로 재평가 답안지 만들기</button><span className="small muted">업로드한 답안지와 같은 양식에 문항만 바꿔 PDF로 내려받습니다.</span></div>;
  return (
    <div className="card" style={{ marginTop: 12, background: 'var(--panel-2)', border: 0 }}>
      <h4>재평가 답안지</h4>
      <div className="form" style={{ marginTop: 10 }}>
        <div><label htmlFor="shPrompt">문항 (수정 가능)</label><textarea id="shPrompt" rows={4} value={d.prompt} onChange={e => set('prompt', e.target.value)} /></div>
        <div className="three">
          <div><label htmlFor="shGrade">학년</label><input id="shGrade" value={d.grade} onChange={e => set('grade', e.target.value)} /></div>
          <div><label htmlFor="shKlass">반</label><input id="shKlass" value={d.klass} onChange={e => set('klass', e.target.value)} /></div>
          <div><label htmlFor="shName">이름 (비우면 빈칸)</label><input id="shName" value={d.student} onChange={e => set('student', e.target.value)} /></div>
        </div>
        <div className="two">
          <div><label htmlFor="shStd">성취기준 (머리글)</label><input id="shStd" value={d.standard} onChange={e => set('standard', e.target.value)} /></div>
          <div><label htmlFor="shCond">조건</label><input id="shCond" value={d.conditions} onChange={e => set('conditions', e.target.value)} /></div>
        </div>
        {err && <div className="err">{err}</div>}
        <div className="row"><button className="btn primary" disabled={busy} onClick={download}>{busy ? '만드는 중…' : '답안지 PDF 내려받기'}</button><button className="btn" onClick={() => setOpen(false)}>닫기</button></div>
      </div>
    </div>
  );
}
