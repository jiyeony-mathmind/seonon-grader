import { frameText } from './rubricFrame';
import type { Item, Rubric, Transcription, Grading, Answer } from './types';

export function rubricText(r: Rubric): string {
  const L = [`총체적 루브릭: 상 "${r.holistic.상}" / 중 "${r.holistic.중}" / 하 "${r.holistic.하}"`, '분석적 루브릭:'];
  for (const a of r.analytic) for (const s of a.subs) L.push(`- ${a.area} / ${s.name}: ` + s.levels.map(l => `${l.level}(${l.score}점) "${l.descriptor}"`).join(' | '));
  if (r.intent?.purpose) L.push(`평가 의도: ${r.intent.purpose} [처음] ${r.intent.처음 || ''} [가운데] ${r.intent.가운데 || ''} [끝] ${r.intent.끝 || ''}`);
  if (r.model?.title) L.push(`채점 예시 답안: 제목 "${r.model.title}" [처음] ${r.model.처음 || ''} [가운데] ${r.model.가운데 || ''} [끝] ${r.model.끝 || ''}`);
  return L.join('\n');
}
export const transText = (t: Transcription) =>
  `제목: ${t.title || '(없음)'}\n[처음] ${t.intro || '(없음)'}\n[가운데] ${t.body || '(없음)'}\n[끝] ${t.conclusion || '(없음)'}\n판독 메모: ${t.notes || '없음'}`;

/* ② 판독 */
export function readPrompt(item: Item | null, layout: string[]): string {
  return `당신은 초등·중등 수학 서술·논술형 답안지를 전사(transcription)하는 OCR 역할입니다. 첨부 이미지는 학생 1명의 손글씨 답안지입니다. 이미지 구성: ${layout.join(' / ')}. 같은 쪽의 연속 구역은 위아래로 이어지며 겹치는 부분은 한 번만 옮깁니다.

[문항 정보 — 참고용, 답안에 없는 내용을 채워 넣는 데 쓰지 말 것]
문항: ${item ? item.prompt : '(없음)'}
답안 양식: 제목 / <서론(처음)> / <본론(가운데)> / <결론(끝)> 칸으로 나뉜 답안지일 가능성이 높음.

[규칙 — 반드시 지킬 것]
1. 학생이 쓴 글자를 있는 그대로 옮긴다. 맞춤법·띄어쓰기·계산 오류·논리 오류를 절대 고치지 않는다. 학생이 틀리게 쓴 수식도 틀린 그대로 쓴다.
2. 세로로 쓴 분수는 "4/8"처럼 가로 표기로 바꾼다. 수식은 텍스트로 선형 표기한다.
3. 읽을 수 없는 글자는 [판독 불가]로, 지운 흔적·취소선은 [지움: 내용] 또는 [지움: 판독 불가]로 표시한다. 그림이 있으면 [그림: 설명]으로 요약한다. 추측으로 채우지 않는다.
4. 인쇄된 문항·양식 문구는 옮기지 않는다. 학생 손글씨만 옮긴다.
5. 답안지 상단의 학년·반·이름 손글씨가 있으면 읽는다.

아래 JSON 하나만 출력한다(설명 문장 금지):
{"student_name":"이름 또는 빈 문자열","grade":"학년 또는 빈 문자열","class":"반 또는 빈 문자열","title":"제목 칸 내용","intro":"서론/처음 칸 내용","body":"본론/가운데 칸 내용 (줄바꿈은 \\n)","conclusion":"결론/끝 칸 내용","notes":"판독 불가·지움 흔적·칸 경계 걸침 등 판독 메모","confidence":"high|medium|low"}`;
}

