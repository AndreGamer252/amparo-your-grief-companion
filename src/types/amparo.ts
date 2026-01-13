export type LossType = 'mae' | 'pai' | 'filho' | 'filha' | 'esposo' | 'esposa' | 'amigo' | 'amiga' | 'avo' | 'outro';

export interface UserProfile {
  name: string;
  lossType: LossType;
  lovedOneName?: string;
  onboardingComplete: boolean;
}

export type MoodLevel = 1 | 2 | 3 | 4 | 5;

export interface DailyCheckIn {
  date: string;
  mood: MoodLevel;
  note?: string;
}

export interface ChatMessage {
  id: string;
  content: string;
  sender: 'user' | 'amparo';
  timestamp: Date;
}

export interface Memory {
  id: string;
  title: string;
  content: string;
  date: string;
  type: 'carta' | 'lembranca';
  imageUrl?: string;
  createdAt: Date;
}

export interface JourneyModule {
  id: string;
  title: string;
  description: string;
  duration: string;
  type: 'read' | 'listen' | 'exercise';
  completed: boolean;
  content?: string;
}
