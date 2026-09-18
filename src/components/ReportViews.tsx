import type { Answer, Item, TeacherReport, ParentReport } from '@/lib/types';
import { AREA_ORDER } from '@/lib/rubricFrame';
import { Lv, fmtDate } from './ui';

const maxOf = (sub: string) => AREA_ORDER.find(x => x.sub === sub)?.scores.상 ?? '';

export function TeacherReportView({ a, it, t }: { a: Answer; it: Item | null; t: TeacherReport }) {
  const g = a.grading; const tr = a.transcription;
  return (
    <div className="report">
      <h2>논술형 채점 보고서 — 교사용</h2>
      <div className="meta">{a.grade}학년 {a.klass}반 {a.student} · {it?.title} · {fmtDate(a.reported_at || a.graded_at)}</div>
      <div className="lead-s">{t.summary}</div>
      <h3>채점 결과</h3>
      <div className="kv"><span className="k">총점</span><span className="num"><b>{g?.total}</b> / 100</span><span className="k">총체적 수준</span><span>{g && <Lv l={g.holistic.level} />}</span><span className="k">영역별</span><span>{g?.scores.map(s => `${s.sub} ${s.level}(${s.score})`).join(' · ')}</span></div>
      <h3>답안 전사</h3>
      <div className="kv"><span className="k">제목</span><span>{tr?.title}</span><span className="k">처음</span><span style={{ whiteSpace: 'pre-wrap' }}>{tr?.intro}</span><span className="k">가운데</span><span style={{ whiteSpace: 'pre-wrap' }}>{tr?.body}</span><span className="k">끝</span><span style={{ whiteSpace: 'pre-wrap' }}>{tr?.conclusion}</span></div>
      <h3>답안 분석</h3>
      <ul>{(t.analysis || []).map((x, i) => <li key={i}><b>{x.type}</b> — {x.text}</li>)}</ul>
      <h3>지도 방향</h3>
      <ul>{(t.guidance || []).map((x, i) => <li key={i}><b>{x.title}</b><br />{x.what}<br /><span className="muted">방법: {x.how}</span></li>)}</ul>
      <h3>연습시킬 것</h3>
      <div className="tbl"><table><thead><tr><th>연습</th><th>방법</th><th>횟수</th></tr></thead><tbody>{(t.practice || []).map((p, i) => <tr key={i}><td><b>{p.name}</b></td><td>{p.method}</td><td>{p.frequency}</td></tr>)}</tbody></table></div>
      <h3>재평가 문항 (예시)</h3>
      <p>{t.reassessment?.prompt}</p>
      <p className="muted small" style={{ marginTop: 6 }}>확인 포인트: {(t.reassessment?.check_points || []).join(' / ')}</p>
    </div>
  );
}

export function ParentReportView({ a, it, p }: { a: Answer; it: Item | null; p: ParentReport }) {
  const g = a.grading;
  return (
    <div className="report">
      <h2>수학 논술형 평가 결과 안내</h2>
      <div className="meta">{a.grade}학년 {a.klass}반 {a.student} 학생 · {it?.title} · {fmtDate(a.reported_at || a.graded_at)}</div>
      <div className="lead-s">{p.summary}</div>
      <h3>평가 결과</h3>
      <div className="kv"><span className="k">총점</span><span className="num"><b>{g?.total}</b> / 100</span><span className="k">성취수준</span><span>{g && <Lv l={g.holistic.level} />}</span></div>
      <div className="tbl" style={{ marginTop: 8 }}><table><thead><tr><th>평가 요소</th><th style={{ textAlign: 'right' }}>점수</th></tr></thead><tbody>{(g?.scores || []).map((s, i) => <tr key={i}><td>{s.area} · {s.sub}</td><td className="num" style={{ textAlign: 'right' }}>{s.score} / {maxOf(s.sub)}</td></tr>)}</tbody></table></div>
      <h3>잘한 점</h3>
      <ul>{(p.strengths || []).map((x, i) => <li key={i}><b>{x.title}</b> {x.text}</li>)}</ul>
      <h3>연습이 필요한 점</h3>
      <ul>{(p.practice || []).map((x, i) => <li key={i}><b>{x.title}</b> {x.text}</li>)}</ul>
    </div>
  );
}
