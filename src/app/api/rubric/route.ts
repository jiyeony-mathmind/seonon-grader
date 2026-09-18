import { guarded } from '../_util';
import { generateRubric } from '@/lib/pipeline';
export const maxDuration = 120;
export async function POST(req: Request) {
  const { itemId } = await req.json();
  return guarded(async () => ({ rubric: await generateRubric(String(itemId)) }));
}
