'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import type { Answer, Item, Transcription } from '@/lib/types';
import { Lv, fmtDate } from './ui';
import { Confirm } from './Confirm';
import { TeacherReportView, ParentReportView } from './ReportViews';
import { SheetMaker } from './SheetMaker';
import { supabaseBrowser } from '@/lib/supabase/client';

const stepOf = (a: Answer) => ({ uploaded: 1, read: 2, graded: 3, reported: 4 }[a.status] || 1);

export function AnswerWorkflow({ a, it, imageUrls, parentUrl }: { a: Answer; it: Item | null; imageUrls: string[]; parentUrl: string }) {
  const router = useRouter();
  const maxStep = stepOf(a);
  const [step, setStep] = useState(maxStep);
  const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const [trans, setTrans] = useState<Transcription | null>(null);   // 편집 중 사본
  const [tab, setTab] = useState<'teacher' | 'parent'>('teacher');
  const [confirm, setConfirm] = useState<null | { msg: string; yes: string; run: () => void }>(null);

  async function call(url: string, body: unknown, method = 'POST') {
    setErr(''); const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
    if (!res.ok) throw new Error(res.error); return res;
  }
  const run = (label: string, url: string, after?: () => void) => async () => {
    setBusy(label);
    try { await call(url, { answerId: a.id }); after?.(); router.refresh(); } catch (e: any) { setErr(e.message); }
    setBusy('');
  };
  const doRead = run('AI가 답안을 읽는 중 (30초~1분)', '/api/read', () => setStep(1));
  const doGrade = run('루브릭에 따라 채점하는 중 (30초~1분)', '/api/grade', () => setStep(2));
  const doReports = run('교사용·학부모용 리포트를 쓰는 중 (1분 내외)', '/api/reports', () => { setStep(3); setTab('teacher'); });
  async function saveTrans() {
    if (!trans) return; setBusy('저장 중');
    const sb = supabaseBrowser();
    const { error } = await sb.from('answers').update({ transcription: { ...trans, edited_by_teacher: true }, status: a.status === 'uploaded' ? 'read' : a.status }).eq('id', a.id);
    setBusy(''); if (error) { setErr(error.message); return; }
    setTrans(null); setStep(2); router.refresh();
  }
  async function markSent() { await supabaseBrowser().from('answers').update({ sent_at: new Date().toISOString() }).eq('id', a.id); router.refresh(); }
  async function del() { try { await call('/api/answers', { answerId: a.id }, 'DELETE'); router.push('/answers'); router.refresh(); } catch (e: any) { setErr(e.message); } }

  const t = trans || a.transcription;
  const ro = !!a.transcription && !trans;
  const rubricOk = !!it?.rubric && it.rubric_status === 'approved';
  const steps = ['② AI 판독', '⑤ 채점·분석', '⑥ 리포트', '⑦ 학부모 링크'];
  const fld = (k: keyof Transcription, rows = 2) => ro ? <div className="pre">{(t?.[k] as string) || <span className="muted">—</span>}</div>
    : <textarea rows={rows} value={(t?.[k] as string) || ''} onChange={e => setTrans({ ...(t as Transcription), [k]: e.target.value })} />;

  return (
    <>
      <div className="stepper">{steps.map((s, i) => { const n = i + 1; const cls = n < maxStep ? 'done' : n === step ? 'cur' : n > maxStep ? 'lock' : ''; return <div key={n} className={`s ${cls} ${n === step && n <= maxStep ? 'cur' : ''}`} onClick={() => { if (n <= maxStep) setStep(n); }}><span className="i">{n < maxStep ? '✓' : n}</span><span>{s}</span></div>; })}</div>
      <div className="detail">
        <div>
          {busy && <div className="progress" style={{ marginBottom: 10 }}><span className="spin" /> {busy}</div>}
          {err && <div className="err" style={{ marginBottom: 10 }}>{err}</div>}

          {step === 1 && <div className="card">
            <div className="row between"><h3>② AI 판독 (전사)</h3><div className="row">
              {!a.transcription && <button className="btn primary" disabled={!!busy} onClick={doRead}>AI로 답안 읽기</button>}
              {a.transcription && ro && <><button className="btn sm" onClick={() => setTrans(JSON.parse(JSON.stringify(a.transcription)))}>수정</button><button className="btn sm" disabled={!!busy} onClick={() => setConfirm({ msg: '다시 판독하면 현재 전사 내용이 바뀝니다. 계속할까요?', yes: '다시 판독', run: doRead })}>다시 판독</button></>}
            </div></div>
            <p className="small muted" style={{ marginTop: 4 }}>학생이 쓴 그대로 옮깁니다. 틀린 답도 고치지 않으며, 못 읽는 부분은 [판독 불가]로 표시합니다. 확인·수정한 뒤 채점으로 넘어가세요.</p>
            {!a.transcription && a.last_error?.step === 'read' && <div className="err" style={{ marginTop: 10 }}>마지막 판독 실패 ({fmtDate(a.last_error.at)}): {a.last_error.message}</div>}
            {t ? <div className="trans" style={{ marginTop: 14 }}>
              <div className="f"><span className="k">제목</span>{fld('title', 1)}</div>
              <div className="f"><span className="k">처음</span>{fld('intro', 3)}</div>
              <div className="f"><span className="k">가운데</span>{fld('body', 6)}</div>
              <div className="f"><span className="k">끝</span>{fld('conclusion', 2)}</div>
              <div className="f"><span className="k">판독 메모</span>{fld('notes', 2)}</div>
              <div className="row between" style={{ marginTop: 6 }}><span className="small muted">판독 신뢰도: <b>{t.confidence || '—'}</b>{t.edited_by_teacher && ' · 교사 수정됨'}</span>
                <div className="row">{ro ? <button className="btn primary" onClick={() => setStep(2)}>채점으로 →</button> : <><button className="btn primary" disabled={!!busy} onClick={saveTrans}>판독 확정</button>{a.transcription && <button className="btn" onClick={() => setTrans(null)}>취소</button>}</>}</div></div>
            </div> : !busy && <div className="empty" style={{ marginTop: 14 }}>아직 판독하지 않았습니다.</div>}
          </div>}

          {step === 2 && <div className="card">
            <div className="row between"><h3>⑤ 채점·평가·분석</h3>
              {!a.grading ? <button className="btn primary" disabled={!!busy || !rubricOk} onClick={doGrade}>승인된 루브릭으로 채점</button>
                : <button className="btn sm" disabled={!!busy} onClick={() => setConfirm({ msg: '다시 채점하면 기존 채점과 리포트가 바뀝니다. 계속할까요?', yes: '다시 채점', run: doGrade })}>다시 채점</button>}</div>
            {!rubricOk && <div className="banner" style={{ marginTop: 10 }}>이 문항의 루브릭이 아직 승인되지 않았습니다. <Link href={`/items/${it?.id}`}>문항으로 이동해 ③ 생성 → ④ 승인</Link>을 먼저 마쳐 주세요.</div>}
            {a.grading && <GradeView a={a} onNext={() => setStep(3)} />}
          </div>}

          {step === 3 && <div className="card">
            <div className="row between"><h3>⑥ 리포트 2종</h3>
              {!a.reports ? <button className="btn primary" disabled={!!busy} onClick={doReports}>교사용·학부모용 리포트 생성</button>
                : <button className="btn sm" disabled={!!busy} onClick={() => setConfirm({ msg: '리포트를 다시 생성할까요?', yes: '다시 생성', run: doReports })}>다시 생성</button>}</div>
            <p className="small muted" style={{ marginTop: 4 }}>교사용에는 지도 방향(가르칠 것·연습시킬 것·재평가 문항)이, 학부모용에는 잘한 점과 연습이 필요한 점이 들어갑니다.</p>
            {a.reports && <>
              <div className="tabs" style={{ marginTop: 14 }}><button className={tab === 'teacher' ? 'on' : ''} onClick={() => setTab('teacher')}>교사용</button><button className={tab === 'parent' ? 'on' : ''} onClick={() => setTab('parent')}>학부모용</button></div>
              {tab === 'teacher' ? <><TeacherReportView a={a} it={it} t={a.reports.teacher} /><SheetMaker a={a} it={it} /></> : <ParentReportView a={a} it={it} p={a.reports.parent} />}
              <div className="row between" style={{ marginTop: 14 }}><span className="small muted">{fmtDate(a.reported_at)}</span><button className="btn primary" onClick={() => setStep(4)}>학부모 발송으로 →</button></div>
            </>}
          </div>}

          {step === 4 && <div className="card">
            <h3>⑦ 학부모 리포트 발송</h3>
            <p className="small muted" style={{ marginTop: 4 }}>아래 링크를 카카오톡·문자로 보내면 학부모가 로그인 없이 리포트를 봅니다. 링크는 추측할 수 없는 고유 주소입니다.</p>
            {a.reports ? <>
              <div className="row" style={{ marginTop: 12 }}><input readOnly value={parentUrl} onFocus={e => e.currentTarget.select()} /><button className="btn primary" onClick={async () => { try { await navigator.clipboard.writeText(parentUrl); alert('링크를 복사했습니다'); } catch { /* ignore */ } }}>링크 복사</button><a className="btn" href={parentUrl} target="_blank" rel="noreferrer">미리보기</a></div>
              <div style={{ marginTop: 14 }}><ParentReportView a={a} it={it} p={a.reports.parent} /></div>
              <div className="row" style={{ marginTop: 12 }}>{a.sent_at ? <div className="ok">발송 기록: {fmtDate(a.sent_at)}</div> : <button className="btn sm" onClick={markSent}>발송 완료로 표시</button>}</div>
            </> : <div className="empty" style={{ marginTop: 14 }}>먼저 ⑥ 리포트를 생성하세요.</div>}
          </div>}

          <div className="row" style={{ marginTop: 14 }}><button className="btn danger sm" onClick={() => setConfirm({ msg: `${a.student} 학생의 답안을 삭제할까요? 파일까지 삭제되며 되돌릴 수 없습니다.`, yes: '삭제', run: del })}>답안 삭제</button></div>
        </div>
        <div className="sheet"><div className="card" style={{ padding: 10 }}><div className="row between" style={{ marginBottom: 8 }}><b className="small">답안지 원본</b><span className="small muted">{imageUrls.length}장</span></div>
          {imageUrls.map((u, i) => (a.images[i] || '').endsWith('.pdf') ? <a key={i} className="btn sm" href={u} target="_blank" rel="noreferrer">PDF {i + 1} 열기</a> : <img key={i} alt="답안지" src={u} />)}
          {!imageUrls.length && <div className="empty small">이미지 없음</div>}</div></div>
      </div>
      {confirm && <Confirm msg={confirm.msg} yes={confirm.yes} onYes={() => { const f = confirm.run; setConfirm(null); f(); }} onNo={() => setConfirm(null)} />}
    </>
  );
}

