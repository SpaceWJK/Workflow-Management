# QA Workflow Management

> 게임 QA 팀의 일감, 빌드, 프로젝트, 근태, 팀 협업을 통합 관리하는 풀스택 웹 애플리케이션

**Live Demo**: https://spacewjk.github.io/Workflow-Management/

---

## 📌 개요

**QA Workflow**는 게임 QA 조직의 실무 요구사항을 기반으로 설계된 **업무 관리 시스템**입니다.
단순한 일감 트래커를 넘어, 게임 QA의 특수성(빌드 사이클, 테스트 유형, 팀 상태 가시화, 근태 연동, 리스크 자동 계산)을 반영한 **도메인 특화 솔루션**입니다.

### 해결하려는 문제

| 기존 방식 | QA Workflow |
|----------|-------------|
| Jira + 엑셀 + 슬랙 분산 | 단일 통합 인터페이스 |
| 수동 리스크 관리 | 자동 리스크 레벨 계산 (기한/진척도/빌드 상태) |
| 정적 팀 상태 | 실시간 팀원 현황 + 픽셀 오피스 시각화 |
| 텍스트 기반 회의실 공지 | 통합 회의실 채팅 (픽셀 오피스 내) |
| 별도 근태 시스템 | 일감·타이머·프로젝트 시간 추적과 자동 연동 |

---

## ✨ 핵심 기능

### 📊 대시보드
- **KPI 카드**: 총 프로젝트/일감, 진행중/지연/오늘 마감, 부재 인원
- **프로젝트 건강도**: 진행률 + 지연 여부 기반 색상 경고
- **위험 일감 테이블**: 리스크 레벨 자동 계산 + 정렬
- **오늘 일정 위젯**: 프로젝트/개인 일정 병합
- **팀원 상태 요약**: 근무중/회의중/휴가/재택 등 9가지 상태별 카운트

### 📋 일감 관리 (Task Management)
- **테스트 유형별 진척도**: BVT, BAT, Functionality, Performance, Compatibility, Localization, Balance, Bug Verification, Update 등 **9종 테스트 유형** 개별 트래킹
- **자동 리스크 계산**: 기대 진척도(선형) vs 실제 진척도 차이 기반
- **일감 시간 추적 (Timer)**: 시작/정지/누적 시간 + 프로젝트별 집계
- **일감-빌드 연동**: 수급 차수별 일감 링크
- **일감 의존성**: BLOCKS 관계로 선행 일감 관리
- **버전 관리**: Optimistic locking으로 동시 편집 충돌 감지
- **테스트 이슈 트래킹**: 심각도/상태별 관리

### 🏗️ 빌드 관리 (Build Lifecycle)
- **수급 차수별 빌드**: `Received → Testing → Test Done → Approved → Released` 상태 전이
- **플랫폼별 버전**: iOS / AOS / PC × APP / CDN / SERVER
- **반려 이력**: 재수정 루프 추적 (rejection history JSON)
- **검증된 상태 전이**: 허용된 전이만 가능 (비정상 경로 차단)

### 👥 팀 관리
- **팀원 현황 페이지**: 역할별/상태별/팀별 필터
- **업무 부하 패널**: 개인별 할당 일감 수 + 경고
- **프로필 모달**: 이메일/연락처/소개/담당 프로젝트
- **상태 실시간 동기화**: Socket.io로 teamStatus 변경 브로드캐스트

### 🎮 픽셀 오피스 (Pixel Office)
- **18석 오피스 시각화**: 6열×3행 그리드 + 역할별 아바타 (관리자/매니저/멤버/뷰어)
- **실시간 상태 반영**: teamStatus에 따라 모니터/랩탑/빈 자리 표시
- **근태 연동**: 오늘 출근자만 자리 배정 (clockIn 기준)
- **역할 필터링**: VIEWER 제외
- **호버 툴팁**: 이름/역할/상태 상세 표시

### 💬 회의실 기능 (MR-1)
Pixel Office 내 **실시간 채팅 회의실**.

