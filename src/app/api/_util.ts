import { NextResponse } from 'next/server';
import { requireTeacher } from '@/lib/auth';

/** API 라우트 공통: 선생님 인증 후 핸들러 실행, 오류는 JSON 으로 */
export async function guarded(handler: () => Promise<unknown>) {
  try {
    await requireTeacher({ soft: true });
    const data = await handler();
    return data instanceof Response ? data : NextResponse.json({ ok: true, ...(data as object) });
  } catch (e) {
    if (e instanceof Response) return NextResponse.json({ ok: false, error: await e.text() }, { status: e.status });
    console.error(e);
    return NextResponse.json({ ok: false, error: String((e as any)?.message || e) }, { status: 500 });
  }
}
