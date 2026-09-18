'use client';
import Link from 'next/link';
import { usePathname } from 'next/navigation';
const NAV = [
  { href: '/', label: '대시보드', step: '◎' },
  { href: '/items', label: '문항·루브릭', step: '3' },
  { href: '/upload', label: '답안 업로드', step: '1' },
  { href: '/answers', label: '답안·채점', step: '2' },
];
export function Nav() {
  const p = usePathname();
  return (
    <nav className="nav">
      {NAV.map(n => { const on = n.href === '/' ? p === '/' : p.startsWith(n.href); return <Link key={n.href} href={n.href} className={on ? 'on' : ''}><span className="muted small">{n.step}</span>{n.label}</Link>; })}
    </nav>
  );
}
