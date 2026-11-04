"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { Course } from '@/types/course';
import {
  BookOpen,
  Users,
  PlusCircle,
  LogOut,
  RefreshCw,
  Code,
  Calendar,
  Sparkles,
  X,
  CheckCircle2,
  AlertCircle,
} from 'lucide-react';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);

  // Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  const fetchTeachingCourses = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await api.get<Course[]>('/courses/my/teaching');
      setCourses(data);
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
      } else if (user.role !== 'INSTRUCTOR' && user.role !== 'SUPER_ADMIN' && user.role !== 'ADMIN') {
        router.push('/student');
      } else {
        fetchTeachingCourses();
      }
    }
  }, [user, loading, router, fetchTeachingCourses]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFormSubmitting(true);

    try {
      await api.post('/courses', {
        title,
        code,
        description,
        isPublished,
      });

      setFeedback({ type: 'success', text: `Course "${title}" created successfully!` });
      setIsModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      await fetchTeachingCourses();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create course';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setFormSubmitting(false);
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090b14] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading instructor portal...</span>
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
            <span className="ml-3 px-2.5 py-0.5 rounded-full text-xs font-semibold bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
              Instructor Portal
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
            <div className="inline-block px-3 py-1 rounded-full text-xs font-semibold bg-emerald-950 text-emerald-300 border border-emerald-800/60 mb-3">
              Instructor Status: Active & Verified
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Instructor Studio &bull; {user.firstName} {user.lastName}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Create and manage courses, curriculum syllabus, and monitor student enrollments.
            </p>
          </div>

          <div className="flex items-center gap-3">
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2.5 px-5 rounded-xl shadow-lg shadow-purple-900/30 transition text-xs flex items-center gap-2 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create New Course
            </button>
          </div>
        </div>

        {/* Stats Row */}
        <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-purple-600/10 border border-purple-500/20 flex items-center justify-center text-purple-400">
              <BookOpen className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">My Courses</div>
              <div className="text-2xl font-bold text-white mt-0.5">{courses.length}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-indigo-600/10 border border-indigo-500/20 flex items-center justify-center text-indigo-400">
              <Users className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Enrolled Students</div>
              <div className="text-2xl font-bold text-indigo-300 mt-0.5">{totalStudents}</div>
            </div>
          </div>

          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex items-center gap-4">
            <div className="w-12 h-12 rounded-xl bg-emerald-500/10 border border-emerald-500/20 flex items-center justify-center text-emerald-400">
              <Sparkles className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Live Status</div>
              <div className="text-2xl font-bold text-emerald-300 mt-0.5">Phase 5 Active</div>
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

        {/* Courses Section Header */}
        <div className="flex items-center justify-between pt-2">
          <h3 className="text-lg font-bold text-white flex items-center gap-2">
            <BookOpen className="w-5 h-5 text-purple-400" />
            My Active Courses ({courses.length})
          </h3>
          <button
            onClick={fetchTeachingCourses}
            disabled={loadingData}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Courses Grid */}
        {courses.length === 0 ? (
          <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
            <BookOpen className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
            <h4 className="text-base font-bold text-white">No Courses Created Yet</h4>
            <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
              You haven&apos;t published any courses yet. Create your first course to open enrollments for students.
            </p>
            <button
              onClick={() => setIsModalOpen(true)}
              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition inline-flex items-center gap-1.5 shadow-md shadow-purple-900/30 cursor-pointer"
            >
              <PlusCircle className="w-4 h-4" />
              Create Your First Course
            </button>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
            {courses.map((course) => (
              <div
                key={course.id}
                className="bg-[#12162b] border border-[#21294c] hover:border-purple-500/50 rounded-2xl p-6 shadow-lg transition flex flex-col justify-between"
              >
                <div>
                  <div className="flex items-center justify-between mb-3">
                    <span className="font-mono text-xs font-bold px-2.5 py-1 rounded-md bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                      <Code className="w-3 h-3" />
                      {course.code}
                    </span>
                    <span className="text-[11px] font-semibold px-2 py-0.5 rounded-full bg-emerald-950 text-emerald-400 border border-emerald-800/50">
                      Published
                    </span>
                  </div>

                  <h4 className="font-bold text-white text-base leading-snug">{course.title}</h4>
                  <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                    {course.description || 'No detailed syllabus description provided yet.'}
                  </p>
                </div>

                <div className="mt-6 pt-4 border-t border-[#1c223c] flex items-center justify-between text-xs text-slate-400">
                  <div className="flex items-center gap-1.5 text-indigo-300 font-semibold">
                    <Users className="w-3.5 h-3.5" />
                    <span>{course._count?.enrollments || 0} Students Enrolled</span>
                  </div>
                  <div className="text-[11px] text-slate-500 flex items-center gap-1">
                    <Calendar className="w-3 h-3" />
                    {new Date(course.createdAt).toLocaleDateString()}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </main>

      {/* Create Course Modal */}
      {isModalOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12162b] border border-[#273059] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <PlusCircle className="w-5 h-5 text-purple-400" />
                Create New Course
              </h3>
              <button
                onClick={() => setIsModalOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateCourse} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Course Code (e.g. CS-101)
                </label>
                <input
                  type="text"
                  required
                  placeholder="CS-101"
                  value={code}
                  onChange={(e) => setCode(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Course Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="Data Structures & Algorithms"
                  value={title}
                  onChange={(e) => setTitle(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Syllabus Description
                </label>
                <textarea
                  rows={3}
                  placeholder="Overview of core concepts, live class schedule, and prerequisites..."
                  value={description}
                  onChange={(e) => setDescription(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="publishCheck"
                  checked={isPublished}
                  onChange={(e) => setIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[#252c4e] text-purple-600 focus:ring-purple-500 bg-[#0c0e1b]"
                />
                <label htmlFor="publishCheck" className="text-xs text-slate-300 select-none">
                  Publish immediately (students can view and enroll)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#21294c]">
                <button
                  type="button"
                  onClick={() => setIsModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={formSubmitting}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {formSubmitting ? 'Creating...' : 'Create Course'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
    </div>
  );
}
