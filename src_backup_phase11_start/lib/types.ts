export type TeamMemberId = 'camera' | 'grading' | 'sound' | 'edit';

export interface TeamMember {
  id: string; // Now can be email or dynamic ID
  name: string;
  email?: string; // New: Link to Auth
  avatarUrl?: string; // New: Link to Auth
  maxPoints?: number;
  color: string;
}

// Task Categories
export type TaskCategory = 'camera' | 'grading' | 'sound' | 'edit' | 'other';

export const CATEGORY_LABELS: Record<TaskCategory, string> = {
  camera: '撮影',
  grading: 'カラコレ',
  sound: '整音',
  edit: '編集',
  other: 'その他',
};

export type TaskPriority = 'high' | 'mid' | 'low';

export interface Task {
  id: string;
  memberId: string; // Use email as ID for auth users
  content: string;
  weight: number; // 1-5
  category: TaskCategory;
  workWeek: string; // ISO Date YYYY-MM-DD of Monday
  notes?: string;
  priority?: TaskPriority; // high/mid/low
  repeatWeekly?: boolean; // auto-copy to next week
  isDone: boolean;
  createdAt: number;
}
// MEMBERS constant will be deprecated/dynamic, but keeping for color reference if needed
export const MEMBERS: TeamMember[] = [
  { id: 'camera', name: 'Camera', color: '#3b82f6' }, // Blue
  { id: 'grading', name: 'Grading', color: '#a855f7' }, // Purple
  { id: 'sound', name: 'Sound', color: '#22c55e' }, // Green
  { id: 'edit', name: 'Edit', color: '#f59e0b' }, // Amber
];
