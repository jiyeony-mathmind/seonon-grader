# 서논술 채점실 (Next.js + Supabase + Claude API)

수학 서술·논술형 답안지를 업로드하면 **AI 판독 → 루브릭 생성·교사 승인 → 채점·분석 → 교사용·학부모용 리포트 → 학부모 링크·재평가 답안지 PDF**까지 처리하는 학원 교사 공용 웹앱입니다.
루브릭 틀은 서울교육정책연구소(2022) 「초등학교 5·6학년의 서술·논술 문항 및 루브릭 개발」의 공통 틀(과제파악 10 · 내용 50 · 조직 20 · 표현 20 = 100점, 상/중/하)을 그대로 씁니다.

## 구성

| 역할 | 서비스 | 비용 |
|---|---|---|
| DB · 파일 저장 · 로그인 | Supabase | 무료 플랜으로 시작 가능 |
| 웹 서버 · 배포 | Vercel | 무료 플랜으로 시작 가능 |
| AI (판독·루브릭·채점·리포트) | Anthropic Claude API (Sonnet) | 사용량 과금, 답안 1건당 약 100~200원 |

선생님은 웹 주소로 접속하며 claude.ai 계정이나 좌석이 필요 없습니다.

## 설치 순서

### 1. Supabase 프로젝트
1. https://supabase.com → New project (리전 Northeast Asia/Seoul, DB 비밀번호 보관).
2. **SQL Editor → New query** 에 `supabase/schema.sql` 전체를 붙여넣고 Run (한 번만).
3. 같은 방법으로 원장 등록:
   ```sql
   insert into public.teachers (email, name, role) values ('원장이메일@example.com', '이름', 'owner')
     on conflict (email) do update set role = 'owner';
   ```
4. (선택) `supabase/seed.sql` 실행 → 예시 문항·승인 루브릭·예시 답안이 들어갑니다.
5. **Authentication → Providers → Email** 활성화.
6. **Authentication → URL Configuration**
   - Site URL: 배포 주소 (예: `https://seonon-grader.vercel.app`, 개발 중이면 `http://localhost:3000`)
   - Redirect URLs 에 `배포주소/auth/callback` 추가.
7. **Settings → API** 에서 Project URL, anon key, service_role key 를 복사해 둡니다.

Storage 버킷 `answer-sheets`(비공개)는 schema.sql 이 만듭니다. Storage 메뉴에서 보이는지 확인하세요.

### 2. Anthropic API 키
https://console.anthropic.com → API Keys → 키 발급 → Billing 에서 결제 수단·크레딧 등록.

### 3. 배포 (Vercel)
1. 이 폴더를 GitHub 저장소로 올립니다 (`node_modules`, `.env` 는 올리지 않음 — `.gitignore` 에 이미 있음).
2. https://vercel.com → Add New Project → 저장소 Import.
3. **Environment Variables** 에 `.env.example` 의 항목을 모두 입력:
   - `NEXT_PUBLIC_SUPABASE_URL`, `NEXT_PUBLIC_SUPABASE_ANON_KEY`, `SUPABASE_SERVICE_ROLE_KEY`
   - `ANTHROPIC_API_KEY`, `CLAUDE_MODEL` (기본 `claude-sonnet-4-5`)
   - `NEXT_PUBLIC_SITE_URL` (배포 주소, 예: `https://seonon-grader.vercel.app`)
4. Deploy. 주소가 확정되면 1-6 의 Site URL / Redirect URLs 와 `NEXT_PUBLIC_SITE_URL` 을 그 주소로 맞춥니다.

### 4. 선생님 초대
1. SQL Editor 에서 명단 등록 (초대보다 **먼저**):
   ```sql
   insert into public.teachers (email, name) values ('teacher@example.com', '김선생') on conflict (email) do nothing;
   ```
