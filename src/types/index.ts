export interface LoginForm {
    emailOrUsername: string;
    password: string;
}

export interface AuthResponse {
    token: string;
}

export interface GoogleAuthRequest {
    idToken: string;
}

export interface RegisterForm {
    username: string;
    email: string;
    password: string;
}

export interface SubjectResponse {
    id: number;
    name: string;
    description: string | null;
    deleted: boolean;
    archived: boolean;
}

export type TaskPriority = "LOW" | "MEDIUM" | "HIGH";

export interface TaskResponse {
    id: number;
    title: string;
    description: string | null;
    assignedDate: string;
    deadline: string | null;
    completedDate: string | null;
    completed: boolean;
    deleted: boolean;
    overdue: boolean;
    subjectId: number;
    priority: TaskPriority;
}

export interface TaskRequest {
    title: string;
    description: string | null;
    deadline: string | null;
    // Optional: omitting it means "default to MEDIUM" on create, or "keep
    // the task's current priority" on update — see redcheck-backend's
    // TaskService (createTask/updateTask).
    priority?: TaskPriority;
}

export interface SubjectWithTasks extends SubjectResponse {
    tasks: TaskResponse[];
}

export interface UserResponse {
    username: string;
    email: string;
    hasPassword: boolean;
}

export interface SubjectRequest {
    name: string;
    description: string | null;
}

export interface ProgressRecord {
    date: string; // "YYYY-MM-DD"
    totalTasks: number;
    completedTasks: number;
    completionRate: number;
}

export interface RecurringTaskResponse {
    id: number,
    title: string,
    description: string | null,
    frequency: string,
    time: string | null, // "HH:mm:ss", applied to every generated task's deadline
    endDate: string | null, // "YYYY-MM-DD", routine auto-deactivates once reached
    active: boolean,
    createdDate: string,
    latestGeneratedDate: string,
    nextOccurrence: string | null, // server-computed preview, ISO datetime
    currentStreak: number,
    longestStreak: number,
    completionRate: number, // 0-1
    totalGenerated: number,
    totalCompleted: number,
    subjectId: number
}

// We define the exact structure that the backend will send us
export interface SubjectStat {
    id: number | string;
    name: string;
    percent: number;
    colorClass: string;       // Ex: "bg-red-500"
    hoverTextClass: string;   // Ex: "group-hover:text-red-600"
}

export interface SmartCheckPlanItem {
    id: number;
    ordenDefinido: number;
    razonPrioridad: string;
}

export interface SmartCheckAiData {
    nivelRiesgo: string;
    mensajeApoyo: string;
    planDeHoy: SmartCheckPlanItem[];
}

export type FeedbackCategory = "BUG" | "SUGGESTION" | "PRAISE" | "OTHER";

export interface FeedbackRequest {
    category: FeedbackCategory;
    message: string;
}

export interface FeedbackResponse {
    id: number;
    category: FeedbackCategory;
    message: string;
    createdDate: string;
}