/* 루브릭 공통 틀 — 서울교육정책연구소(2022) 「초등학교 5·6학년의 서술·논술 문항 및 루브릭 개발」 */
import type { ItemType, Level } from './types';

type Scores = Record<Level, number>;
export const FRAME = {
  areas: [
    { area: '과제파악', area_score: 10, subs: [{ name: '충실성', interval: 5, scores: { 상: 10, 중: 5, 하: 0 } as Scores }] },
    { area: '내용', area_score: 50, subs: [
      { name: '명료성과 적실성', interval: 10, scores: { 상: 25, 중: 15, 하: 5 } as Scores },
      { name: '구체성', interval: 10, scores: { 상: 25, 중: 15, 하: 5 } as Scores },
    ] },
    { area: '조직', area_score: 20, subs: [
      { name: '통일성[일관성]', interval: 5, scores: { 상: 10, 중: 5, 하: 0 } as Scores },
      { name: '체계성', interval: 5, scores: { 상: 10, 중: 5, 하: 0 } as Scores },
    ] },
    { area: '표현', area_score: 20, subs: [
      { name: '어휘 및 문장의 적실성', interval: 5, scores: { 상: 10, 중: 5, 하: 0 } as Scores },
      { name: '어법의 정확성', interval: 5, scores: { 상: 10, 중: 5, 하: 0 } as Scores },
    ] },
  ],
  common: {
    '충실성': { 상: '제시된 문항의 의도와 과제 상황을 고려하여 충실하게 해결에 임하고 적실한 제목을 기술함', 중: '제시된 문항의 의도와 과제 상황을 고려하여 해결에 임함', 하: '자신의 글의 내용을 집약한 제목의 기술이 필요함' },
    '통일성[일관성]': { 상: '주제를 중심으로 통일성 갖춘 글을 구성함', 중: '주제를 중심으로 부분적인 통일성을 갖춘 글을 구성함', 하: '주제와 관련성 없는 내용을 포함하는 글을 구성함' },
    '체계성': { 상: '소주제를 중심으로 문장과 문단이 자연스럽게 연결된 글을 구성함', 중: '대체로 체계적이며 문장 및 문단 간 연결성 있게 글을 구성함', 하: '소주제와 연관성이 적은 문장과 문단으로 글을 구성함' },
    '어휘 및 문장의 적실성': { 상: '적확한 어휘를 선택하고 자연스러운 문장 구성함', 중: '어휘 선택과 문장 표현이 적실함', 하: '문장호응이나 어휘 선택이 어색함' },
    '어법의 정확성': { 상: '모든 문장에 어법에 맞는 맞춤법과 띄어쓰기 사용함', 중: '대체로 어법에 맞는 맞춤법과 띄어쓰기 사용함', 하: '의사전달에 오해를 유발하는 맞춤법과 띄어쓰기 사용함' },
  } as Record<string, Record<Level, string>>,
  content: {
    서술형: {
      '명료성과 적실성': { 상: '설명 대상에 초점을 맞춰 내용을 명료하고 적실하게 제시함', 중: '설명 대상에 초점을 맞춰 내용을 제시함', 하: '설명 대상을 초점화 없이 내용을 제시함' },
      '구체성': { 상: '풍부하고 구체적인 세부 내용을 제시하여 대상을 설명함', 중: '세부 내용을 제시하여 대상을 설명함', 하: '대상을 추상적으로만 설명함' },
    },
    논술형: {
      '명료성과 적실성': { 상: '합리성과 참신성을 고려하여 독창적이며 타당한 주장을 타당한 근거와 함께 명료하게 제시함', 중: '타당한 주장과 근거를 명료하게 제시함', 하: '주장이나 근거가 타당하지 않거나 모호하게 제시함' },
      '구체성': { 상: '주장을 풍부하고 구체적인 근거 제시로 지지함', 중: '주장을 구체적인 근거 제시로 지지함', 하: '주장을 지지하는 구체적 근거 제시가 필요함' },
    },
  } as Record<ItemType, Record<string, Record<Level, string>>>,
  holistic: {
    상: '과제상황을 충실히 수행함. 내용이 명료하고 적절하며 구체적으로 제시됨. 글의 조직이 체계적이고 일관성이 있으며 표현이 적실하고 정확함',
    중: '과제 상황의 일부를 수행함. 내용이 부분적으로 명료하고 적절하며 일부 구체적임. 글의 조직이 일부분 체계적이고 일관성이 있으며 부분적으로 표현이 적실하고 정확함',
    하: '과제 수행이 전반적으로 미흡함. 내용의 명료성과 적절성, 구체성이 미흡함. 글의 조직과 표현에 있어 두루 미흡함',
  } as Record<Level, string>,
  structure: '답안은 반드시 제목 + 처음·가운데·끝 구조. 서술형: 처음=서술 방향과 개요, 끝=키워드로 요약 정리. 논술형: 처음=자신의 입장(의견·주장) 표명과 개요, 끝=논거와 논지를 한 문장 정도로 기술.',
};

export const AREA_ORDER = FRAME.areas.flatMap(a => a.subs.map(s => ({ area: a.area, sub: s.name, scores: s.scores, interval: s.interval })));
export const LEVELS: Level[] = ['상', '중', '하'];

export function frameText(): string {
  const L: string[] = [
    '[루브릭 공통 틀 — 서울교육정책연구소(2022) 「초등학교 5·6학년의 서술·논술 문항 및 루브릭 개발」]',
    '총점 100점. 영역 4개·하위요소 7개 고정. 성취수준은 상/중/하 3단계.',
  ];
  for (const a of FRAME.areas) for (const s of a.subs) L.push(`- ${a.area}[${a.area_score}] / ${s.name}: 상 ${s.scores.상}점, 중 ${s.scores.중}점, 하 ${s.scores.하}점 (급간 ${s.interval})`);
  L.push('공통 기술문(과제파악·조직·표현):');
  for (const [k, v] of Object.entries(FRAME.common)) L.push(`- ${k}: 상 "${v.상}" / 중 "${v.중}" / 하 "${v.하}"`);
  L.push('내용 영역 기술문 — 서술형:');
  for (const [k, v] of Object.entries(FRAME.content.서술형)) L.push(`- ${k}: 상 "${v.상}" / 중 "${v.중}" / 하 "${v.하}"`);
  L.push('내용 영역 기술문 — 논술형:');
  for (const [k, v] of Object.entries(FRAME.content.논술형)) L.push(`- ${k}: 상 "${v.상}" / 중 "${v.중}" / 하 "${v.하}"`);
  L.push(`총체적 루브릭 일반형: 상 "${FRAME.holistic.상}" / 중 "${FRAME.holistic.중}" / 하 "${FRAME.holistic.하}"`);
  L.push('답안 구조 요구: ' + FRAME.structure);
  L.push('문항별 루브릭 작성 규칙: 과제파악·어법의 정확성은 공통 문장을 그대로 쓰고, 내용·조직·어휘 항목은 공통 문장 앞에 "[문항 주제]를/에 대해 …" 형태로 교과 내용을 삽입한다. 내용 영역은 문항 유형(서술형/논술형)에 맞는 기술문을 쓴다. 총체적 루브릭은 "처음, 가운데, 끝을 나누고, [핵심 개념]을 이해하여 글을 씀"(상) / "…부분적으로 이해하여 글을 씀"(중) / "…정리하여 글을 구성하려고 노력함"(하) 형태로 쓴다.');
  return L.join('\n');
}
