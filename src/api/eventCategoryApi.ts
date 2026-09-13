import api from "./axiosConfig";
import type { EventCategoryRequest, EventCategoryResponse } from "../types";

export const getEventCategories = async (): Promise<EventCategoryResponse[]> => {
    const response = await api.get("/event-categories");
    return response.data;
};

export const createEventCategory = async (data: EventCategoryRequest): Promise<EventCategoryResponse> => {
    const response = await api.post("/event-categories", data);
    return response.data;
};

export const updateEventCategory = async (categoryId: number, data: EventCategoryRequest): Promise<EventCategoryResponse> => {
    const response = await api.put(`/event-categories/${categoryId}`, data);
    return response.data;
};

export const deleteEventCategory = async (categoryId: number): Promise<void> => {
    await api.delete(`/event-categories/${categoryId}`);
};
