'use client';
import { useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Item, Rubric, Level } from '@/lib/types';
import { Lv, fmtDate } from './ui';
import { Confirm } from './Confirm';

const LV: Level[] = ['상', '중', '하'];

export function RubricEditor({ item }: { item: Item }) {
  const router = useRouter();
  const [draft, setDraft] = useState<Rubric | null>(null);          // 편집 중 사본
  const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const [confirm, setConfirm] = useState<null | { msg: string; yes: string; run: () => void }>(null);
  const r = draft || item.rubric;
  const ro = item.rubric_status === 'approved' && !draft;

  async function call(url: string, body: unknown, method = 'POST') {
    setErr(''); const res = await fetch(url, { method, headers: { 'Content-Type': 'application/json' }, body: JSON.stringify(body) }).then(r => r.json());
    if (!res.ok) throw new Error(res.error);
    return res;
  }
  async function generate() {
    setBusy('AI가 루브릭 초안을 만드는 중 (30초~1분)');
    try { await call('/api/rubric', { itemId: item.id }); setDraft(null); router.refresh(); } catch (e: any) { setErr(e.message); }
    setBusy('');
  }
  async function save(status: 'draft' | 'approved') {
    if (!r) return; setBusy('저장 중');
    try { await call('/api/items', { itemId: item.id, rubric: r, status }, 'PATCH'); setDraft(null); router.refresh(); } catch (e: any) { setErr(e.message); }
    setBusy('');
  }
  async function del() {
    try { await call('/api/items', { itemId: item.id }, 'DELETE'); router.push('/items'); router.refresh(); } catch (e: any) { setErr(e.message); }
  }
  const edit = () => setDraft(JSON.parse(JSON.stringify(item.rubric)));
  const upd = (fn: (d: Rubric) => void) => { const d: Rubric = JSON.parse(JSON.stringify(r)); fn(d); setDraft(d); };
  const cell = (v: string, on: (s: string) => void, rows = 2) => ro ? <span>{v}</span> : <textarea rows={rows} value={v} onChange={e => on(e.target.value)} style={{ fontSize: 12.5, minHeight: 0 }} />;

  return (
    <div className="card">
      <div className="row between"><h3>③ 루브릭 {item.rubric_status === 'approved' && <span className="pill r-approved">승인됨 · 채점에 사용 중</span>}{item.rubric_status === 'draft' && <span className="pill r-draft">④ 교사 검토 대기</span>}</h3>
        <div className="row">
          {r ? <button className="btn sm" disabled={!!busy} onClick={() => setConfirm({ msg: '현재 루브릭을 버리고 새로 생성할까요?', yes: '다시 생성', run: generate })}>다시 생성</button>
             : <button className="btn primary" disabled={!!busy} onClick={generate}>AI로 루브릭 초안 만들기</button>}
          <button className="btn danger sm" onClick={() => setConfirm({ msg: `"${item.title}" 문항을 삭제할까요? 연결된 답안이 있으면 삭제되지 않습니다.`, yes: '삭제', run: del })}>문항 삭제</button>
        </div></div>
      <p className="small muted" style={{ marginTop: 4 }}>서교연(2022) 공통 틀: 과제파악 10 · 내용 50 · 조직 20 · 표현 20 = 100점, 상/중/하 3수준. 기술문은 직접 고칠 수 있고, 승인해야 채점에 사용됩니다.</p>
      {busy && <div className="progress" style={{ marginTop: 10 }}><span className="spin" /> {busy}</div>}
      {err && <div className="err" style={{ marginTop: 10 }}>{err}</div>}
      {r && (
        <div style={{ marginTop: 14 }}>
          <h4>총체적 루브릭 (1차 채점 · 성취수준 판정)</h4>
          <div className="tbl" style={{ marginTop: 6 }}><table><thead><tr><th style={{ width: 60 }}>수준</th><th>기대수행정도</th></tr></thead><tbody>
            {LV.map(l => <tr key={l}><td><Lv l={l} /></td><td>{cell(r.holistic[l] || '', s => upd(d => { d.holistic[l] = s; }))}</td></tr>)}
          </tbody></table></div>
          <h4 style={{ marginTop: 16 }}>분석적 루브릭 (2차 채점 · 영역별 점수)</h4>
          <div className="tbl" style={{ marginTop: 6 }}><table><thead><tr><th>하위요소</th><th>상</th><th>중</th><th>하</th></tr></thead><tbody>
            {r.analytic.map((a, ai) => [
              <tr className="area-head" key={a.area}><td colSpan={4}>{a.area} [{a.area_score}]</td></tr>,
              ...a.subs.map((s, si) => <tr key={a.area + s.name}><td style={{ width: 120 }}><b>{s.name}</b></td>{LV.map((l, li) => { const lv = s.levels.find(x => x.level === l)!; return <td key={l}><div className="row" style={{ gap: 6, marginBottom: 4 }}><Lv l={l} /><b className="num">{lv.score}점</b></div>{cell(lv.descriptor, v => upd(d => { d.analytic[ai].subs[si].levels[li].descriptor = v; }))}</td>; })}</tr>),
            ])}
          </tbody></table></div>
          <details style={{ marginTop: 14 }}><summary>평가 의도 및 유의점 · 채점 예시 답안</summary>
            <div className="form" style={{ marginTop: 10 }}>
              <div><label>평가 의도</label>{cell(r.intent?.purpose || '', v => upd(d => { d.intent = { ...d.intent, purpose: v }; }))}</div>
              <div className="three">{(['처음', '가운데', '끝'] as const).map(k => <div key={k}><label>[{k}]</label>{cell(r.intent?.[k] || '', v => upd(d => { d.intent = { ...d.intent, [k]: v }; }))}</div>)}</div>
              <div><label>예시 답안 제목</label>{cell(r.model?.title || '', v => upd(d => { d.model = { ...d.model, title: v }; }), 1)}</div>
              {(['처음', '가운데', '끝'] as const).map(k => <div key={k}><label>[{k}]</label>{cell(r.model?.[k] || '', v => upd(d => { d.model = { ...d.model, [k]: v }; }), k === '가운데' ? 5 : 3)}</div>)}
            </div></details>
          <div className="row" style={{ marginTop: 14 }}>
            {ro ? <button className="btn" onClick={edit}>수정</button> : <>
              <button className="btn good" disabled={!!busy} onClick={() => save('approved')}>④ 검토 완료 · 승인</button>
              <button className="btn" disabled={!!busy} onClick={() => save('draft')}>초안으로 저장</button>
              {draft && <button className="btn" onClick={() => setDraft(null)}>취소</button>}
            </>}
            <span className="small muted">{item.approved_at && `승인 ${fmtDate(item.approved_at)}`} {item.rubric_source && `· 출처: ${item.rubric_source}`}</span>
          </div>
        </div>
      )}
      {confirm && <Confirm msg={confirm.msg} yes={confirm.yes} onYes={() => { const f = confirm.run; setConfirm(null); f(); }} onNo={() => setConfirm(null)} />}
    </div>
  );
}
