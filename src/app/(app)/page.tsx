import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { Answer, Item } from '@/lib/types';
import { StatusPill, RubricPill, Lv } from '@/components/ui';

export const dynamic = 'force-dynamic';

export default async function Dashboard() {
  const sb = await supabaseServer();
  const [{ data: items }, { data: recent }, { data: stats }] = await Promise.all([
    sb.from('items').select('*').order('created_at', { ascending: false }),
    sb.from('answers').select('*').order('created_at', { ascending: false }).limit(8),
    sb.from('answer_stats').select('*').single(),
  ]);
  const its = (items || []) as Item[]; const rec = (recent || []) as Answer[];
  const st = (stats || { uploaded: 0, read: 0, graded: 0, reported: 0 }) as Record<string, number>;
  const itemOf = (id: string) => its.find(i => i.id === id);
  return (
    <>
      <div className="view-head"><div><h1>대시보드</h1><p className="lead">사진·PDF로 올린 답안이 판독 → 채점 → 리포트 → 학부모 발송까지 어디에 있는지 한눈에 봅니다.</p></div>
        <div className="row"><Link className="btn primary" href="/upload">답안 업로드</Link><Link className="btn" href="/items/new">문항 만들기</Link></div></div>
      <div className="grid c4">
        {[['업로드됨 · 판독 대기', st.uploaded], ['판독 완료 · 채점 대기', st.read], ['채점 완료 · 리포트 대기', st.graded], ['리포트 완료', st.reported]].map(([k, v]) => <div className="card stat" key={String(k)}><span className="k">{k}</span><span className="v num">{v}</span></div>)}
      </div>
      <div className="grid c2" style={{ marginTop: 14 }}>
        <div className="card">
          <div className="row between"><h3>최근 답안</h3><Link className="btn sm" href="/answers">전체 보기</Link></div>
          {rec.length ? <div className="tbl" style={{ marginTop: 10 }}><table><thead><tr><th>학생</th><th>문항</th><th>상태</th><th>총점</th><th>수준</th></tr></thead><tbody>
            {rec.map(a => <tr key={a.id}><td><Link href={`/answers/${a.id}`}><b>{a.student}</b></Link><div className="small muted">{a.grade}학년 {a.klass}반</div></td><td>{itemOf(a.item_id)?.title || '(삭제된 문항)'}</td><td><StatusPill s={a.status} /></td><td className="num">{a.total != null ? <>{a.total}<span className="muted">/100</span></> : '—'}</td><td>{a.level ? <Lv l={a.level} /> : '—'}</td></tr>)}
          </tbody></table></div> : <div className="empty" style={{ marginTop: 10 }}>아직 업로드된 답안이 없습니다.</div>}
        </div>
        <div className="card">
          <div className="row between"><h3>문항·루브릭</h3><Link className="btn sm" href="/items">관리</Link></div>
          <p className="small muted" style={{ marginTop: 4 }}>{its.length}개 문항 · 승인 대기 루브릭 {its.filter(i => i.rubric_status !== 'approved').length}개</p>
          <div className="stack" style={{ marginTop: 10 }}>{its.slice(0, 5).map(i => <div className="row between" key={i.id} style={{ padding: '6px 0', borderBottom: '1px solid var(--line)' }}><div><Link href={`/items/${i.id}`} style={{ fontWeight: 500, textDecoration: 'none' }}>{i.title}</Link><div className="small muted">{i.grade}학년 · {i.domain} · {i.item_type}</div></div><RubricPill s={i.rubric_status} /></div>)}{!its.length && <div className="empty">문항이 없습니다.</div>}</div>
        </div>
      </div>
      <div className="card" style={{ marginTop: 14 }}>
        <h3>흐름</h3><p className="small muted" style={{ margin: '4px 0 10px' }}>한 답안이 거치는 7단계. 루브릭은 문항당 한 번만 만들고 승인하면 같은 문항의 모든 답안에 재사용됩니다. 판독은 업로드 직후 자동으로 실행됩니다.</p>
        <div className="stepper" style={{ gridTemplateColumns: 'repeat(7,1fr)', margin: 0 }}>{['① 업로드', '② AI 판독', '③ 루브릭 생성', '④ 교사 승인', '⑤ 채점·분석', '⑥ 리포트 2종', '⑦ 학부모 링크'].map(s => <div className="s" key={s} style={{ cursor: 'default' }}><span className="small">{s}</span></div>)}</div>
      </div>
    </>
  );
}