2. **Authentication → Users → Add user → Send invitation** 에 같은 이메일 입력.
3. 선생님은 메일 링크 → 비밀번호 설정 화면에서 비밀번호를 정하면 바로 사용할 수 있습니다. 원장 본인도 같은 절차로 계정을 만듭니다.

명단에 없는 이메일로 가입한 계정은 로그인은 되어도 아무 데이터도 보지 못합니다(RLS).

## 로컬에서 실행 (개발자)
```bash
cp .env.example .env.local   # 값 채우기
npm install
npm run dev                  # http://localhost:3000
npm run build                # 배포 전 빌드 확인
```

## 사용 흐름
1. **문항·루브릭**: 문항 등록 → "AI로 루브릭 초안 만들기" → 기술문 검토·수정 → **승인**. 승인된 루브릭만 채점에 쓰입니다.
2. **답안 업로드**: 사진(JPG/PNG, 여러 장) 또는 PDF. 저장 즉시 AI 판독이 실행됩니다.
3. **답안·채점**: 판독 결과 확인·수정 → 채점 → 리포트 2종 생성 → 학부모 링크 복사(카카오톡·문자로 발송) → 교사용 탭에서 재평가 답안지 PDF.

학부모 링크(`/report/{토큰}`)는 로그인 없이 열리며, `answers.parent_token_expires_at` 에 날짜를 넣으면 만료됩니다.

## 폴더 구조
```
supabase/schema.sql        테이블·RLS·버킷 (최초 1회 실행)
supabase/seed.sql          예시 데이터 (선택)
public/fonts/              PDF 용 한글 글꼴 (Noto Sans CJK KR 서브셋, OFL)
src/lib/rubricFrame.ts     서교연 루브릭 공통 틀
src/lib/prompts.ts         판독·루브릭·채점·리포트 프롬프트
src/lib/pipeline.ts        AI 파이프라인 (Storage → Claude → DB)
src/lib/sheetPdf.ts        재평가 답안지 PDF
src/app/api/*              서버 API (판독·루브릭·채점·리포트·PDF·업로드)
src/app/(app)/*            선생님 화면 (로그인 필요)
src/app/report/[token]     학부모 공개 페이지
```

## 자주 겪는 문제
- **초대 메일 링크를 눌렀는데 로그인 화면으로 감**: Supabase URL Configuration 의 Redirect URLs 에 `배포주소/auth/callback` 이 없거나 Site URL 이 다릅니다.
- **로그인 후 "선생님 명단에 없는 계정"**: `teachers` 에 그 이메일이 없거나 `user_id` 가 비어 있습니다. 명단을 넣은 뒤 아래 한 줄로 연결하세요.
  ```sql
  update public.teachers t set user_id = u.id from auth.users u where lower(u.email) = lower(t.email) and t.user_id is null;
  ```
- **판독/채점이 60초 넘게 걸려 실패**: Vercel 무료 플랜의 함수 시간 제한(기본 60초, 설정으로 늘릴 수 있음)을 확인하세요. `maxDuration` 은 각 API 라우트에 지정되어 있습니다.
- **AI 응답 형식 오류**: 같은 버튼을 한 번 더 누르면 됩니다. 반복되면 `CLAUDE_MODEL` 이 유효한 모델 ID 인지 확인하세요.
- **비용 상한**: Anthropic 콘솔에서 월 사용 한도를 설정해 두면 예기치 않은 과금을 막을 수 있습니다.

## 보안·개인정보
- `SUPABASE_SERVICE_ROLE_KEY` 와 `ANTHROPIC_API_KEY` 는 서버에만 있고 브라우저로 나가지 않습니다.
- 답안지 이미지는 비공개 버킷에 저장되며, 화면에는 1시간짜리 서명 URL 로만 표시됩니다.
- 학생 이름·답안지가 외부 서비스(Supabase·Vercel·Anthropic)에 저장·전송되므로 학원 개인정보 처리방침에 반영하세요.
