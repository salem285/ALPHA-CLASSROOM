# ALPHA CLASSROOM — Project Progress

**Project:** ALPHA CLASSROOM  
**Client / Organization:** Alpha Coding  
**Architecture:** Monorepo (Next.js Frontend + NestJS Backend + PostgreSQL)

---

## Phase Roadmap & Status

| Phase | Description | Status | Completion Date |
| :--- | :--- | :--- | :--- |
| **Phase 0** | Development Environment Inspection & Architectural Blueprint | **Completed** | 2026-11-04 |
| **Phase 1** | Project Scaffolding, Base Monorepo & Health Check | **Completed** | 2026-11-04 |
| **Phase 2** | Database Configuration, Prisma Schema & Migrations | **Completed** | 2026-11-04 |
| **Phase 3** | Authentication & RBAC Core (JWT, User Approval System) | **Completed** | 2026-11-04 |
| **Phase 4** | User Management & Frontend Auth Integration | **Completed** | 2026-11-04 |
| **Phase 5** | Course Management & Enrollment System | **Completed** | 2026-11-04 |
| **Phase 6** | Assignments & Submissions System | **Completed** | 2026-11-04 |
| **Phase 7** | Online Examination & Grading System | **Completed** | 2026-11-04 |
| **Phase 8** | Live Classrooms System (LiveKit WebRTC) | **Completed** | 2026-11-04 |
| **Phase 9** | Automated Classroom Attendance Tracking & Analytics | **Completed** | 2026-11-05 |
| **Phase 10** | Real-Time Messaging & Notifications | Pending | |
| **Phase 11** | Session Recording & Lecture Archive System | **Completed** | 2026-11-05 |
| **Phase 12** | Polish, Audit & Production Readiness | Pending | |

---

## Phase 1 Execution Checklist
- [x] Verify Node.js, npm, Git, and PostgreSQL local installation
- [x] Initialize Git repository
- [x] Create root `.gitignore`, `.env.example`, `PROJECT_PROGRESS.md`, `README.md`
- [x] Create `docs/` directory and documentation
- [x] Initialize NestJS backend in `backend/`
- [x] Configure backend to run on port `4000` with global prefix `api/v1`
- [x] Implement `GET /api/v1/health` endpoint on backend
- [x] Initialize Next.js frontend in `frontend/` (App Router, TypeScript, Tailwind CSS)
- [x] Configure frontend to run on port `3001`
- [x] Create frontend verification page confirming ALPHA CLASSROOM is running
- [x] Verify TypeScript compilation for backend & frontend
- [x] Test backend health endpoint (`http://localhost:4000/api/v1/health` -> HTTP 200)
- [x] Test frontend page (`http://localhost:3001` -> HTTP 200)

---

## Phase 2 Execution Checklist
- [x] Install Prisma CLI (`prisma@6.19.3`) as devDependency and `@prisma/client@6.19.3` in `backend/`
- [x] Initialize Prisma in `backend/`
- [x] Configure `backend/.env` with PostgreSQL connection string for `alpha_classroom_db`
- [x] Define `schema.prisma` with `UserRole` enum and foundational `User` model
- [x] Create `alpha_classroom_db` in PostgreSQL
- [x] Run initial migration (`prisma migrate dev --name init`) and generate Prisma Client
- [x] Implement `PrismaService` and `PrismaModule` in NestJS with connection lifecycle management
- [x] Update `GET /api/v1/health` endpoint to check database connectivity
- [x] Verify TypeScript compilation and run automated tests
- [x] Test live health endpoint with database status (`database: { status: "connected" }`)

---

## Phase 3 Execution Checklist
- [x] Install security & auth dependencies (`@nestjs/jwt`, `@nestjs/passport`, `passport`, `passport-jwt`, `bcryptjs`, `@types/bcryptjs`, `@types/passport-jwt`, `class-validator`, `class-transformer`, `tsx`)
- [x] Configure JWT secrets and expiration times in `backend/.env` and `.env.example`
- [x] Enable global `ValidationPipe` with `whitelist: true`, `transform: true` in `main.ts`
- [x] Implement DTOs:
  - `RegisterDto` (email, password min 8 chars, firstName, lastName, role enum)
  - `LoginDto` (email, password)