/* ③ 루브릭 생성 */
export function rubricPrompt(it: Item): string {
  return `당신은 초등·중등 수학 서술·논술형 평가 루브릭을 개발하는 교육평가 전문가입니다. 아래 공통 틀을 그대로 적용하여 이 문항의 루브릭을 만듭니다.

${frameText()}

[문항]
학년: ${it.grade} / 영역·단원: ${it.domain || ''} / 성취기준: ${it.standard || ''} / 유형: ${it.item_type}
문항 주제: ${it.title}
문항: ${it.prompt}
조건: ${it.conditions || ''}

[작성 지침]
- 영역·하위요소·점수는 공통 틀 그대로(변경 금지). 기술문만 이 문항의 교과 내용(핵심 개념·해결 방법)을 넣어 문항별로 구체화한다.
- 내용 영역 기술문은 이 문항의 핵심 개념이 무엇인지 드러나게 쓴다. ${it.item_type === '논술형' ? '논술형이므로 "주장·근거" 관점을 포함한다.' : '서술형이므로 "설명 대상·세부 내용" 관점으로 쓴다.'}
- 평가 의도 및 유의점: 무엇을 평가하는지 1~2문장, 그리고 [처음]/[가운데]/[끝]에 각각 무엇이 들어가야 하는지 한 문장씩.
- 채점 예시 답안: 제목 + [처음]/[가운데]/[끝]. 학년 수준의 모범 답안이며 수학적으로 정확해야 한다.

아래 JSON 하나만 출력한다(설명 문장 금지):
{"holistic":{"상":"...","중":"...","하":"..."},
 "analytic":[{"area":"과제파악","subs":[{"name":"충실성","levels":[{"level":"상","descriptor":"..."},{"level":"중","descriptor":"..."},{"level":"하","descriptor":"..."}]}]},{"area":"내용","subs":[{"name":"명료성과 적실성","levels":[...]},{"name":"구체성","levels":[...]}]},{"area":"조직","subs":[{"name":"통일성[일관성]","levels":[...]},{"name":"체계성","levels":[...]}]},{"area":"표현","subs":[{"name":"어휘 및 문장의 적실성","levels":[...]},{"name":"어법의 정확성","levels":[...]}]}],
 "intent":{"purpose":"...","처음":"...","가운데":"...","끝":"..."},
 "model":{"title":"...","처음":"...","가운데":"...","끝":"..."}}`;
}

/* ⑤ 채점 */
export function gradePrompt(it: Item, t: Transcription): string {
  return `당신은 초등·중등 수학 서술·논술형 답안을 채점하는 교사입니다. 아래 승인된 루브릭만을 기준으로 채점합니다. 루브릭에 없는 기준을 만들지 않습니다.

[문항] (${it.grade}학년 · ${it.item_type}) ${it.title}
${it.prompt}
조건: ${it.conditions || ''}
성취기준: ${it.standard || ''}

[승인된 루브릭]
${rubricText(it.rubric as Rubric)}

[학생 답안 전사 — 학생이 쓴 그대로이며 [판독 불가]는 읽지 못한 부분]
${transText(t)}

[채점 절차]
1차: 총체적 루브릭으로 성취수준(상/중/하)을 판정하고 근거를 쓴다.
2차: 분석적 루브릭의 7개 하위요소 각각에 수준(상/중/하)을 판정한다. 점수는 루브릭에 적힌 그 수준의 점수를 그대로 쓴다(내용 25/15/5, 나머지 10/5/0). 각 판정마다 답안에서 근거가 되는 구절을 그대로 인용하고(없으면 빈 문자열) 한 문장으로 판단 이유를 쓴다.
- 수학적 정확성(개념·계산·논리)은 '내용' 영역에서 판단한다. 수학적으로 틀린 주장은 명료성과 적실성에서 '하'로 본다.
- 문항이 요구한 판단(예: 주장이 옳은지)을 명시하지 않았으면 내용 영역에서 감점 근거로 삼는다.
- 어법의 정확성은 전사된 표기만으로 판단하며, 판독 메모에 표기된 판독 불가 부분은 감점하지 않는다.
- [판독 불가]가 채점에 영향을 준 정도를 none/minor/major로 표시한다.
3차: 강점 2~3개, 약점 2~3개, 오개념(있을 때만, 수학 개념의 오류만) 목록을 쓴다. 각 항목은 답안 근거를 포함한 한 문장.

아래 JSON 하나만 출력한다(설명 문장 금지):
{"holistic":{"level":"상|중|하","reason":"..."},
 "scores":[{"area":"과제파악","sub":"충실성","level":"상|중|하","score":0,"evidence":"답안 인용","comment":"판단 이유"}, ... 7개, 루브릭 순서대로],
 "structure":{"title":true,"intro":true,"body":true,"conclusion":true},
 "strengths":["..."],"weaknesses":["..."],"misconceptions":["..."],
 "illegible_impact":"none|minor|major","notes":"..."}`;
}

