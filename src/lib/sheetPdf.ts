import { PDFDocument, rgb, PDFFont } from 'pdf-lib';
import fontkit from '@pdf-lib/fontkit';
import fs from 'node:fs/promises';
import path from 'node:path';

export interface SheetSpec {
  item_type: '서술형' | '논술형';
  grade: string; domain: string; standard: string;
  prompt: string; conditions: string;
  sgrade: string; klass: string; student: string;
}

let fontCache: { regular: Uint8Array; bold: Uint8Array } | null = null;
async function loadFonts() {
  if (fontCache) return fontCache;
  const dir = path.join(process.cwd(), 'public', 'fonts');
  fontCache = { regular: await fs.readFile(path.join(dir, 'NotoSansKR-Regular.ttf')), bold: await fs.readFile(path.join(dir, 'NotoSansKR-Bold.ttf')) };
  return fontCache;
}

function wrap(font: PDFFont, size: number, text: string, maxW: number): string[] {
  const out: string[] = [];
  for (const para of String(text || '').split('\n')) {
    let line = '';
    for (const word of para.split(' ')) {
      const t = line ? line + ' ' + word : word;
      if (font.widthOfTextAtSize(t, size) <= maxW) { line = t; continue; }
      if (line) out.push(line);
      if (font.widthOfTextAtSize(word, size) > maxW) { let cur = ''; for (const ch of word) { if (font.widthOfTextAtSize(cur + ch, size) > maxW) { out.push(cur); cur = ch; } else cur += ch; } line = cur; }
      else line = word;
    }
    out.push(line);
  }
  return out;
}

/** 업로드 답안지와 같은 양식의 A4 답안지 PDF (텍스트 복사 가능) */
export async function buildSheetPdf(o: SheetSpec): Promise<Uint8Array> {
  const fonts = await loadFonts();
  const doc = await PDFDocument.create();
  doc.registerFontkit(fontkit);
  // GSUB 기능(문맥 치환·자간 조정)을 끄지 않으면 한글 사이 공백이 cmap 에 없는 글리프로 바뀌어 폭 계산이 어긋난다
  const NO_FEATURES = { calt: false, ccmp: false, liga: false, dlig: false, kern: false, palt: false, halt: false, fwid: false, hwid: false, pwid: false, vert: false, vrt2: false, aalt: false } as const;
  const R = await doc.embedFont(fonts.regular, { subset: false, features: NO_FEATURES });
  const B = await doc.embedFont(fonts.bold, { subset: false, features: NO_FEATURES });
  const page = doc.addPage([595.28, 841.89]); // A4 pt
  const W = 595.28, H = 841.89;
  const L = 42, RGT = W - 42, TW = RGT - L, LAB = 78;
  const ink = rgb(0.1, 0.1, 0.1), fill = rgb(0.85, 0.886, 0.937), line = rgb(0.16, 0.16, 0.16);
  const text = (s: string, x: number, y: number, size: number, font: PDFFont = R, color = ink) => page.drawText(s, { x, y, size, font, color });
  const centered = (s: string, cx: number, y: number, size: number, font: PDFFont = R) => text(s, cx - font.widthOfTextAtSize(s, size) / 2, y, size, font);
  const box = (x: number, y: number, w: number, h: number, filled = false) => page.drawRectangle({ x, y: y - h, width: w, height: h, borderColor: line, borderWidth: 0.9, color: filled ? fill : undefined });
  const label = (x: number, y: number, w: number, h: number, s: string) => { box(x, y, w, h, true); centered(s, x + w / 2, y - h / 2 - 3.5, 10, B); };

  // 제목·머리글
  centered(`수학과 서술·논술형 평가  —  ${o.item_type} 문항 답안지`, W / 2, H - 62, 15.5, B);
  const hdr = `${o.grade}학년 ${o.domain || ''}  |  ${o.standard || ''}`.replace(/\s+\|\s+$/, '');
  text(hdr, RGT - R.widthOfTextAtSize(hdr, 8.2), H - 86, 8.2, R, rgb(0.27, 0.27, 0.27));
  let y = H - 99;
  // 1행 학년·반·이름
  let h = 34; box(L, y, TW, h, true);
  const blank = (v: string) => (v ? ` ${v} ` : '        ');
  centered(`[${blank(o.sgrade)}] 학년    [${blank(o.klass)}] 반     이름 : [${o.student ? ' ' + o.student + ' ' : '                '}]`, L + TW / 2, y - h / 2 - 3.8, 10.8);
  y -= h;
  // 2행 교과 / 문항 유형
  h = 34; label(L, y, LAB, h, '교과'); box(L + LAB, y, 200, h); centered('수학', L + LAB + 100, y - h / 2 - 3.5, 10);
  label(L + LAB + 200, y, 72, h, '문항 유형'); box(L + LAB + 272, y, TW - LAB - 272, h);
  // 체크박스는 글꼴에 없는 기호라 도형으로 그린다
  const cbx = L + LAB + 272 + (TW - LAB - 272) / 2 - 62, cby = y - h / 2;
  const checkbox = (x: number, checked: boolean) => {
    page.drawRectangle({ x, y: cby - 5, width: 10, height: 10, borderColor: line, borderWidth: 0.9 });
    if (checked) { page.drawLine({ start: { x: x + 2, y: cby }, end: { x: x + 4.3, y: cby - 3 }, thickness: 1.2, color: ink }); page.drawLine({ start: { x: x + 4.3, y: cby - 3 }, end: { x: x + 8.5, y: cby + 3.5 }, thickness: 1.2, color: ink }); }
  };
  checkbox(cbx, o.item_type === '서술형'); text('서술형', cbx + 14, cby - 3.5, 10);
  checkbox(cbx + 70, o.item_type === '논술형'); text('논술형', cbx + 84, cby - 3.5, 10);
  y -= h;
  // 3행 문항
  const qs = 9.6, lh = qs * 1.62;
  const q = wrap(R, qs, '※ ' + o.prompt, TW - LAB - 18), c = o.conditions ? wrap(R, qs, '(' + o.conditions + ')', TW - LAB - 18) : [];
  h = Math.max(72, (q.length + c.length) * lh + 22);
  label(L, y, LAB, h, '문항'); box(L + LAB, y, TW - LAB, h);
  let ty = y - 12 - qs;
  for (const s of q) { text(s, L + LAB + 9, ty, qs); ty -= lh; }
  for (const s of c) { text(s, L + LAB + 9, ty, qs, R, rgb(0.25, 0.25, 0.25)); ty -= lh; }
  y -= h;
  // 4행 제목
  h = 40; label(L, y, LAB, h, '제목'); box(L + LAB, y, TW - LAB, h); y -= h;
  // 5~7행 서론/본론/결론
  const bottom = 40; const rest = y - bottom;
  const hs = [Math.round(rest * 0.22), Math.round(rest * 0.5)]; hs.push(rest - hs[0] - hs[1]);
  const names = ['<서론>', '<본론>', '<결론>'];
  for (let i = 0; i < 3; i++) { label(L, y, LAB, hs[i], names[i]); box(L + LAB, y, TW - LAB, hs[i]); y -= hs[i]; }
  doc.setTitle(`${o.student || ''} ${o.item_type} 답안지`.trim());
  return doc.save();
}