- [x] Implement password hashing using `bcryptjs` with salt rounds = 10
- [x] Implement user registration with approval rules (`isApproved: false` by default)
- [x] Implement user login with credential validation, approval status enforcement (HTTP 403 Forbidden on unapproved), and JWT issuance
- [x] Implement `JwtStrategy` and `JwtAuthGuard` for route authentication
- [x] Implement `@Roles()` decorator and `RolesGuard` for role-based authorization (`SUPER_ADMIN`, `ADMIN`, `INSTRUCTOR`, `STUDENT`)
- [x] Implement `GET /api/v1/auth/me` protected endpoint returning current authenticated user profile
- [x] Implement database seed script (`backend/prisma/seed.ts`) to initialize default Super Admin (`admin@alphacoding.com`)
- [x] Configure `package.json` with `prisma.seed` and execute `npx prisma db seed`
- [x] Comprehensive unit tests for `AuthService` (5 unit tests passing)
- [x] Live end-to-end testing verifying Registration, 403 Unapproved rejection, Super Admin Login, and Bearer token protected profile access

---

## Phase 4 Execution Checklist
- [x] Build backend `UsersModule`, `UsersService`, and `UsersController`
- [x] Implement protected user management endpoints (`JwtAuthGuard`, `RolesGuard` for `SUPER_ADMIN`, `ADMIN`):
  - `GET /api/v1/users` (list all users, with role & isApproved filter queries)
  - `GET /api/v1/users/pending` (list users where `isApproved === false`)
  - `PATCH /api/v1/users/:id/approve` (sets `isApproved: true`)
  - `PATCH /api/v1/users/:id/reject` & `DELETE /api/v1/users/:id` (removes unapproved applicant)
- [x] Comprehensive unit tests for `UsersService` (5 unit tests passing)
- [x] Build frontend API client utility (`frontend/src/lib/api.ts`) with automatic Bearer token attachment
- [x] Implement `AuthContext` and `useAuth` hook managing token persistence, user profile, login, registration, and logout
- [x] Build branded UI pages matching Alpha Coding theme (dark purple `#7c3aed` & navy `#090b14`):
  - `/login` (interactive sign-in with 403 pending-approval error guidance and admin quick-fill)
  - `/register` (name, email, password, role selection with administrative review notice)
  - `/pending-approval` (verification status page informing applicant of pending review)
- [x] Build role-based dashboard shells:
  - `/admin` (management overview, pending approvals table with live Approve/Reject actions, all users directory)
  - `/instructor` (instructor portal shell with course, live class, and grading modules)
  - `/student` (student portal shell with course enrollment, assignments, and exam grades)
- [x] Verify zero build errors for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live end-to-end testing of user registration -> 403 block -> admin approval -> successful login -> profile access

---

