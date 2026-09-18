-- =====================================================================
--  서논술 채점실 — Supabase 스키마 (v1)
--  실행 방법: Supabase 대시보드 → SQL Editor → New query → 전체 붙여넣기 → Run
--  한 번만 실행합니다. 다시 실행해도 안전하도록 if not exists 를 썼습니다.
-- =====================================================================

-- 0. 확장: 학부모 링크 토큰 생성용 (Supabase 기본 제공)
create extension if not exists pgcrypto with schema extensions;

-- ---------------------------------------------------------------------
-- 1. 선생님 명단 (허용 목록)
--    원장이 이메일을 먼저 등록해 두면, 그 이메일로 가입/초대된 계정만 대시보드를 쓸 수 있습니다.
-- ---------------------------------------------------------------------
create table if not exists public.teachers (
  email       text primary key,
  name        text not null,
  role        text not null default 'teacher' check (role in ('owner','teacher')),
  user_id     uuid unique references auth.users(id) on delete set null,
  created_at  timestamptz not null default now()
);

-- 가입(초대 수락) 시 auth.users 의 id 를 teachers.user_id 에 자동 연결
create or replace function public.link_teacher_on_signup()
returns trigger language plpgsql security definer set search_path = public as $$
begin
  update public.teachers set user_id = new.id where lower(email) = lower(new.email) and user_id is null;
  return new;
end $$;

drop trigger if exists on_auth_user_created on auth.users;
create trigger on_auth_user_created
  after insert on auth.users
  for each row execute function public.link_teacher_on_signup();

-- 현재 로그인한 사람이 등록된 선생님인지
create or replace function public.is_teacher()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid());
$$;

-- 현재 로그인한 사람이 원장(owner)인지
create or replace function public.is_owner()
returns boolean language sql stable security definer set search_path = public as $$
  select exists (select 1 from public.teachers where user_id = auth.uid() and role = 'owner');
$$;

-- ---------------------------------------------------------------------
-- 2. 문항 + 루브릭
-- ---------------------------------------------------------------------
create table if not exists public.items (
  id             text primary key,
  title          text not null,                       -- 문항 주제
  grade          text,                                -- 학년 (5, 6, 중1 …)
  domain         text,                                -- 영역·단원
  standard       text,                                -- 성취기준
  item_type      text not null check (item_type in ('서술형','논술형')),
  prompt         text not null,                       -- 문항 본문
  conditions     text,                                -- 조건 (처음-가운데-끝, 제목 필수 등)
  rubric         jsonb,                               -- 총체적·분석적 루브릭 + 평가의도 + 예시답안
  rubric_status  text not null default 'none' check (rubric_status in ('none','draft','approved')),
  rubric_source  text,
  approved_at    timestamptz,
  approved_by    uuid references auth.users(id),
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users(id),
  updated_at     timestamptz not null default now()
);

-- ---------------------------------------------------------------------
-- 3. 답안 (업로드 → 판독 → 채점 → 리포트 → 발송)
-- ---------------------------------------------------------------------
create table if not exists public.answers (
  id             text primary key,
  item_id        text not null references public.items(id) on delete restrict,
  student        text,
  grade          text,
  klass          text,
  images         text[] not null default '{}',        -- Storage 경로 목록 (answer-sheets/…)
  status         text not null default 'uploaded' check (status in ('uploaded','read','graded','reported')),
  transcription  jsonb,                               -- 판독(전사) 결과
  grading        jsonb,                               -- 채점 결과
  reports        jsonb,                               -- {teacher:{…}, parent:{…}}
  -- 집계용 파생 컬럼 (JSON 에서 자동 추출)
  total          int  generated always as ((grading->>'total')::int) stored,
  level          text generated always as (grading->'holistic'->>'level') stored,
  last_error     jsonb,
  read_at        timestamptz,
  graded_at      timestamptz,
  reported_at    timestamptz,
  sent_at        timestamptz,
  -- 학부모 링크: /report/{parent_token} — 로그인 없이 열람, 추측 불가능한 32자
  parent_token   text not null unique default encode(extensions.gen_random_bytes(16), 'hex'),
  parent_token_expires_at timestamptz,               -- null 이면 만료 없음
  created_at     timestamptz not null default now(),
  created_by     uuid default auth.uid() references auth.users(id),
  updated_at     timestamptz not null default now()
);

