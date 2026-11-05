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
| **Phase 10** | Course Announcements, Discussion Q&A & Notifications | **Completed** | 2026-11-05 |
| **Phase 11** | Session Recording & Lecture Archive System | **Completed** | 2026-11-05 |
| **Phase 12** | Polish, Security Audit & Production Readiness | **Completed** | 2026-11-05 |
| **Phase 13** | Course Materials Library, Student Progress & CSV Export | **Completed** | 2026-11-05 |

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

## Phase 10 Execution Checklist
- [x] Expand Prisma schema with `Announcement`, `Notification`, and `DiscussionPost` models:
  - `Announcement` (id, courseId -> Course onDelete Cascade, authorId -> User onDelete Cascade, title, content, isPinned Boolean @default(false), createdAt, updatedAt)
  - `Notification` (id, userId -> User onDelete Cascade, title, message, type String, link String?, isRead Boolean @default(false), createdAt)
  - `DiscussionPost` (id, courseId -> Course onDelete Cascade, authorId -> User onDelete Cascade, content, parentId? -> DiscussionPost onDelete Cascade, createdAt, updatedAt, self-relation for threaded replies)
  - Cascade relations added to `User` and `Course`
- [x] Execute migration `20261105112200_add_announcements_notifications_discussions` in PostgreSQL and regenerate Prisma client
- [x] Backend Notifications Module (`backend/src/modules/notifications`):
  - `NotificationsService`: `getUserNotifications`, `markAsRead`, `markAllAsRead`, `createNotification`, and `createBatchNotifications` (using `prisma.notification.createMany` for bulk dispatch)
  - `NotificationsController`: `GET /api/v1/notifications`, `PATCH /api/v1/notifications/:id/read`, `PATCH /api/v1/notifications/read-all`
  - Unit tests in `notifications.service.spec.ts` (6 tests passing)
- [x] Backend Announcements Module (`backend/src/modules/announcements`):
  - `AnnouncementsService`: `createAnnouncement` (validates instructor/admin ownership, auto-notifies all enrolled course students via batch notification), `getCourseAnnouncements` (sorted with pinned announcements first)
  - `AnnouncementsController`: `POST /api/v1/courses/:courseId/announcements`, `GET /api/v1/courses/:courseId/announcements`
  - Unit tests in `announcements.service.spec.ts` (6 tests passing)
- [x] Backend Discussions Module (`backend/src/modules/discussions`):
  - `DiscussionsService`: `createPost` (validates course enrollment or instructor/admin status, supports optional `parentId` for replies, notifies root author when replied to), `getCourseDiscussions` (returns structured hierarchical threads with nested `replies` and author details)
  - `DiscussionsController`: `POST /api/v1/courses/:courseId/discussions`, `GET /api/v1/courses/:courseId/discussions`
- [x] Total backend unit tests: 87 passing across 10 test suites
- [x] Frontend Notification UI Component (`frontend/src/components/notifications-popover.tsx`):
  - Bell icon with real-time unread badge counter and polling interval
  - Dropdown popover with categorized icons (`ANNOUNCEMENT`, `ASSIGNMENT`, `EXAM`, `LIVE_SESSION`, `DISCUSSION`, `GRADE`)
  - "Mark all as read" button and per-item click-to-read with navigation
- [x] Frontend Instructor Portal (`frontend/src/app/instructor/page.tsx`):
  - Added `NotificationsPopover` to header bar
  - Added "Announcements / الإعلانات" and "Q&A Discussions / نقاشات" tab options and course card shortcuts
  - Announcement modal for publishing updates with pinned priority toggle
  - Q&A thread list with nested replies and inline instructor reply form
- [x] Frontend Student Portal (`frontend/src/app/student/page.tsx`):
  - Added `NotificationsPopover` to header bar
  - Dedicated "Announcements / الإعلانات" tab in Course Details modal with pinned banner styling
  - Dedicated "Q&A Discussions / نقاشات" tab in Course Details modal with "Ask a Question" input, nested threads, and replies
- [x] Zero compilation errors verified for both backend (`npm run build`) and frontend (`npm run build`)
- [x] Live automated end-to-end test (`scratch/test_phase10_announcements.ps1`):
  1. Instructor creates course and student enrolls
  2. Student baseline notification verified
  3. Instructor publishes pinned announcement
  4. Enrolled student receives automated notification with announcement title and course link
  5. Unenrolled student verified receiving 0 notifications
  6. Student marks notification as read (unread counter decrements accurately)
  7. Student posts discussion question
  8. Instructor views thread and replies with `parentId`
  9. Student views nested thread with verified instructor author details and reply hierarchy

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

