'use client';
import { useRef, useState } from 'react';
import { useRouter } from 'next/navigation';
import type { Item } from '@/lib/types';
import { supabaseBrowser } from '@/lib/supabase/client';

const MAX_SIDE = 2400;
/** 브라우저에서 사진을 최대 2400px·JPEG 로 줄여 전송량을 낮춘다 (PDF 는 그대로) */
async function shrink(file: File): Promise<File> {
  if (!file.type.startsWith('image/')) return file;
  const bmp = await createImageBitmap(file).catch(() => null); if (!bmp) return file;
  const k = Math.min(1, MAX_SIDE / Math.max(bmp.width, bmp.height));
  const c = document.createElement('canvas'); c.width = Math.round(bmp.width * k); c.height = Math.round(bmp.height * k);
  c.getContext('2d')!.drawImage(bmp, 0, 0, c.width, c.height);
  const blob: Blob | null = await new Promise(res => c.toBlob(res, 'image/jpeg', 0.88));
  return blob ? new File([blob], file.name.replace(/\.[^.]+$/, '') + '.jpg', { type: 'image/jpeg' }) : file;
}

export function Uploader({ items, defaultItem }: { items: Pick<Item, 'id' | 'title' | 'grade' | 'item_type'>[]; defaultItem?: string }) {
  const router = useRouter(); const inp = useRef<HTMLInputElement>(null);
  const [itemId, setItemId] = useState(defaultItem || items[0]?.id || '');
  const [student, setStudent] = useState(''); const [grade, setGrade] = useState(''); const [klass, setKlass] = useState('');
  const [files, setFiles] = useState<File[]>([]); const [busy, setBusy] = useState(''); const [err, setErr] = useState('');
  const add = (list: FileList | null) => { if (list) setFiles(f => [...f, ...Array.from(list)]); };
  async function submit() {
    if (!itemId) { setErr('먼저 문항을 등록하세요'); return; }
    setErr(''); setBusy('파일 준비 중');
    try {
      const sb = supabaseBrowser();
      const id = 'an-' + Date.now().toString(36) + Math.random().toString(36).slice(2, 8);
      const paths: string[] = [];
      for (let i = 0; i < files.length; i++) {
        setBusy(`파일 올리는 중 ${i + 1}/${files.length}`);
        const f = await shrink(files[i]);
        const ext = f.type === 'application/pdf' || /\.pdf$/i.test(f.name) ? 'pdf' : f.type === 'image/png' ? 'png' : f.type === 'image/webp' ? 'webp' : 'jpg';
        const p = `${id}/${String(i + 1).padStart(2, '0')}.${ext}`;
        const { error } = await sb.storage.from('answer-sheets').upload(p, f, { contentType: f.type || undefined, upsert: false });
        if (error) throw new Error('파일 저장 실패: ' + error.message);
        paths.push(p);
      }
      setBusy('저장하고 AI 판독 중 (30초~1분)');
      const r = await fetch('/api/answers', { method: 'POST', headers: { 'Content-Type': 'application/json' }, body: JSON.stringify({ id, itemId, student, grade, klass, images: paths }) }).then(r => r.json());
      if (!r.ok) throw new Error(r.error);
      router.push(`/answers/${r.id}`); router.refresh();
    } catch (e: any) { setErr(e.message); setBusy(''); }
  }
  return (
    <div className="card form">
      <div className="three">
        <div><label htmlFor="uItem">문항</label><select id="uItem" value={itemId} onChange={e => setItemId(e.target.value)}>{items.map(i => <option key={i.id} value={i.id}>{i.title} ({i.grade}학년 · {i.item_type})</option>)}{!items.length && <option value="">먼저 문항을 등록하세요</option>}</select></div>
        <div><label htmlFor="uName">학생 이름</label><input id="uName" value={student} onChange={e => setStudent(e.target.value)} placeholder="비워두면 답안지에서 읽어 옵니다" /></div>
        <div className="two" style={{ gap: 8 }}><div><label htmlFor="uGrade">학년</label><input id="uGrade" value={grade} onChange={e => setGrade(e.target.value)} placeholder="5" /></div><div><label htmlFor="uKlass">반</label><input id="uKlass" value={klass} onChange={e => setKlass(e.target.value)} placeholder="4" /></div></div>
      </div>
      <div className="drop" onClick={() => inp.current?.click()} onDragOver={e => e.preventDefault()} onDrop={e => { e.preventDefault(); add(e.dataTransfer.files); }}>
        파일을 여기에 끌어다 놓거나 클릭해서 선택 (사진 여러 장 또는 PDF)<div className="small muted" style={{ marginTop: 4 }}>한 학생의 답안지 = 1건. 다른 학생은 저장 후 다시 올립니다.</div>
      </div>
      <input ref={inp} type="file" accept="image/*,application/pdf" multiple hidden onChange={e => { add(e.target.files); e.target.value = ''; }} />
      {files.length > 0 && <div className="thumbs">{files.map((f, i) => <div className="t" key={i} title={f.name} onClick={() => setFiles(fs => fs.filter((_, j) => j !== i))}>{f.type.startsWith('image/') ? <img alt="" src={URL.createObjectURL(f)} /> : 'PDF'}</div>)}</div>}
      {busy && <div className="progress"><span className="spin" /> {busy}</div>}
      {err && <div className="err">{err}</div>}
      <div className="row"><button className="btn primary" disabled={!files.length || !itemId || !!busy} onClick={submit}>저장하고 판독</button><span className="small muted">썸네일을 누르면 제거됩니다.</span></div>
    </div>
  );
}