**기능:**
- 회의실 생성 (제목, 공개/비공개, 비밀번호, 초대 인원)
- 공개방: 누구나 참여 / 비공개방: 비밀번호 필요
- **ADMIN 특권**: 비밀번호 없이 입장 + 참여자 목록 비노출 (감독용)
- 실시간 채팅 (Socket.io)
- 참여 시 `teamStatus = IN_MEETING` 자동 변경, 퇴장 시 이전 상태 복원
- Socket disconnect 자동 퇴장 + 전원 퇴장 시 방 자동 닫힘
- 새로고침 시 회의 상태 복원 (`/api/meeting-rooms/me/current`)

### 📅 캘린더
- **월간 그리드**: 프로젝트 일감 + 개인 일정 통합
- **간트 타임라인**: 프로젝트별 일감 기간 시각화
- **Today Indicator**: 실시간 현재 시각 라인
- **일정 이벤트**: 휴가, 출장, 반차, 재택, 외근, 회의, 기타
- **공휴일 자동 표시**

### ⏰ 근태 관리 (AT-1)
- **일일 근태**: 출근/퇴근 클록 + 일일 기록
- **월간 근태**: 개인별 누적 (정상/지각/조퇴/결근)
- **개인 근태 상세**: 프로젝트별 작업 시간 집계
- **프로젝트 시간**: 기간별 프로젝트별 인원/시간 리포트
- **상태 자동 연동**: 출근 시 `AVAILABLE`, 퇴근 시 `OFF_WORK`

### 🔐 인증 / 권한
- **JWT 기반 인증** + 세션 복원
- **4-Tier 역할**: `ADMIN > QA_MANAGER > QA_MEMBER > VIEWER`
- **Rate Limiting**: 전역 1분당 100req, 로그인 별도 제한
- **관리자 페이지**: 회원 관리, 시스템 설정

### ⚙️ 개인 설정 (PS-1)
- **프로필 편집** (아바타 크롭 포함)
- **상태 변경 페이지** (수동 상태 전환)
- **비밀번호 변경** (bcrypt 검증)
- **오늘 할 일** 개인 뷰
- **출퇴근 클록 페이지**

### 🔔 실시간 알림
- **Notification 모델**: 개인/팀/프로젝트 대상
- **Socket.io 브로드캐스트**: task, project, build, team, calendar, meeting 이벤트

---

## 🏗️ 기술 스택

### Frontend
| 영역 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript | ~5.9 |
| 프레임워크 | React | 19 |
| 빌드 도구 | Vite | 8 |
| 라우팅 | React Router | 7 |
| 상태 관리 | Zustand (전역) + TanStack Query (서버) | 5 / 5 |
| 스타일링 | Tailwind CSS v4 + CSS Custom Properties | 4 |
| 애니메이션 | Framer Motion | 12 |
| 아이콘 | Lucide React | - |
| 폼 | React Hook Form + Zod | 7 / 4 |
| 차트 | Recharts | 3 |
| 날짜 | Day.js | 1.11 |
| 실시간 | Socket.io Client | 4.8 |
| 이미지 크롭 | react-image-crop | 11 |
| 배포 | gh-pages (GitHub Pages) | - |

### Backend
| 영역 | 기술 | 버전 |
|------|------|------|
| 언어 | TypeScript (ESM) | - |
| 런타임 | Node.js + tsx | 24 |
| 프레임워크 | Express | 5 |
| ORM | Prisma | 6.19 |
| DB | PostgreSQL (Supabase) | - |
| 인증 | JWT (jsonwebtoken) | - |
| 비밀번호 해시 | bcryptjs | - |
| 실시간 | Socket.io | 4.8 |
| 입력 검증 | Zod | 4 |
| 보안 | Helmet, CORS, express-rate-limit | - |
| 이메일 | 자체 서비스 | - |

### 인프라
- **DB**: Supabase PostgreSQL (ap-northeast-2)
- **프론트 호스팅**: GitHub Pages (`gh-pages` 브랜치)
- **백엔드 호스팅**: Railway 또는 로컬 (배포 예정)
- **Git**: GitHub (SpaceWJK/Workflow-Management)

---

## 🏛️ 아키텍처

### 전체 구조