---

## Phase 12 Execution Checklist
- [x] Security Hardening in NestJS Backend (`backend/`):
  - Installed and configured `helmet` in `backend/src/main.ts` with `crossOriginResourcePolicy: { policy: 'cross-origin' }` and `crossOriginEmbedderPolicy: false` to protect headers while permitting cross-origin lecture video streaming
  - Installed and configured `@nestjs/throttler` (v6) in `app.module.ts`:
    * Global rate limiter: 100 requests per 60 seconds (`ttl: 60000`, `limit: 100`) via `APP_GUARD` and `ThrottlerGuard`
    * Stricter rate limits on authentication endpoints in `auth.controller.ts` (`/login` and `/register` limited to 10 requests per minute)
    * Rate limit bypassed on `/health` endpoint using `@SkipThrottle()`
  - Configured dynamic and strict CORS policies in `main.ts` utilizing `FRONTEND_URL` environment variable with explicit allowed/exposed headers (`Range`, `Content-Range`, `Accept-Ranges`, `Authorization`)
  - Enhanced health check endpoint (`GET /api/v1/health`) returning PostgreSQL database connectivity status (`database: { status: 'up', connected: true }`), server uptime in seconds, system ISO timestamp, and API version
- [x] Production Containerization & Dockerfile Scaffolding:
  - Created multi-stage `backend/Dockerfile` using `node:22-alpine`:
    * Builder stage with OpenSSL and libc6-compat for Prisma engine compilation, `npm ci`, `prisma generate`, `nest build`, and devDependencies pruning
    * Production runner stage with non-root `nestjs` user (UID 1001), automatic `prisma migrate deploy`, persistent uploads volume mount, and exposed port 4000
  - Created multi-stage `frontend/Dockerfile` using `node:22-alpine`:
    * Enabled `output: 'standalone'` in `frontend/next.config.ts`
    * Builder stage accepting `NEXT_PUBLIC_API_URL` and `NEXT_PUBLIC_LIVEKIT_URL` build arguments
    * Production runner stage copying `.next/standalone`, `.next/static`, and `public` with non-root `nextjs` user, exposing port 3000
  - Created `.dockerignore` for both `backend/` and `frontend/` excluding local `node_modules`, `dist`, `.next`, and logs
  - Created root `docker-compose.yml` orchestrating:
    * `postgres`: PostgreSQL 18 Alpine (`postgres:18-alpine`) with healthcheck and persistent volume `pgdata:/var/lib/postgresql`
    * `livekit`: Official `livekit/livekit-server:latest` with WebRTC signaling (7880), TCP fallback (7881), and UDP ICE media ports (7882, 50000-50050)
    * `backend`: NestJS production container with healthcheck dependency on postgres, persistent recordings volume, and port 4000
    * `frontend`: Next.js 16 standalone web app with dependency on backend and port 3000
  - Created comprehensive `.env.production.example` templates in root, `backend/`, and `frontend/` documenting all production secrets and endpoints
- [x] Production Deployment Documentation:
  - Created `DEPLOYMENT.md` detailing step-by-step instructions for Ubuntu 22.04/24.04 LTS VPS deployment
  - Documented UFW firewall rules, Docker & Docker Compose setup, database migration & seeding commands
  - Provided full production Nginx virtual host configuration with WebSocket upgrades (`map $http_upgrade $connection_upgrade`), HTTP 206 Partial Content range forwarding for video streaming, and 1GB upload limits
  - Documented Certbot automated Let's Encrypt SSL issuance and auto-renewal
  - Documented automated daily PostgreSQL database backups via crontab and zero-downtime rolling update instructions
- [x] Verification & Integrity Checks:
  - All 87 unit tests passed across 10 test suites (`vitest run` in `backend`)
  - Production builds compiled with 0 errors for both backend (`npm run build`) and frontend Next.js standalone (`npm run build`)
  - Live HTTP query verified `GET /api/v1/health` returning valid JSON with `database: { status: "up" }`
  - Automated E2E verification confirmed Phase 10 discussion and announcements flow still passes 100% with helmet and throttler active

