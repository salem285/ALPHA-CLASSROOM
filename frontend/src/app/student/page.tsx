"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { Course, Enrollment } from '@/types/course';
import { Assignment } from '@/types/assignment';
import { Exam, ExamAttempt } from '@/types/exam';
import { LiveRoom, StudentCourseAttendance } from '@/types/room';
import {
  GraduationCap,
  BookOpen,
  Code,
  Users,
  LogOut,
  RefreshCw,
  CheckCircle2,
  Calendar,
  AlertCircle,
  Compass,
  ArrowRight,
  Key,
  Lock,
  X,
  ShieldCheck,
  FileText,
  Award,
  Clock,
  Send,
  ExternalLink,
  CheckSquare,
  Timer,
  Check,
  Radio,
  Video,
  UserCheck,
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [enrolledList, setEnrolledList] = useState<Enrollment[]>([]);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'catalog'>('my');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Enroll modal states
  const [selectedCourseForEnroll, setSelectedCourseForEnroll] = useState<Course | null>(null);
  const [accessCodeInput, setAccessCodeInput] = useState<string>('');
  const [enrollModalError, setEnrollModalError] = useState<string | null>(null);
  const [isEnrolling, setIsEnrolling] = useState<boolean>(false);

  // Coursework / Course Details modal states
  const [activeCourseForAssignments, setActiveCourseForAssignments] = useState<Course | null>(null);
  const [courseModalTab, setCourseModalTab] = useState<'assignments' | 'exams'>('assignments');
  const [courseAssignments, setCourseAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [courseExams, setCourseExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState<boolean>(false);

  // Submit Assignment states
  const [submittingAssignment, setSubmittingAssignment] = useState<Assignment | null>(null);
  const [submissionContent, setSubmissionContent] = useState<string>('');
  const [isSendingSubmission, setIsSendingSubmission] = useState<boolean>(false);
  const [submissionModalError, setSubmissionModalError] = useState<string | null>(null);

  // Exam Player states
  const [takingExamData, setTakingExamData] = useState<{
    exam: Exam;
    attempt: ExamAttempt;
    remainingSeconds: number;
  } | null>(null);
  const [countdownSeconds, setCountdownSeconds] = useState<number>(0);
  const [selectedAnswers, setSelectedAnswers] = useState<Record<string, string>>({});
  const [submittingExam, setSubmittingExam] = useState<boolean>(false);

  // Exam Result Card state
  const [examResultData, setExamResultData] = useState<{
    message: string;
    score: number;
    isPassed: boolean;
    totalScore: number;
    passingScore: number;
  } | null>(null);

  // Live Room states
  const [activeRooms, setActiveRooms] = useState<Record<string, LiveRoom | null>>({});

  // Attendance states
  const [courseAttendanceMap, setCourseAttendanceMap] = useState<Record<string, StudentCourseAttendance>>({});
  const [selectedCourseAttendanceModal, setSelectedCourseAttendanceModal] = useState<StudentCourseAttendance | null>(null);
  const [loadingAttendanceModal, setLoadingAttendanceModal] = useState<boolean>(false);

  const fetchStudentData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [enrolled, available] = await Promise.all([
        api.get<Enrollment[]>('/courses/my/enrolled'),
        api.get<Course[]>('/courses'),
      ]);
      setEnrolledList(enrolled);
      setCatalog(available);

      // Fetch active live rooms and attendance for enrolled courses
      const roomsMap: Record<string, LiveRoom | null> = {};
      const attendanceMap: Record<string, StudentCourseAttendance> = {};

      await Promise.all(
        enrolled.map(async (item) => {
          try {
            const active = await api.get<LiveRoom | null>(`/courses/${item.courseId}/rooms/active`);
            roomsMap[item.courseId] = active;
          } catch {
            roomsMap[item.courseId] = null;
          }

          try {
            const att = await api.get<StudentCourseAttendance>(`/courses/${item.courseId}/my-attendance`);
            attendanceMap[item.courseId] = att;
          } catch {
            // Silently ignore if not found
          }
        }),
      );
      setActiveRooms(roomsMap);
      setCourseAttendanceMap(attendanceMap);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFeedback({ type: 'error', text: `Failed to load courses: ${err.message}` });
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

  const handleOpenAttendanceModal = async (courseId: string) => {
    setLoadingAttendanceModal(true);
    try {
      const data = await api.get<StudentCourseAttendance>(`/courses/${courseId}/my-attendance`);
      setSelectedCourseAttendanceModal(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load attendance report';
      alert(msg);
    } finally {
      setLoadingAttendanceModal(false);
    }
  };

  const fetchCourseAssignments = async (courseId: string) => {
    setLoadingAssignments(true);
    try {
      const data = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
      setCourseAssignments(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load coursework';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingAssignments(false);
    }
  };

  const fetchCourseExams = async (courseId: string) => {
    setLoadingExams(true);
    try {
      const data = await api.get<Exam[]>(`/courses/${courseId}/exams`);
      setCourseExams(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load exams';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingExams(false);
    }
  };

  const handleOpenCoursework = async (course: Course) => {
    setActiveCourseForAssignments(course);
    setCourseModalTab('assignments');
    await Promise.all([
      fetchCourseAssignments(course.id),
      fetchCourseExams(course.id),
    ]);
  };

  // Exam Countdown Timer Effect
  useEffect(() => {
    if (!takingExamData || countdownSeconds <= 0) return;
    const timer = setInterval(() => {
      setCountdownSeconds((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          return 0;
        }
        return prev - 1;
      });
    }, 1000);
    return () => clearInterval(timer);
  }, [takingExamData, countdownSeconds]);

  useEffect(() => {
    if (!loading) {
      if (!user) {
        router.push('/login');
      } else {
        fetchStudentData();
      }
    }
  }, [user, loading, router, fetchStudentData]);

  const handleOpenEnrollModal = (course: Course) => {
    setSelectedCourseForEnroll(course);
    setAccessCodeInput('');
    setEnrollModalError(null);
  };

  const handleEnrollSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseForEnroll) return;

    const trimmedCode = accessCodeInput.trim().toUpperCase();
    if (!trimmedCode) {
      setEnrollModalError('Please enter the course access code.');
      return;
    }

    setIsEnrolling(true);
    setEnrollModalError(null);

    try {
      await api.post(`/courses/${selectedCourseForEnroll.id}/enroll`, {
        accessCode: trimmedCode,
      });

      setFeedback({
        type: 'success',
        text: `Successfully enrolled in "${selectedCourseForEnroll.title}"! Welcome to the class.`,
      });
      setSelectedCourseForEnroll(null);
      setAccessCodeInput('');
      await fetchStudentData();
      setActiveTab('my');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Enrollment failed';
      setEnrollModalError(msg);
    } finally {
      setIsEnrolling(false);
    }
  };

  const handleOpenSubmitModal = (assignment: Assignment) => {
    setSubmittingAssignment(assignment);
    const existingContent = assignment.submissions && assignment.submissions.length > 0
      ? assignment.submissions[0].content
      : '';
    setSubmissionContent(existingContent);
    setSubmissionModalError(null);
  };

  const handleSubmitWork = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!submittingAssignment) return;

    const content = submissionContent.trim();
    if (!content) {
      setSubmissionModalError('Please enter your solution or submission link.');
      return;
    }

    setIsSendingSubmission(true);
    setSubmissionModalError(null);

    try {
      await api.post(`/assignments/${submittingAssignment.id}/submit`, {
        content,
      });

      setFeedback({
        type: 'success',
        text: `Assignment "${submittingAssignment.title}" submitted successfully!`,
      });
      setSubmittingAssignment(null);
      setSubmissionContent('');
      if (activeCourseForAssignments) {
        await fetchCourseAssignments(activeCourseForAssignments.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Submission failed';
      setSubmissionModalError(msg);
    } finally {
      setIsSendingSubmission(false);
    }
  };

  const handleStartExam = async (examId: string) => {
    setFeedback(null);
    try {
      const data = await api.get<{
        exam: Exam;
        attempt: ExamAttempt;
        remainingSeconds: number;
      }>(`/exams/${examId}/take`);

      setTakingExamData(data);
      setCountdownSeconds(data.remainingSeconds);
      setSelectedAnswers((data.attempt.answers as Record<string, string>) || {});
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to start exam';
      setFeedback({ type: 'error', text: msg });
    }
  };

  const handleSubmitExam = async () => {
    if (!takingExamData) return;
    setSubmittingExam(true);
    try {
      const res = await api.post<{
        message: string;
        score: number;
        isPassed: boolean;
        totalScore: number;
        passingScore: number;
        attempt: ExamAttempt;
      }>(`/exams/${takingExamData.exam.id}/submit`, {
        answers: selectedAnswers,
      });

      setTakingExamData(null);
      setExamResultData(res);
      if (activeCourseForAssignments) {
        await fetchCourseExams(activeCourseForAssignments.id);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Exam submission failed';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingExam(false);
    }
  };

  const isEnrolled = (courseId: string) => {
    return enrolledList.some((e) => e.courseId === courseId || e.course?.id === courseId);
  };

  const formatCountdown = (seconds: number) => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs < 10 ? '0' : ''}${secs}`;
  };

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090b14] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading student portal...</span>
        </div>
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-[#090b14] text-slate-100 flex flex-col">
      {/* Top Navigation */}
      <header className="border-b border-[#1c223c] bg-[#0e1224]/80 backdrop-blur-md sticky top-0 z-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 h-16 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <Link href="/" className="flex items-center gap-2">
              <span className="w-8 h-8 rounded-lg bg-gradient-to-tr from-purple-600 to-indigo-600 flex items-center justify-center font-extrabold text-white text-sm shadow-md">
                α
              </span>
              <div>
                <span className="text-[10px] uppercase tracking-widest font-bold text-purple-400 block -mb-1">
                  Alpha Coding
                </span>
                <span className="text-lg font-bold text-white tracking-tight">ALPHA CLASSROOM</span>
              </div>
            </Link>
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-purple-950/80 text-purple-300 border border-purple-800/60">
              Student Portal
            </span>
          </div>

          <div className="flex items-center gap-4">
            <div className="text-right hidden sm:block">
              <div className="text-xs font-semibold text-slate-200">
                {user.firstName} {user.lastName}
              </div>
              <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
            </div>
            <button
              onClick={logout}
              className="p-2 sm:px-3 sm:py-1.5 rounded-xl border border-[#262e52] hover:bg-[#1a203a] text-xs font-medium text-slate-300 hover:text-white transition flex items-center gap-1.5 cursor-pointer"
            >
              <LogOut className="w-3.5 h-3.5" />
              <span className="hidden sm:inline">Sign Out</span>
            </button>
          </div>
        </div>
      </header>

      {/* Main Container */}
      <main className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-8 flex-1 w-full space-y-6">
        {/* Welcome Hero & Stats */}
        <div className="bg-gradient-to-r from-purple-950/40 via-[#131833] to-[#0f142b] border border-[#232b50] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-purple-950 text-purple-300 border border-purple-800/60 mb-3">
              Learning Dashboard &bull; Alpha Coding
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Welcome back, {user.firstName}!
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Access enrolled courses, complete homework assignments, and participate in timed online examinations with automatic grading.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab(activeTab === 'my' ? 'catalog' : 'my')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-900/30 transition text-xs flex items-center gap-2 cursor-pointer"
            >
              {activeTab === 'my' ? (
                <>
                  <Compass className="w-4 h-4" />
                  Explore Course Catalog
                </>
              ) : (
                <>
                  <BookOpen className="w-4 h-4" />
                  View Enrolled Courses
                </>
              )}
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <GraduationCap className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Enrolled Courses</div>
              <div className="text-2xl font-bold text-white mt-0.5">{enrolledList.length}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Exam Engine</div>
              <div className="text-2xl font-bold text-indigo-300 mt-0.5">Automated</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Award className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Coursework & Exams</div>
              <div className="text-2xl font-bold text-emerald-300 mt-0.5">Active</div>
            </div>
          </div>
        </div>

        {/* Feedback message */}
        {feedback && (
          <div
            className={`p-4 rounded-xl border text-sm flex items-center justify-between ${
              feedback.type === 'success'
                ? 'bg-emerald-950/40 border-emerald-800/60 text-emerald-200'
                : 'bg-rose-950/40 border-rose-800/60 text-rose-200'
            }`}
          >
            <div className="flex items-center gap-2">
              {feedback.type === 'success' ? (
                <CheckCircle2 className="w-4 h-4 text-emerald-400" />
              ) : (
                <AlertCircle className="w-4 h-4 text-rose-400" />
              )}
              <span>{feedback.text}</span>
            </div>
            <button
              onClick={() => setFeedback(null)}
              className="text-xs font-bold px-2 py-0.5 hover:opacity-75 cursor-pointer"
            >
              ✕
            </button>
          </div>
        )}

        {/* Tabs Bar */}
        <div className="flex items-center justify-between border-b border-[#1c223c] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'my'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <GraduationCap className="w-3.5 h-3.5" />
              My Enrolled Courses ({enrolledList.length})
            </button>

            <button
              onClick={() => setActiveTab('catalog')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'catalog'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <Compass className="w-3.5 h-3.5" />
              Course Catalog ({catalog.length})
            </button>
          </div>

          <button
            onClick={fetchStudentData}
            disabled={loadingData}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Active Live Class Alert Banner */}
        {Object.values(activeRooms).some((r) => r !== null) && (
          <div className="p-4 sm:p-5 rounded-2xl bg-gradient-to-r from-purple-950/80 via-[#181138] to-[#12162b] border border-purple-500/50 shadow-xl shadow-purple-900/20 flex flex-col sm:flex-row sm:items-center justify-between gap-4">
            <div className="flex items-center gap-3.5">
              <div className="w-10 h-10 rounded-xl bg-rose-500/20 border border-rose-500/40 flex items-center justify-center shrink-0">
                <Radio className="w-5 h-5 text-rose-400 animate-pulse" />
              </div>
              <div>
                <div className="flex items-center gap-2">
                  <span className="text-[10px] font-extrabold uppercase px-2 py-0.5 rounded-full bg-rose-950 border border-rose-700/60 text-rose-300 animate-pulse">
                    Live Classroom Active
                  </span>
                </div>
                <div className="text-white font-bold text-sm sm:text-base mt-0.5">
                  {Object.values(activeRooms).find((r) => r !== null)?.title}
                </div>
              </div>
            </div>
            <Link
              href={`/classroom/${Object.values(activeRooms).find((r) => r !== null)?.id}`}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs sm:text-sm py-2.5 px-5 rounded-xl transition flex items-center justify-center gap-2 shadow-lg shadow-purple-900/40 cursor-pointer shrink-0"
            >
              <Radio className="w-4 h-4 animate-pulse" />
              <span>Join Live Session</span>
            </Link>
          </div>
        )}

        {/* Tab 1: My Enrolled Courses */}
        {activeTab === 'my' && (
          <div>
            {enrolledList.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <GraduationCap className="w-12 h-12 text-indigo-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No Course Enrollments Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
                  You are not currently enrolled in any courses. Explore the catalog and use your access code to join a class!
                </p>
                <button
                  onClick={() => setActiveTab('catalog')}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
                >
                  <Compass className="w-4 h-4" />
                  Explore Catalog
                </button>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {enrolledList.map((item) => (
                  <div
                    key={item.id}
                    className="bg-[#12162b] border border-[#21294c] hover:border-purple-500/50 rounded-2xl p-6 shadow-lg transition flex flex-col justify-between"
                  >
                    <div>
                      <div className="flex items-center justify-between mb-3">
                        <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                          <Code className="w-3 h-3" />
                          {item.course?.code}
                        </span>
                        <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                          Active Learner
                        </span>
                      </div>

                      <h4 className="font-bold text-white text-base leading-snug">
                        {item.course?.title}
                      </h4>
                      <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                        {item.course?.description || 'Curriculum details provided inside the course.'}
                      </p>

                      <div className="mt-4 p-2.5 rounded-xl bg-[#0b0e1b] border border-[#1a2038] text-xs">
                        <div className="text-[11px] text-slate-400">Instructor:</div>
                        <div className="font-medium text-slate-200 mt-0.5">
                          {item.course?.instructor?.firstName} {item.course?.instructor?.lastName}
                        </div>
                      </div>

                      {/* Attendance Rate Summary */}
                      <div className="mt-3.5 p-3 rounded-xl bg-[#0b0e1b] border border-[#1a2038] flex items-center justify-between text-xs">
                        <div className="flex items-center gap-2.5">
                          <div className="w-8 h-8 rounded-lg bg-emerald-600/20 border border-emerald-500/40 flex items-center justify-center shrink-0">
                            <UserCheck className="w-4 h-4 text-emerald-400" />
                          </div>
                          <div>
                            <span className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold block">Attendance Rate</span>
                            <div className="flex items-baseline gap-1 mt-0.5">
                              <span className="font-extrabold text-white text-xs sm:text-sm">
                                {courseAttendanceMap[item.courseId]
                                  ? `${courseAttendanceMap[item.courseId].attendancePercentage}%`
                                  : '100%'}
                              </span>
                              <span className="text-[10px] text-slate-500">
                                ({courseAttendanceMap[item.courseId]?.attendedSessions || 0}/{courseAttendanceMap[item.courseId]?.totalSessions || 0} sessions)
                              </span>
                            </div>
                          </div>
                        </div>
                        <button
                          onClick={() => handleOpenAttendanceModal(item.courseId)}
                          className="text-xs px-2.5 py-1.5 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-semibold transition cursor-pointer"
                        >
                          View History
                        </button>
                      </div>

                      {/* Active Live Session in Enrolled Course */}
                      {activeRooms[item.courseId] && (
                        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>Live Session Active</span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {activeRooms[item.courseId]?.title}
                            </span>
                          </div>
                          <Link
                            href={`/classroom/${activeRooms[item.courseId]!.id}`}
                            className="mt-1 py-1.5 px-3 rounded-lg bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
                          >
                            <Radio className="w-3.5 h-3.5 animate-pulse" />
                            <span>Join Live Session</span>
                          </Link>
                        </div>
                      )}
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1c223c] flex items-center justify-between text-xs">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        {new Date(item.enrolledAt).toLocaleDateString()}
                      </span>
                      <button
                        onClick={() => handleOpenCoursework(item.course)}
                        className="bg-purple-600/25 hover:bg-purple-600/40 text-purple-200 border border-purple-500/40 px-3 py-1.5 rounded-xl font-semibold text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                      >
                        <FileText className="w-3.5 h-3.5 text-purple-400" />
                        Assignments & Exams
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Course Catalog */}
        {activeTab === 'catalog' && (
          <div>
            {catalog.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                <Compass className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <p className="font-semibold text-slate-200">Catalog is Currently Empty</p>
              </div>
            ) : (
              <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                {catalog.map((course) => {
                  const enrolled = isEnrolled(course.id);

                  return (
                    <div
                      key={course.id}
                      className="bg-[#12162b] border border-[#21294c] hover:border-indigo-500/50 rounded-2xl p-6 shadow-lg transition flex flex-col justify-between"
                    >
                      <div>
                        <div className="flex items-center justify-between mb-3">
                          <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-indigo-950/80 text-indigo-300 border border-indigo-800/60 flex items-center gap-1">
                            <Code className="w-3 h-3" />
                            {course.code}
                          </span>
                          <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                            <Users className="w-3 h-3 text-slate-500" />
                            {course._count?.enrollments || 0} Students
                          </span>
                        </div>

                        <h4 className="font-bold text-white text-base leading-snug">{course.title}</h4>
                        <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                          {course.description || 'No detailed syllabus description provided yet.'}
                        </p>

                        <div className="mt-4 p-2.5 rounded-xl bg-[#0b0e1b] border border-[#1a2038] text-xs">
                          <div className="text-[11px] text-slate-400">Instructor:</div>
                          <div className="font-medium text-slate-200 mt-0.5">
                            {course.instructor?.firstName} {course.instructor?.lastName}
                          </div>
                        </div>
                      </div>

                      <div className="mt-5 pt-4 border-t border-[#1c223c] flex items-center justify-between">
                        <span className="text-[11px] text-amber-300/80 flex items-center gap-1 font-medium">
                          <Lock className="w-3 h-3 text-amber-400" />
                          Code Required
                        </span>

                        {enrolled ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Enrolled
                          </span>
                        ) : (
                          <button
                            onClick={() => handleOpenEnrollModal(course)}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
                          >
                            Enroll Now <ArrowRight className="w-3 h-3" />
                          </button>
                        )}
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </div>
        )}
      </main>

      {/* Enrollment Access Code Modal */}
      {selectedCourseForEnroll && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Key className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Course Access Code</h3>
                  <p className="text-[11px] text-slate-400">Enter code provided by your instructor</p>
                </div>
              </div>
              <button
                onClick={() => setSelectedCourseForEnroll(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="mb-4 p-3 rounded-xl bg-[#0b0e1b] border border-[#1e2544]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {selectedCourseForEnroll.code}
                </span>
                <span className="text-xs font-bold text-white line-clamp-1">
                  {selectedCourseForEnroll.title}
                </span>
              </div>
            </div>

            {enrollModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{enrollModalError}</span>
              </div>
            )}

            <form onSubmit={handleEnrollSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-amber-300 uppercase tracking-wider mb-2 flex items-center gap-1.5">
                  <Key className="w-3.5 h-3.5 text-amber-400" />
                  Enter the Secret Access Code provided by your instructor
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. ALPHA-2026"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    className="w-full bg-[#0c0e1b] border border-[#2a345e] focus:border-amber-500 rounded-xl py-2.5 px-3 pl-9 text-sm text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none transition"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5">
                  Enter the Secret Access Code provided by your instructor to unlock course materials and lectures.
                </p>
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#21294c]">
                <button
                  type="button"
                  onClick={() => setSelectedCourseForEnroll(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isEnrolling}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isEnrolling ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Verifying...</span>
                    </>
                  ) : (
                    <>
                      <Key className="w-3.5 h-3.5" />
                      <span>Verify & Enroll</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Coursework & Exams Modal */}
      {activeCourseForAssignments && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            {/* Header */}
            <div className="p-6 pb-4 border-b border-[#21294c] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                    {activeCourseForAssignments.code}
                  </span>
                  <h3 className="font-bold text-white text-lg">
                    {activeCourseForAssignments.title} &bull; Course Portal
                  </h3>
                </div>
                <div className="flex items-center gap-2 mt-3">
                  <button
                    onClick={() => setCourseModalTab('assignments')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      courseModalTab === 'assignments'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-[#1a203a]'
                    }`}
                  >
                    <FileText className="w-3.5 h-3.5" />
                    Homework & Assignments ({courseAssignments.length})
                  </button>

                  <button
                    onClick={() => setCourseModalTab('exams')}
                    className={`px-3 py-1 rounded-lg text-xs font-semibold transition cursor-pointer flex items-center gap-1.5 ${
                      courseModalTab === 'exams'
                        ? 'bg-purple-600 text-white shadow'
                        : 'text-slate-400 hover:text-white hover:bg-[#1a203a]'
                    }`}
                  >
                    <CheckSquare className="w-3.5 h-3.5" />
                    Online Exams ({courseExams.length})
                  </button>
                </div>
              </div>
              <button
                onClick={() => setActiveCourseForAssignments(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer self-start"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Body: Assignments Tab */}
            {courseModalTab === 'assignments' && (
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingAssignments ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs">Loading course assignments...</span>
                  </div>
                ) : courseAssignments.length === 0 ? (
                  <div className="bg-[#0c0e1b] border border-[#202848] rounded-xl p-8 text-center text-slate-400">
                    <FileText className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No Assignments Yet</p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseAssignments.map((assignment) => {
                      const studentSub = assignment.submissions && assignment.submissions.length > 0
                        ? assignment.submissions[0]
                        : null;
                      const isGraded = studentSub?.status === 'GRADED';
                      const isSubmitted = studentSub?.status === 'SUBMITTED';
                      const isLink = studentSub?.content?.startsWith('http://') || studentSub?.content?.startsWith('https://');

                      return (
                        <div
                          key={assignment.id}
                          className="bg-[#0b0e1b] border border-[#222949] rounded-xl p-5 shadow flex flex-col md:flex-row md:items-start justify-between gap-5"
                        >
                          <div className="flex-1 space-y-3">
                            <div className="flex items-center justify-between">
                              <h4 className="font-bold text-white text-base">{assignment.title}</h4>
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                Max: {assignment.maxScore} pts
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed whitespace-pre-wrap">
                              {assignment.description}
                            </p>

                            {studentSub && (
                              <div className="mt-3 p-3.5 rounded-xl bg-[#12162b] border border-[#1e2547] space-y-2">
                                <div className="text-[10px] font-semibold uppercase text-slate-400 tracking-wider">
                                  Your Submission ({new Date(studentSub.submittedAt).toLocaleString()}):
                                </div>
                                <div className="text-xs">
                                  {isLink ? (
                                    <a
                                      href={studentSub.content}
                                      target="_blank"
                                      rel="noreferrer"
                                      className="text-indigo-400 hover:text-indigo-300 underline font-mono flex items-center gap-1 break-all"
                                    >
                                      {studentSub.content}
                                      <ExternalLink className="w-3 h-3 shrink-0" />
                                    </a>
                                  ) : (
                                    <p className="text-slate-200 whitespace-pre-wrap">{studentSub.content}</p>
                                  )}
                                </div>

                                {isGraded && (
                                  <div className="mt-3 pt-2.5 border-t border-[#1a213e]">
                                    <div className="flex items-center gap-2 mb-1">
                                      <Award className="w-4 h-4 text-emerald-400" />
                                      <span className="font-bold text-emerald-300 text-sm">
                                        Grade: {studentSub.score} / {assignment.maxScore} pts
                                      </span>
                                    </div>
                                    {studentSub.feedback && (
                                      <p className="text-xs text-slate-300 italic pl-6">
                                        &ldquo;{studentSub.feedback}&rdquo;
                                      </p>
                                    )}
                                  </div>
                                )}
                              </div>
                            )}
                          </div>

                          <div className="w-full md:w-56 shrink-0 flex flex-col justify-between items-end border-t md:border-t-0 md:border-l border-[#1a213e] pt-3 md:pt-0 md:pl-5 space-y-3">
                            <span
                              className={`inline-block px-2.5 py-1 rounded-full text-xs font-semibold border ${
                                isGraded
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                  : isSubmitted
                                  ? 'bg-indigo-950/80 text-indigo-300 border-indigo-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              }`}
                            >
                              {isGraded
                                ? `Graded: ${studentSub?.score} pts`
                                : isSubmitted
                                ? 'Submitted & In Review'
                                : 'Pending Submission'}
                            </span>

                            {!isGraded && (
                              <button
                                onClick={() => handleOpenSubmitModal(assignment)}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <Send className="w-3.5 h-3.5" />
                                <span>{isSubmitted ? 'Update Submission' : 'Submit Work'}</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}

            {/* Modal Body: Exams Tab */}
            {courseModalTab === 'exams' && (
              <div className="p-6 overflow-y-auto flex-1 space-y-4">
                {loadingExams ? (
                  <div className="py-12 text-center text-slate-400">
                    <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                    <span className="text-xs">Loading course exams...</span>
                  </div>
                ) : courseExams.length === 0 ? (
                  <div className="bg-[#0c0e1b] border border-[#202848] rounded-xl p-8 text-center text-slate-400">
                    <CheckSquare className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                    <p className="text-sm font-semibold text-slate-300">No Online Exams Available</p>
                    <p className="text-xs text-slate-500 mt-1">
                      Your instructor has not scheduled any exams for this course yet.
                    </p>
                  </div>
                ) : (
                  <div className="space-y-4">
                    {courseExams.map((exam) => {
                      const studentAttempt = exam.attempts && exam.attempts.length > 0
                        ? exam.attempts[0]
                        : null;
                      const hasCompleted = studentAttempt?.status === 'AUTO_GRADED' || studentAttempt?.status === 'SUBMITTED';

                      return (
                        <div
                          key={exam.id}
                          className="bg-[#0b0e1b] border border-[#222949] rounded-xl p-5 shadow flex flex-col md:flex-row md:items-center justify-between gap-5"
                        >
                          <div className="flex-1 space-y-2">
                            <div className="flex items-center gap-2">
                              <h4 className="font-bold text-white text-base">{exam.title}</h4>
                              <span className="font-mono text-xs font-semibold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                                {exam.durationMinutes} mins
                              </span>
                            </div>

                            <p className="text-xs text-slate-300 leading-relaxed">
                              {exam.description || 'Timed multiple-choice exam with automated instant evaluation.'}
                            </p>

                            <div className="flex items-center gap-3 text-xs text-slate-400 pt-1">
                              <span>Passing Threshold: {exam.passingScore} / {exam.totalScore} pts</span>
                              <span>&bull;</span>
                              <span>Questions: {exam._count?.questions || exam.questions?.length || 0}</span>
                            </div>
                          </div>

                          <div className="w-full md:w-56 shrink-0 flex flex-col items-end border-t md:border-t-0 md:border-l border-[#1a213e] pt-3 md:pt-0 md:pl-5 space-y-3">
                            {hasCompleted ? (
                              <div className="w-full text-right space-y-1.5">
                                <span
                                  className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                                    studentAttempt?.isPassed
                                      ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                                      : 'bg-rose-950 text-rose-300 border-rose-800/60'
                                  }`}
                                >
                                  {studentAttempt?.isPassed ? 'PASSED' : 'FAILED'} &bull; {studentAttempt?.score} pts
                                </span>
                                <div className="text-[11px] text-slate-500">
                                  Completed on {new Date(studentAttempt?.submittedAt || '').toLocaleDateString()}
                                </div>
                              </div>
                            ) : (
                              <button
                                onClick={() => handleStartExam(exam.id)}
                                className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md"
                              >
                                <Timer className="w-3.5 h-3.5" />
                                <span>Start Online Exam</span>
                              </button>
                            )}
                          </div>
                        </div>
                      );
                    })}
                  </div>
                )}
              </div>
            )}
          </div>
        </div>
      )}

      {/* Submit Assignment Modal */}
      {submittingAssignment && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Send className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Submit Assignment</h3>
                  <p className="text-[11px] text-slate-400 line-clamp-1">{submittingAssignment.title}</p>
                </div>
              </div>
              <button
                onClick={() => setSubmittingAssignment(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {submissionModalError && (
              <div className="mb-4 p-3 rounded-xl bg-rose-950/50 border border-rose-800/70 text-rose-200 text-xs flex items-center gap-2">
                <AlertCircle className="w-4 h-4 text-rose-400 shrink-0" />
                <span>{submissionModalError}</span>
              </div>
            )}

            <form onSubmit={handleSubmitWork} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Solution Link or Text Answer
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Paste your GitHub repository link, Google Drive document link, or type your answer here..."
                  value={submissionContent}
                  onChange={(e) => setSubmissionContent(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#2a345e] focus:border-purple-500 rounded-xl py-2.5 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none transition"
                />
              </div>

              <div className="pt-3 flex items-center justify-end gap-3 border-t border-[#21294c]">
                <button
                  type="button"
                  onClick={() => setSubmittingAssignment(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={isSendingSubmission}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  {isSendingSubmission ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Submitting...</span>
                    </>
                  ) : (
                    <>
                      <Send className="w-3.5 h-3.5" />
                      <span>Submit Solution</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Online Exam Player Modal */}
      {takingExamData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/90 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[92vh] flex flex-col shadow-2xl relative">
            {/* Header with Sticky Timer */}
            <div className="p-6 pb-4 border-b border-[#21294c] flex items-center justify-between bg-[#0e1224] rounded-t-2xl">
              <div>
                <h3 className="font-bold text-white text-lg flex items-center gap-2">
                  <CheckSquare className="w-5 h-5 text-purple-400" />
                  {takingExamData.exam.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Answer all questions and submit before time expires.
                </p>
              </div>

              {/* Countdown Badge */}
              <div
                className={`flex items-center gap-2 px-4 py-2 rounded-xl border font-mono font-bold text-sm ${
                  countdownSeconds < 300
                    ? 'bg-rose-950/80 border-rose-800 text-rose-300 animate-pulse'
                    : 'bg-purple-950/80 border-purple-800 text-purple-300'
                }`}
              >
                <Timer className="w-4 h-4" />
                <span>Time Left: {formatCountdown(countdownSeconds)}</span>
              </div>
            </div>

            {/* Questions Form */}
            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {takingExamData.exam.questions && takingExamData.exam.questions.length > 0 ? (
                takingExamData.exam.questions.map((q, qIdx) => (
                  <div
                    key={q.id}
                    className="bg-[#0b0e1b] border border-[#222949] rounded-xl p-5 space-y-3"
                  >
                    <div className="flex items-center justify-between">
                      <span className="font-bold text-sm text-white">
                        Question {qIdx + 1} of {takingExamData.exam.questions?.length}:
                      </span>
                      <span className="font-mono text-xs text-purple-400 font-semibold">
                        {q.points} pt(s)
                      </span>
                    </div>

                    <p className="text-xs text-slate-200 leading-relaxed font-medium">
                      {q.text}
                    </p>

                    <div className="space-y-2 pt-2">
                      {q.options.map((opt) => {
                        const isSelected = selectedAnswers[q.id] === opt.id;

                        return (
                          <label
                            key={opt.id}
                            className={`flex items-center gap-3 p-3 rounded-lg border text-xs cursor-pointer transition ${
                              isSelected
                                ? 'bg-purple-950/60 border-purple-500 text-white font-medium'
                                : 'bg-[#12162b] border-[#1f2648] text-slate-300 hover:bg-[#171d3a]'
                            }`}
                          >
                            <input
                              type="radio"
                              name={`question_${q.id}`}
                              value={opt.id}
                              checked={isSelected}
                              onChange={() =>
                                setSelectedAnswers({
                                  ...selectedAnswers,
                                  [q.id]: opt.id,
                                })
                              }
                              className="text-purple-600 focus:ring-purple-500 bg-[#0a0c16]"
                            />
                            <span className="font-mono uppercase font-bold text-slate-400">
                              {opt.id}.
                            </span>
                            <span>{opt.text}</span>
                          </label>
                        );
                      })}
                    </div>
                  </div>
                ))
              ) : (
                <div className="py-12 text-center text-slate-400">
                  <p>No questions found in this exam.</p>
                </div>
              )}
            </div>

            {/* Footer Actions */}
            <div className="p-4 px-6 border-t border-[#21294c] flex items-center justify-between bg-[#0e1224] rounded-b-2xl">
              <span className="text-xs text-slate-400">
                Answered: {Object.keys(selectedAnswers).length} of {takingExamData.exam.questions?.length || 0}
              </span>

              <div className="flex items-center gap-3">
                <button
                  type="button"
                  onClick={() => setTakingExamData(null)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Exit Exam
                </button>
                <button
                  type="button"
                  disabled={submittingExam}
                  onClick={handleSubmitExam}
                  className="bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold py-2 px-6 rounded-xl text-xs transition shadow-lg shadow-emerald-900/30 flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                >
                  {submittingExam ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Grading...</span>
                    </>
                  ) : (
                    <>
                      <Check className="w-4 h-4" />
                      <span>Submit & Auto-Grade Exam</span>
                    </>
                  )}
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Immediate Exam Result Modal */}
      {examResultData && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-md p-6 shadow-2xl relative text-center">
            <div className="w-16 h-16 rounded-2xl mx-auto mb-4 flex items-center justify-center bg-purple-600/20 border border-purple-500/30">
              {examResultData.isPassed ? (
                <CheckCircle2 className="w-8 h-8 text-emerald-400" />
              ) : (
                <AlertCircle className="w-8 h-8 text-rose-400" />
              )}
            </div>

            <h3 className="font-extrabold text-white text-xl">
              {examResultData.isPassed ? 'Exam Passed!' : 'Exam Completed'}
            </h3>
            <p className="text-xs text-slate-400 mt-1">{examResultData.message}</p>

            <div className="my-6 p-4 rounded-xl bg-[#0b0e1b] border border-[#1e2547] space-y-2">
              <div className="text-3xl font-extrabold text-white">
                {examResultData.score} <span className="text-sm font-normal text-slate-400">/ {examResultData.totalScore} pts</span>
              </div>
              <span
                className={`inline-block px-3 py-1 rounded-full text-xs font-bold border ${
                  examResultData.isPassed
                    ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                    : 'bg-rose-950 text-rose-300 border-rose-800/60'
                }`}
              >
                {examResultData.isPassed ? 'PASSED &bull; APPROVED' : 'DID NOT PASS'}
              </span>
              <div className="text-[11px] text-slate-500 pt-1">
                Required passing threshold: {examResultData.passingScore} pts
              </div>
            </div>

            <button
              onClick={() => setExamResultData(null)}
              className="w-full bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 cursor-pointer"
            >
              Continue Learning
            </button>
          </div>
        </div>
      )}

      {/* Student Course Attendance Modal */}
      {selectedCourseAttendanceModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-2xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-5 border-b border-[#21294c] flex items-center justify-between bg-[#0e1224]">
              <div>
                <h3 className="font-bold text-white text-base flex items-center gap-2">
                  <UserCheck className="w-5 h-5 text-purple-400" />
                  Live Classroom Attendance Record
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {selectedCourseAttendanceModal.courseTitle} ({selectedCourseAttendanceModal.courseCode})
                </p>
              </div>
              <button
                onClick={() => setSelectedCourseAttendanceModal(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a203a] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Attendance Overview Card */}
            <div className="p-5 border-b border-[#1c2344] bg-[#0c0f20]">
              <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
                <div className="p-3.5 rounded-xl bg-[#131835] border border-[#232c52]">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Attendance Rate
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {selectedCourseAttendanceModal.attendancePercentage}%
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131835] border border-[#232c52]">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Sessions Attended
                  </div>
                  <div className="text-2xl font-black text-white mt-1">
                    {selectedCourseAttendanceModal.attendedSessions}{' '}
                    <span className="text-sm font-normal text-slate-400">
                      / {selectedCourseAttendanceModal.totalSessions}
                    </span>
                  </div>
                </div>

                <div className="p-3.5 rounded-xl bg-[#131835] border border-[#232c52]">
                  <div className="text-[11px] uppercase tracking-wider text-slate-400 font-medium">
                    Standing
                  </div>
                  <div className="mt-1">
                    <span
                      className={`inline-block px-2.5 py-1 rounded-full text-xs font-bold border ${
                        selectedCourseAttendanceModal.attendancePercentage >= 80
                          ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                          : selectedCourseAttendanceModal.attendancePercentage >= 60
                          ? 'bg-amber-950 text-amber-300 border-amber-800/60'
                          : 'bg-rose-950 text-rose-300 border-rose-800/60'
                      }`}
                    >
                      {selectedCourseAttendanceModal.attendancePercentage >= 80
                        ? 'Good Standing'
                        : selectedCourseAttendanceModal.attendancePercentage >= 60
                        ? 'Needs Attention'
                        : 'At Risk'}
                    </span>
                  </div>
                </div>
              </div>
            </div>

            {/* Attendance Logs List */}
            <div className="p-5 flex-1 overflow-y-auto space-y-3">
              <h4 className="text-xs font-semibold uppercase tracking-wider text-slate-400">
                Session Logs ({selectedCourseAttendanceModal.records.length})
              </h4>

              {selectedCourseAttendanceModal.records.length === 0 ? (
                <div className="text-center py-10 text-slate-400 text-xs">
                  No live session attendance logs recorded yet for this course.
                </div>
              ) : (
                selectedCourseAttendanceModal.records.map((rec) => (
                  <div
                    key={rec.id}
                    className="p-3.5 rounded-xl bg-[#0f142b] border border-[#1e2547] flex flex-col sm:flex-row sm:items-center justify-between gap-3"
                  >
                    <div>
                      <div className="font-semibold text-white text-sm">
                        {rec.room?.title || 'Live Classroom Session'}
                      </div>
                      <div className="text-xs text-slate-400 flex items-center gap-3 mt-1">
                        <span className="flex items-center gap-1">
                          <Calendar className="w-3.5 h-3.5 text-slate-500" />
                          {new Date(rec.joinedAt).toLocaleDateString()}
                        </span>
                        <span>
                          Joined: {new Date(rec.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                        </span>
                        {rec.leftAt && (
                          <span>
                            Left: {new Date(rec.leftAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                          </span>
                        )}
                      </div>
                    </div>

                    <div className="flex items-center gap-2">
                      <span className="px-2.5 py-1 rounded-lg text-xs font-medium bg-[#1a2040] text-slate-300 border border-[#2b3564] flex items-center gap-1.5">
                        <Clock className="w-3.5 h-3.5 text-purple-400" />
                        {rec.durationMinutes} min
                      </span>
                      <span
                        className={`px-2.5 py-1 rounded-lg text-xs font-bold border ${
                          rec.status === 'PRESENT'
                            ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                            : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                        }`}
                      >
                        {rec.status}
                      </span>
                    </div>
                  </div>
                ))
              )}
            </div>

            <div className="p-4 border-t border-[#21294c] bg-[#0e1224] flex justify-end">
              <button
                type="button"
                onClick={() => setSelectedCourseAttendanceModal(null)}
                className="px-5 py-2 rounded-xl text-xs font-semibold bg-[#1a203a] hover:bg-[#232b50] text-slate-200 transition cursor-pointer"
              >
                Close
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
