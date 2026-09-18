import type { AnswerStatus, RubricStatus, Level } from '@/lib/types';
export const fmtDate = (iso?: string | null) => { if (!iso) return ''; const d = new Date(iso); return isNaN(+d) ? '' : `${d.getFullYear()}.${String(d.getMonth() + 1).padStart(2, '0')}.${String(d.getDate()).padStart(2, '0')}`; };
export function StatusPill({ s }: { s: AnswerStatus }) { const m: Record<AnswerStatus, string> = { uploaded: '판독 대기', read: '채점 대기', graded: '리포트 대기', reported: '완료' }; return <span className={`pill s-${s}`}>{m[s]}</span>; }
export function RubricPill({ s }: { s: RubricStatus }) { const m: Record<RubricStatus, string> = { none: '루브릭 없음', draft: '승인 대기', approved: '승인됨' }; return <span className={`pill r-${s}`}>{m[s]}</span>; }
export function Lv({ l, big }: { l: Level; big?: boolean }) { return <span className={`lv ${l}`} style={big ? { width: 34, height: 34, fontSize: 17 } : undefined}>{l}</span>; }
