export interface LoginForm {
    email: string;
    password: string;
}

export interface AuthResponse {
    token: string;
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
    archived: boolean;
}

export interface TaskResponse {
    id: number;
    title: string;
    description: string | null;
    assignedDate: string;
    deadline: string | null;
    completedDate: string | null;
    completed: boolean;
    overdue: boolean;
    subjectId: boolean;
}

export interface TaskRequest {
    title: string;
    description: string | null;
    deadline: string | null;
}

export interface SubjectWithTasks extends SubjectResponse {
    tasks: TaskResponse[];
}

export interface UserResponse {
    username: string;
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
    active: boolean,
    createdDate: string,
    latestGeneratedDate: string,
    subjectId: number
}