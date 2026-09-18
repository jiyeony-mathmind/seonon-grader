import { guarded } from '../_util';
import { supabaseAdmin } from '@/lib/supabase/admin';

/** 문항 생성 */
export async function POST(req: Request) {
  return guarded(async () => {
    const b = await req.json();
    if (!b.title || !b.prompt) throw new Error('문항 주제와 본문을 입력하세요');
    const id = 'it-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
    const { error } = await supabaseAdmin().from('items').insert({ id, title: b.title, grade: b.grade || null, domain: b.domain || null, standard: b.standard || null, item_type: b.item_type === '서술형' ? '서술형' : '논술형', prompt: b.prompt, conditions: b.conditions || null, rubric: null, rubric_status: 'none' });
    if (error) throw new Error(error.message);
    return { id };
  });
}
/** 루브릭 저장(초안/승인) 또는 문항 삭제 */
export async function PATCH(req: Request) {
  return guarded(async () => {
    const { itemId, rubric, status } = await req.json();
    const patch: Record<string, unknown> = { rubric, rubric_status: status === 'approved' ? 'approved' : 'draft' };
    if (status === 'approved') patch.approved_at = new Date().toISOString();
    const { error } = await supabaseAdmin().from('items').update(patch).eq('id', itemId);
    if (error) throw new Error(error.message);
    return {};
  });
}
export async function DELETE(req: Request) {
  return guarded(async () => {
    const { itemId } = await req.json();
    const { count } = await supabaseAdmin().from('answers').select('id', { count: 'exact', head: true }).eq('item_id', itemId);
    if (count) throw new Error(`연결된 답안 ${count}건이 있어 삭제할 수 없습니다. 답안을 먼저 삭제하세요.`);
    const { error } = await supabaseAdmin().from('items').delete().eq('id', itemId);
    if (error) throw new Error(error.message);
    return {};
  });
}
