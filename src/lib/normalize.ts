import { FRAME, AREA_ORDER, LEVELS } from './rubricFrame';
import type { Rubric, Grading, ItemType, Level } from './types';

export function parseJSON(text: string): any {
  const t = String(text || '').trim();
  try { return JSON.parse(t); } catch { /* continue */ }
  const m = t.match(/```(?:json)?\s*([\s\S]*?)```/);
  if (m) { try { return JSON.parse(m[1]); } catch { /* continue */ } }
  const i = t.indexOf('{'), j = t.lastIndexOf('}');
  if (i >= 0 && j > i) { try { return JSON.parse(t.slice(i, j + 1)); } catch { /* continue */ } }
  throw new Error('AI 응답에서 JSON을 찾지 못했습니다');
}

const lv = (x: unknown): Level => (LEVELS as string[]).includes(String(x)) ? (x as Level) : '중';

export function normalizeRubric(d: any, type: ItemType): Rubric {
  const r: Rubric = { holistic: { 상: d?.holistic?.상 || '', 중: d?.holistic?.중 || '', 하: d?.holistic?.하 || '' }, analytic: [], intent: d?.intent || {}, model: d?.model || {} };
  for (const a of FRAME.areas) {
    const ai = (d?.analytic || []).find((x: any) => x.area === a.area);
    r.analytic.push({
      area: a.area, area_score: a.area_score,
      subs: a.subs.map(s => {
        const si = ai?.subs?.find((x: any) => x.name === s.name);
        const def = FRAME.common[s.name] || FRAME.content[type]?.[s.name] || ({} as Record<Level, string>);
        return { name: s.name, interval: s.interval, levels: LEVELS.map(l => ({ level: l, score: s.scores[l], descriptor: si?.levels?.find((x: any) => x.level === l)?.descriptor || def[l] || '' })) };
      }),
    });
  }
  return r;
}

export function normalizeGrading(d: any): Grading {
  const scores = AREA_ORDER.map(o => {
    const s = (d?.scores || []).find((x: any) => x.sub === o.sub) || {};
    const level = lv(s.level);
    return { area: o.area, sub: o.sub, level, score: o.scores[level], evidence: s.evidence || '', comment: s.comment || '' };
  });
  const total = scores.reduce((n, s) => n + s.score, 0);
  return {
    holistic: { level: lv(d?.holistic?.level), reason: d?.holistic?.reason || '' },
    scores, total, structure: d?.structure || {},
    strengths: d?.strengths || [], weaknesses: d?.weaknesses || [], misconceptions: d?.misconceptions || [],
    illegible_impact: ['none', 'minor', 'major'].includes(d?.illegible_impact) ? d.illegible_impact : 'none', notes: d?.notes || '',
  };
}