/* ⑥ 리포트 2종 */
export function reportsPrompt(it: Item, a: Answer, g: Grading): string {
  return `당신은 ${it.grade}학년 수학을 가르치는 경력 교사입니다. 아래 채점 결과를 바탕으로 리포트 2종의 내용을 작성합니다. 사실은 채점 결과와 답안 전사에 있는 것만 쓰고, 없는 사실을 만들지 않습니다. 문장은 짧고 구체적으로. 감정적·격려성 수사는 쓰지 않습니다.

[문항] (${it.grade}학년 · ${it.item_type}) ${it.title}: ${it.prompt}
[학생] ${a.student} (${a.grade}학년 ${a.klass}반)
[답안 전사]
${transText(a.transcription as Transcription)}
[채점 결과] 총점 ${g.total}/100, 총체적 수준 ${g.holistic.level} (${g.holistic.reason})
${g.scores.map(s => `- ${s.area}/${s.sub}: ${s.level} ${s.score}점 — ${s.comment} ${s.evidence ? `(인용: "${s.evidence}")` : ''}`).join('\n')}
강점: ${(g.strengths || []).join(' / ')}
약점: ${(g.weaknesses || []).join(' / ')}
오개념: ${(g.misconceptions || []).join(' / ') || '없음'}

[교사용 리포트에 들어갈 것]
- summary: 결론 한두 문장(수준·점수·핵심 진단).
- analysis: 강점·약점 각각 2~3개 {type:"강점"|"약점", text}. 답안 근거를 포함.
- guidance: 지도 방향 2~3개 {title, what(무엇을 가르칠지), how(수업에서 어떻게: 모델 문장·질문 프롬프트·활동)}. 개념 오류가 없으면 개념 재교육을 권하지 말고 서술 기술에 집중.
- practice: 연습시킬 것 3~4개 {name, method, frequency}. 이 학생의 약점에 직결되는 것만.
- reassessment: {prompt(같은 성취기준의 새 논술 문항 1개, 수치와 상황을 바꿔서), check_points(확인할 것 2~3개)}.

[학부모용 리포트에 들어갈 것 — 교육 용어 없이 학부모가 이해할 수 있는 말로]
- summary: 이번 평가에서 무엇을 평가했고 결과가 어떤지 두 문장.
- strengths: 잘한 점 2~3개 {title, text}. 답안에서 실제로 한 것을 근거로.
- practice: 연습이 필요한 점 2~3개 {title, text}. "수학 실력 문제가 아니라 글로 설명하는 연습"처럼 성격을 정확히 규정.
- 점수·수준을 감추지 않되 비교·서열 표현은 쓰지 않는다. 가정 학습법이나 학원 계획은 쓰지 않는다.

아래 JSON 하나만 출력한다(설명 문장 금지):
{"teacher":{"summary":"...","analysis":[{"type":"강점","text":"..."}],"guidance":[{"title":"...","what":"...","how":"..."}],"practice":[{"name":"...","method":"...","frequency":"..."}],"reassessment":{"prompt":"...","check_points":["..."]}},
 "parent":{"summary":"...","strengths":[{"title":"...","text":"..."}],"practice":[{"title":"...","text":"..."}]}}`;
}
