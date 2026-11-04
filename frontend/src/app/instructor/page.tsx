"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { Course } from '@/types/course';
import { Assignment, Submission } from '@/types/assignment';
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
  Key,
  Copy,
  Check,
  FileText,
  Award,
  ExternalLink,
  Clock,
} from 'lucide-react';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'courses' | 'assignments'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);

  // Course Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Assignment states
  const [selectedCourseId, setSelectedCourseId] = useState<string | null>(null);
  const [assignments, setAssignments] = useState<Assignment[]>([]);
  const [loadingAssignments, setLoadingAssignments] = useState<boolean>(false);
  const [isCreateAssignmentOpen, setIsCreateAssignmentOpen] = useState<boolean>(false);
  const [assignmentTitle, setAssignmentTitle] = useState('');
  const [assignmentDescription, setAssignmentDescription] = useState('');
  const [assignmentDueDate, setAssignmentDueDate] = useState('');
  const [assignmentMaxScore, setAssignmentMaxScore] = useState<number>(100);
  const [submittingAssignment, setSubmittingAssignment] = useState<boolean>(false);

  // Submissions Modal states
  const [activeAssignmentForSubmissions, setActiveAssignmentForSubmissions] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [gradeScores, setGradeScores] = useState<Record<string, number>>({});
  const [gradeFeedbacks, setGradeFeedbacks] = useState<Record<string, string>>({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingSuccessId, setGradingSuccessId] = useState<string | null>(null);

  const fetchTeachingCourses = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await api.get<Course[]>('/courses/my/teaching');
      setCourses(data);
      if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }
    } catch (err: unknown) {
      if (err instanceof ApiError) {
        setFeedback({ type: 'error', text: `Failed to load courses: ${err.message}` });
      }
    } finally {
      setLoadingData(false);
    }
  }, [selectedCourseId]);

  const fetchAssignments = useCallback(async (courseId: string) => {
    setLoadingAssignments(true);
    try {
      const data = await api.get<Assignment[]>(`/courses/${courseId}/assignments`);
      setAssignments(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load assignments';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingAssignments(false);
    }
  }, []);

  const fetchSubmissions = async (assignment: Assignment) => {
    setActiveAssignmentForSubmissions(assignment);
    setLoadingSubmissions(true);
    try {
      const data = await api.get<Submission[]>(`/assignments/${assignment.id}/submissions`);
      setSubmissions(data);

      // Pre-fill existing grades
      const initialScores: Record<string, number> = {};
      const initialFeedbacks: Record<string, string> = {};
      data.forEach((sub) => {
        if (sub.score !== null) initialScores[sub.id] = sub.score;
        if (sub.feedback) initialFeedbacks[sub.id] = sub.feedback;
      });
      setGradeScores(initialScores);
      setGradeFeedbacks(initialFeedbacks);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load submissions';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingSubmissions(false);
    }
  };

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

  useEffect(() => {
    if (selectedCourseId && activeTab === 'assignments') {
      fetchAssignments(selectedCourseId);
    }
  }, [selectedCourseId, activeTab, fetchAssignments]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFormSubmitting(true);

    try {
      const trimmedAccess = accessCode.trim().toUpperCase();
      await api.post('/courses', {
        title,
        code,
        description,
        accessCode: trimmedAccess || undefined,
        isPublished,
      });

      setFeedback({ type: 'success', text: `Course "${title}" created successfully!` });
      setIsModalOpen(false);
      setTitle('');
      setCode('');
      setDescription('');
      setAccessCode('');
      await fetchTeachingCourses();
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create course';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setFormSubmitting(false);
    }
  };

  const handleCreateAssignment = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setFeedback(null);
    setSubmittingAssignment(true);

    try {
      await api.post(`/courses/${selectedCourseId}/assignments`, {
        title: assignmentTitle.trim(),
        description: assignmentDescription.trim(),
        dueDate: assignmentDueDate ? new Date(assignmentDueDate).toISOString() : undefined,
        maxScore: Number(assignmentMaxScore) || 100,
      });

      setFeedback({ type: 'success', text: `Assignment "${assignmentTitle}" created successfully!` });
      setIsCreateAssignmentOpen(false);
      setAssignmentTitle('');
      setAssignmentDescription('');
      setAssignmentDueDate('');
      setAssignmentMaxScore(100);
      await fetchAssignments(selectedCourseId);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create assignment';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingAssignment(false);
    }
  };

  const handleSaveGrade = async (submissionId: string) => {
    const score = gradeScores[submissionId];
    if (score === undefined || score === null) {
      setFeedback({ type: 'error', text: 'Please enter a valid numeric score.' });
      return;
    }

    setGradingSubmissionId(submissionId);
    try {
      await api.patch(`/submissions/${submissionId}/grade`, {
        score: Number(score),
        feedback: gradeFeedbacks[submissionId]?.trim() || undefined,
      });

      setGradingSuccessId(submissionId);
      setTimeout(() => setGradingSuccessId(null), 2500);

      if (activeAssignmentForSubmissions) {
        const updated = await api.get<Submission[]>(`/assignments/${activeAssignmentForSubmissions.id}/submissions`);
        setSubmissions(updated);
      }
      if (selectedCourseId) {
        fetchAssignments(selectedCourseId);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to save grade';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setGradingSubmissionId(null);
    }
  };

  const handleCopyCode = async (courseId: string, codeToCopy?: string) => {
    if (!codeToCopy) return;
    try {
      await navigator.clipboard.writeText(codeToCopy);
      setCopiedCodeId(courseId);
      setTimeout(() => setCopiedCodeId(null), 2000);
    } catch {
      setFeedback({ type: 'error', text: `Could not copy code automatically: ${codeToCopy}` });
    }
  };

  const totalStudents = courses.reduce((acc, c) => acc + (c._count?.enrollments || 0), 0);

  if (loading || !user) {
    return (
      <div className="min-h-screen bg-[#090b14] flex items-center justify-center text-slate-300">
        <div className="flex items-center gap-3">
          <div className="w-5 h-5 border-2 border-purple-500 border-t-transparent rounded-full animate-spin" />
          <span>Loading instructor studio...</span>
        </div>
      </div>
    );
  }

  const selectedCourse = courses.find((c) => c.id === selectedCourseId);

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
              Instructor Studio &bull; Active & Verified
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Instructor Studio &bull; {user.firstName} {user.lastName}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Manage courses, distribute secure access codes, design homework assignments, and review & grade student submissions.
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
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Assignments System</div>
              <div className="text-2xl font-bold text-emerald-300 mt-0.5">Phase 6 Active</div>
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

        {/* Navigation Tabs */}
        <div className="flex items-center justify-between border-b border-[#1c223c] pb-3">
          <div className="flex items-center gap-2">
            <button
              onClick={() => setActiveTab('courses')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'courses'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <BookOpen className="w-3.5 h-3.5" />
              My Courses ({courses.length})
            </button>

            <button
              onClick={() => setActiveTab('assignments')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'assignments'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <FileText className="w-3.5 h-3.5" />
              Assignments & Grading
            </button>
          </div>

          <button
            onClick={fetchTeachingCourses}
            disabled={loadingData}
            className="text-xs px-3 py-1.5 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
          >
            <RefreshCw className={`w-3.5 h-3.5 ${loadingData ? 'animate-spin' : ''}`} />
            Refresh
          </button>
        </div>

        {/* Tab 1: My Courses */}
        {activeTab === 'courses' && (
          <div>
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <BookOpen className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">No Courses Created Yet</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-6">
                  You haven&apos;t published any courses yet. Create your first course to open enrollments and assign coursework.
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

                      {/* Access Code Display Banner */}
                      {course.accessCode && (
                        <div className="mt-4 p-3 rounded-xl bg-[#0b0e1b] border border-[#222949] flex items-center justify-between">
                          <div className="flex items-center gap-2">
                            <Key className="w-3.5 h-3.5 text-amber-400 shrink-0" />
                            <div>
                              <div className="text-[10px] text-slate-400 uppercase tracking-wider font-semibold">
                                Access Code
                              </div>
                              <span className="font-mono text-xs font-bold text-amber-300">
                                {course.accessCode}
                              </span>
                            </div>
                          </div>
                          <button
                            onClick={() => handleCopyCode(course.id, course.accessCode)}
                            className="text-[11px] font-semibold px-2.5 py-1 rounded-lg bg-[#181f3d] hover:bg-[#222a52] text-slate-200 hover:text-white border border-[#2e3766] transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                            title="Copy Access Code"
                          >
                            {copiedCodeId === course.id ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span className="text-emerald-400">Copied</span>
                              </>
                            ) : (
                              <>
                                <Copy className="w-3.5 h-3.5 text-slate-400" />
                                <span>Copy</span>
                              </>
                            )}
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#1c223c] flex items-center justify-between">
                      <div className="flex items-center gap-1.5 text-indigo-300 font-semibold text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course._count?.enrollments || 0} Students</span>
                      </div>
                      <button
                        onClick={() => {
                          setSelectedCourseId(course.id);
                          setActiveTab('assignments');
                        }}
                        className="text-xs px-3 py-1.5 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition flex items-center gap-1.5 cursor-pointer"
                      >
                        <FileText className="w-3 h-3" />
                        Assignments
                      </button>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </div>
        )}

        {/* Tab 2: Assignments & Grading */}
        {activeTab === 'assignments' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <FileText className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
                <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                  Assignments belong to courses. Please publish a course before creating coursework.
                </p>
                <button
                  onClick={() => {
                    setActiveTab('courses');
                    setIsModalOpen(true);
                  }}
                  className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                >
                  <PlusCircle className="w-4 h-4" />
                  Create Course
                </button>
              </div>
            ) : (
              <div>
                {/* Course Selector Bar & Action */}
                <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-5 shadow-lg flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div className="flex items-center gap-3">
                    <label className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                      Selected Course:
                    </label>
                    <select
                      value={selectedCourseId || ''}
                      onChange={(e) => setSelectedCourseId(e.target.value)}
                      className="bg-[#0b0e1b] border border-[#262e52] rounded-xl px-3 py-2 text-xs font-medium text-slate-200 focus:outline-none focus:border-purple-500 transition"
                    >
                      {courses.map((c) => (
                        <option key={c.id} value={c.id}>
                          {c.code} — {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <button
                    onClick={() => setIsCreateAssignmentOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-purple-900/30 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create Assignment
                  </button>
                </div>

                {/* Assignments List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Coursework for {selectedCourse?.code || 'Course'} ({assignments.length})
                    </h3>
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchAssignments(selectedCourseId)}
                        disabled={loadingAssignments}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingAssignments ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {loadingAssignments ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course assignments...</span>
                    </div>
                  ) : assignments.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <FileText className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="font-bold text-white text-sm">No Assignments Created Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                        Create homework, projects, or lab tasks for enrolled students in this course.
                      </p>
                      <button
                        onClick={() => setIsCreateAssignmentOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Create First Assignment
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {assignments.map((assignment) => (
                        <div
                          key={assignment.id}
                          className="bg-[#12162b] border border-[#21294c] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="font-mono text-[11px] font-bold px-2 py-0.5 rounded bg-indigo-950/80 text-indigo-300 border border-indigo-800/60">
                                Max: {assignment.maxScore} pts
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Users className="w-3 h-3 text-slate-500" />
                                {assignment._count?.submissions || 0} Submissions
                              </span>
                            </div>

                            <h4 className="font-bold text-white text-base leading-snug">{assignment.title}</h4>
                            <p className="text-xs text-slate-400 mt-2 line-clamp-3 leading-relaxed">
                              {assignment.description}
                            </p>

                            <div className="mt-4 pt-3 border-t border-[#1a203a] text-xs text-slate-400 flex items-center justify-between">
                              <span className="flex items-center gap-1 text-[11px]">
                                <Clock className="w-3 h-3 text-slate-500" />
                                Due: {assignment.dueDate ? new Date(assignment.dueDate).toLocaleDateString() : 'No Deadline'}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#1c223c]">
                            <button
                              onClick={() => fetchSubmissions(assignment)}
                              className="w-full bg-gradient-to-r from-purple-600/30 to-indigo-600/30 hover:from-purple-600/50 hover:to-indigo-600/50 text-purple-200 border border-purple-500/40 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <Award className="w-3.5 h-3.5 text-purple-400" />
                              View Submissions & Grade ({assignment._count?.submissions || 0})
                            </button>
                          </div>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
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
                <div className="flex items-center justify-between mb-2">
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider">
                    Access Code (Optional)
                  </label>
                  <span className="text-[11px] text-slate-500">Auto-generated if empty</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. ALPHA-2026"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 uppercase font-mono focus:outline-none focus:border-purple-500 transition"
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

      {/* Create Assignment Modal */}
      {isCreateAssignmentOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/70 backdrop-blur-sm">
          <div className="bg-[#12162b] border border-[#273059] rounded-2xl w-full max-w-md p-6 shadow-2xl relative animate-in fade-in zoom-in-95 duration-150">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <FileText className="w-5 h-5 text-purple-400" />
                Create Assignment for {selectedCourse?.code}
              </h3>
              <button
                onClick={() => setIsCreateAssignmentOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAssignment} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Assignment Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Lab 1: Relational Schema & Queries"
                  value={assignmentTitle}
                  onChange={(e) => setAssignmentTitle(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Instructions & Requirements
                </label>
                <textarea
                  rows={3}
                  required
                  placeholder="Explain requirements, deliverables, GitHub repository link requirements, or grading rubric..."
                  value={assignmentDescription}
                  onChange={(e) => setAssignmentDescription(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-2 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Max Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    value={assignmentMaxScore}
                    onChange={(e) => setAssignmentMaxScore(Number(e.target.value))}
                    className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Due Date (Optional)
                  </label>
                  <input
                    type="date"
                    value={assignmentDueDate}
                    onChange={(e) => setAssignmentDueDate(e.target.value)}
                    className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#21294c]">
                <button
                  type="button"
                  onClick={() => setIsCreateAssignmentOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAssignment}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {submittingAssignment ? 'Publishing...' : 'Publish Assignment'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Submissions Viewer & Grading Modal */}
      {activeAssignmentForSubmissions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            {/* Modal Header */}
            <div className="p-6 pb-4 border-b border-[#21294c] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                    Max: {activeAssignmentForSubmissions.maxScore} pts
                  </span>
                  <h3 className="font-bold text-white text-lg">
                    {activeAssignmentForSubmissions.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1 line-clamp-1">
                  {activeAssignmentForSubmissions.description}
                </p>
              </div>
              <button
                onClick={() => setActiveAssignmentForSubmissions(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            {/* Modal Content */}
            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="flex items-center justify-between">
                <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Student Submissions ({submissions.length})
                </div>
                {activeAssignmentForSubmissions && (
                  <button
                    onClick={() => fetchSubmissions(activeAssignmentForSubmissions)}
                    disabled={loadingSubmissions}
                    className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                  >
                    <RefreshCw className={`w-3 h-3 ${loadingSubmissions ? 'animate-spin' : ''}`} />
                    Refresh
                  </button>
                )}
              </div>

              {loadingSubmissions ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading student submissions...</span>
                </div>
              ) : submissions.length === 0 ? (
                <div className="bg-[#0c0e1b] border border-[#202848] rounded-xl p-8 text-center text-slate-400">
                  <Users className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Submissions Yet</p>
                  <p className="text-xs text-slate-500 mt-1">
                    Enrolled students have not submitted work for this assignment yet.
                  </p>
                </div>
              ) : (
                <div className="space-y-4">
                  {submissions.map((sub) => {
                    const isGraded = sub.status === 'GRADED';
                    const isSaving = gradingSubmissionId === sub.id;
                    const isSuccess = gradingSuccessId === sub.id;
                    const isLink = sub.content.startsWith('http://') || sub.content.startsWith('https://');

                    return (
                      <div
                        key={sub.id}
                        className="bg-[#0b0e1b] border border-[#222949] rounded-xl p-4 shadow flex flex-col md:flex-row md:items-start justify-between gap-4"
                      >
                        <div className="flex-1 space-y-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-2">
                              <span className="font-semibold text-sm text-white">
                                {sub.student?.firstName} {sub.student?.lastName}
                              </span>
                              <span className="text-xs text-slate-400 font-mono">
                                ({sub.student?.email})
                              </span>
                            </div>
                            <span
                              className={`text-[11px] font-semibold px-2 py-0.5 rounded-full border ${
                                isGraded
                                  ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                  : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                              }`}
                            >
                              {isGraded ? `Graded: ${sub.score} / ${activeAssignmentForSubmissions.maxScore}` : 'Awaiting Grade'}
                            </span>
                          </div>

                          {/* Submission Content */}
                          <div className="p-3 rounded-lg bg-[#12162b] border border-[#1d2342] text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                              Submitted Solution / Link:
                            </span>
                            {isLink ? (
                              <a
                                href={sub.content}
                                target="_blank"
                                rel="noreferrer"
                                className="text-indigo-400 hover:text-indigo-300 underline font-mono flex items-center gap-1 break-all"
                              >
                                {sub.content}
                                <ExternalLink className="w-3 h-3 shrink-0" />
                              </a>
                            ) : (
                              <p className="text-slate-200 whitespace-pre-wrap">{sub.content}</p>
                            )}
                          </div>

                          <div className="text-[11px] text-slate-500">
                            Submitted on {new Date(sub.submittedAt).toLocaleString()}
                          </div>
                        </div>

                        {/* Grading Controls */}
                        <div className="w-full md:w-72 bg-[#12162b] border border-[#232b50] rounded-xl p-3 space-y-2.5 shrink-0">
                          <div>
                            <div className="flex items-center justify-between mb-1">
                              <label className="text-[11px] font-semibold text-slate-300 uppercase">
                                Score (Max {activeAssignmentForSubmissions.maxScore})
                              </label>
                            </div>
                            <input
                              type="number"
                              min={0}
                              max={activeAssignmentForSubmissions.maxScore}
                              value={gradeScores[sub.id] ?? ''}
                              onChange={(e) =>
                                setGradeScores({
                                  ...gradeScores,
                                  [sub.id]: Number(e.target.value),
                                })
                              }
                              placeholder={`0 - ${activeAssignmentForSubmissions.maxScore}`}
                              className="w-full bg-[#0a0c16] border border-[#252c4e] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 uppercase block mb-1">
                              Feedback (Optional)
                            </label>
                            <input
                              type="text"
                              value={gradeFeedbacks[sub.id] ?? ''}
                              onChange={(e) =>
                                setGradeFeedbacks({
                                  ...gradeFeedbacks,
                                  [sub.id]: e.target.value,
                                })
                              }
                              placeholder="Great work, clean structure..."
                              className="w-full bg-[#0a0c16] border border-[#252c4e] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                            />
                          </div>

                          <button
                            onClick={() => handleSaveGrade(sub.id)}
                            disabled={isSaving}
                            className={`w-full py-1.5 px-3 rounded-lg text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md ${
                              isSuccess
                                ? 'bg-emerald-600 text-white'
                                : 'bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white'
                            }`}
                          >
                            {isSaving ? (
                              <div className="w-3 h-3 border-2 border-white border-t-transparent rounded-full animate-spin" />
                            ) : isSuccess ? (
                              <>
                                <Check className="w-3.5 h-3.5" />
                                <span>Grade Saved!</span>
                              </>
                            ) : (
                              <>
                                <Award className="w-3.5 h-3.5" />
                                <span>{isGraded ? 'Update Grade' : 'Save Grade'}</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
    </div>
  );
}