## Phase 5 Execution Checklist
- [x] Expand Prisma schema with `Course` and `Enrollment` models with cascade deletion and unique constraints
- [x] Execute migration `20261104133245_add_courses_and_enrollments` in PostgreSQL
- [x] Regenerate Prisma Client with `CourseDelegate` and `EnrollmentDelegate`
- [x] Implement backend `CoursesModule`, `CoursesService`, and `CoursesController` with DTOs (`CreateCourseDto`, `UpdateCourseDto`)
- [x] Protected endpoints with role checking:
  - `POST /api/v1/courses` (Instructor/Admin course creation with auto-assigned instructor)
  - `GET /api/v1/courses` (Public / active student course catalog with instructor profile and enrollment counters)
  - `GET /api/v1/courses/:id` (Detailed course lookup)
  - `POST /api/v1/courses/:id/enroll` (Student course enrollment with duplicate prevention)
  - `GET /api/v1/courses/my/teaching` (Instructor's teaching courses with live enrollment counts)
  - `GET /api/v1/courses/my/enrolled` (Student's enrolled courses with instructor details)
- [x] Comprehensive unit tests for `CoursesService` (6 unit tests passing, total backend tests: 17)
- [x] Enhance `/instructor` page with Course Creation Modal and interactive teaching courses grid
- [x] Enhance `/student` page with "My Enrolled Courses" tab, "Course Catalog" tab, and one-click "Enroll Now" functionality
- [x] Zero compilation errors verified for frontend (`npm run build`) and backend (`npm run build`)
- [x] Live automated end-to-end test of course creation, student enrollment, duplicate prevention (409), and teaching counters
- [x] **Course Access Code Security Upgrade**:
  - Added `accessCode` field to `Course` model and executed migration `20261104162703_add_course_access_code`
  - Regenerated Prisma Client with access code support
  - Implemented `EnrollCourseDto` requiring valid access code for enrollment
  - Configured `CoursesService.create` to accept custom codes or auto-generate `ALPHA-XXXX` format
  - Secured public course catalog (`GET /api/v1/courses`) to strip `accessCode` from student-facing payloads
  - Maintained `accessCode` visibility in instructor teaching catalog (`GET /courses/my/teaching`)
  - Enforced case-insensitive access code validation in `CoursesService.enroll` with HTTP 400 rejection for mismatched codes
  - Expanded unit test coverage in `CoursesService.spec.ts` (9 tests passing, total backend tests: 20)
  - Updated `/instructor` portal with Access Code input on modal and "Copy Access Code" action on course cards
  - Updated `/student` portal with interactive Enrollment Modal requiring instructor-provided access code
  - Automated E2E verification of code validation, rejection on invalid code (400), and enrollment on valid code (201)

---

## Phase 6 Execution Checklist
- [x] Expand Prisma schema with `Assignment` and `Submission` models:
  - `Assignment` (id, courseId, title, description, dueDate, maxScore, createdAt, updatedAt)
  - `Submission` (id, assignmentId, studentId, content, score, feedback, status, submittedAt, gradedAt, @@unique([assignmentId, studentId]))
- [x] Execute migration `20261104164031_add_assignments_and_submissions` in PostgreSQL
- [x] Regenerate Prisma Client with `AssignmentDelegate` and `SubmissionDelegate`
- [x] Implement backend `AssignmentsModule`, `AssignmentsService`, and `AssignmentsController` with DTOs:
  - `CreateAssignmentDto` (title, description, dueDate, maxScore)
  - `SubmitAssignmentDto` (content)
  - `GradeSubmissionDto` (score, feedback)
- [x] Protected endpoints with role checking and course ownership verification:
  - `POST /api/v1/courses/:courseId/assignments` (INSTRUCTOR owner, ADMIN only)
  - `GET /api/v1/courses/:courseId/assignments` (Course instructor or enrolled students only)
  - `POST /api/v1/assignments/:id/submit` (STUDENT only, verify student is enrolled in parent course)
  - `GET /api/v1/assignments/:id/submissions` (INSTRUCTOR owner, ADMIN only)
  - `PATCH /api/v1/submissions/:id/grade` (INSTRUCTOR owner, ADMIN only)
- [x] Comprehensive unit tests for `AssignmentsService` (12 unit tests passing, total backend tests: 32)
- [x] Frontend Instructor Portal (`/instructor`):
  - Added "Assignments & Grading" management tab and course selector
  - Added "Create Assignment" modal with title, description, max score, and optional due date
  - Added Submissions viewer & grading modal with student work, solution link/text viewer, score input, feedback input, and live grading
- [x] Frontend Student Portal (`/student`):
  - Added "View Coursework" button on enrolled course cards
  - Added interactive Coursework viewer modal displaying all course assignments
  - Added "Submit Assignment" modal supporting solution link or text
  - Displayed real-time submission status badges, numerical score, and instructor feedback when graded
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test verifying:
  1. Instructor creates assignment for course CS101
  2. Enrolled student submits solution link
  3. Instructor reviews and grades submission (score + feedback)
  4. Student retrieves the graded assignment with score and feedback verified

---

## Phase 7 Execution Checklist
- [x] Expand Prisma schema with `Exam`, `Question`, and `ExamAttempt` models:
  - `Exam` (id, courseId, title, description, durationMinutes, passingScore, totalScore, startTime, endTime, isPublished, timestamps)
  - `Question` (id, examId, text, type, points, options Json, correctAnswer, orderIndex)
  - `ExamAttempt` (id, examId, studentId, answers Json, score, isPassed, startedAt, submittedAt, status, @@unique([examId, studentId]))
- [x] Execute migration `20261104170402_add_exams_and_grading` in PostgreSQL
- [x] Regenerate Prisma Client with `ExamDelegate`, `QuestionDelegate`, and `ExamAttemptDelegate`
- [x] Implement backend `ExamsModule`, `ExamsService`, and `ExamsController` with DTOs:
  - `CreateExamDto` (title, description, durationMinutes, passingScore, totalScore, isPublished)
  - `AddQuestionDto` (text, type, points, options, correctAnswer, orderIndex)
  - `SubmitExamDto` (answers map)
- [x] Protected endpoints with role checking and security assertions:
  - `POST /api/v1/courses/:courseId/exams` (INSTRUCTOR owner, ADMIN only)
  - `POST /api/v1/exams/:id/questions` (INSTRUCTOR owner, ADMIN only)
  - `GET /api/v1/courses/:courseId/exams` (Enrolled students & Instructor)
  - `GET /api/v1/exams/:id/take` (STUDENT only: starts attempt and strips `correctAnswer` from questions)
  - `POST /api/v1/exams/:id/submit` (STUDENT only: evaluates student answers against keys, calculates final score, and assigns pass/fail status)
  - `GET /api/v1/exams/:id/results` (INSTRUCTOR owner, ADMIN only: view all student attempts)
  - `GET /api/v1/exams/:id/my-result` (STUDENT only: view personal exam score and evaluation)
- [x] Comprehensive unit tests for `ExamsService` (11 unit tests passing, total backend tests: 43)
- [x] Frontend Instructor Portal (`/instructor`):
  - Added "Online Exams" management tab and course selector
  - Added "Create New Exam" modal with duration, passing score, and publish controls
  - Added Question Builder interface for MCQ options and answer key selection
  - Added Exam Results modal displaying student attempts, scores, and pass/fail indicators
- [x] Frontend Student Portal (`/student`):
  - Added "Online Exams" tab inside the Course Portal modal
  - Displayed exam catalog with duration, questions count, and status badges
  - Built interactive Exam Taking interface with live countdown timer and radio selectors
  - Built immediate Exam Result card displaying score, percentage, and passing badge
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test verifying:
  1. Instructor creates exam with 2 MCQ questions for CS101
  2. Student starts exam (payload verified: answer keys securely stripped)
  3. Student submits correct answers
  4. Auto-grading verified: calculated 100% score, marked status as PASSED, and updated student & instructor views

---

## Phase 8 Execution Checklist
- [x] Expand Prisma schema with `LiveRoom` model and relation to `Course`:
  - `LiveRoom` (id, courseId, title, roomName @unique, isLive @default(true), createdAt, endedAt, cascade relation to Course)
- [x] Execute migration `20261104174434_add_live_rooms` in PostgreSQL
- [x] Regenerate Prisma Client with `LiveRoomDelegate`
- [x] Install `livekit-server-sdk` in `backend/` and configure environment variables (`LIVEKIT_API_KEY`, `LIVEKIT_API_SECRET`, `LIVEKIT_URL`)
- [x] Install `@livekit/components-react`, `@livekit/components-styles`, and `livekit-client` in `frontend/`
- [x] Configure `NEXT_PUBLIC_LIVEKIT_URL="ws://localhost:7880"` in `frontend/.env.local`
- [x] Implement backend `RoomsModule`, `RoomsService`, and `RoomsController` with DTOs:
  - `POST /api/v1/courses/:courseId/rooms` (INSTRUCTOR owner, ADMIN only: closes any existing active session and starts a new live room)
  - `GET /api/v1/courses/:courseId/rooms/active` (Enrolled students & Instructor: returns currently active live room)
  - `GET /api/v1/rooms/:roomId/token` (Generates cryptographically signed LiveKit `AccessToken` with appropriate video grants: `roomAdmin: true` for instructor, `roomAdmin: false` for students)
  - `PATCH /api/v1/rooms/:roomId/end` (INSTRUCTOR owner, ADMIN only: sets `isLive: false` and records `endedAt`)
  - `GET /api/v1/rooms/:roomId` (Retrieves room metadata)
- [x] Comprehensive unit tests for `RoomsService` (15 unit tests passing, total backend tests: 58 across 7 test suites)
- [x] Frontend Classroom View (`frontend/src/app/classroom/[roomId]/page.tsx`):
  - Embedded `<LiveKitRoom>` with `@livekit/components-styles` and `<VideoConference>`
  - Custom Alpha Coding dark theme styling (`#7c3aed`, `#090b14`, `#12162b`)
  - Real-time live status indicator badge, course info, and user role identification
  - Host controls: "End Live Session for Everyone" button for instructors and admins
  - Clean error boundaries and "Back to Dashboard" fallback handlers
- [x] Frontend Instructor Portal (`/instructor`):
  - Added live session status & controls on course cards (Start Live Class modal, active pulsing badge, Join and End buttons)
  - Added global top banner alerting instructor of any active live sessions
- [x] Frontend Student Portal (`/student`):
  - Added real-time live alert banner for enrolled courses with one-click "Join Live Session" routing
  - Added live indicator badge and direct join button on enrolled course cards
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test (`scratch/test_phase8_livekit.ps1`):
  1. Instructor launches live room for course CS101
  2. Enrolled student discovers active room and requests signed LiveKit JWT token
  3. Instructor requests admin LiveKit token
  4. Un-enrolled user verified rejected with 403 Forbidden
  5. Instructor ends room (isLive: false, endedAt recorded)
  6. Subsequent token requests for ended room verified rejected with 400 Bad Request

---

## Phase 9 Execution Checklist
- [x] Expand Prisma schema with `AttendanceRecord` model:
  - `AttendanceRecord` (id, roomId, studentId, joinedAt, leftAt, durationMinutes, status [PRESENT, LATE, ABSENT], createdAt, updatedAt, @@unique([roomId, studentId]))
  - Added cascade relation to `LiveRoom` and `User`
- [x] Execute migration `20261105102322_add_attendance_records` in PostgreSQL
- [x] Regenerate Prisma Client with `AttendanceRecordDelegate`
- [x] Backend Attendance Logic in `RoomsModule` (`RoomsService`, `RoomsController`):
  - Auto-create attendance record with `joinedAt: new Date()` upon student requesting LiveKit token (`GET /api/v1/rooms/:roomId/token`)
  - `POST /api/v1/rooms/:roomId/heartbeat` (STUDENT): updates `leftAt` and recalculates `durationMinutes`
  - `POST /api/v1/rooms/:roomId/leave` (STUDENT): records exit timestamp and finalizes `durationMinutes`
  - `GET /api/v1/rooms/:roomId/attendance` (INSTRUCTOR owner, ADMIN): returns all session attendees with names, emails, duration, status
  - `GET /api/v1/courses/:courseId/my-attendance` (STUDENT): returns personal attendance history, total/attended sessions, and calculated attendance rate percentage
  - `GET /api/v1/courses/:courseId/attendance-sessions` (INSTRUCTOR owner, ADMIN): returns all past sessions with attendees for instructor reports
- [x] Comprehensive unit tests in `rooms.service.spec.ts` covering attendance logic:
  - Token request auto-logs attendance record
  - Heartbeat updates `leftAt` and `durationMinutes`
  - Leave endpoint records exit time
  - Room attendance reports return attendee list
  - Student course attendance calculates percentage rate accurately
  - Total backend tests: 63 passed across all 7 test suites
- [x] Frontend Classroom Attendance Integration (`frontend/src/app/classroom/[roomId]/page.tsx`):
  - Automated 60-second heartbeat interval while student is active in room
  - Automatic `leave` endpoint invocation on unmount and on clicking "Leave Classroom"
- [x] Frontend Instructor Portal (`frontend/src/app/instructor/page.tsx`):
  - "Attendance Reports" tab with course selector and session cards
  - Attendees detail modal with student names, emails, join/leave times, duration, and status
  - Quick "Attendance" navigation button on course cards in Courses tab
- [x] Frontend Student Portal (`frontend/src/app/student/page.tsx`):
  - Course attendance rate summary badge on each enrolled course card
  - Detailed session history modal showing overall attendance %, attended vs total sessions, standing badge, and breakdown of all joined sessions with dates, times, and duration
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test (`scratch/test_phase9_attendance.ps1`):
  1. Instructor creates course with access code
  2. Instructor starts live classroom session
  3. Student enrolls with access code
  4. Student requests LiveKit token (verifies auto-attendance record creation)
  5. Student sends heartbeat ping and calls leave endpoint (verifies duration calculation and leftAt timestamp)
  6. Instructor queries room attendance report (verifies attendee student details, duration, and status)
  7. Student queries personal attendance history (verifies 100% attendance rate for 1/1 session)

---

## Phase 10: Real-Time Messaging & Notifications Outline
- [ ] Define Prisma models for direct & classroom chat:
  - `ChatMessage` (id, courseId, roomId?, senderId, content, createdAt, updatedAt)
  - `Notification` (id, userId, title, message, type [SYSTEM, ASSIGNMENT, EXAM, LIVE_CLASS], isRead, createdAt)
- [ ] Implement WebSocket / Socket.IO Gateway in NestJS (`ChatGateway` / `NotificationsGateway`)
- [ ] Real-time in-classroom chat channel for participants during live sessions
- [ ] Course announcements and direct student-instructor communication
- [ ] Notification bell icon and real-time toast alerts in frontend UI
- [ ] Unread notification counters and mark-as-read endpoints
- [ ] Unit tests and live WebSocket end-to-end verification

---

## Phase 11 Execution Checklist
- [x] Expand Prisma schema with `Recording` model:
  - `Recording` (id, roomId? -> LiveRoom onDelete SetNull, courseId -> Course onDelete Cascade, title, fileName, fileUrl, durationSeconds, sizeBytes BigInt, recordedAt)
  - Relations added to `Course` and `LiveRoom`
- [x] Execute migration `20261105104953_add_recordings` in PostgreSQL and regenerate Prisma client
- [x] Backend Recordings Module (`backend/src/modules/recordings`):
  - Configured static file serving for `uploads/recordings` via NestExpressApplication and disk storage
  - Configured Multer interceptor with video MIME type filters (webm, mp4, mkv, mov) and 1GB file size limit
  - `POST /api/v1/rooms/:roomId/recordings` (INSTRUCTOR owner, ADMIN): saves file to disk, auto-serializes BigInt `sizeBytes`, creates recording record
  - `GET /api/v1/courses/:courseId/recordings` (Enrolled students, Instructor, Admin): retrieves all recordings with room details
  - `DELETE /api/v1/recordings/:id` (INSTRUCTOR owner, ADMIN): securely unlinks file from disk and deletes DB record
  - `GET /api/v1/recordings/:id/stream` & `/api/v1/recordings/file/:fileName`: HTTP 206 Partial Content range request streaming for HTML5 video seeking
- [x] Comprehensive unit tests in `recordings.service.spec.ts` (12 unit tests passing, total backend tests: 75 passed across 8 test suites)
- [x] Frontend Classroom Integration (`frontend/src/app/classroom/[roomId]/page.tsx`):
  - Instructor "Record / Stop REC" control toggle in conference header
  - Client-side MediaRecorder capture of screen and audio with 1s chunk slicing
  - Pulsing "● REC mm:ss" indicator visible while recording is active
  - Automatic compilation of WebM chunks and background upload with progress toast upon stopping or session end
- [x] Frontend Instructor Portal (`frontend/src/app/instructor/page.tsx`):
  - "Recordings / المحاضرات المسجلة" tab with course selector and lecture archive cards
  - "Recordings" shortcut button on course cards in Courses tab
  - Built-in video player modal for playback with HTTP range streaming, download button, and delete action
- [x] Frontend Student Portal (`frontend/src/app/student/page.tsx`):
  - "Recordings / المحاضرات" quick button on enrolled course cards
  - Dedicated "Recordings / المحاضرات المسجلة" tab inside Course Details modal
  - Built-in video player modal for instant lecture playback and download
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test (`scratch/test_phase11_recordings.ps1`):
  1. Instructor creates course and starts live room
  2. Student enrolls in course
  3. Instructor uploads video recording payload via multipart/form-data
  4. Student retrieves course recordings list
  5. Verified HTTP 206 Partial Content range request streaming
  6. Instructor deletes recording (file unlinked and removed from database)
