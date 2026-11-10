import { LiveRoom } from './room';

export interface Recording {
  id: string;
  roomId?: string | null;
  courseId: string;
  title: string;
  fileName: string;
  fileUrl: string;
  durationSeconds: number;
  sizeBytes: number;
  recordedAt: string;
  driveFileId?: string | null;
  previewUrl?: string | null;
  room?: Partial<LiveRoom> | null;
}
