import Link from 'next/link';
import { notFound } from 'next/navigation';
import { supabaseServer } from '@/lib/supabase/server';
import { signedUrls } from '@/lib/images';
import type { Answer, Item } from '@/lib/types';
import { StatusPill } from '@/components/ui';
import { AnswerWorkflow } from '@/components/AnswerWorkflow';
export const dynamic = 'force-dynamic';

export default async function AnswerPage({ params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  const sb = await supabaseServer();
  const { data } = await sb.from('answers').select('*').eq('id', id).maybeSingle();
  if (!data) notFound();
  const a = data as Answer;
  const { data: itemRow } = await sb.from('items').select('*').eq('id', a.item_id).maybeSingle();
  const it = (itemRow || null) as Item | null;
  const urls = await signedUrls(a.images || []);
  const site = process.env.NEXT_PUBLIC_SITE_URL || '';
  return (
    <>
      <div className="view-head"><div><Link className="btn sm" href="/answers">← 답안 목록</Link><h1 style={{ marginTop: 8 }}>{a.student} <span className="muted" style={{ fontWeight: 400, fontSize: 15 }}>{a.grade}학년 {a.klass}반</span></h1><p className="lead">{it?.title || '(삭제된 문항)'} · <StatusPill s={a.status} /></p></div></div>
      <AnswerWorkflow a={a} it={it} imageUrls={urls} parentUrl={`${site}/report/${a.parent_token}`} />
    </>
  );
}