```
┌──────────────────────────────────────────────────────────────┐
│                         CLIENT (Browser)                      │
│  ┌────────────────────────────────────────────────────────┐  │
│  │  React SPA (Vite)                                       │  │
│  │  ├─ Zustand (auth, UI 전역 state)                       │  │
│  │  ├─ TanStack Query (서버 state + 캐싱 + invalidation)   │  │
│  │  ├─ Socket.io Client (실시간 이벤트 수신)                │  │
│  │  └─ React Router (SPA 라우팅)                           │  │
│  └────────────────────────────────────────────────────────┘  │
└───────────────────┬─────────────────────┬────────────────────┘
                    │ REST (JSON)         │ WebSocket
                    ▼                     ▼
┌──────────────────────────────────────────────────────────────┐
│                    SERVER (Node.js / Express)                 │
│  ┌──────────────────┐  ┌──────────────────────────────────┐  │
│  │  Express Routes  │  │  Socket.io Server                 │  │
│  │  /api/*          │  │  - JWT 인증 미들웨어               │  │
│  │  - JWT 검증       │  │  - meeting:* events               │  │
│  │  - Zod 검증       │  │  - task/team/build broadcast      │  │
│  │  - Rate limiting  │  │                                   │  │
│  └────────┬─────────┘  └──────────────┬───────────────────┘  │
│           │                            │                      │
│           ▼                            ▼                      │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Services Layer                                       │    │
│  │  auth / task / project / team / attendance /          │    │
│  │  build / timer / meeting / notification               │    │
│  └──────────────────┬───────────────────────────────────┘    │
│                     │                                          │
│                     ▼                                          │
│  ┌──────────────────────────────────────────────────────┐    │
│  │  Prisma ORM                                          │    │
│  └──────────────────┬───────────────────────────────────┘    │
└─────────────────────┼──────────────────────────────────────┘
                      │
                      ▼
         ┌────────────────────────────┐
         │  Supabase PostgreSQL       │
         │  (20+ tables)              │
         └────────────────────────────┘
```

### 디렉토리 구조

```
QA Workflow/
├── client/                    # 프론트엔드 (Vite + React)
│   ├── public/
│   │   ├── 404.html          # GitHub Pages SPA 폴백
│   │   ├── favicon.svg
│   │   └── icons.svg
│   ├── src/
│   │   ├── App.tsx           # 라우팅 루트
│   │   ├── main.tsx          # Vite 진입점
│   │   ├── index.css         # Tailwind + CSS 변수 (테마)
│   │   ├── components/
│   │   │   ├── dashboard/    # 대시보드 위젯 5종
│   │   │   ├── tasks/        # 일감 목록/상세/폼/테이블
│   │   │   ├── projects/     # 프로젝트 칸반/타임라인
│   │   │   ├── builds/       # 빌드 목록/상세/폼
│   │   │   ├── calendar/     # 월간/간트 캘린더
│   │   │   ├── team/         # 팀원 현황 + PixelOffice
│   │   │   │   └── meeting/  # 회의실 UI (리스트/채팅/모달)
│   │   │   ├── attendance/   # 일일/월간/개인/프로젝트 근태
│   │   │   ├── profile/      # 개인 설정 5종
│   │   │   ├── settings/     # 시스템 설정
│   │   │   ├── admin/        # 회원 관리
│   │   │   ├── layout/       # AppShell, Sidebar, Header
│   │   │   └── common/       # 공통 UI (Badge, KPI, Modal 등)
│   │   ├── hooks/            # React Query + Socket.io 커스텀 훅
│   │   ├── stores/           # Zustand (auth, ui)
│   │   ├── lib/              # api, socket, utils, holidays
│   │   ├── types/            # 전역 TypeScript 타입
│   │   └── pages/            # LoginPage
│   ├── index.html            # SPA 폴백 복원 스크립트 포함
│   ├── vite.config.ts        # base: '/Workflow-Management/' + proxy
│   └── package.json
│
├── server/                    # 백엔드 (Express + Prisma)
│   ├── src/
│   │   ├── app.ts            # Express 앱 팩토리
│   │   ├── index.ts          # 서버 진입점
│   │   ├── prisma.ts         # Prisma 클라이언트
│   │   ├── socket.ts         # Socket.io 초기화 + 이벤트
│   │   ├── routes/           # REST 라우터
│   │   │   ├── auth, tasks, projects, team, calendar,
│   │   │   ├── leaves, settings, admin, builds, timer,
│   │   │   ├── attendance, meeting-rooms
│   │   ├── services/         # 비즈니스 로직
│   │   │   ├── auth, task, project, team, build,
│   │   │   ├── timer, attendance, meeting, calendar-event,
│   │   │   ├── risk, email, notification
│   │   ├── middleware/       # auth, error, validate
│   │   └── types/            # 서버 타입 + Socket 이벤트
│   ├── prisma/
│   │   ├── schema.prisma     # 20+ 모델
│   │   ├── seed.ts           # 초기 데이터
│   │   └── migrations/
│   └── package.json
│
└── README.md                  # (이 문서)
```

