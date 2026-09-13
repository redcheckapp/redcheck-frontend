import api from "./axiosConfig";
import type { RecurringCalendarEventRequest, RecurringCalendarEventResponse } from "../types";

// Only "create" is used today (CalendarEventModal's "repeats" option) — no
// UI yet manages an existing routine (pause/edit/delete the template
// itself, mirroring RoutinesView.tsx for tasks). See the frontend CLAUDE.md
// note on calendar events for that known follow-up.
export const createRecurringCalendarEvent = async (data: RecurringCalendarEventRequest): Promise<RecurringCalendarEventResponse> => {
    const response = await api.post("/recurring-calendar-events", data);
    return response.data;
};