function GradeView({ a, onNext }: { a: Answer; onNext: () => void }) {
  const g = a.grading!; const st = g.structure || {};
  return (
    <div style={{ marginTop: 14 }}>
      <div className="grid c3">
        <div className="card stat" style={{ background: 'var(--panel-2)', border: 0 }}><span className="k">총점</span><span className="v num">{g.total}<span className="muted" style={{ fontSize: 14, fontWeight: 400 }}>/100</span></span></div>
        <div className="card stat" style={{ background: 'var(--panel-2)', border: 0 }}><span className="k">총체적 수준 (1차)</span><span className="v"><Lv l={g.holistic.level} big /></span></div>
        <div className="card stat" style={{ background: 'var(--panel-2)', border: 0 }}><span className="k">글 구조</span><span className="v" style={{ fontSize: 14, fontWeight: 500, lineHeight: 1.8 }}>{(['title', 'intro', 'body', 'conclusion'] as const).map((k, i) => <span key={k} className={`pill ${st[k] ? 's-reported' : 'r-none'}`} style={{ marginRight: 4 }}>{['제목', '처음', '가운데', '끝'][i]}</span>)}</span></div>
      </div>
      <p style={{ marginTop: 12 }} className="evid"><b>수준 판정 근거:</b> {g.holistic.reason}</p>
      <h4 style={{ marginTop: 16 }}>분석적 채점 (2차)</h4>
      <div className="tbl scores" style={{ marginTop: 6 }}><table><thead><tr><th>영역 / 하위요소</th><th style={{ width: 60 }}>수준</th><th style={{ width: 60, textAlign: 'right' }}>점수</th><th>근거 (답안 인용 · 판단)</th></tr></thead><tbody>
        {g.scores.map(s => <tr key={s.sub}><td><span className="small muted">{s.area}</span><br /><b>{s.sub}</b></td><td><Lv l={s.level} /></td><td className="sc num">{s.score}</td><td className="evid">{s.evidence && <>“{s.evidence}”<br /></>}{s.comment}</td></tr>)}
      </tbody><tfoot><tr><td colSpan={2}><b>합계</b></td><td className="sc num">{g.total}</td><td /></tr></tfoot></table></div>
      <div className="grid c2" style={{ marginTop: 14 }}>
        <div><h4>강점</h4><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{g.strengths.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
        <div><h4>약점</h4><ul style={{ margin: '6px 0 0', paddingLeft: 18 }}>{g.weaknesses.map((x, i) => <li key={i}>{x}</li>)}</ul></div>
      </div>
      <div style={{ marginTop: 12 }}><h4>오개념</h4><p style={{ marginTop: 4 }}>{g.misconceptions.length ? g.misconceptions.join(' · ') : <span className="muted">발견되지 않음</span>}</p></div>
      {g.illegible_impact !== 'none' && <div className="banner" style={{ marginTop: 12 }}>판독 불가 구간이 채점에 {g.illegible_impact === 'major' ? '크게' : '일부'} 영향을 주었습니다. {g.notes} 원본을 확인해 주세요.</div>}
      <div className="row between" style={{ marginTop: 14 }}><span className="small muted">{fmtDate(a.graded_at)}</span><button className="btn primary" onClick={onNext}>리포트 생성으로 →</button></div>
    </div>
  );
}
