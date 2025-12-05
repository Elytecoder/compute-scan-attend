/**
 * Members API Service
 * 
 * This module provides CRUD operations for the members table
 * using explicit HTTP requests with the native fetch() API.
 * 
 * API Endpoints:
 * - GET    /members         - Fetch all members
 * - POST   /members         - Create a new member
 * - PATCH  /members?id=eq.{id} - Update a member
 * - DELETE /members?id=eq.{id} - Delete a member
 */

import { API_BASE_URL, getHeaders, handleResponse, handleError } from './config';

// Member type definition
export interface Member {
  id: string;
  school_id: string;
  name: string;
  program: 'BSCS' | 'BSIT' | 'BSIS' | 'BTVTED-CSS';
  block: string;
  year_level: number;
  created_at: string | null;
}

// Member input type for create/update operations
export interface MemberInput {
  school_id: string;
  name: string;
  program: 'BSCS' | 'BSIT' | 'BSIS' | 'BTVTED-CSS';
  block: string;
  year_level: number;
}

/**
 * GET - Fetch all members from the database
 * 
 * HTTP Method: GET
 * Endpoint: /members?select=*&order=name.asc
 */
export const getMembers = async (): Promise<Member[]> => {
  try {
    // Using fetch() to make GET request to the REST API
    const response = await fetch(
      `${API_BASE_URL}/members?select=*&order=name.asc`,
      {
        method: 'GET',
        headers: getHeaders(),
      }
    );

    return handleResponse<Member[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * POST - Create a new member
 * 
 * HTTP Method: POST
 * Endpoint: /members
 * Body: MemberInput object
 */
export const createMember = async (member: MemberInput): Promise<Member[]> => {
  try {
    // Using fetch() to make POST request to create a new member
    const response = await fetch(
      `${API_BASE_URL}/members`,
      {
        method: 'POST',
        headers: getHeaders(),
        body: JSON.stringify(member),
      }
    );

    return handleResponse<Member[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * PATCH - Update an existing member
 * 
 * HTTP Method: PATCH
 * Endpoint: /members?id=eq.{id}
 * Body: Partial MemberInput object
 */
export const updateMember = async (id: string, member: MemberInput): Promise<Member[]> => {
  try {
    // Using fetch() to make PATCH request to update the member
    const response = await fetch(
      `${API_BASE_URL}/members?id=eq.${id}`,
      {
        method: 'PATCH',
        headers: getHeaders(),
        body: JSON.stringify(member),
      }
    );

    return handleResponse<Member[]>(response);
  } catch (error) {
    return handleError(error);
  }
};

/**
 * DELETE - Delete a member
 * 
 * HTTP Method: DELETE
 * Endpoint: /members?id=eq.{id}
 */
export const deleteMember = async (id: string): Promise<void> => {
  try {
    // Using fetch() to make DELETE request to remove the member
    const response = await fetch(
      `${API_BASE_URL}/members?id=eq.${id}`,
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
