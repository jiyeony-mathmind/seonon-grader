import { guarded } from '../_util';
import { readAnswer } from '@/lib/pipeline';
export const maxDuration = 120;
export async function POST(req: Request) {
  const { answerId } = await req.json();
  return guarded(async () => readAnswer(String(answerId)));
}
