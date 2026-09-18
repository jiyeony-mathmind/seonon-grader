import type { Metadata } from 'next';
import './globals.css';

export const metadata: Metadata = { title: '서논술 채점실', description: '수학 서술·논술형 답안 판독·채점·리포트' };

export default function RootLayout({ children }: { children: React.ReactNode }) {
  return (
    <html lang="ko">
      <head><link rel="stylesheet" href="https://fonts.googleapis.com/css2?family=IBM+Plex+Sans+KR:wght@400;500;600;700&display=swap" /></head>
      <body>{children}</body>
    </html>
  );
}
