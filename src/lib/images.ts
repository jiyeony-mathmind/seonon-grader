import sharp from 'sharp';
import { supabaseAdmin } from './supabase/admin';
import type { ImagePart } from './claude';

export const BUCKET = 'answer-sheets';

/** Storage 에서 파일을 내려받아 Claude 에 보낼 조각으로 만든다.
 *  이미지: 세로로 2~3구역(12% 겹침)으로 잘라 손글씨 해상도를 유지. PDF: 그대로 문서로 전달. */
export async function prepareFiles(paths: string[]): Promise<{ files: ImagePart[]; layout: string[] }> {
  const admin = supabaseAdmin();
  const files: ImagePart[] = []; const layout: string[] = [];
  for (let i = 0; i < paths.length; i++) {
    const { data, error } = await admin.storage.from(BUCKET).download(paths[i]);
    if (error || !data) throw new Error(`답안지 파일을 읽지 못했습니다: ${paths[i]} (${error?.message || ''})`);
    const buf = Buffer.from(await data.arrayBuffer());
    if (paths[i].toLowerCase().endsWith('.pdf')) { files.push({ kind: 'pdf', base64: buf.toString('base64') }); layout.push(`${i + 1}번 파일: PDF 문서 전체`); continue; }
    const img = sharp(buf).rotate(); // EXIF 방향 보정
    const meta = await img.metadata();
    const W = meta.width || 0, H = meta.height || 0;
    let n = Math.max(1, Math.min(3, Math.ceil((W * H) / 2.4e6)));
    if (H < W * 1.1) n = Math.min(n, 2);
    const ov = 0.12;
    for (let k = 0; k < n; k++) {
      const h = H / n; const y0 = Math.max(0, Math.round(h * k - (k > 0 ? h * ov : 0))); const y1 = Math.min(H, Math.round(h * (k + 1) + (k < n - 1 ? h * ov : 0)));
      const strip = await sharp(buf).rotate().extract({ left: 0, top: y0, width: W, height: y1 - y0 })
        .resize({ width: Math.min(W, 1800), withoutEnlargement: true }).jpeg({ quality: 88 }).toBuffer();
      files.push({ kind: 'image', mediaType: 'image/jpeg', base64: strip.toString('base64') });
    }
    layout.push(`${i + 1}쪽: 세로 ${n}구역(위→아래, 12% 겹침)`);
  }
  return { files, layout };
}

/** 뷰어용 서명 URL (1시간) */
export async function signedUrls(paths: string[]): Promise<string[]> {
  if (!paths.length) return [];
  const admin = supabaseAdmin();
  const { data } = await admin.storage.from(BUCKET).createSignedUrls(paths, 3600);
  return (data || []).map(d => d.signedUrl || '');
}
