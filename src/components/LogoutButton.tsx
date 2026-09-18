'use client';
import { useRouter } from 'next/navigation';
import { supabaseBrowser } from '@/lib/supabase/client';
export function LogoutButton() {
  const router = useRouter();
  return <button className="btn sm" onClick={async () => { await supabaseBrowser().auth.signOut(); router.replace('/login'); router.refresh(); }}>로그아웃</button>;
}
