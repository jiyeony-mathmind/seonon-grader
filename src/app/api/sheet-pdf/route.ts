import { guarded } from '../_util';
import { buildSheetPdf, type SheetSpec } from '@/lib/sheetPdf';
export const maxDuration = 60;
export async function POST(req: Request) {
  const spec = (await req.json()) as SheetSpec;
  return guarded(async () => {
    const bytes = await buildSheetPdf({ ...spec, item_type: spec.item_type === '서술형' ? '서술형' : '논술형' });
    const name = encodeURIComponent(`${spec.student || '빈양식'}_재평가_답안지.pdf`);
    return new Response(Buffer.from(bytes), { headers: { 'Content-Type': 'application/pdf', 'Content-Disposition': `attachment; filename*=UTF-8''${name}` } });
  });
}
