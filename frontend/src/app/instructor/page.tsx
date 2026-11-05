"use client";

import React, { useEffect, useState, useCallback } from 'react';
import Link from 'next/link';
import { useRouter } from 'next/navigation';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { Course } from '@/types/course';
import { Assignment, Submission } from '@/types/assignment';
import { Exam, ExamAttempt } from '@/types/exam';
import { LiveRoom, LiveRoomWithAttendance, AttendanceRecord } from '@/types/room';
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
  CheckSquare,
  HelpCircle,
  Eye,
  Radio,
  Video,
  PhoneOff,
  UserCheck,
  Timer,
  Play,
  Trash2,
  Download,
  Film,
  Megaphone,
  Pin,
  MessageSquare,
  CornerDownRight,
  Send,
  FolderDown,
  File,
  FileArchive,
  UploadCloud,
  FileSpreadsheet,
} from 'lucide-react';
import { Recording } from '@/types/recording';
import { Announcement } from '@/types/announcement';
import { DiscussionPost } from '@/types/discussion';
import { CourseMaterial } from '@/types/material';
import NotificationsPopover from '@/components/notifications-popover';
import ProfileModal from '@/components/profile-modal';
import VideoWatermark from '@/components/video-watermark';

export default function InstructorDashboardPage() {
  const router = useRouter();
  const { user, loading, logout } = useAuth();

  const [activeTab, setActiveTab] = useState<'courses' | 'assignments' | 'exams' | 'attendance' | 'recordings' | 'materials' | 'announcements' | 'discussions'>('courses');
  const [courses, setCourses] = useState<Course[]>([]);
  const [loadingData, setLoadingData] = useState<boolean>(true);
  const [isModalOpen, setIsModalOpen] = useState<boolean>(false);
  const [formSubmitting, setFormSubmitting] = useState<boolean>(false);
  const [feedback, setFeedback] = useState<{ type: 'success' | 'error'; text: string } | null>(null);
  const [copiedCodeId, setCopiedCodeId] = useState<string | null>(null);
  const [isProfileOpen, setIsProfileOpen] = useState<boolean>(false);

  // Materials states
  const [materials, setMaterials] = useState<CourseMaterial[]>([]);
  const [loadingMaterials, setLoadingMaterials] = useState<boolean>(false);
  const [isUploadMaterialOpen, setIsUploadMaterialOpen] = useState<boolean>(false);
  const [materialTitle, setMaterialTitle] = useState<string>('');
  const [materialDescription, setMaterialDescription] = useState<string>('');
  const [materialFile, setMaterialFile] = useState<File | null>(null);
  const [submittingMaterial, setSubmittingMaterial] = useState<boolean>(false);
  const [deletingMaterialId, setDeletingMaterialId] = useState<string | null>(null);
  const [exportingGrades, setExportingGrades] = useState<boolean>(false);
  const [exportingAttendance, setExportingAttendance] = useState<boolean>(false);

  // Announcements states
  const [announcements, setAnnouncements] = useState<Announcement[]>([]);
  const [loadingAnnouncements, setLoadingAnnouncements] = useState<boolean>(false);
  const [isCreateAnnouncementOpen, setIsCreateAnnouncementOpen] = useState<boolean>(false);
  const [announcementTitle, setAnnouncementTitle] = useState<string>('');
  const [announcementContent, setAnnouncementContent] = useState<string>('');
  const [announcementIsPinned, setAnnouncementIsPinned] = useState<boolean>(false);
  const [submittingAnnouncement, setSubmittingAnnouncement] = useState<boolean>(false);

  // Discussions states
  const [discussions, setDiscussions] = useState<DiscussionPost[]>([]);
  const [loadingDiscussions, setLoadingDiscussions] = useState<boolean>(false);
  const [replyContentMap, setReplyContentMap] = useState<Record<string, string>>({});
  const [submittingReplyId, setSubmittingReplyId] = useState<string | null>(null);

  // Recordings states
  const [recordings, setRecordings] = useState<Recording[]>([]);
  const [loadingRecordings, setLoadingRecordings] = useState<boolean>(false);
  const [activeRecordingForPlayback, setActiveRecordingForPlayback] = useState<Recording | null>(null);
  const [deletingRecordingId, setDeletingRecordingId] = useState<string | null>(null);

  // Course Form states
  const [title, setTitle] = useState('');
  const [code, setCode] = useState('');
  const [description, setDescription] = useState('');
  const [accessCode, setAccessCode] = useState('');
  const [isPublished, setIsPublished] = useState(true);

  // Attendance states
  const [attendanceSessions, setAttendanceSessions] = useState<LiveRoomWithAttendance[]>([]);
  const [loadingAttendance, setLoadingAttendance] = useState<boolean>(false);
  const [activeSessionForAttendance, setActiveSessionForAttendance] = useState<LiveRoomWithAttendance | null>(null);

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

  // Assignment Submissions Modal states
  const [activeAssignmentForSubmissions, setActiveAssignmentForSubmissions] = useState<Assignment | null>(null);
  const [submissions, setSubmissions] = useState<Submission[]>([]);
  const [loadingSubmissions, setLoadingSubmissions] = useState<boolean>(false);
  const [gradeScores, setGradeScores] = useState<Record<string, number>>({});
  const [gradeFeedbacks, setGradeFeedbacks] = useState<Record<string, string>>({});
  const [gradingSubmissionId, setGradingSubmissionId] = useState<string | null>(null);
  const [gradingSuccessId, setGradingSuccessId] = useState<string | null>(null);

  // Exam states
  const [exams, setExams] = useState<Exam[]>([]);
  const [loadingExams, setLoadingExams] = useState<boolean>(false);
  const [isCreateExamOpen, setIsCreateExamOpen] = useState<boolean>(false);
  const [examTitle, setExamTitle] = useState('');
  const [examDescription, setExamDescription] = useState('');
  const [examDuration, setExamDuration] = useState<number>(30);
  const [examPassingScore, setExamPassingScore] = useState<number>(50);
  const [examTotalScore, setExamTotalScore] = useState<number>(100);
  const [examIsPublished, setExamIsPublished] = useState<boolean>(true);
  const [submittingExam, setSubmittingExam] = useState<boolean>(false);

  // Question Builder states
  const [activeExamForQuestions, setActiveExamForQuestions] = useState<Exam | null>(null);
  const [questionText, setQuestionText] = useState('');
  const [optA, setOptA] = useState('');
  const [optB, setOptB] = useState('');
  const [optC, setOptC] = useState('');
  const [optD, setOptD] = useState('');
  const [correctAnswer, setCorrectAnswer] = useState('a');
  const [questionPoints, setQuestionPoints] = useState<number>(1);
  const [submittingQuestion, setSubmittingQuestion] = useState<boolean>(false);

  // Exam Results states
  const [activeExamForResults, setActiveExamForResults] = useState<Exam | null>(null);
  const [examResults, setExamResults] = useState<ExamAttempt[]>([]);
  const [loadingExamResults, setLoadingExamResults] = useState<boolean>(false);

  // Live Room states
  const [activeRooms, setActiveRooms] = useState<Record<string, LiveRoom | null>>({});
  const [isStartLiveModalOpen, setIsStartLiveModalOpen] = useState<boolean>(false);
  const [liveModalCourse, setLiveModalCourse] = useState<Course | null>(null);
  const [liveSessionTitle, setLiveSessionTitle] = useState<string>('');
  const [startingLiveSession, setStartingLiveSession] = useState<boolean>(false);

  const fetchTeachingCourses = useCallback(async () => {
    setLoadingData(true);
    try {
      const data = await api.get<Course[]>('/courses/my/teaching');
      setCourses(data);
      if (data.length > 0 && !selectedCourseId) {
        setSelectedCourseId(data[0].id);
      }

      // Fetch active rooms for all teaching courses
      const roomsMap: Record<string, LiveRoom | null> = {};
      await Promise.all(
        data.map(async (c) => {
          try {
            const active = await api.get<LiveRoom | null>(`/courses/${c.id}/rooms/active`);
            roomsMap[c.id] = active;
          } catch {
            roomsMap[c.id] = null;
          }
        }),
      );
      setActiveRooms(roomsMap);
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

  const fetchExams = useCallback(async (courseId: string) => {
    setLoadingExams(true);
    try {
      const data = await api.get<Exam[]>(`/courses/${courseId}/exams`);
      setExams(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load exams';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingExams(false);
    }
  }, []);

  const fetchAttendanceSessions = useCallback(async (courseId: string) => {
    setLoadingAttendance(true);
    try {
      const data = await api.get<LiveRoomWithAttendance[]>(`/courses/${courseId}/attendance-sessions`);
      setAttendanceSessions(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load attendance sessions';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingAttendance(false);
    }
  }, []);

  const fetchSubmissions = async (assignment: Assignment) => {
    setActiveAssignmentForSubmissions(assignment);
    setLoadingSubmissions(true);
    try {
      const data = await api.get<Submission[]>(`/assignments/${assignment.id}/submissions`);
      setSubmissions(data);

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

  const fetchResults = async (exam: Exam) => {
    setActiveExamForResults(exam);
    setLoadingExamResults(true);
    try {
      const data = await api.get<ExamAttempt[]>(`/exams/${exam.id}/results`);
      setExamResults(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load exam results';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingExamResults(false);
    }
  };

  const fetchRecordings = useCallback(async (courseId: string) => {
    setLoadingRecordings(true);
    try {
      const data = await api.get<Recording[]>(`/courses/${courseId}/recordings`);
      setRecordings(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load recordings';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingRecordings(false);
    }
  }, []);

  const handleDeleteRecording = async (recordingId: string) => {
    if (!confirm('Are you sure you want to delete this lecture recording?')) return;
    setDeletingRecordingId(recordingId);
    try {
      await api.delete(`/recordings/${recordingId}`);
      setRecordings((prev) => prev.filter((r) => r.id !== recordingId));
      setFeedback({ type: 'success', text: 'Recording deleted successfully.' });
      if (activeRecordingForPlayback?.id === recordingId) {
        setActiveRecordingForPlayback(null);
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete recording';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setDeletingRecordingId(null);
    }
  };

  const formatRecordingDuration = (sec: number) => {
    const hours = Math.floor(sec / 3600);
    const mins = Math.floor((sec % 3600) / 60);
    const secs = sec % 60;
    if (hours > 0) {
      return `${hours}h ${mins.toString().padStart(2, '0')}m ${secs.toString().padStart(2, '0')}s`;
    }
    return `${mins}m ${secs.toString().padStart(2, '0')}s`;
  };

  const formatFileSize = (bytes: number) => {
    if (!bytes || bytes === 0) return '0 MB';
    const mb = bytes / (1024 * 1024);
    if (mb < 1) return `${(bytes / 1024).toFixed(1)} KB`;
    return `${mb.toFixed(1)} MB`;
  };

  const getRecordingStreamUrl = (recording: Recording) => {
    const backendBase = process.env.NEXT_PUBLIC_API_URL
      ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
      : 'http://localhost:4000';
    return `${backendBase}/api/v1/recordings/${recording.id}/stream`;
  };

  const fetchMaterials = useCallback(async (courseId: string) => {
    setLoadingMaterials(true);
    try {
      const data = await api.get<CourseMaterial[]>(`/courses/${courseId}/materials`);
      setMaterials(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load materials';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingMaterials(false);
    }
  }, []);

  const handleUploadMaterial = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !materialFile || !materialTitle.trim()) {
      alert('Please select a course, provide a title, and choose a file');
      return;
    }
    setSubmittingMaterial(true);
    try {
      const formData = new FormData();
      formData.append('file', materialFile);
      formData.append('title', materialTitle.trim());
      if (materialDescription.trim()) {
        formData.append('description', materialDescription.trim());
      }

      const created = await api.post<CourseMaterial>(
        `/courses/${selectedCourseId}/materials`,
        formData,
      );
      setMaterials((prev) => [created, ...prev]);
      setIsUploadMaterialOpen(false);
      setMaterialTitle('');
      setMaterialDescription('');
      setMaterialFile(null);
      setFeedback({ type: 'success', text: 'Course material uploaded successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to upload material';
      alert(msg);
    } finally {
      setSubmittingMaterial(false);
    }
  };

  const handleDeleteMaterial = async (id: string) => {
    if (!confirm('Are you sure you want to delete this course material?')) return;
    setDeletingMaterialId(id);
    try {
      await api.delete(`/materials/${id}`);
      setMaterials((prev) => prev.filter((m) => m.id !== id));
      setFeedback({ type: 'success', text: 'Material deleted successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to delete material';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setDeletingMaterialId(null);
    }
  };

  const handleExportGradesCsv = async (courseId: string) => {
    setExportingGrades(true);
    try {
      const csvText = await api.get<string>(`/courses/${courseId}/export/grades`);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId.slice(0, 8)}_grades.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', text: 'Grades CSV report exported successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to export grades CSV';
      alert(msg);
    } finally {
      setExportingGrades(false);
    }
  };

  const handleExportAttendanceCsv = async (courseId: string) => {
    setExportingAttendance(true);
    try {
      const csvText = await api.get<string>(`/courses/${courseId}/export/attendance`);
      const blob = new Blob([csvText], { type: 'text/csv;charset=utf-8;' });
      const url = URL.createObjectURL(blob);
      const link = document.createElement('a');
      link.href = url;
      link.setAttribute('download', `course_${courseId.slice(0, 8)}_attendance.csv`);
      document.body.appendChild(link);
      link.click();
      document.body.removeChild(link);
      URL.revokeObjectURL(url);
      setFeedback({ type: 'success', text: 'Attendance CSV report exported successfully!' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to export attendance CSV';
      alert(msg);
    } finally {
      setExportingAttendance(false);
    }
  };

  const fetchAnnouncements = useCallback(async (courseId: string) => {
    setLoadingAnnouncements(true);
    try {
      const data = await api.get<Announcement[]>(`/courses/${courseId}/announcements`);
      setAnnouncements(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load announcements';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingAnnouncements(false);
    }
  }, []);

  const fetchDiscussions = useCallback(async (courseId: string) => {
    setLoadingDiscussions(true);
    try {
      const data = await api.get<DiscussionPost[]>(`/courses/${courseId}/discussions`);
      setDiscussions(data);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to load discussions';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setLoadingDiscussions(false);
    }
  }, []);

  const handleCreateAnnouncement = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId || !announcementTitle.trim() || !announcementContent.trim()) return;
    setSubmittingAnnouncement(true);
    try {
      const created = await api.post<Announcement>(`/courses/${selectedCourseId}/announcements`, {
        title: announcementTitle.trim(),
        content: announcementContent.trim(),
        isPinned: announcementIsPinned,
      });
      setAnnouncements((prev) => [created, ...prev]);
      setAnnouncementTitle('');
      setAnnouncementContent('');
      setAnnouncementIsPinned(false);
      setIsCreateAnnouncementOpen(false);
      setFeedback({ type: 'success', text: 'Announcement published & notifications dispatched!' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create announcement';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingAnnouncement(false);
    }
  };

  const handleCreateInstructorReply = async (parentId: string) => {
    const text = replyContentMap[parentId]?.trim();
    if (!selectedCourseId || !text) return;
    setSubmittingReplyId(parentId);
    try {
      const reply = await api.post<DiscussionPost>(`/courses/${selectedCourseId}/discussions`, {
        content: text,
        parentId,
      });
      setDiscussions((prev) =>
        prev.map((post) => {
          if (post.id === parentId) {
            return {
              ...post,
              replies: [...(post.replies || []), reply],
            };
          }
          return post;
        }),
      );
      setReplyContentMap((prev) => ({ ...prev, [parentId]: '' }));
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to send reply';
      alert(msg);
    } finally {
      setSubmittingReplyId(null);
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
    if (selectedCourseId) {
      if (activeTab === 'assignments') {
        fetchAssignments(selectedCourseId);
      } else if (activeTab === 'exams') {
        fetchExams(selectedCourseId);
      } else if (activeTab === 'attendance') {
        fetchAttendanceSessions(selectedCourseId);
      } else if (activeTab === 'recordings') {
        fetchRecordings(selectedCourseId);
      } else if (activeTab === 'materials') {
        fetchMaterials(selectedCourseId);
      } else if (activeTab === 'announcements') {
        fetchAnnouncements(selectedCourseId);
      } else if (activeTab === 'discussions') {
        fetchDiscussions(selectedCourseId);
      }
    }
  }, [
    selectedCourseId,
    activeTab,
    fetchAssignments,
    fetchExams,
    fetchAttendanceSessions,
    fetchRecordings,
    fetchMaterials,
    fetchAnnouncements,
    fetchDiscussions,
  ]);

  const handleCreateCourse = async (e: React.FormEvent) => {
    e.preventDefault();
    setFeedback(null);
    setFormSubmitting(true);

    try {
      const trimmedAccess = accessCode.trim().toUpperCase() || 'ALPHA-2026';
      await api.post('/courses', {
        title,
        code,
        description,
        accessCode: trimmedAccess,
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

  const handleOpenStartLive = (course: Course) => {
    setLiveModalCourse(course);
    setLiveSessionTitle(`Live Lecture: ${course.code} - ${course.title}`);
    setIsStartLiveModalOpen(true);
  };

  const handleStartLiveSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!liveModalCourse || !liveSessionTitle.trim()) return;
    setStartingLiveSession(true);
    try {
      const newRoom = await api.post<LiveRoom>(`/courses/${liveModalCourse.id}/rooms`, {
        title: liveSessionTitle.trim(),
      });
      setIsStartLiveModalOpen(false);
      router.push(`/classroom/${newRoom.id}`);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to start live session';
      alert(msg);
      setStartingLiveSession(false);
    }
  };

  const handleEndSession = async (courseId: string, roomId: string) => {
    if (!confirm('Are you sure you want to end this live session for all participants?')) return;
    try {
      await api.patch(`/rooms/${roomId}/end`);
      setActiveRooms((prev) => ({ ...prev, [courseId]: null }));
      setFeedback({ type: 'success', text: 'Live session ended successfully.' });
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to end live session';
      alert(msg);
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

  const handleCreateExam = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!selectedCourseId) return;

    setFeedback(null);
    setSubmittingExam(true);

    try {
      await api.post(`/courses/${selectedCourseId}/exams`, {
        title: examTitle.trim(),
        description: examDescription.trim() || undefined,
        durationMinutes: Number(examDuration) || 30,
        passingScore: Number(examPassingScore) || 50,
        totalScore: Number(examTotalScore) || 100,
        isPublished: examIsPublished,
      });

      setFeedback({ type: 'success', text: `Exam "${examTitle}" created successfully!` });
      setIsCreateExamOpen(false);
      setExamTitle('');
      setExamDescription('');
      setExamDuration(30);
      setExamPassingScore(50);
      setExamTotalScore(100);
      await fetchExams(selectedCourseId);
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to create exam';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingExam(false);
    }
  };

  const handleAddQuestion = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!activeExamForQuestions) return;

    const options = [
      { id: 'a', text: optA.trim() },
      { id: 'b', text: optB.trim() },
      { id: 'c', text: optC.trim() },
      { id: 'd', text: optD.trim() },
    ].filter((o) => o.text.length > 0);

    if (options.length < 2) {
      setFeedback({ type: 'error', text: 'Please provide at least 2 options for the question.' });
      return;
    }

    setSubmittingQuestion(true);
    try {
      await api.post(`/exams/${activeExamForQuestions.id}/questions`, {
        text: questionText.trim(),
        type: 'MULTIPLE_CHOICE',
        points: Number(questionPoints) || 1,
        options,
        correctAnswer,
      });

      setFeedback({ type: 'success', text: 'Question added to exam successfully!' });
      setQuestionText('');
      setOptA('');
      setOptB('');
      setOptC('');
      setOptD('');
      setCorrectAnswer('a');
      setQuestionPoints(1);

      if (selectedCourseId) {
        await fetchExams(selectedCourseId);
      }
      // Re-fetch the updated active exam
      if (selectedCourseId) {
        const freshExams = await api.get<Exam[]>(`/courses/${selectedCourseId}/exams`);
        const freshActive = freshExams.find((ex) => ex.id === activeExamForQuestions.id);
        if (freshActive) {
          setActiveExamForQuestions(freshActive);
        }
      }
    } catch (err: unknown) {
      const msg = err instanceof ApiError ? err.message : 'Failed to add question';
      setFeedback({ type: 'error', text: msg });
    } finally {
      setSubmittingQuestion(false);
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

          <div className="flex items-center gap-3">
            <NotificationsPopover />
            <button
              onClick={() => setIsProfileOpen(true)}
              className="flex items-center gap-2.5 p-1 sm:px-2.5 sm:py-1.5 rounded-xl border border-[#262e52] hover:border-purple-500/50 hover:bg-[#1a203a] transition cursor-pointer text-left group"
              title="Manage Profile & Settings"
            >
              <div className="w-8 h-8 rounded-full overflow-hidden bg-purple-900/60 border border-purple-500/40 flex items-center justify-center shrink-0 text-xs font-bold text-purple-200">
                {user.avatarUrl ? (
                  <img
                    src={user.avatarUrl.startsWith('http') ? user.avatarUrl : `http://localhost:4000${user.avatarUrl}`}
                    alt={user.firstName}
                    className="w-full h-full object-cover"
                  />
                ) : (
                  <span>
                    {user.firstName?.[0] || 'I'}
                    {user.lastName?.[0] || ''}
                  </span>
                )}
              </div>
              <div className="text-right hidden sm:block">
                <div className="text-xs font-semibold text-slate-200 group-hover:text-purple-300 transition">
                  {user.firstName} {user.lastName}
                </div>
                <div className="text-[11px] text-slate-400 font-mono">{user.email}</div>
              </div>
            </button>
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
              Instructor Studio &bull; Verified
            </div>
            <h2 className="text-2xl sm:text-3xl font-extrabold text-white">
              Instructor Studio &bull; {user.firstName} {user.lastName}
            </h2>
            <p className="text-slate-300 text-sm mt-1 max-w-xl">
              Manage courses, distribute access codes, create coursework assignments, and build online exams with automated grading.
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
              <CheckSquare className="w-6 h-6" />
            </div>
            <div>
              <div className="text-xs uppercase tracking-wider text-slate-400 font-medium">Exam Engine</div>
              <div className="text-2xl font-bold text-emerald-300 mt-0.5">Phase 7 Auto-Grading</div>
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

            <button
              onClick={() => setActiveTab('exams')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'exams'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <CheckSquare className="w-3.5 h-3.5" />
              Online Exams ({exams.length})
            </button>

            <button
              onClick={() => setActiveTab('attendance')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'attendance'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <UserCheck className="w-3.5 h-3.5" />
              Attendance Reports
            </button>

            <button
              onClick={() => setActiveTab('recordings')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'recordings'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <Video className="w-3.5 h-3.5" />
              Recordings / المحاضرات ({recordings.length})
            </button>

            <button
              onClick={() => setActiveTab('materials')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'materials'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <FolderDown className="w-3.5 h-3.5" />
              Materials / الملازم ({materials.length})
            </button>

            <button
              onClick={() => setActiveTab('announcements')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'announcements'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <Megaphone className="w-3.5 h-3.5" />
              Announcements ({announcements.length})
            </button>

            <button
              onClick={() => setActiveTab('discussions')}
              className={`px-4 py-2 rounded-xl text-xs font-semibold transition cursor-pointer flex items-center gap-2 ${
                activeTab === 'discussions'
                  ? 'bg-purple-600 text-white shadow-md shadow-purple-900/30'
                  : 'text-slate-400 hover:text-white hover:bg-[#191f3a]'
              }`}
            >
              <MessageSquare className="w-3.5 h-3.5" />
              Q&A Discussions ({discussions.length})
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
                    Live Session In Progress
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
              <span>Enter Live Classroom</span>
            </Link>
          </div>
        )}

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

                      {/* Prominent Enrollment Access Code Badge */}
                      <div className="mt-4 p-3 rounded-xl bg-gradient-to-r from-amber-950/40 via-[#161426] to-[#0f1325] border border-amber-500/40 shadow-sm flex items-center justify-between gap-3">
                        <div className="flex items-center gap-2.5 min-w-0">
                          <div className="w-8 h-8 rounded-lg bg-amber-500/20 border border-amber-500/40 flex items-center justify-center shrink-0">
                            <Key className="w-4 h-4 text-amber-400" />
                          </div>
                          <div className="min-w-0">
                            <div className="text-[10px] text-amber-300/90 font-bold uppercase tracking-wider">
                              Enrollment Access Code
                            </div>
                            <span className="font-mono text-xs sm:text-sm font-extrabold text-amber-300 tracking-wide block truncate">
                              {course.accessCode || 'ALPHA-2026'}
                            </span>
                          </div>
                        </div>
                        <button
                          onClick={() => handleCopyCode(course.id, course.accessCode || 'ALPHA-2026')}
                          className="shrink-0 text-xs font-bold px-3 py-1.5 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-200 hover:text-white border border-amber-500/50 transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                          title="Copy Access Code for Students"
                        >
                          {copiedCodeId === course.id ? (
                            <>
                              <Check className="w-3.5 h-3.5 text-emerald-400" />
                              <span className="text-emerald-300">Copied</span>
                            </>
                          ) : (
                            <>
                              <Copy className="w-3.5 h-3.5 text-amber-400" />
                              <span>Copy Code</span>
                            </>
                          )}
                        </button>
                      </div>

                      {/* Live Classroom Controls */}
                      {activeRooms[course.id] ? (
                        <div className="mt-4 p-3 rounded-xl bg-rose-950/40 border border-rose-500/40 flex flex-col gap-2">
                          <div className="flex items-center justify-between">
                            <div className="flex items-center gap-1.5 text-rose-300 text-xs font-bold animate-pulse">
                              <span className="w-2 h-2 rounded-full bg-rose-500" />
                              <span>Live Session Active</span>
                            </div>
                            <span className="text-[10px] text-slate-400 truncate max-w-[120px]">
                              {activeRooms[course.id]?.title}
                            </span>
                          </div>
                          <div className="flex items-center gap-2 mt-1">
                            <Link
                              href={`/classroom/${activeRooms[course.id]!.id}`}
                              className="flex-1 py-1.5 px-3 rounded-lg bg-purple-600 hover:bg-purple-500 text-white font-bold text-xs text-center transition flex items-center justify-center gap-1.5 shadow-md shadow-purple-900/30"
                            >
                              <Radio className="w-3.5 h-3.5 animate-pulse" />
                              Join Class
                            </Link>
                            <button
                              onClick={() => handleEndSession(course.id, activeRooms[course.id]!.id)}
                              className="py-1.5 px-2.5 rounded-lg bg-rose-900/40 hover:bg-rose-900/70 text-rose-200 border border-rose-700/50 text-xs font-semibold transition cursor-pointer flex items-center gap-1"
                              title="End Live Session"
                            >
                              <PhoneOff className="w-3.5 h-3.5" />
                              <span>End</span>
                            </button>
                          </div>
                        </div>
                      ) : (
                        <div className="mt-4">
                          <button
                            onClick={() => handleOpenStartLive(course)}
                            className="w-full py-2 px-3 rounded-xl bg-purple-950/40 hover:bg-purple-900/50 text-purple-200 border border-purple-500/30 text-xs font-semibold transition flex items-center justify-center gap-1.5 cursor-pointer shadow-sm group"
                          >
                            <Radio className="w-3.5 h-3.5 text-purple-400 group-hover:scale-110 transition" />
                            <span>Start Live Class</span>
                          </button>
                        </div>
                      )}
                    </div>

                    <div className="mt-6 pt-4 border-t border-[#1c223c] flex items-center justify-between gap-2">
                      <div className="flex items-center gap-1 text-indigo-300 font-semibold text-xs">
                        <Users className="w-3.5 h-3.5" />
                        <span>{course._count?.enrollments || 0}</span>
                      </div>
                      <div className="flex items-center gap-1.5">
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('assignments');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <FileText className="w-3 h-3" />
                          Assignments
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('exams');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-indigo-600/20 hover:bg-indigo-600/30 text-indigo-300 border border-indigo-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <CheckSquare className="w-3 h-3" />
                          Exams
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('attendance');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-emerald-600/20 hover:bg-emerald-600/30 text-emerald-300 border border-emerald-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <UserCheck className="w-3 h-3" />
                          Attendance
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('recordings');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-pink-600/20 hover:bg-pink-600/30 text-pink-300 border border-pink-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <Video className="w-3 h-3" />
                          Recordings
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('materials');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-amber-600/20 hover:bg-amber-600/30 text-amber-300 border border-amber-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <FolderDown className="w-3 h-3" />
                          Materials
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('announcements');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-purple-600/20 hover:bg-purple-600/30 text-purple-300 border border-purple-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <Megaphone className="w-3 h-3" />
                          Announcements
                        </button>
                        <button
                          onClick={() => {
                            setSelectedCourseId(course.id);
                            setActiveTab('discussions');
                          }}
                          className="text-xs px-2.5 py-1 rounded-lg bg-teal-600/20 hover:bg-teal-600/30 text-teal-300 border border-teal-500/30 font-medium transition flex items-center gap-1 cursor-pointer"
                        >
                          <MessageSquare className="w-3 h-3" />
                          Q&A
                        </button>
                      </div>
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
              </div>
            ) : (
              <div>
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

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {selectedCourseId && (
                      <button
                        onClick={() => handleExportGradesCsv(selectedCourseId)}
                        disabled={exportingGrades}
                        className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-semibold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download CSV Gradebook report"
                      >
                        <FileSpreadsheet className={`w-4 h-4 ${exportingGrades ? 'animate-bounce' : ''}`} />
                        <span>Export Grades (CSV)</span>
                      </button>
                    )}
                    <button
                      onClick={() => setIsCreateAssignmentOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <PlusCircle className="w-4 h-4" />
                      Create Assignment
                    </button>
                  </div>
                </div>

                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FileText className="w-4 h-4 text-purple-400" />
                      Coursework for {selectedCourse?.code || 'Course'} ({assignments.length})
                    </h3>
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

        {/* Tab 3: Online Exams & Automated Grading */}
        {activeTab === 'exams' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <CheckSquare className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
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
                    onClick={() => setIsCreateExamOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-purple-900/30 flex items-center gap-1.5 self-start sm:self-auto cursor-pointer"
                  >
                    <PlusCircle className="w-4 h-4" />
                    Create New Exam
                  </button>
                </div>

                {/* Exams List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <CheckSquare className="w-4 h-4 text-purple-400" />
                      Exams for {selectedCourse?.code || 'Course'} ({exams.length})
                    </h3>
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchExams(selectedCourseId)}
                        disabled={loadingExams}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingExams ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {loadingExams ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course exams...</span>
                    </div>
                  ) : exams.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <CheckSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="font-bold text-white text-sm">No Online Exams Created Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                        Build multiple choice exams with automatic instant grading and score thresholds.
                      </p>
                      <button
                        onClick={() => setIsCreateExamOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <PlusCircle className="w-3.5 h-3.5" />
                        Create First Exam
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {exams.map((exam) => (
                        <div
                          key={exam.id}
                          className="bg-[#12162b] border border-[#21294c] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span
                                className={`text-[10px] font-bold px-2 py-0.5 rounded-full border ${
                                  exam.isPublished
                                    ? 'bg-emerald-950/80 text-emerald-300 border-emerald-800/60'
                                    : 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                }`}
                              >
                                {exam.isPublished ? 'Published' : 'Draft'}
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {exam.durationMinutes} mins
                              </span>
                            </div>

                            <h4 className="font-bold text-white text-base leading-snug">{exam.title}</h4>
                            <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                              {exam.description || 'No detailed instructions provided.'}
                            </p>

                            <div className="mt-3.5 p-2.5 rounded-xl bg-[#0b0e1b] border border-[#1a2038] text-[11px] grid grid-cols-2 gap-2 text-slate-300">
                              <div>
                                <span className="text-slate-500 block">Passing / Total:</span>
                                <span className="font-mono font-bold text-emerald-400">
                                  {exam.passingScore} / {exam.totalScore} pts
                                </span>
                              </div>
                              <div>
                                <span className="text-slate-500 block">Questions / Attempts:</span>
                                <span className="font-mono font-bold text-indigo-300">
                                  {exam._count?.questions || exam.questions?.length || 0} Qs &bull; {exam._count?.attempts || 0}
                                </span>
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#1c223c] grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setActiveExamForQuestions(exam)}
                              className="bg-[#1a203a] hover:bg-[#232c52] text-slate-200 border border-[#2e3966] font-semibold py-1.5 px-2 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <HelpCircle className="w-3.5 h-3.5 text-purple-400" />
                              Questions ({exam.questions?.length || exam._count?.questions || 0})
                            </button>
                            <button
                              onClick={() => fetchResults(exam)}
                              className="bg-purple-600/20 hover:bg-purple-600/35 text-purple-300 border border-purple-500/40 font-semibold py-1.5 px-2 rounded-xl text-xs transition flex items-center justify-center gap-1 cursor-pointer"
                            >
                              <Eye className="w-3.5 h-3.5 text-indigo-400" />
                              Results ({exam._count?.attempts || 0})
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

        {/* Tab 4: Classroom Attendance Reports */}
        {activeTab === 'attendance' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <UserCheck className="w-12 h-12 text-emerald-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
              </div>
            ) : (
              <div>
                {/* Course Selector Bar */}
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
                          {c.code} - {c.title}
                        </option>
                      ))}
                    </select>
                  </div>

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {selectedCourseId && (
                      <button
                        onClick={() => handleExportAttendanceCsv(selectedCourseId)}
                        disabled={exportingAttendance}
                        className="bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-semibold py-2 px-3.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                        title="Download CSV Attendance report"
                      >
                        <FileSpreadsheet className={`w-4 h-4 ${exportingAttendance ? 'animate-bounce' : ''}`} />
                        <span>Export Attendance (CSV)</span>
                      </button>
                    )}
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchAttendanceSessions(selectedCourseId)}
                        disabled={loadingAttendance}
                        className="text-xs px-3 py-2 rounded-xl border border-[#262e52] hover:bg-[#1a203a] text-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingAttendance ? 'animate-spin' : ''}`} />
                        Refresh Sessions
                      </button>
                    )}
                  </div>
                </div>

                {/* Sessions List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <UserCheck className="w-4 h-4 text-emerald-400" />
                      Live Classroom Sessions for {selectedCourse?.code || 'Course'} ({attendanceSessions.length})
                    </h3>
                  </div>

                  {loadingAttendance ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-emerald-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading attendance analytics...</span>
                    </div>
                  ) : attendanceSessions.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <Radio className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                      <p className="font-semibold text-slate-200">No Live Class Sessions Yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto">
                        Launch a live class from the My Courses tab. As students connect to the classroom, their attendance and engagement time will automatically record here.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {attendanceSessions.map((session) => (
                        <div
                          key={session.id}
                          className="bg-[#12162b] border border-[#21294c] hover:border-emerald-500/50 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(session.createdAt).toLocaleDateString()} &bull; {new Date(session.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                              </span>
                              {session.isLive ? (
                                <span className="flex items-center gap-1 text-[10px] font-bold px-2 py-0.5 rounded-full bg-rose-950 text-rose-300 border border-rose-800/60 animate-pulse">
                                  <span className="w-1.5 h-1.5 rounded-full bg-rose-500" />
                                  LIVE NOW
                                </span>
                              ) : (
                                <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-slate-800 text-slate-400 border border-slate-700">
                                  COMPLETED
                                </span>
                              )}
                            </div>

                            <h4 className="font-bold text-white text-base leading-snug">{session.title}</h4>

                            <div className="mt-3.5 p-3 rounded-xl bg-[#0b0e1b] border border-[#1a2038] text-xs flex items-center justify-between">
                              <span className="text-slate-400 flex items-center gap-1.5">
                                <Users className="w-3.5 h-3.5 text-indigo-400" />
                                Attendees Recorded
                              </span>
                              <span className="font-bold font-mono text-emerald-400 text-sm">
                                {session._count?.attendanceRecords || session.attendanceRecords?.length || 0}
                              </span>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#1c223c]">
                            <button
                              onClick={() => setActiveSessionForAttendance(session)}
                              className="w-full bg-emerald-600/20 hover:bg-emerald-600/35 text-emerald-300 border border-emerald-500/40 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer"
                            >
                              <UserCheck className="w-3.5 h-3.5" />
                              View Attendees List ({session._count?.attendanceRecords || session.attendanceRecords?.length || 0})
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

        {/* Tab 5: Session Recordings & Lecture Archive */}
        {activeTab === 'recordings' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <Video className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
              </div>
            ) : (
              <div>
                {/* Course Selector Bar */}
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

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <Film className="w-4 h-4 text-purple-400" />
                    <span>Archived Lectures: {recordings.length}</span>
                  </div>
                </div>

                {/* Recordings List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Video className="w-4 h-4 text-purple-400" />
                      Recorded Sessions / المحاضرات المسجلة ({recordings.length})
                    </h3>
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchRecordings(selectedCourseId)}
                        disabled={loadingRecordings}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingRecordings ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {loadingRecordings ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course recordings...</span>
                    </div>
                  ) : recordings.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <Video className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="font-bold text-white text-sm">No Lecture Recordings Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Start a live classroom session and click the &quot;Record&quot; button to capture and archive lectures for your students.
                      </p>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {recordings.map((rec) => (
                        <div
                          key={rec.id}
                          className="bg-[#12162b] border border-[#21294c] hover:border-purple-500/40 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
                        >
                          <div>
                            <div className="flex items-center justify-between mb-2.5">
                              <span className="text-[10px] font-bold px-2 py-0.5 rounded-full bg-purple-950/80 text-purple-300 border border-purple-800/60 flex items-center gap-1">
                                <Film className="w-3 h-3 text-purple-400" />
                                Archived Lecture
                              </span>
                              <span className="text-[11px] font-semibold text-slate-400 flex items-center gap-1">
                                <Clock className="w-3 h-3 text-slate-500" />
                                {formatRecordingDuration(rec.durationSeconds)}
                              </span>
                            </div>

                            <h4 className="font-bold text-white text-base leading-snug">{rec.title}</h4>
                            <div className="text-xs text-slate-400 mt-2 space-y-1">
                              <div className="flex items-center gap-1.5">
                                <Calendar className="w-3.5 h-3.5 text-slate-500" />
                                <span>{new Date(rec.recordedAt).toLocaleString()}</span>
                              </div>
                              <div className="flex items-center justify-between text-[11px] text-slate-500 pt-1">
                                <span>Size: {formatFileSize(rec.sizeBytes)}</span>
                                {rec.room && (
                                  <span className="truncate max-w-[150px]">Room: {rec.room.title}</span>
                                )}
                              </div>
                            </div>
                          </div>

                          <div className="mt-4 pt-3 border-t border-[#1c223c] grid grid-cols-2 gap-2">
                            <button
                              onClick={() => setActiveRecordingForPlayback(rec)}
                              className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer shadow-md shadow-purple-900/30"
                            >
                              <Play className="w-3.5 h-3.5 fill-current" />
                              Watch / تشغيل
                            </button>
                            <button
                              onClick={() => handleDeleteRecording(rec.id)}
                              disabled={deletingRecordingId === rec.id}
                              className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 font-semibold py-2 px-3 rounded-xl text-xs transition flex items-center justify-center gap-1.5 cursor-pointer disabled:opacity-50"
                            >
                              <Trash2 className="w-3.5 h-3.5" />
                              Delete
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

        {/* Tab: Course Materials */}
        {activeTab === 'materials' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <FolderDown className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
              </div>
            ) : (
              <div>
                {/* Course Selector & Actions Bar */}
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

                  <div className="flex items-center gap-2 self-start sm:self-auto">
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchMaterials(selectedCourseId)}
                        disabled={loadingMaterials}
                        className="text-xs px-2.5 py-2 rounded-xl border border-[#262e52] hover:bg-[#1a203a] text-slate-200 transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3.5 h-3.5 ${loadingMaterials ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                    <button
                      onClick={() => setIsUploadMaterialOpen(true)}
                      className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
                    >
                      <UploadCloud className="w-4 h-4" />
                      Upload Material / رفع ملزمة
                    </button>
                  </div>
                </div>

                {/* Materials Grid */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <FolderDown className="w-4 h-4 text-amber-400" />
                      Materials for {selectedCourse?.code || 'Course'} ({materials.length})
                    </h3>
                  </div>

                  {loadingMaterials ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course materials...</span>
                    </div>
                  ) : materials.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <FolderDown className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <p className="font-semibold text-slate-200 text-sm">No Materials Uploaded Yet</p>
                      <p className="text-xs text-slate-500 mt-1 max-w-sm mx-auto mb-4">
                        Upload lecture slides, syllabus, homework templates, or code archives for your students.
                      </p>
                      <button
                        onClick={() => setIsUploadMaterialOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <UploadCloud className="w-3.5 h-3.5" />
                        Upload First Material
                      </button>
                    </div>
                  ) : (
                    <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-5">
                      {materials.map((mat) => {
                        const backendBase = process.env.NEXT_PUBLIC_API_URL
                          ? process.env.NEXT_PUBLIC_API_URL.replace('/api/v1', '')
                          : 'http://localhost:4000';
                        const downloadUrl = mat.fileUrl.startsWith('http')
                          ? mat.fileUrl
                          : `${backendBase}${mat.fileUrl}`;

                        return (
                          <div
                            key={mat.id}
                            className="bg-[#12162b] border border-[#21294c] hover:border-amber-500/40 rounded-2xl p-5 shadow-lg transition flex flex-col justify-between"
                          >
                            <div>
                              <div className="flex items-center justify-between mb-3">
                                <span
                                  className={`text-[10px] font-bold px-2.5 py-0.5 rounded-full border ${
                                    mat.fileType === 'PDF'
                                      ? 'bg-rose-950/80 text-rose-300 border-rose-800/60'
                                      : mat.fileType === 'ZIP'
                                      ? 'bg-amber-950/80 text-amber-300 border-amber-800/60'
                                      : mat.fileType === 'DOC'
                                      ? 'bg-blue-950/80 text-blue-300 border-blue-800/60'
                                      : 'bg-purple-950/80 text-purple-300 border-purple-800/60'
                                  }`}
                                >
                                  {mat.fileType}
                                </span>
                                <span className="text-xs text-slate-400 font-mono">
                                  {formatFileSize(mat.sizeBytes)}
                                </span>
                              </div>

                              <h4 className="font-bold text-white text-base leading-snug">
                                {mat.title}
                              </h4>
                              {mat.description && (
                                <p className="text-xs text-slate-400 mt-2 line-clamp-2">
                                  {mat.description}
                                </p>
                              )}
                            </div>

                            <div className="mt-5 pt-4 border-t border-[#1c223c] flex items-center justify-between gap-2">
                              <span className="text-[10px] text-slate-500 flex items-center gap-1">
                                <Calendar className="w-3 h-3" />
                                {new Date(mat.createdAt).toLocaleDateString()}
                              </span>
                              <div className="flex items-center gap-2">
                                <a
                                  href={downloadUrl}
                                  target="_blank"
                                  rel="noopener noreferrer"
                                  download={mat.fileName}
                                  className="bg-amber-600/20 hover:bg-amber-600/35 text-amber-300 border border-amber-500/40 font-semibold py-1.5 px-2.5 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer"
                                  title="Download material"
                                >
                                  <Download className="w-3.5 h-3.5" />
                                  <span>Download</span>
                                </a>
                                <button
                                  onClick={() => handleDeleteMaterial(mat.id)}
                                  disabled={deletingMaterialId === mat.id}
                                  className="bg-rose-950/40 hover:bg-rose-900/50 text-rose-300 border border-rose-800/50 font-semibold py-1.5 px-2.5 rounded-xl text-xs transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                                  title="Delete material"
                                >
                                  <Trash2 className="w-3.5 h-3.5" />
                                </button>
                              </div>
                            </div>
                          </div>
                        );
                      })}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 6: Course Announcements */}
        {activeTab === 'announcements' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <Megaphone className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
              </div>
            ) : (
              <div>
                {/* Course Selector & Create Button */}
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
                    onClick={() => setIsCreateAnnouncementOpen(true)}
                    className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-4 rounded-xl text-xs transition shadow-md shadow-purple-900/30 flex items-center gap-1.5 cursor-pointer"
                  >
                    <Megaphone className="w-4 h-4" />
                    Publish Announcement
                  </button>
                </div>

                {/* Announcements List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <Megaphone className="w-4 h-4 text-purple-400" />
                      Course Announcements ({announcements.length})
                    </h3>
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchAnnouncements(selectedCourseId)}
                        disabled={loadingAnnouncements}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingAnnouncements ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {loadingAnnouncements ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course announcements...</span>
                    </div>
                  ) : announcements.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <Megaphone className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="font-bold text-white text-sm">No Announcements Published Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto mb-4">
                        Publish reminders, schedule updates, and syllabus notices to notify all enrolled students.
                      </p>
                      <button
                        onClick={() => setIsCreateAnnouncementOpen(true)}
                        className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-3.5 rounded-xl text-xs transition inline-flex items-center gap-1.5 cursor-pointer"
                      >
                        <Megaphone className="w-3.5 h-3.5" />
                        Publish First Announcement
                      </button>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {announcements.map((ann) => (
                        <div
                          key={ann.id}
                          className={`rounded-2xl p-5 border transition ${
                            ann.isPinned
                              ? 'bg-gradient-to-r from-purple-950/60 via-[#14122d] to-[#0f142b] border-purple-500/50 shadow-lg shadow-purple-950/30'
                              : 'bg-[#12162b] border-[#21294c]'
                          }`}
                        >
                          <div className="flex items-center justify-between gap-2 mb-2">
                            <div className="flex items-center gap-2">
                              {ann.isPinned && (
                                <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-amber-500/20 text-amber-300 border border-amber-500/40 flex items-center gap-1">
                                  <Pin className="w-3 h-3 text-amber-400 rotate-45" />
                                  PINNED
                                </span>
                              )}
                              <h4 className="font-bold text-white text-base">{ann.title}</h4>
                            </div>
                            <span className="text-[11px] text-slate-400 flex items-center gap-1">
                              <Clock className="w-3 h-3 text-slate-500" />
                              {new Date(ann.createdAt).toLocaleDateString()}
                            </span>
                          </div>
                          <p className="text-xs text-slate-300 whitespace-pre-line leading-relaxed mt-2">
                            {ann.content}
                          </p>
                        </div>
                      ))}
                    </div>
                  )}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Tab 7: Q&A Discussions */}
        {activeTab === 'discussions' && (
          <div className="space-y-6">
            {courses.length === 0 ? (
              <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                <MessageSquare className="w-12 h-12 text-purple-400/40 mx-auto mb-3" />
                <h4 className="text-base font-bold text-white">Create a Course First</h4>
              </div>
            ) : (
              <div>
                {/* Course Selector Bar */}
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

                  <div className="text-xs text-slate-400 flex items-center gap-2">
                    <MessageSquare className="w-4 h-4 text-purple-400" />
                    <span>Total Question Threads: {discussions.length}</span>
                  </div>
                </div>

                {/* Discussions List */}
                <div className="mt-6">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-base font-bold text-white flex items-center gap-2">
                      <MessageSquare className="w-4 h-4 text-purple-400" />
                      Student Q&A & Discussion Threads ({discussions.length})
                    </h3>
                    {selectedCourseId && (
                      <button
                        onClick={() => fetchDiscussions(selectedCourseId)}
                        disabled={loadingDiscussions}
                        className="text-xs px-2.5 py-1 rounded-lg border border-[#232948] hover:bg-[#1a203a] text-slate-300 transition flex items-center gap-1 cursor-pointer disabled:opacity-50"
                      >
                        <RefreshCw className={`w-3 h-3 ${loadingDiscussions ? 'animate-spin' : ''}`} />
                        Refresh
                      </button>
                    )}
                  </div>

                  {loadingDiscussions ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center text-slate-400">
                      <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                      <span className="text-xs">Loading course discussions...</span>
                    </div>
                  ) : discussions.length === 0 ? (
                    <div className="bg-[#12162b] border border-[#21294c] rounded-2xl p-12 text-center">
                      <MessageSquare className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                      <h4 className="font-bold text-white text-sm">No Student Questions Yet</h4>
                      <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                        Questions posted by enrolled students on the course discussion board will appear here for you to answer.
                      </p>
                    </div>
                  ) : (
                    <div className="space-y-4">
                      {discussions.map((post) => (
                        <div
                          key={post.id}
                          className="rounded-2xl p-5 bg-[#12162b] border border-[#21294c] space-y-3"
                        >
                          <div className="flex items-center justify-between gap-2">
                            <div className="flex items-center gap-2">
                              <span className="w-6 h-6 rounded-full bg-purple-600/30 text-purple-300 flex items-center justify-center font-bold text-xs">
                                {post.author?.firstName?.[0] || 'U'}
                              </span>
                              <span className="font-semibold text-white text-xs">
                                {post.author?.firstName} {post.author?.lastName}
                              </span>
                              <span
                                className={`px-1.5 py-0.2 rounded text-[10px] font-bold ${
                                  post.author?.role === 'INSTRUCTOR'
                                    ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                    : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                }`}
                              >
                                {post.author?.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'}
                              </span>
                            </div>
                            <span className="text-[11px] text-slate-500">
                              {new Date(post.createdAt).toLocaleDateString()} &bull;{' '}
                              {new Date(post.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                            </span>
                          </div>

                          <p className="text-xs text-slate-200 leading-relaxed pl-8 whitespace-pre-line">
                            {post.content}
                          </p>

                          {/* Nested Replies */}
                          {post.replies && post.replies.length > 0 && (
                            <div className="ml-8 space-y-2 pt-2 border-t border-[#1a203a]">
                              {post.replies.map((reply) => (
                                <div
                                  key={reply.id}
                                  className="p-3 rounded-xl bg-[#0b0e1b] border border-[#1b2242] flex items-start gap-2.5"
                                >
                                  <CornerDownRight className="w-4 h-4 text-purple-400 shrink-0 mt-0.5" />
                                  <div className="flex-1 min-w-0">
                                    <div className="flex items-center gap-2">
                                      <span className="font-semibold text-white text-[11px]">
                                        {reply.author?.firstName} {reply.author?.lastName}
                                      </span>
                                      <span
                                        className={`px-1.5 py-0.2 rounded text-[9px] font-bold ${
                                          reply.author?.role === 'INSTRUCTOR'
                                            ? 'bg-purple-950 text-purple-300 border border-purple-800/60'
                                            : 'bg-indigo-950 text-indigo-300 border border-indigo-800/60'
                                        }`}
                                      >
                                        {reply.author?.role === 'INSTRUCTOR' ? 'Instructor' : 'Student'}
                                      </span>
                                      <span className="text-[10px] text-slate-500">
                                        {new Date(reply.createdAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}
                                      </span>
                                    </div>
                                    <p className="text-xs text-slate-300 mt-1 leading-relaxed">
                                      {reply.content}
                                    </p>
                                  </div>
                                </div>
                              ))}
                            </div>
                          )}

                          {/* Instructor Reply Form */}
                          <div className="ml-8 pt-2 flex items-center gap-2">
                            <input
                              type="text"
                              placeholder="Type an instructor answer or reply..."
                              value={replyContentMap[post.id] || ''}
                              onChange={(e) =>
                                setReplyContentMap((prev) => ({
                                  ...prev,
                                  [post.id]: e.target.value,
                                }))
                              }
                              onKeyDown={(e) => {
                                if (e.key === 'Enter') {
                                  handleCreateInstructorReply(post.id);
                                }
                              }}
                              className="flex-1 bg-[#0b0e1b] border border-[#1f2648] focus:border-purple-500 rounded-xl py-1.5 px-3 text-xs text-slate-200 placeholder-slate-500 focus:outline-none transition"
                            />
                            <button
                              onClick={() => handleCreateInstructorReply(post.id)}
                              disabled={
                                submittingReplyId === post.id || !replyContentMap[post.id]?.trim()
                              }
                              className="px-3.5 py-1.5 rounded-xl bg-purple-600 hover:bg-purple-500 text-white border border-purple-500/40 text-xs font-semibold transition cursor-pointer disabled:opacity-50"
                            >
                              Post Answer
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
                  <label className="text-xs font-semibold text-amber-300 uppercase tracking-wider flex items-center gap-1.5">
                    <Key className="w-3.5 h-3.5 text-amber-400" />
                    Enrollment Access Code
                  </label>
                  <span className="text-[11px] text-slate-400">Default: ALPHA-2026</span>
                </div>
                <input
                  type="text"
                  placeholder="e.g. ALPHA-2026"
                  value={accessCode}
                  onChange={(e) => setAccessCode(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] focus:border-amber-500 rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 uppercase font-mono focus:outline-none transition"
                />
                <p className="text-[11px] text-slate-400 mt-1">
                  Students will enter this code to enroll in your course. Leave empty to use default &apos;ALPHA-2026&apos;.
                </p>
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
                  placeholder="Explain requirements, deliverables, GitHub repository link requirements..."
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

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Student Submissions ({submissions.length})
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

                          <div className="p-3 rounded-lg bg-[#12162b] border border-[#1d2342] text-xs">
                            <span className="text-slate-400 font-semibold uppercase tracking-wider text-[10px] block mb-1">
                              Submitted Solution:
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
                        </div>

                        <div className="w-full md:w-72 bg-[#12162b] border border-[#232b50] rounded-xl p-3 space-y-2.5 shrink-0">
                          <div>
                            <label className="text-[11px] font-semibold text-slate-300 uppercase mb-1 block">
                              Score (Max {activeAssignmentForSubmissions.maxScore})
                            </label>
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

      {/* Create Exam Modal */}
      {isCreateExamOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/75 backdrop-blur-sm animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#273059] rounded-2xl w-full max-w-md p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-5">
              <h3 className="font-bold text-white text-lg flex items-center gap-2">
                <CheckSquare className="w-5 h-5 text-purple-400" />
                Create Exam for {selectedCourse?.code}
              </h3>
              <button
                onClick={() => setIsCreateExamOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateExam} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Exam Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Examination: Data Structures"
                  value={examTitle}
                  onChange={(e) => setExamTitle(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Instructions & Guidelines
                </label>
                <textarea
                  rows={2}
                  placeholder="Rules, allowed materials, and coverage..."
                  value={examDescription}
                  onChange={(e) => setExamDescription(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="grid grid-cols-3 gap-3">
                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Duration (mins)
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={examDuration}
                    onChange={(e) => setExamDuration(Number(e.target.value))}
                    className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Pass Score
                  </label>
                  <input
                    type="number"
                    min={0}
                    required
                    value={examPassingScore}
                    onChange={(e) => setExamPassingScore(Number(e.target.value))}
                    className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>

                <div>
                  <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                    Total Score
                  </label>
                  <input
                    type="number"
                    min={1}
                    required
                    value={examTotalScore}
                    onChange={(e) => setExamTotalScore(Number(e.target.value))}
                    className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-sm text-slate-100 focus:outline-none focus:border-purple-500 transition"
                  />
                </div>
              </div>

              <div className="flex items-center gap-2 pt-2">
                <input
                  type="checkbox"
                  id="examPublishCheck"
                  checked={examIsPublished}
                  onChange={(e) => setExamIsPublished(e.target.checked)}
                  className="w-4 h-4 rounded border-[#252c4e] text-purple-600 focus:ring-purple-500 bg-[#0c0e1b]"
                />
                <label htmlFor="examPublishCheck" className="text-xs text-slate-300 select-none">
                  Publish Exam immediately (visible to enrolled students)
                </label>
              </div>

              <div className="pt-4 flex items-center justify-end gap-3 border-t border-[#21294c]">
                <button
                  type="button"
                  onClick={() => setIsCreateExamOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingExam}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 cursor-pointer"
                >
                  {submittingExam ? 'Creating...' : 'Create Exam'}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Question Builder Modal */}
      {activeExamForQuestions && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-[#21294c] flex items-center justify-between">
              <div>
                <div className="flex items-center gap-2">
                  <span className="font-mono text-xs font-bold px-2 py-0.5 rounded bg-purple-950 text-purple-300 border border-purple-800/60">
                    {activeExamForQuestions.questions?.length || 0} Questions
                  </span>
                  <h3 className="font-bold text-white text-lg">
                    Question Bank &bull; {activeExamForQuestions.title}
                  </h3>
                </div>
                <p className="text-xs text-slate-400 mt-1">
                  Add multiple-choice questions with automated scoring keys.
                </p>
              </div>
              <button
                onClick={() => setActiveExamForQuestions(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-6">
              {/* Add Question Form */}
              <div className="bg-[#0b0e1b] border border-[#252c4e] rounded-xl p-5">
                <h4 className="font-bold text-white text-sm flex items-center gap-2 mb-3">
                  <PlusCircle className="w-4 h-4 text-purple-400" />
                  Add New Multiple-Choice Question
                </h4>

                <form onSubmit={handleAddQuestion} className="space-y-4">
                  <div>
                    <label className="block text-xs font-semibold text-slate-300 uppercase mb-1">
                      Question Prompt
                    </label>
                    <textarea
                      rows={2}
                      required
                      placeholder="e.g. Which data structure operates on a First-In, First-Out (FIFO) principle?"
                      value={questionText}
                      onChange={(e) => setQuestionText(e.target.value)}
                      className="w-full bg-[#12162b] border border-[#283256] rounded-xl p-2.5 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500"
                    />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>Option A</span>
                        <input
                          type="radio"
                          name="correctRadio"
                          checked={correctAnswer === 'a'}
                          onChange={() => setCorrectAnswer('a')}
                          className="text-purple-600 focus:ring-purple-500"
                          title="Mark as correct answer"
                        />
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Stack"
                        value={optA}
                        onChange={(e) => setOptA(e.target.value)}
                        className="w-full bg-[#12162b] border border-[#283256] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>Option B</span>
                        <input
                          type="radio"
                          name="correctRadio"
                          checked={correctAnswer === 'b'}
                          onChange={() => setCorrectAnswer('b')}
                          className="text-purple-600 focus:ring-purple-500"
                          title="Mark as correct answer"
                        />
                      </label>
                      <input
                        type="text"
                        required
                        placeholder="e.g. Queue"
                        value={optB}
                        onChange={(e) => setOptB(e.target.value)}
                        className="w-full bg-[#12162b] border border-[#283256] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>Option C (Optional)</span>
                        <input
                          type="radio"
                          name="correctRadio"
                          checked={correctAnswer === 'c'}
                          onChange={() => setCorrectAnswer('c')}
                          className="text-purple-600 focus:ring-purple-500"
                          title="Mark as correct answer"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Tree"
                        value={optC}
                        onChange={(e) => setOptC(e.target.value)}
                        className="w-full bg-[#12162b] border border-[#283256] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>

                    <div>
                      <label className="flex items-center justify-between text-xs font-semibold text-slate-300 mb-1">
                        <span>Option D (Optional)</span>
                        <input
                          type="radio"
                          name="correctRadio"
                          checked={correctAnswer === 'd'}
                          onChange={() => setCorrectAnswer('d')}
                          className="text-purple-600 focus:ring-purple-500"
                          title="Mark as correct answer"
                        />
                      </label>
                      <input
                        type="text"
                        placeholder="e.g. Hash Table"
                        value={optD}
                        onChange={(e) => setOptD(e.target.value)}
                        className="w-full bg-[#12162b] border border-[#283256] rounded-lg py-1.5 px-2.5 text-xs text-slate-100 focus:outline-none focus:border-purple-500"
                      />
                    </div>
                  </div>

                  <div className="flex items-center justify-between pt-2">
                    <div className="flex items-center gap-2">
                      <label className="text-xs text-slate-400">Points:</label>
                      <input
                        type="number"
                        min={0.5}
                        step={0.5}
                        value={questionPoints}
                        onChange={(e) => setQuestionPoints(Number(e.target.value))}
                        className="w-20 bg-[#12162b] border border-[#283256] rounded-lg py-1 px-2 text-xs text-slate-100"
                      />
                      <span className="text-[11px] text-amber-400 font-medium">
                        (Selected Correct Answer: Option {correctAnswer.toUpperCase()})
                      </span>
                    </div>

                    <button
                      type="submit"
                      disabled={submittingQuestion}
                      className="bg-purple-600 hover:bg-purple-500 text-white font-semibold py-1.5 px-4 rounded-xl text-xs transition shadow cursor-pointer disabled:opacity-50"
                    >
                      {submittingQuestion ? 'Adding...' : 'Add Question'}
                    </button>
                  </div>
                </form>
              </div>

              {/* Questions List */}
              <div className="space-y-3">
                <h4 className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                  Existing Questions in this Exam ({activeExamForQuestions.questions?.length || 0})
                </h4>

                {!activeExamForQuestions.questions || activeExamForQuestions.questions.length === 0 ? (
                  <p className="text-xs text-slate-500 italic">No questions added yet. Use the form above.</p>
                ) : (
                  <div className="space-y-3">
                    {activeExamForQuestions.questions.map((q, idx) => (
                      <div
                        key={q.id || idx}
                        className="bg-[#0b0e1b] border border-[#21294c] rounded-xl p-4 text-xs space-y-2"
                      >
                        <div className="flex items-center justify-between">
                          <span className="font-bold text-white">
                            Q{idx + 1}. {q.text}
                          </span>
                          <span className="font-mono text-purple-400 font-semibold">
                            {q.points} pt(s)
                          </span>
                        </div>

                        <div className="grid grid-cols-2 gap-2 pt-1">
                          {q.options.map((opt) => (
                            <div
                              key={opt.id}
                              className={`p-2 rounded-lg border flex items-center justify-between ${
                                q.correctAnswer === opt.id
                                  ? 'bg-emerald-950/60 border-emerald-700/70 text-emerald-200'
                                  : 'bg-[#12162b] border-[#1d2442] text-slate-300'
                              }`}
                            >
                              <span>
                                <strong className="uppercase font-mono mr-1.5">{opt.id}.</strong> {opt.text}
                              </span>
                              {q.correctAnswer === opt.id && (
                                <span className="text-[10px] uppercase font-bold text-emerald-400 bg-emerald-900/60 px-1.5 py-0.5 rounded">
                                  Correct Key
                                </span>
                              )}
                            </div>
                          ))}
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Exam Results Modal */}
      {activeExamForResults && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl relative">
            <div className="p-6 pb-4 border-b border-[#21294c] flex items-center justify-between">
              <div>
                <h3 className="font-bold text-white text-lg">
                  Exam Results &bull; {activeExamForResults.title}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  Passing Threshold: {activeExamForResults.passingScore} / {activeExamForResults.totalScore} pts
                </p>
              </div>
              <button
                onClick={() => setActiveExamForResults(null)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-6 overflow-y-auto flex-1 space-y-4">
              <div className="text-xs font-semibold text-slate-300 uppercase tracking-wider">
                Student Attempts ({examResults.length})
              </div>

              {loadingExamResults ? (
                <div className="py-12 text-center text-slate-400">
                  <div className="w-6 h-6 border-2 border-purple-500 border-t-transparent rounded-full animate-spin mx-auto mb-2" />
                  <span className="text-xs">Loading exam attempts...</span>
                </div>
              ) : examResults.length === 0 ? (
                <div className="bg-[#0c0e1b] border border-[#202848] rounded-xl p-8 text-center text-slate-400">
                  <Award className="w-8 h-8 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Student Attempts Yet</p>
                </div>
              ) : (
                <div className="space-y-3">
                  {examResults.map((attempt) => (
                    <div
                      key={attempt.id}
                      className="bg-[#0b0e1b] border border-[#21294c] rounded-xl p-4 flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">
                          {attempt.student?.firstName} {attempt.student?.lastName}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {attempt.student?.email}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-1">
                          Submitted on {attempt.submittedAt ? new Date(attempt.submittedAt).toLocaleString() : 'In Progress'}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-base font-extrabold text-white">
                          {attempt.score ?? 0} / {activeExamForResults.totalScore} pts
                        </div>
                        <span
                          className={`inline-block px-2.5 py-0.5 rounded-full font-bold text-[10px] border ${
                            attempt.isPassed
                              ? 'bg-emerald-950 text-emerald-300 border-emerald-800/60'
                              : 'bg-rose-950 text-rose-300 border-rose-800/60'
                          }`}
                        >
                          {attempt.isPassed ? 'PASSED' : 'FAILED'}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>
          </div>
        </div>
      )}
      {/* Start Live Class Modal */}
      {isStartLiveModalOpen && liveModalCourse && (
        <div className="fixed inset-0 z-50 bg-black/80 backdrop-blur-sm flex items-center justify-center p-4">
          <div className="bg-[#12162b] border border-[#262e52] rounded-2xl max-w-lg w-full p-6 shadow-2xl relative">
            <button
              onClick={() => setIsStartLiveModalOpen(false)}
              className="absolute top-5 right-5 text-slate-400 hover:text-white transition cursor-pointer"
            >
              <X className="w-5 h-5" />
            </button>

            <div className="flex items-center gap-3 mb-5">
              <div className="w-10 h-10 rounded-xl bg-purple-600/20 border border-purple-500/40 text-purple-400 flex items-center justify-center">
                <Radio className="w-5 h-5" />
              </div>
              <div>
                <h3 className="text-lg font-bold text-white">Start Live Classroom</h3>
                <p className="text-xs text-slate-400">
                  {liveModalCourse.code} • {liveModalCourse.title}
                </p>
              </div>
            </div>

            <form onSubmit={handleStartLiveSubmit} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 mb-1.5">
                  Session Title *
                </label>
                <input
                  type="text"
                  required
                  value={liveSessionTitle}
                  onChange={(e) => setLiveSessionTitle(e.target.value)}
                  placeholder="e.g., Live Lecture: WebRTC Deep Dive"
                  className="w-full bg-[#0b0e1b] border border-[#262e52] rounded-xl px-4 py-2.5 text-sm text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="p-3 rounded-xl bg-[#0b0e1b] border border-[#202747] text-xs text-slate-400 space-y-1">
                <div className="font-semibold text-slate-300 flex items-center gap-1.5">
                  <Sparkles className="w-3.5 h-3.5 text-purple-400" />
                  LiveKit WebRTC Classroom
                </div>
                <p>
                  Enrolled students will see an active live banner and can join immediately with audio, video, and screen sharing.
                </p>
              </div>

              <div className="pt-2 flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsStartLiveModalOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white hover:bg-[#181f3d] transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={startingLiveSession || !liveSessionTitle.trim()}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold px-5 py-2 rounded-xl text-xs transition shadow-lg shadow-purple-900/40 flex items-center gap-2 cursor-pointer disabled:opacity-50"
                >
                  {startingLiveSession ? (
                    <>
                      <div className="w-3.5 h-3.5 border-2 border-white border-t-transparent rounded-full animate-spin" />
                      <span>Starting...</span>
                    </>
                  ) : (
                    <>
                      <Radio className="w-3.5 h-3.5" />
                      <span>Launch Live Class</span>
                    </>
                  )}
                </button>
              </div>
            </form>
          </div>
        </div>
      )}
      {/* Attendance Detail Modal */}
      {activeSessionForAttendance && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-sm">
          <div className="bg-[#12162b] border border-[#273059] rounded-2xl w-full max-w-2xl p-6 shadow-2xl relative max-h-[90vh] flex flex-col">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c]">
              <div className="flex items-center gap-3">
                <div className="w-10 h-10 rounded-xl bg-emerald-600/20 border border-emerald-500/40 text-emerald-400 flex items-center justify-center">
                  <UserCheck className="w-5 h-5" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Session Attendance Report</h3>
                  <p className="text-xs text-slate-400">
                    {activeSessionForAttendance.title} &bull; {new Date(activeSessionForAttendance.createdAt).toLocaleDateString()}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveSessionForAttendance(null)}
                className="text-slate-400 hover:text-white p-1 rounded-lg hover:bg-[#1a203a] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="py-4 overflow-y-auto flex-1 space-y-3">
              {(!activeSessionForAttendance.attendanceRecords || activeSessionForAttendance.attendanceRecords.length === 0) ? (
                <div className="py-12 text-center text-slate-400">
                  <UserCheck className="w-10 h-10 text-slate-600 mx-auto mb-2" />
                  <p className="text-sm font-semibold text-slate-300">No Student Attendees Recorded</p>
                  <p className="text-xs text-slate-500 mt-1">Students will automatically appear here once they connect to this session.</p>
                </div>
              ) : (
                <div className="space-y-2.5">
                  {activeSessionForAttendance.attendanceRecords.map((att) => (
                    <div
                      key={att.id}
                      className="p-3.5 rounded-xl bg-[#0b0e1b] border border-[#202848] flex items-center justify-between text-xs"
                    >
                      <div>
                        <div className="font-bold text-white text-sm">
                          {att.student?.firstName} {att.student?.lastName}
                        </div>
                        <div className="text-slate-400 font-mono text-[11px]">
                          {att.student?.email}
                        </div>
                        <div className="text-slate-500 text-[10px] mt-1 flex items-center gap-2">
                          <span>Joined: {new Date(att.joinedAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          {att.leftAt && (
                            <span>&bull; Left: {new Date(att.leftAt).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' })}</span>
                          )}
                        </div>
                      </div>

                      <div className="text-right space-y-1">
                        <div className="text-sm font-bold font-mono text-emerald-400 flex items-center justify-end gap-1">
                          <Timer className="w-3.5 h-3.5 text-slate-400" />
                          <span>{att.durationMinutes} min</span>
                        </div>
                        <span className="inline-block px-2 py-0.5 rounded-full font-bold text-[10px] bg-emerald-950 text-emerald-300 border border-emerald-800/60">
                          {att.status}
                        </span>
                      </div>
                    </div>
                  ))}
                </div>
              )}
            </div>

            <div className="pt-4 border-t border-[#21294c] flex justify-end">
              <button
                onClick={() => setActiveSessionForAttendance(null)}
                className="px-4 py-2 rounded-xl text-xs font-semibold bg-[#1a203a] hover:bg-[#232c52] text-slate-200 transition cursor-pointer"
              >
                Close Report
              </button>
            </div>
          </div>
        </div>
      )}

      {/* Video Player Modal */}
      {activeRecordingForPlayback && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/85 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-4xl max-h-[90vh] flex flex-col shadow-2xl overflow-hidden">
            <div className="p-4 px-6 border-b border-[#21294c] flex items-center justify-between bg-[#0e1224]">
              <div className="flex items-center gap-2.5">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Video className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base leading-tight">
                    {activeRecordingForPlayback.title}
                  </h3>
                  <p className="text-[11px] text-slate-400">
                    Recorded {new Date(activeRecordingForPlayback.recordedAt).toLocaleString()} &bull;{' '}
                    {formatRecordingDuration(activeRecordingForPlayback.durationSeconds)} &bull;{' '}
                    {formatFileSize(activeRecordingForPlayback.sizeBytes)}
                  </p>
                </div>
              </div>
              <button
                onClick={() => setActiveRecordingForPlayback(null)}
                className="p-1.5 rounded-lg text-slate-400 hover:text-white hover:bg-[#1a203a] transition cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <div className="p-4 bg-black flex items-center justify-center relative overflow-hidden">
              <VideoWatermark />
              <video
                controls
                autoPlay
                className="w-full max-h-[60vh] rounded-lg shadow-lg relative z-10"
                src={getRecordingStreamUrl(activeRecordingForPlayback)}
              >
                Your browser does not support video playback.
              </video>
            </div>

            <div className="p-4 px-6 border-t border-[#21294c] bg-[#0e1224] flex items-center justify-between">
              <div className="text-xs text-slate-400 flex items-center gap-3">
                <span>
                  File: <code className="text-purple-300 font-mono">{activeRecordingForPlayback.fileName}</code>
                </span>
              </div>
              <div className="flex items-center gap-3">
                <a
                  href={getRecordingStreamUrl(activeRecordingForPlayback)}
                  download={activeRecordingForPlayback.fileName}
                  className="px-3.5 py-1.5 rounded-xl text-xs font-semibold bg-[#1a203a] hover:bg-[#252f5c] text-slate-200 border border-[#2b3664] transition flex items-center gap-1.5"
                >
                  <Download className="w-3.5 h-3.5" />
                  Download
                </a>
                <button
                  type="button"
                  onClick={() => setActiveRecordingForPlayback(null)}
                  className="px-4 py-1.5 rounded-xl text-xs font-semibold bg-purple-600 hover:bg-purple-500 text-white transition cursor-pointer"
                >
                  Close
                </button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* Create Announcement Modal */}
      {isCreateAnnouncementOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-purple-600/20 border border-purple-500/30 flex items-center justify-center text-purple-400">
                  <Megaphone className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Publish Course Announcement</h3>
                  <p className="text-[11px] text-slate-400">Notifies all enrolled students automatically</p>
                </div>
              </div>
              <button
                onClick={() => setIsCreateAnnouncementOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleCreateAnnouncement} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Announcement Title
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Midterm Exam Schedule Update"
                  value={announcementTitle}
                  onChange={(e) => setAnnouncementTitle(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Announcement Content / Message
                </label>
                <textarea
                  rows={4}
                  required
                  placeholder="Write announcement details for students..."
                  value={announcementContent}
                  onChange={(e) => setAnnouncementContent(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-purple-500 transition"
                />
              </div>

              <div className="flex items-center gap-2">
                <input
                  type="checkbox"
                  id="pinAnnouncement"
                  checked={announcementIsPinned}
                  onChange={(e) => setAnnouncementIsPinned(e.target.checked)}
                  className="w-4 h-4 text-purple-600 focus:ring-purple-500 bg-[#0c0e1b] border-[#252c4e] rounded"
                />
                <label htmlFor="pinAnnouncement" className="text-xs text-slate-300 cursor-pointer flex items-center gap-1">
                  <Pin className="w-3.5 h-3.5 text-amber-400 rotate-45" />
                  Pin to top of course announcements board
                </label>
              </div>

              <div className="pt-4 border-t border-[#21294c] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsCreateAnnouncementOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingAnnouncement}
                  className="bg-gradient-to-r from-purple-600 to-indigo-600 hover:from-purple-500 hover:to-indigo-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-purple-900/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <Send className="w-3.5 h-3.5" />
                  <span>{submittingAnnouncement ? 'Publishing...' : 'Publish & Dispatch Alerts'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Modal: Upload Course Material */}
      {isUploadMaterialOpen && (
        <div className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/80 backdrop-blur-md animate-in fade-in duration-150">
          <div className="bg-[#12162b] border border-[#2a345e] rounded-2xl w-full max-w-lg p-6 shadow-2xl relative">
            <div className="flex items-center justify-between pb-4 border-b border-[#21294c] mb-4">
              <div className="flex items-center gap-2">
                <div className="w-8 h-8 rounded-lg bg-amber-600/20 border border-amber-500/30 flex items-center justify-center text-amber-400">
                  <UploadCloud className="w-4 h-4" />
                </div>
                <div>
                  <h3 className="font-bold text-white text-base">Upload Course Material</h3>
                  <p className="text-[11px] text-slate-400">
                    Upload syllabus, lecture slides, documents, or code archives
                  </p>
                </div>
              </div>
              <button
                type="button"
                onClick={() => setIsUploadMaterialOpen(false)}
                className="text-slate-400 hover:text-white transition p-1 rounded-lg hover:bg-[#1a203a] cursor-pointer"
              >
                <X className="w-5 h-5" />
              </button>
            </div>

            <form onSubmit={handleUploadMaterial} className="space-y-4">
              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Target Course
                </label>
                <select
                  value={selectedCourseId || ''}
                  onChange={(e) => setSelectedCourseId(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-xs text-slate-100 focus:outline-none focus:border-amber-500 transition"
                >
                  {courses.map((c) => (
                    <option key={c.id} value={c.id}>
                      {c.code} — {c.title}
                    </option>
                  ))}
                </select>
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Material Title / عنوان المرفق
                </label>
                <input
                  type="text"
                  required
                  placeholder="e.g. Week 1 Lecture Slides & Code"
                  value={materialTitle}
                  onChange={(e) => setMaterialTitle(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Description / ملاحظات (Optional)
                </label>
                <textarea
                  rows={3}
                  placeholder="Additional context or instructions regarding this material..."
                  value={materialDescription}
                  onChange={(e) => setMaterialDescription(e.target.value)}
                  className="w-full bg-[#0c0e1b] border border-[#252c4e] rounded-xl py-2 px-3 text-xs text-slate-100 placeholder-slate-500 focus:outline-none focus:border-amber-500 transition"
                />
              </div>

              <div>
                <label className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
                  Attach File (PDF, ZIP, DOC, PPT, up to 50MB)
                </label>
                <input
                  type="file"
                  required
                  onChange={(e) => setMaterialFile(e.target.files?.[0] || null)}
                  className="w-full text-xs text-slate-400 file:mr-3 file:py-2 file:px-4 file:rounded-xl file:border-0 file:text-xs file:font-semibold file:bg-amber-600/20 file:text-amber-300 hover:file:bg-amber-600/30 file:cursor-pointer cursor-pointer border border-[#252c4e] rounded-xl bg-[#0c0e1b] p-1.5"
                />
              </div>

              <div className="pt-4 border-t border-[#21294c] flex items-center justify-end gap-3">
                <button
                  type="button"
                  onClick={() => setIsUploadMaterialOpen(false)}
                  className="px-4 py-2 rounded-xl text-xs font-semibold text-slate-400 hover:text-white transition cursor-pointer"
                >
                  Cancel
                </button>
                <button
                  type="submit"
                  disabled={submittingMaterial || !materialFile}
                  className="bg-gradient-to-r from-amber-600 to-orange-600 hover:from-amber-500 hover:to-orange-500 text-white font-semibold py-2 px-5 rounded-xl text-xs transition shadow-lg shadow-amber-900/30 disabled:opacity-50 flex items-center gap-2 cursor-pointer"
                >
                  <UploadCloud className="w-3.5 h-3.5" />
                  <span>{submittingMaterial ? 'Uploading...' : 'Upload & Save'}</span>
                </button>
              </div>
            </form>
          </div>
        </div>
      )}

      {/* Account Profile & Settings Modal */}
      <ProfileModal
        isOpen={isProfileOpen}
        onClose={() => setIsProfileOpen(false)}
      />
    </div>
  );
}