### 데이터 모델 (핵심 23개 테이블)

```
User ─┬─ assignedTasks     Task ─┬─ testTypes (TaskTestType)
      ├─ createdTasks            ├─ progressLogs (TaskProgressLog)
      ├─ projectMembers          ├─ dependsOn/dependedBy (TaskDependency)
      ├─ leaves                  ├─ issues (Issue)
      ├─ notifications           ├─ buildLinks (TaskBuildLink)
      ├─ calendarEvents          ├─ timeLogs (TaskTimeLog)
      ├─ attendanceLogs          └─ project (Project)
      ├─ meetingParticipants
      ├─ meetingMessages  Project ─── builds (Build) ── buildVersions
      └─ meetingRoomsCreated     └── taskLinks (TaskBuildLink)

TestTypeCode ─── taskTestTypes
AlertRule (시스템)
ActivityLog (감사 로그)
EmailVerification
Setting (시스템 KV)

MeetingRoom ─┬─ participants (MeetingParticipant)
             └─ messages (MeetingMessage)
```

---

## 🔄 주요 동작 흐름

### 1. 사용자 로그인 → 대시보드
```
[User] → POST /api/auth/login (name + password)
         ↓
[Server] → bcrypt.compare → JWT 생성 → { token, user }
         ↓
[Client] → localStorage 저장 → Zustand authStore 갱신
         ↓ Socket.io connect (JWT)
[Server] → Socket JWT 검증 → 'global' room join
         ↓
[Client] → GET /api/auth/me (복원) + /api/tasks + /api/projects + /api/team 병렬
         ↓ 대시보드 렌더
```

### 2. 일감 상태 변경 → 실시간 브로드캐스트
```
[User A] → 일감 상태 PENDING → IN_PROGRESS
         ↓ PUT /api/tasks/:id
[Server] → Zod 검증 → 상태 전이 검증(VALID_TRANSITIONS) → Prisma update
         ↓ ActivityLog 기록
         ↓ io.to('global').emit('task:statusChanged')
[User B 브라우저] → Socket 수신 → queryClient.invalidateQueries(['tasks'])
                  ↓ 일감 목록 자동 갱신
```

### 3. 회의실 생성 → 채팅 → 퇴장
```
[User A] → "회의실 만들기" → CreateMeetingModal (제목, 공개/비공개, 초대)
         ↓ POST /api/meeting-rooms
[Server] → 기존 참여 있으면 자동 leave → bcrypt hash → MeetingRoom + MeetingParticipant 생성
         ↓ teamStatus = IN_MEETING → io.emit('team:statusChanged')
         ↓ io.to('global').emit('meeting:created')
[Client A] → activeRoomId = 새 방 → MeetingChatPanel key remount
          ↓ socket.emit('meeting:join', roomId) → socket.join('meeting:N')

[User A] → 메시지 입력 → socket.emit('meeting:sendMessage')
[Server] → MeetingParticipant 검증 → content.slice(0, 2000) → DB 저장
         ↓ io.to('meeting:N').emit('meeting:message')
[All Participants] → 실시간 수신 → UI 업데이트

[User A] → 나가기 → POST /api/meeting-rooms/:id/leave
[Server] → $transaction: participant 삭제 + teamStatus 복원 + 인원 0이면 isActive=false
         ↓ io.to('meeting:N').emit('meeting:left')
         ↓ io.emit('team:statusChanged', { status: restoredStatus })
         ↓ if closed: io.to('global').emit('meeting:closed')
```

