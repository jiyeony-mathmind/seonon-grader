import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import type { Item } from '@/lib/types';
import { RubricPill } from '@/components/ui';
import { RubricEditor } from '@/components/RubricEditor';
export const dynamic = 'force-dynamic';

export default async function ItemPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data } = await sb.from('items').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const it = data as Item;
  return (
    <>
      <div className="view-head"><div><Link className="btn sm" href="/items">← 문항 목록</Link><h1 style={{ marginTop: 8 }}>{it.title}</h1><p className="lead">{it.grade}학년 · {it.domain} · {it.item_type} <RubricPill s={it.rubric_status} /></p></div></div>
      <div className="card"><div className="kv"><span className="k">성취기준</span><span>{it.standard || '—'}</span><span className="k">문항</span><span>{it.prompt}</span><span className="k">조건</span><span>{it.conditions || '—'}</span></div></div>
      <RubricEditor item={it} />
    </>
  );
}
