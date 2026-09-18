import { supabaseAdmin } from './supabase/admin';
import { askJSON } from './claude';
import { prepareFiles } from './images';
import { readPrompt, rubricPrompt, gradePrompt, reportsPrompt } from './prompts';
import { normalizeRubric, normalizeGrading } from './normalize';
import type { Item, Answer, Transcription, Grading } from './types';

const now = () => new Date().toISOString();

async function getItem(id: string): Promise<Item> {
  const { data, error } = await supabaseAdmin().from('items').select('*').eq('id', id).single();
  if (error || !data) throw new Error('문항을 찾을 수 없습니다');
  return data as Item;
}
async function getAnswer(id: string): Promise<Answer> {
  const { data, error } = await supabaseAdmin().from('answers').select('*').eq('id', id).single();
  if (error || !data) throw new Error('답안을 찾을 수 없습니다');
  return data as Answer;
}
async function recordError(answerId: string, step: string, e: unknown) {
  await supabaseAdmin().from('answers').update({ last_error: { step, message: String((e as any)?.message || e), at: now() } }).eq('id', answerId);
}

/* ③ 루브릭 초안 생성 → draft 저장 */
export async function generateRubric(itemId: string) {
  const it = await getItem(itemId);
  const { data, model } = await askJSON(rubricPrompt(it), [], 6000);
  const rubric = normalizeRubric(data, it.item_type);
  const { error } = await supabaseAdmin().from('items').update({ rubric, rubric_status: 'draft', rubric_source: `AI 초안 · 서교연(2022) 틀 · ${model}`, approved_at: null }).eq('id', itemId);
  if (error) throw new Error(error.message);
  return rubric;
}

/* ② 판독: Storage 이미지 → Claude → transcription 저장, status=read */
export async function readAnswer(answerId: string) {
  const a = await getAnswer(answerId);
  const it = await getItem(a.item_id).catch(() => null);
  try {
    if (!a.images?.length) throw new Error('저장된 답안지 파일이 없습니다');
    const { files, layout } = await prepareFiles(a.images);
    const { data, model } = await askJSON(readPrompt(it, layout), files, 4000);
    const t: Transcription = { title: data.title || '', intro: data.intro || '', body: data.body || '', conclusion: data.conclusion || '', notes: data.notes || '', confidence: data.confidence || '', read_at: now() };
    const patch: Record<string, unknown> = { transcription: t, read_at: now(), last_error: null, status: a.status === 'uploaded' ? 'read' : a.status };
    if ((!a.student || a.student === '(이름 확인 중)') && data.student_name) patch.student = data.student_name;
    if (!a.student && !data.student_name) patch.student = '이름 미상';
    if (!a.grade && data.grade) patch.grade = String(data.grade);
    if (!a.klass && data.class) patch.klass = String(data.class);
    const { error } = await supabaseAdmin().from('answers').update(patch).eq('id', answerId);
    if (error) throw new Error(error.message);
    return { transcription: t, model };
  } catch (e) { await recordError(answerId, 'read', e); throw e; }
}

/* ⑤ 채점: 승인 루브릭 + 전사 → grading 저장, status=graded (리포트 초기화) */
export async function gradeAnswer(answerId: string) {
  const a = await getAnswer(answerId);
  const it = await getItem(a.item_id);
  if (!it.rubric || it.rubric_status !== 'approved') throw new Error('이 문항의 루브릭이 아직 승인되지 않았습니다');
  if (!a.transcription) throw new Error('먼저 판독을 완료하세요');
  try {
    const { data, model } = await askJSON(gradePrompt(it, a.transcription), [], 5000);
    const g: Grading = normalizeGrading(data);
    const { error } = await supabaseAdmin().from('answers').update({ grading: g, status: 'graded', graded_at: now(), reports: null, reported_at: null, sent_at: null, last_error: null }).eq('id', answerId);
    if (error) throw new Error(error.message);
    return { grading: g, model };
  } catch (e) { await recordError(answerId, 'grade', e); throw e; }
}

/* ⑥ 리포트 2종 → reports 저장, status=reported */
export async function makeReports(answerId: string) {
  const a = await getAnswer(answerId);
  const it = await getItem(a.item_id);
  if (!a.grading) throw new Error('먼저 채점을 완료하세요');
  try {
    const { data, model } = await askJSON(reportsPrompt(it, a, a.grading), [], 6000);
    if (!data?.teacher || !data?.parent) throw new Error('리포트 형식이 올바르지 않습니다. 다시 시도해 주세요.');
    const { error } = await supabaseAdmin().from('answers').update({ reports: { teacher: data.teacher, parent: data.parent }, status: 'reported', reported_at: now(), last_error: null }).eq('id', answerId);
    if (error) throw new Error(error.message);
    return { reports: { teacher: data.teacher, parent: data.parent }, model };
  } catch (e) { await recordError(answerId, 'report', e); throw e; }
}
