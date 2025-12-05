/**
 * Events API Service
 * 
 * This module provides CRUD operations for the events table
 * using explicit HTTP requests with the native fetch() API.
 * 
 * API Endpoints:
 * - GET    /events              - Fetch all events
 * - POST   /events              - Create a new event
 * - PATCH  /events?id=eq.{id}   - Update an event
 * - DELETE /events?id=eq.{id}   - Delete an event
 */

import { API_BASE_URL, getHeaders, handleResponse, handleError } from './config';

// Event type definition
export interface Event {
  id: string;
  name: string;
  description: string | null;
  event_date: string;
  created_by: string | null;
  created_at: string | null;
}

// Event input type for create operations
export interface EventInput {
  name: string;
  description?: string;
  event_date: string;
  created_by?: string;
}

// Event input type for update operations
export interface EventUpdateInput {
  name: string;
  description?: string;
  event_date: string;
}

/**
 * GET - Fetch all events from the database
 * 
 * HTTP Method: GET
 * Endpoint: /events?select=*&order=event_date.desc
 */
export const getEvents = async (): Promise<Event[]> => {
  try {
    // Using fetch() to make GET request to the REST API
    const response = await fetch(
      `${API_BASE_URL}/events?select=*&order=event_date.desc`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    return handleResponse<Event[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST - Create a new event
 * 
 * HTTP Method: POST
 * Endpoint: /events
 * Body: EventInput object
 */
export const createEvent = async (event: EventInput): Promise<Event[]> => {
  try {
    // Using fetch() to make POST request to create a new event
    const response = await fetch(
      `${API_BASE_URL}/events`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(event),
      }
    );

    return handleResponse<Event[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PATCH - Update an existing event
 * 
 * HTTP Method: PATCH
 * Endpoint: /events?id=eq.{id}
 * Body: EventUpdateInput object
 */
export const updateEvent = async (id: string, event: EventUpdateInput): Promise<Event[]> => {
  try {
    // Using fetch() to make PATCH request to update the event
    const response = await fetch(
      `${API_BASE_URL}/events?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(event),
      }
    );

    return handleResponse<Event[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * DELETE - Delete an event
 * 
 * HTTP Method: DELETE
 * Endpoint: /events?id=eq.{id}
 */
export const deleteEvent = async (id: string): Promise<void> => {
  try {
    // Using fetch() to make DELETE request to remove the event
    const response = await fetch(
      `${API_BASE_URL}/events?id=eq.${id}`,
      {
        method: 'DELETE',
        headers: getHeaders(),
      }
    );

    if (!response.ok) {
      const errorData = await response.json().catch(() => ({}));
      throw new Error(errorData.message || `HTTP Error: ${response.status}`);
    }
  } catch (error) {
    handleError(error);
  }
};