---

## Phase 13 Execution Checklist
- [x] Expand Prisma schema with `CourseMaterial` model:
  - `CourseMaterial` (id, courseId -> Course onDelete Cascade, title, description?, fileUrl, fileName, fileType, sizeBytes BigInt @default(0), createdAt)
  - Added cascade relation `materials CourseMaterial[]` to `Course`
- [x] Execute migration `20261105115411_add_course_materials` in PostgreSQL and regenerate Prisma client
- [x] Backend Materials Module (`backend/src/modules/materials`):
  - Configured multer disk storage in `uploads/materials` with 50MB file size limits and file extension filters (`pdf`, `zip`, `rar`, `7z`, `tar`, `gz`, `doc`, `docx`, `ppt`, `pptx`, `xls`, `xlsx`, `txt`)
  - Configured BigInt serialization utility converting `sizeBytes` to Number
  - `POST /api/v1/courses/:courseId/materials` (INSTRUCTOR owner, ADMIN): uploads physical file, automatically detects `fileType` (`PDF`, `ZIP`, `DOC`, `OTHER`), and saves material record
  - `GET /api/v1/courses/:courseId/materials` (Enrolled students, Instructor, Admin): returns course materials list ordered by `createdAt: desc`
  - `DELETE /api/v1/materials/:id` (INSTRUCTOR owner, ADMIN): unlinks file from disk and deletes DB record
- [x] Backend Student Progress Tracking (`backend/src/modules/courses`):
  - `GET /api/v1/courses/:courseId/my-progress` (STUDENT):
    * Calculates 40% weighted completion on submitted assignments ratio
    * Calculates 40% weighted completion on submitted exam attempts ratio
    * Calculates 20% weighted completion on classroom attendance rate
    * Returns `{ overallPercentage, completedAssignments, totalAssignments, completedExams, totalExams, attendanceRate }`
- [x] Backend CSV Export Endpoints (`backend/src/modules/courses`):
  - `GET /api/v1/courses/:courseId/export/grades` (INSTRUCTOR owner, ADMIN): streams formatted CSV report containing Student Name, Email, Assignments Completed/Average, Exams Completed/Average, and Overall Average Score
  - `GET /api/v1/courses/:courseId/export/attendance` (INSTRUCTOR owner, ADMIN): streams formatted CSV report containing Student Name, Email, Session Room, Session Date, Status, Join/Left Timestamps, and Duration (Minutes)
- [x] Backend Unit Tests:
  - Added `materials.service.spec.ts` (11 unit tests passing) testing file type detection, create with BigInt formatting, enrollment checks, and file deletion
  - Added tests in `courses.service.spec.ts` for progress formula calculations and CSV exports
  - Total backend tests: 101 tests passed across 11 test suites
- [x] Frontend Student Dashboard (`frontend/src/app/student/page.tsx`):
  - Enrolled course cards display a sleek gradient Progress Bar showing `{overallPercentage}%` completed with HW, Exam, and Attendance count breakdown
  - Added "Materials / الملازم" quick button on course cards
  - Dedicated "Materials / الملازم" tab inside Course Details modal with file type badges, formatted sizes (KB/MB), upload dates, and direct download buttons
- [x] Frontend Instructor Dashboard (`frontend/src/app/instructor/page.tsx`):
  - Added "Materials / الملازم" navigation tab with course selector and upload modal
  - In "Assignments & Grading" tab: added "Export Grades (CSV)" button with instant browser file download
  - In "Attendance Reports" tab: added "Export Attendance (CSV)" button with instant browser file download
  - Modal to upload course materials supporting title, description, and file selection
  - Material cards with download actions and delete button
- [x] Verification & Integrity Checks:
  - All 101 backend unit tests passed (`vitest run`)
  - Production builds compiled with 0 errors for both backend (`npm run build`) and frontend (`npm run build`)
  - Automated E2E verification test (`scratch/test_phase13_materials_progress.ps1`):
    1. Instructor uploads PDF material via multipart/form-data
    2. Enrolled student fetches course materials and verifies metadata
    3. Verified static download URL returns HTTP 200 OK
    4. Student queries progress calculation endpoint (verified 40/40/20 formula)
    5. Instructor downloads CSV grade report (verified headers and student record)
    6. Instructor downloads CSV attendance report (verified headers)
    7. Instructor deletes material (record removed and file unlinked)
