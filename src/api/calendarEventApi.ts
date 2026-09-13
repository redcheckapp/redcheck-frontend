import api from "./axiosConfig";
import type { CalendarEventRequest, CalendarEventResponse } from "../types";

// Every event (pending or past) whose interval overlaps [from, to] (both
// "YYYY-MM-DD") — same "one call per visible calendar view" contract as
// taskApi.ts's getTasksForDateRange.
export const getCalendarEventsForDateRange = async (from: string, to: string): Promise<CalendarEventResponse[]> => {
    const response = await api.get(`/calendar-events?from=${from}&to=${to}`);
    return response.data;
};

export const createCalendarEvent = async (data: CalendarEventRequest): Promise<CalendarEventResponse> => {
    const response = await api.post("/calendar-events", data);
    return response.data;
};

export const updateCalendarEvent = async (eventId: number, data: CalendarEventRequest): Promise<CalendarEventResponse> => {
    const response = await api.put(`/calendar-events/${eventId}`, data);
    return response.data;
};

export const deleteCalendarEvent = async (eventId: number): Promise<void> => {
    await api.delete(`/calendar-events/${eventId}`);
};
