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
} from 'lucide-react';

export default function StudentDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [enrolledList, setEnrolledList] = useState<Enrollment[]>([]);
  const [catalog, setCatalog] = useState<Course[]>([]);
  const [activeTab, setActiveTab] = useState<'my' | 'catalog'>('my');
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [enrollingId, setEnrollingId] = useState<string | null>(null);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

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

  const handleEnroll = async (courseId: string, courseTitle: string) => {
    setEnrollingId(courseId);
    setFeedback(null);
    try {
      await api.post(`/courses/${courseId}/enroll`);
      setFeedback({ type: 'success', text: `Successfully enrolled in "${courseTitle}"!` });
      await fetchStudentData();
      setActiveTab('my');
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Enrollment failed';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setEnrollingId(null);
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
        {/* Welcome Hero */}
        <div className="bg-gradient-to-r from-indigo-950/40 via-[#131833] to-[#0f142b] border border-[#232b50] rounded-2xl p-6 sm:p-8 shadow-xl flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 mb-3">
              Student Status: Active & Enrolled
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Hello, {user.firstName}!
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Access your enrolled classes, explore new courses, and learn with Alpha Coding instructors.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setActiveTab('catalog')}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-900/30 transition text-xs flex items-center gap-2 cursor-pointer"
            >
              <Compass className="w-4 h-4" />
              Browse Course Catalog
            </button>
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

        {/* Tab Selection Row */}
        <div className="flex items-center justify-between border-b border-[#21294c] pb-4">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('my')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'my'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
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
                  You are not currently enrolled in any courses. Explore the catalog to join your first class!
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
                  const isEnrolling = enrollingId === course.id;

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
                        <span className="text-[11px] text-slate-500">Free Enrollment</span>

                        {enrolled ? (
                          <span className="px-3 py-1.5 rounded-lg bg-emerald-950 text-emerald-300 border border-emerald-800/60 text-xs font-semibold flex items-center gap-1">
                            <CheckCircle2 className="w-3.5 h-3.5 text-emerald-400" />
                            Enrolled
                          </span>
                        ) : (
                          <button
                            onClick={() => handleEnroll(course.id, course.title)}
                            disabled={isEnrolling}
                            className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-1.5 px-4 rounded-lg text-xs transition flex items-center gap-1.5 shadow-md shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                          >
                            {isEnrolling ? (
                              <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : (
                              <>
                                Enroll Now <ArrowRight className="w-3 h-3" />
                              </>
                            )}
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
    </div>
  );
}
