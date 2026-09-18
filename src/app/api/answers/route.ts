import { guarded } from '../_util';
import { supabaseAdmin } from '@/lib/supabase/admin';
import { BUCKET } from '@/lib/images';
import { readAnswer } from '@/lib/pipeline';
export const maxDuration = 180;

/** ① 업로드 등록: 파일은 브라우저가 Supabase Storage 에 직접 올리고(RLS), 여기서는 answers 행 생성 + 즉시 판독 */
export async function POST(req: Request) {
  return guarded(async () => {
    const b = await req.json();
    const itemId = String(b.itemId || ''); const id = String(b.id || '');
    const images: string[] = Array.isArray(b.images) ? b.images.map(String) : [];
    if (!itemId) throw new Error('문항을 선택하세요');
    if (!/^an-[a-z0-9]+$/.test(id) || !images.length || images.some(p => !p.startsWith(id + '/'))) throw new Error('업로드 정보가 올바르지 않습니다');
    const admin = supabaseAdmin();
    const { error } = await admin.from('answers').insert({ id, item_id: itemId, student: String(b.student || ''), grade: String(b.grade || ''), klass: String(b.klass || ''), images, status: 'uploaded' });
    if (error) throw new Error('답안 저장 실패: ' + error.message);
    let readError: string | null = null;
    try { await readAnswer(id); } catch (e) { readError = String((e as any)?.message || e); }
    return { id, readError };
  });
}

/** 답안 삭제 (파일 포함) */
export async function DELETE(req: Request) {
  return guarded(async () => {
    const { answerId } = await req.json();
    const admin = supabaseAdmin();
    const { data } = await admin.from('answers').select('images').eq('id', answerId).single();
    if (data?.images?.length) await admin.storage.from(BUCKET).remove(data.images);
    const { error } = await admin.from('answers').delete().eq('id', answerId);
    if (error) throw new Error(error.message);
    return {};
  });
}
