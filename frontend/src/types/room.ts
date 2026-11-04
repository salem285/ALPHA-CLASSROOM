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
