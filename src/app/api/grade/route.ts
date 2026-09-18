import { guarded } from '../_util';
import { gradeAnswer } from '@/lib/pipeline';
export const maxDuration = 120;
export async function POST(req: Request) {
  const { answerId } = await req.json();
  return guarded(async () => gradeAnswer(String(answerId)));
}
