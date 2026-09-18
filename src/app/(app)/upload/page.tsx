import { supabaseServer } from '@/lib/supabase/server';
import type { Item } from '@/lib/types';
import { Uploader } from '@/components/Uploader';
export const dynamic = 'force-dynamic';

export default async function UploadPage({ searchParams }: { searchParams: Promise<{ item?: string }> }) {
  const { item } = await searchParams;
  const sb = await supabaseServer();
  const { data } = await sb.from('items').select('id,title,grade,item_type').order('created_at', { ascending: false });
  return (
    <>
      <div className="view-head"><div><h1>① 답안 업로드</h1><p className="lead">답안지 사진(JPG·PNG) 또는 PDF를 올립니다. 저장 즉시 AI 판독이 실행되고, 사진은 손글씨가 뭉개지지 않도록 세로로 나눠 전달됩니다.</p></div></div>
      <Uploader items={(data || []) as Pick<Item, 'id' | 'title' | 'grade' | 'item_type'>[]} defaultItem={item} />
    </>
  );
}
