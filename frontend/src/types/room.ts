export interface LiveRoom {
  id: string;
  courseId: string;
  title: string;
  roomName: string;
  isLive: boolean;
  createdAt: string;
  endedAt?: string | null;
  course?: {
    id: string;
    title: string;
    code: string;
    instructorId?: string;
  };
}

export interface LiveKitTokenResponse {
  token: string;
  room: LiveRoom;
  wsUrl: string;
}

export interface AttendanceRecord {
  id: string;
  roomId: string;
  studentId: string;
  joinedAt: string;
  leftAt?: string | null;
  durationMinutes: number;
  status: string;
  student?: {
    id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  room?: {
    id: string;
    title: string;
    createdAt: string;
    endedAt?: string | null;
  };
}

export interface RoomAttendanceReport {
  room: LiveRoom;
  totalAttendees: number;
  records: AttendanceRecord[];
}

export interface StudentCourseAttendance {
  courseId: string;
  courseTitle: string;
  courseCode: string;
  totalSessions: number;
  attendedSessions: number;
  attendancePercentage: number;
  records: AttendanceRecord[];
}

export interface LiveRoomWithAttendance extends LiveRoom {
  _count?: {
    attendanceRecords: number;
  };
  attendanceRecords?: AttendanceRecord[];
}
