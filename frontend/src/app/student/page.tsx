"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { Course, Enrollment } from '@/types/course';
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

  const fetchStudentData = useCallback(async () => {
    setLoadingData(true);
    try {
      const [enrolled, available] = await Promise.all([
        api.get<Enrollment[]>('/courses/my/enrolled'),
        api.get<Course[]>('/courses'),
      ]);
      setEnrolledList(enrolled);
      setCatalog(available);
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFeedback({ type: 'error', text: `Failed to load courses: ${err.message}` });
      }
    } finally {
      setLoadingData(false);
    }
  }, []);

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

  const isEnrolled = (courseId: string) => {
    return enrolledList.some((e) => e.courseId === courseId || e.course?.id === courseId);
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
              Access your enrolled classes, explore new syllabus topics, and unlock courses with your instructor access code.
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
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Available Catalog</div>
              <div className="text-2xl font-bold text-indigo-300 mt-0.5">{catalog.length}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-amber-500/10 border border-amber-500/20 flex items-center justify-center text-amber-400">
              <Key className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Access Security</div>
              <div className="text-2xl font-bold text-amber-300 mt-0.5">Code Protected</div>
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
                    </div>

                    <div className="mt-5 pt-4 border-t border-[#1c223c] flex items-center justify-between text-xs text-slate-400">
                      <span className="text-[11px] text-slate-500 flex items-center gap-1">
                        <Calendar className="w-3 h-3" />
                        Enrolled {new Date(item.enrolledAt).toLocaleDateString()}
                      </span>
                      <span className="text-purple-400 font-semibold flex items-center gap-1 text-[11px]">
                        Enrolled <CheckCircle2 className="w-3 h-3 text-emerald-400" />
                      </span>
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
                <p className="text-xs text-slate-500 mt-1">
                  Instructors are currently preparing new courses. Check back shortly!
                </p>
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

            {/* Selected Course Quick Info */}
            <div className="mb-4 p-3 rounded-xl bg-[#0b0e1b] border border-[#1e2544]">
              <div className="flex items-center gap-2 mb-1">
                <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950 text-indigo-300 border border-indigo-800/60">
                  {selectedCourseForEnroll.code}
                </span>
                <span className="text-xs font-bold text-white line-clamp-1">
                  {selectedCourseForEnroll.title}
                </span>
              </div>
              <div className="text-[11px] text-slate-400">
                Instructor: {selectedCourseForEnroll.instructor?.firstName} {selectedCourseForEnroll.instructor?.lastName}
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
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Enter Course Access Code
                </label>
                <div className="relative">
                  <input
                    type="text"
                    required
                    autoFocus
                    placeholder="e.g. ALPHA-2026"
                    value={accessCodeInput}
                    onChange={(e) => setAccessCodeInput(e.target.value)}
                    className="w-full bg-[#0c0e1b] border border-[#2a345e] focus:border-purple-500 rounded-xl py-2.5 px-3 pl-9 text-sm text-slate-100 placeholder-slate-500 font-mono uppercase tracking-wider focus:outline-none transition"
                  />
                  <Key className="w-4 h-4 text-slate-500 absolute left-3 top-3" />
                </div>
                <p className="text-[11px] text-slate-400 mt-1.5 flex items-center gap-1">
                  <ShieldCheck className="w-3.5 h-3.5 text-purple-400 shrink-0" />
                  Access codes are case-insensitive and assigned by course instructors.
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
    </div>
  );
}
