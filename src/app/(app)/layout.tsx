import { requireTeacher } from '@/lib/auth';
import { Nav } from '@/components/Nav';
import { LogoutButton } from '@/components/LogoutButton';

export default async function AppLayout({ children }: { children: React.ReactNode }) {
  const { teacher, email } = await requireTeacher();
  return (
    <div className="app">
      <aside className="side">
        <div className="brand"><div className="name">서논술 채점실</div><div className="sub">수학 서술·논술형 채점·평가</div></div>
        <Nav />
        <div className="foot">
          <div>{teacher?.name || email} <span className="muted">· {teacher?.role === 'owner' ? '원장' : '교사'}</span></div>
          <LogoutButton />
        </div>
      </aside>
      <main className="main">{children}</main>
    </div>
  );
}
