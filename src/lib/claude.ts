import Anthropic from '@anthropic-ai/sdk';
import { parseJSON } from './normalize';

const MODEL = process.env.CLAUDE_MODEL || 'claude-sonnet-4-5';
let _client: Anthropic | null = null;
function client() {
  if (!process.env.ANTHROPIC_API_KEY) throw new Error('ANTHROPIC_API_KEY 환경변수가 없습니다');
  return (_client ??= new Anthropic({ apiKey: process.env.ANTHROPIC_API_KEY }));
}

export type ImagePart = { kind: 'image'; mediaType: 'image/jpeg' | 'image/png' | 'image/webp'; base64: string } | { kind: 'pdf'; base64: string };

/** 프롬프트(+이미지/PDF)를 보내고 JSON 하나를 돌려받는다. */
export async function askJSON<T = any>(prompt: string, files: ImagePart[] = [], maxTokens = 4000): Promise<{ data: T; model: string; usage: { input: number; output: number } }> {
  const content: Anthropic.MessageCreateParams['messages'][number]['content'] = [];
  for (const f of files) {
    if (f.kind === 'image') content.push({ type: 'image', source: { type: 'base64', media_type: f.mediaType, data: f.base64 } });
    else content.push({ type: 'document', source: { type: 'base64', media_type: 'application/pdf', data: f.base64 } } as any);
  }
  content.push({ type: 'text', text: prompt });
  const res = await client().messages.create({ model: MODEL, max_tokens: maxTokens, messages: [{ role: 'user', content }] });
  const text = res.content.filter(b => b.type === 'text').map(b => (b as any).text).join('\n');
  if (res.stop_reason === 'max_tokens') throw new Error('AI 응답이 길이 제한으로 잘렸습니다. 다시 시도해 주세요.');
  return { data: parseJSON(text) as T, model: res.model, usage: { input: res.usage.input_tokens, output: res.usage.output_tokens } };
}
