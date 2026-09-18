import Link from 'next/link';
import { supabaseServer } from '@/lib/supabase/server';
import type { Item } from '@/lib/types';
import { RubricPill, fmtDate } from '@/components/ui';
export const dynamic = 'force-dynamic';

export default async function ItemsPage() {
  const sb = await supabaseServer();
  const { data: items } = await sb.from('items').select('*').order('created_at', { ascending: false });
  const { data: counts } = await sb.from('answers').select('item_id');
  const cnt = (id: string) => (counts || []).filter(c => c.item_id === id).length;
  const its = (items || []) as Item[];
  return (
    <>
      <div className="view-head"><div><h1>문항·루브릭</h1><p className="lead">문항을 등록하면 AI가 서교연(2022) 루브릭 틀에 맞춰 총체적·분석적 루브릭 초안을 만듭니다. 선생님이 검토·수정·승인한 뒤에만 채점에 쓰입니다.</p></div>
        <Link className="btn primary" href="/items/new">새 문항</Link></div>
      {its.length ? <div className="tbl"><table><thead><tr><th>문항</th><th>학년·유형</th><th>루브릭</th><th>답안 수</th><th>등록일</th></tr></thead><tbody>
        {its.map(i => <tr key={i.id}><td><Link href={`/items/${i.id}`}><b>{i.title}</b></Link><div className="small muted">{i.standard}</div></td><td>{i.grade}학년 · {i.item_type}</td><td><RubricPill s={i.rubric_status} /></td><td className="num">{cnt(i.id)}</td><td className="num">{fmtDate(i.created_at)}</td></tr>)}
      </tbody></table></div> : <div className="empty">등록된 문항이 없습니다. "새 문항"으로 시작하세요.</div>}
    </>
  );
}