### 4. 자동 리스크 계산
```
[Scheduler / API 호출 시] → risk.service 실행
         ↓
  기대 진척도(expected) = (today - startDate) / (dueDate - startDate) × 100
  실제 진척도(total) = progressTotal
  차이 = expected - total
         ↓
  차이 > 40% && 기한 임박 → CRITICAL
  차이 > 25%              → HIGH
  차이 > 10%              → MEDIUM
  else                    → LOW
```

### 5. 근태 → teamStatus 연동
```
[User] → /api/attendance/clock (IN/OUT)
[Server] → AttendanceLog upsert (UPSERT on userId+date)
         ↓ User.teamStatus 자동 변경
         │   IN  → AVAILABLE
         │   OUT → OFF_WORK
         ↓ io.emit('team:statusChanged')
[Client] → Pixel Office / 팀원 현황 UI 자동 갱신
```

---

## 🚀 로컬 개발

### 요구사항
- Node.js 20+
- PostgreSQL (또는 Supabase 프로젝트)
- `.env` 파일 (server/)

### 설치
```bash
# 클라이언트
cd client
npm install

# 서버
cd ../server
npm install
cp .env.example .env   # DATABASE_URL, JWT_SECRET 등 설정
npx prisma generate
npx prisma db push     # 또는 migrate deploy
npx tsx prisma/seed.ts # 초기 데이터
```

### 실행
```bash
# 터미널 1: 백엔드
cd server
npx tsx src/index.ts   # http://localhost:4000

# 터미널 2: 프론트
cd client
npm run dev            # http://localhost:5173/Workflow-Management/
```

### 배포
```bash
cd client
npm run deploy         # vite build → gh-pages -d dist
```

---

## 🔐 보안 고려사항

- ✅ JWT 기반 인증 (Authorization 헤더)
- ✅ bcrypt 비밀번호 해시 (rounds: 12)
- ✅ Helmet HTTP 보안 헤더
- ✅ CORS whitelist (프로덕션 origin 제한)
- ✅ Rate Limiting (전역 + 로그인 별도)
- ✅ Zod 입력 검증 (모든 POST/PUT)
- ✅ Prisma Parameterized Query (SQL Injection 방지)
- ✅ 회의실 비밀번호 bcrypt 저장 + 응답에서 passwordHash 제외
- ✅ Socket.io JWT 미들웨어
- ✅ ADMIN 참여자 서버사이드 필터 (클라이언트 의존 X)
- ✅ 회의실 Socket join DB 참여자 검증 (도청 방지)
- ✅ 메시지 길이 제한 (2000자)

---

## 📦 주요 의존성 이유

| 라이브러리 | 선택 이유 |
|-----------|---------|
| **Vite** | esbuild + Rollup 기반 초고속 HMR |
| **TanStack Query** | 서버 state 캐싱 + invalidation + 백그라운드 refetch로 Redux 대체 |
| **Zustand** | Boilerplate 최소화, Redux 대비 학습곡선 낮음 |
| **Prisma** | Type-safe ORM, 마이그레이션 관리, Supabase 호환 |
| **Socket.io** | 자동 재연결, Room 기반 브로드캐스트, 폴백 지원 |
| **Zod** | 런타임 + 컴파일 타임 타입 안전성 |
| **Framer Motion** | 페이지 전환 + 모달 애니메이션 |
| **React Hook Form** | Uncontrolled 폼 + Zod 통합으로 렌더링 최소화 |
| **Recharts** | 대시보드 차트 (Declarative, React Native) |

---

## 🧪 개발 원칙

프로젝트는 **에이전트 기반 8단계 워크플로우**로 개발됩니다:

1. 요구분석 (테스트 매트릭스 작성)
2. 설계 및 기획
3. 설계 검수 (기술/QA 2인 에이전트 병렬)
4. 구현 (dev 에이전트 투입)
5. QA 검수 (통합 QA 1인)
6. 이슈 수정
7. 최종 검수 (QA + 보안 2인)
8. 배포 (사용자 승인)

상세 워크플로우는 `_workspace/` 디렉토리 참조.

---

## 📜 License

Private — SpaceWJK

## 🙋 Contact

- GitHub: [SpaceWJK](https://github.com/SpaceWJK)
- Repo: [Workflow-Management](https://github.com/SpaceWJK/Workflow-Management)
