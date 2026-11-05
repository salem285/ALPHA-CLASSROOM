"use client";

import React, { useEffect, useState, useRef, use } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useAuth } from '@/context/auth-context';
import { api, ApiError } from '@/lib/api';
import { LiveRoom, LiveKitTokenResponse } from '@/types/room';
import {
  LiveKitRoom,
  VideoConference,
} from '@livekit/components-react';
import '@livekit/components-styles';
import {
  Radio,
  LogOut,
  Sparkles,
  PhoneOff,
  AlertCircle,
  RefreshCw,
  BookOpen,
  Shield,
  GraduationCap,
  CircleDot,
  Square,
  UploadCloud,
  CheckCircle2,
} from 'lucide-react';

interface PageProps {
  params: Promise<{
    roomId: string;
  }>;
}

export default function ClassroomPage({ params }: PageProps) {
  const unwrappedParams = use(params);
  const roomId = unwrappedParams.roomId;

  const router = useRouter();
  const { user, loading: authLoading } = useAuth();

  const [mounted, setMounted] = useState(false);
  const [roomData, setRoomData] = useState<LiveKitTokenResponse | null>(null);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [endingSession, setEndingSession] = useState(false);

  // Recording State & Refs
  const [isRecording, setIsRecording] = useState(false);
  const [recordingTime, setRecordingTime] = useState(0);
  const [uploadingRecording, setUploadingRecording] = useState(false);
  const [recordingToast, setRecordingToast] = useState<{ type: 'success' | 'info' | 'error'; message: string } | null>(null);

  const mediaRecorderRef = useRef<MediaRecorder | null>(null);
  const recordedChunksRef = useRef<Blob[]>([]);
  const streamRef = useRef<MediaStream | null>(null);
  const timerRef = useRef<NodeJS.Timeout | null>(null);
  const durationRef = useRef<number>(0);

  const showToast = (message: string, type: 'success' | 'info' | 'error' = 'info') => {
    setRecordingToast({ message, type });
    setTimeout(() => {
      setRecordingToast(null);
    }, 5000);
  };

  const formatDuration = (sec: number) => {
    const mins = Math.floor(sec / 60);
    const remainingSecs = sec % 60;
    return `${mins.toString().padStart(2, '0')}:${remainingSecs.toString().padStart(2, '0')}`;
  };

  const uploadRecordingData = async (blob: Blob, durationSec: number) => {
    if (!roomId || !roomData) return;
    setUploadingRecording(true);
    showToast('Uploading & archiving lecture recording...', 'info');
    try {
      const formData = new FormData();
      const filename = `recording-${roomId}-${Date.now()}.webm`;
      formData.append('file', blob, filename);
      formData.append('title', `${roomData.room.title} (Recorded ${new Date().toLocaleDateString()})`);
      formData.append('durationSeconds', durationSec.toString());

      await api.upload(`/rooms/${roomId}/recordings`, formData);
      showToast('Session recording archived to course library successfully!', 'success');
    } catch (err: any) {
      showToast(err.message || 'Failed to upload session recording', 'error');
    } finally {
      setUploadingRecording(false);
    }
  };

  const startRecording = async () => {
    try {
      let stream: MediaStream;
      if (navigator.mediaDevices && navigator.mediaDevices.getDisplayMedia) {
        stream = await navigator.mediaDevices.getDisplayMedia({
          video: true,
          audio: true,
        });
      } else {
        stream = await navigator.mediaDevices.getUserMedia({
          video: true,
          audio: true,
        });
      }

      const options = MediaRecorder.isTypeSupported('video/webm;codecs=vp9,opus')
        ? { mimeType: 'video/webm;codecs=vp9,opus' }
        : MediaRecorder.isTypeSupported('video/webm;codecs=vp8,opus')
        ? { mimeType: 'video/webm;codecs=vp8,opus' }
        : { mimeType: 'video/webm' };

      const recorder = new MediaRecorder(stream, options);
      recordedChunksRef.current = [];
      durationRef.current = 0;

      recorder.ondataavailable = (event) => {
        if (event.data && event.data.size > 0) {
          recordedChunksRef.current.push(event.data);
        }
      };

      recorder.onstop = async () => {
        const finalChunks = recordedChunksRef.current;
        const totalDuration = durationRef.current;
        if (finalChunks.length > 0) {
          const blob = new Blob(finalChunks, { type: 'video/webm' });
          if (blob.size > 0) {
            await uploadRecordingData(blob, totalDuration);
          }
        }
      };

      stream.getVideoTracks().forEach((track) => {
        track.onended = () => {
          stopRecording();
        };
      });

      recorder.start(1000);
      mediaRecorderRef.current = recorder;
      streamRef.current = stream;
      setIsRecording(true);
      setRecordingTime(0);

      timerRef.current = setInterval(() => {
        setRecordingTime((prev) => {
          const next = prev + 1;
          durationRef.current = next;
          return next;
        });
      }, 1000);

      showToast('Recording started. Screen and audio are being captured.', 'info');
    } catch (err: any) {
      if (err.name !== 'NotAllowedError') {
        showToast('Could not start screen recording: ' + err.message, 'error');
      }
    }
  };

  const stopRecording = () => {
    if (timerRef.current) {
      clearInterval(timerRef.current);
      timerRef.current = null;
    }
    if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
      mediaRecorderRef.current.stop();
    }
    if (streamRef.current) {
      streamRef.current.getTracks().forEach((t) => t.stop());
      streamRef.current = null;
    }
    setIsRecording(false);
  };

  // Clean up recording on unmount
  useEffect(() => {
    return () => {
      if (timerRef.current) clearInterval(timerRef.current);
      if (mediaRecorderRef.current && mediaRecorderRef.current.state !== 'inactive') {
        mediaRecorderRef.current.stop();
      }
      if (streamRef.current) {
        streamRef.current.getTracks().forEach((t) => t.stop());
      }
    };
  }, []);

  useEffect(() => {
    setMounted(true);
  }, []);

  const fetchToken = async () => {
    if (!roomId) return;
    setLoading(true);
    setError(null);
    try {
      const data = await api.get<LiveKitTokenResponse>(`/rooms/${roomId}/token`);
      setRoomData(data);
    } catch (err: any) {
      if (err instanceof ApiError) {
        setError(err.message);
      } else {
        setError('Failed to connect to the live classroom. Please try again.');
      }
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (!authLoading && user && roomId && mounted) {
      fetchToken();
    } else if (!authLoading && !user && mounted) {
      router.push('/login');
    }
  }, [authLoading, user, roomId, mounted]);

  // Automated Attendance Heartbeat effect for students
  useEffect(() => {
    if (!roomData || !roomId || user?.role !== 'STUDENT') return;

    // Send initial ping to confirm presence
    api.post(`/rooms/${roomId}/heartbeat`).catch(() => {});

    // Periodic heartbeat every 60 seconds
    const interval = setInterval(() => {
      api.post(`/rooms/${roomId}/heartbeat`).catch(() => {});
    }, 60000);

    return () => {
      clearInterval(interval);
      api.post(`/rooms/${roomId}/leave`).catch(() => {});
    };
  }, [roomData, roomId, user]);

  const handleEndSession = async () => {
    if (!confirm('Are you sure you want to end this live session for all participants?')) {
      return;
    }
    if (isRecording) {
      stopRecording();
    }
    setEndingSession(true);
    try {
      await api.patch(`/rooms/${roomId}/end`);
      router.push('/instructor');
    } catch (err: any) {
      alert(err.message || 'Failed to end session');
      setEndingSession(false);
    }
  };

  const handleLeave = async () => {
    if (user?.role === 'STUDENT') {
      try {
        await api.post(`/rooms/${roomId}/leave`);
      } catch {}
      router.push('/student');
    } else {
      router.push('/instructor');
    }
  };

  if (!mounted || authLoading || loading) {
    return (
      <div className="min-h-screen bg-[#090b14] text-white flex flex-col items-center justify-center p-6">
        <div className="w-16 h-16 rounded-2xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-xl shadow-purple-600/30 animate-pulse mb-6 flex items-center justify-center">
          <div className="w-full h-full bg-[#090b14] rounded-2xl flex items-center justify-center">
            <Radio className="w-8 h-8 text-purple-400 animate-spin" />
          </div>
        </div>
        <h2 className="text-xl font-bold tracking-tight">Connecting to Live Classroom...</h2>
        <p className="text-sm text-slate-400 mt-2">Authenticating your live video token and media channels</p>
      </div>
    );
  }

  if (error || !roomData) {
    return (
      <div className="min-h-screen bg-[#090b14] text-white flex flex-col items-center justify-center p-6">
        <div className="max-w-md w-full bg-[#12162b] border border-[#21294c] rounded-2xl p-8 text-center shadow-2xl">
          <div className="w-14 h-14 rounded-2xl bg-rose-500/10 border border-rose-500/20 text-rose-400 flex items-center justify-center mx-auto mb-4">
            <AlertCircle className="w-7 h-7" />
          </div>
          <h3 className="text-lg font-bold text-white mb-2">Classroom Access Error</h3>
          <p className="text-sm text-slate-400 mb-6 leading-relaxed">
            {error || 'Unable to join the classroom session.'}
          </p>
          <div className="flex flex-col gap-3">
            <button
              onClick={fetchToken}
              className="w-full py-2.5 px-4 rounded-xl bg-purple-600 hover:bg-purple-500 text-white font-semibold text-xs transition flex items-center justify-center gap-2 cursor-pointer shadow-lg shadow-purple-900/30"
            >
              <RefreshCw className="w-4 h-4" />
              Try Again
            </button>
            <button
              onClick={handleLeave}
              className="w-full py-2.5 px-4 rounded-xl bg-[#181f3d] hover:bg-[#222a52] text-slate-300 hover:text-white font-semibold text-xs transition border border-[#2a3462] cursor-pointer"
            >
              Back to Dashboard
            </button>
          </div>
        </div>
      </div>
    );
  }

  const { token, wsUrl, room } = roomData;
  const isInstructorOrAdmin =
    user?.role === 'SUPER_ADMIN' ||
    user?.role === 'ADMIN' ||
    room?.course?.instructorId === user?.id;

  return (
    <div className="min-h-screen bg-[#090b14] text-white flex flex-col">
      {/* Top Bar */}
      <header className="h-16 bg-[#0f1325] border-b border-[#1f274a] px-4 sm:px-6 flex items-center justify-between z-20 shrink-0">
        <div className="flex items-center gap-3">
          <Link href={user?.role === 'STUDENT' ? '/student' : '/instructor'} className="flex items-center gap-2 group">
            <div className="w-9 h-9 rounded-xl bg-gradient-to-tr from-purple-600 to-indigo-500 p-0.5 shadow-md shadow-purple-600/30 group-hover:scale-105 transition">
              <div className="w-full h-full bg-[#0f1325] rounded-[10px] flex items-center justify-center">
                <Sparkles className="w-4 h-4 text-purple-400" />
              </div>
            </div>
            <span className="font-extrabold text-sm tracking-wider text-transparent bg-clip-text bg-gradient-to-r from-purple-400 via-indigo-300 to-white hidden sm:inline">
              ALPHA<span className="text-purple-400">CLASS</span>
            </span>
          </Link>

          <div className="h-5 w-px bg-[#262f55] hidden sm:block" />

          <div className="flex items-center gap-2.5">
            <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/80 border border-rose-500/40 text-rose-300 text-xs font-bold animate-pulse">
              <span className="w-2 h-2 rounded-full bg-rose-500" />
              <span>LIVE</span>
            </div>

            {isRecording && (
              <div className="flex items-center gap-1.5 px-2.5 py-1 rounded-full bg-rose-950/90 border border-rose-500/70 text-rose-300 text-xs font-bold animate-pulse shadow-md shadow-rose-950/50">
                <span className="w-2 h-2 rounded-full bg-rose-500 animate-ping" />
                <span>REC {formatDuration(recordingTime)}</span>
              </div>
            )}

            <div>
              <div className="text-xs font-bold text-white flex items-center gap-1.5">
                {room.course?.code && (
                  <span className="text-purple-400 font-mono text-[11px] px-1.5 py-0.5 rounded bg-purple-950/60 border border-purple-800/40">
                    {room.course.code}
                  </span>
                )}
                <span className="truncate max-w-[200px] sm:max-w-xs">{room.title}</span>
              </div>
            </div>
          </div>
        </div>

        <div className="flex items-center gap-2 sm:gap-3">
          <div className="hidden md:flex items-center gap-2 px-3 py-1.5 rounded-xl bg-[#141a33] border border-[#232c52] text-xs">
            {isInstructorOrAdmin ? (
              <span className="flex items-center gap-1 text-purple-300 font-semibold">
                <Shield className="w-3.5 h-3.5 text-purple-400" />
                Instructor (Host)
              </span>
            ) : (
              <span className="flex items-center gap-1 text-indigo-300 font-semibold">
                <GraduationCap className="w-3.5 h-3.5 text-indigo-400" />
                Student
              </span>
            )}
            <span className="text-slate-400">•</span>
            <span className="text-slate-200 font-medium">
              {user?.firstName} {user?.lastName}
            </span>
          </div>

          {isInstructorOrAdmin && (
            <>
              {isRecording ? (
                <button
                  onClick={stopRecording}
                  disabled={uploadingRecording}
                  className="bg-rose-600 hover:bg-rose-500 text-white font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-lg shadow-rose-900/40"
                  title="Stop recording and upload lecture"
                >
                  <Square className="w-3.5 h-3.5 fill-current" />
                  <span>Stop REC</span>
                </button>
              ) : (
                <button
                  onClick={startRecording}
                  disabled={uploadingRecording}
                  className="bg-purple-600/30 hover:bg-purple-600 text-purple-300 hover:text-white border border-purple-500/40 font-bold px-3 py-1.5 rounded-xl text-xs transition flex items-center gap-1.5 cursor-pointer shadow-sm"
                  title="Record screen and audio of this live lecture"
                >
                  <CircleDot className="w-3.5 h-3.5 text-rose-400" />
                  <span className="hidden sm:inline">Record</span>
                </button>
              )}

              <button
                onClick={handleEndSession}
                disabled={endingSession}
                className="bg-rose-600/20 hover:bg-rose-600 text-rose-300 hover:text-white border border-rose-500/40 px-3 py-1.5 rounded-xl text-xs font-bold transition flex items-center gap-1.5 cursor-pointer disabled:opacity-50"
                title="End the live session for all students"
              >
                <PhoneOff className="w-3.5 h-3.5" />
                <span className="hidden sm:inline">{endingSession ? 'Ending...' : 'End Live Session'}</span>
              </button>
            </>
          )}

          <button
            onClick={handleLeave}
            className="bg-[#181f3d] hover:bg-[#252f5c] text-slate-200 hover:text-white border border-[#2a3462] px-3 py-1.5 rounded-xl text-xs font-semibold transition flex items-center gap-1.5 cursor-pointer shadow-sm"
          >
            <LogOut className="w-3.5 h-3.5 text-slate-400" />
            <span>Leave</span>
          </button>
        </div>
      </header>

      {/* Recording Notification Toast */}
      {recordingToast && (
        <div className="fixed top-20 right-6 z-50 animate-in fade-in slide-in-from-top-4 duration-200 pointer-events-none">
          <div
            className={`flex items-center gap-2.5 px-4 py-2.5 rounded-xl text-xs font-semibold shadow-2xl border backdrop-blur-md ${
              recordingToast.type === 'success'
                ? 'bg-emerald-950/95 text-emerald-200 border-emerald-700/80 shadow-emerald-950/50'
                : recordingToast.type === 'error'
                ? 'bg-rose-950/95 text-rose-200 border-rose-700/80 shadow-rose-950/50'
                : 'bg-indigo-950/95 text-indigo-200 border-indigo-700/80 shadow-indigo-950/50'
            }`}
          >
            {uploadingRecording ? (
              <UploadCloud className="w-4 h-4 text-purple-400 animate-bounce" />
            ) : recordingToast.type === 'success' ? (
              <CheckCircle2 className="w-4 h-4 text-emerald-400" />
            ) : (
              <CircleDot className="w-4 h-4 text-indigo-400" />
            )}
            <span>{recordingToast.message}</span>
          </div>
        </div>
      )}

      {/* LiveKit Video Conference Container */}
      <main className="flex-1 w-full bg-[#090b14] relative overflow-hidden">
        <LiveKitRoom
          video={false}
          audio={false}
          token={token}
          serverUrl={wsUrl}
          data-lk-theme="default"
          style={{ height: 'calc(100vh - 64px)', width: '100%' }}
          onDisconnected={handleLeave}
        >
          <VideoConference />
        </LiveKitRoom>
      </main>
    </div>
  );
}