create index if not exists answers_item_id_idx    on public.answers(item_id);
create index if not exists answers_status_idx     on public.answers(status);
create index if not exists answers_created_at_idx on public.answers(created_at desc);

-- updated_at 자동 갱신
create or replace function public.touch_updated_at()
returns trigger language plpgsql as $$
begin new.updated_at = now(); return new; end $$;

drop trigger if exists items_touch on public.items;
create trigger items_touch before update on public.items for each row execute function public.touch_updated_at();
drop trigger if exists answers_touch on public.answers;
create trigger answers_touch before update on public.answers for each row execute function public.touch_updated_at();

-- ---------------------------------------------------------------------
-- 4. 행 단위 보안(RLS)
--    규칙: 등록된 선생님(로그인)은 문항·답안을 모두 읽고 씀. 그 외에는 아무것도 못 봄.
--    학부모 리포트는 서버가 service_role 키로 대신 읽으므로 여기서 열어 줄 필요가 없음.
-- ---------------------------------------------------------------------
alter table public.teachers enable row level security;
alter table public.items    enable row level security;
alter table public.answers  enable row level security;

-- teachers: 본인 행은 누구나(로그인) 조회, 명단 관리는 원장만
drop policy if exists teachers_select_self on public.teachers;
create policy teachers_select_self on public.teachers
  for select to authenticated using (user_id = auth.uid() or public.is_owner());
drop policy if exists teachers_owner_manage on public.teachers;
create policy teachers_owner_manage on public.teachers
  for all to authenticated using (public.is_owner()) with check (public.is_owner());

-- items / answers: 등록된 선생님 전부
drop policy if exists items_teacher_all on public.items;
create policy items_teacher_all on public.items
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());
drop policy if exists answers_teacher_all on public.answers;
create policy answers_teacher_all on public.answers
  for all to authenticated using (public.is_teacher()) with check (public.is_teacher());

-- ---------------------------------------------------------------------
-- 5. Storage 버킷: 답안지 이미지 (비공개)
-- ---------------------------------------------------------------------
insert into storage.buckets (id, name, public, file_size_limit, allowed_mime_types)
values ('answer-sheets', 'answer-sheets', false, 20971520, array['image/jpeg','image/png','image/webp','application/pdf'])
on conflict (id) do nothing;

drop policy if exists sheets_teacher_select on storage.objects;
create policy sheets_teacher_select on storage.objects
  for select to authenticated using (bucket_id = 'answer-sheets' and public.is_teacher());
drop policy if exists sheets_teacher_insert on storage.objects;
create policy sheets_teacher_insert on storage.objects
  for insert to authenticated with check (bucket_id = 'answer-sheets' and public.is_teacher());
drop policy if exists sheets_teacher_update on storage.objects;
create policy sheets_teacher_update on storage.objects
  for update to authenticated using (bucket_id = 'answer-sheets' and public.is_teacher());
drop policy if exists sheets_teacher_delete on storage.objects;
create policy sheets_teacher_delete on storage.objects
  for delete to authenticated using (bucket_id = 'answer-sheets' and public.is_teacher());

-- ---------------------------------------------------------------------
-- 6. 집계 뷰 (대시보드 홈 카드용)
-- ---------------------------------------------------------------------
create or replace view public.answer_stats as
select
  count(*) filter (where status = 'uploaded') as uploaded,
  count(*) filter (where status = 'read')     as read,
  count(*) filter (where status = 'graded')   as graded,
  count(*) filter (where status = 'reported') as reported,
  count(*)                                    as total
from public.answers;

-- =====================================================================
-- 7. 실행 직후 해야 할 것 (아래 두 줄의 이메일·이름을 본인 것으로 바꿔 실행)
-- =====================================================================
-- insert into public.teachers (email, name, role) values ('teamjyc2026@gmail.com', 'JYC', 'owner')
--   on conflict (email) do update set role = 'owner';
--
-- 선생님 추가: 먼저 여기에 등록하고, 그다음 Authentication → Users → Invite user 로 같은 이메일을 초대
-- insert into public.teachers (email, name) values ('teacher1@example.com', '김선생');
