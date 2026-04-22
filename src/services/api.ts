// API service layer for the AMS Frontend
// Based on the OpenAPI specification

import type {
  Folder,
  FolderTree,
  FolderStats,
  FolderCreate,
  FolderUpdate,
  FolderWithFiles,
  Event,
  EventCreate,
  EventUpdate,
  EventType,
  EventSummary,
  Role,
  RoleCreate,
  RoleUpdate,
  Permission,
  PermissionCreate,
  PermissionUpdate,
  AssignRoleRequest,
  RoleResponse,
  PermissionResponse
} from '../types';

import {
  transformRoleFromBackend,
  transformPermissionFromBackend,
  transformRolesFromBackend,
  transformPermissionsFromBackend,
  transformRoleCreateToBackend,
  transformRoleUpdateToBackend,
  safeParseId
} from '../utils/apiTransformers';

import { APP_CONFIG } from '../constants';
import { SYSTEM_ROLES } from '../data/rolesConfig';

const API_BASE_URL = import.meta.env.VITE_API_BASE_URL || 'https://ams-vision-backend.onrender.com';

// Types for API requests and responses
export interface LoginRequest {
  email: string;
  password: string;
}

export interface TokenResponse {
  access_token: string;
  refresh_token: string;
  token_type: string;
}

export interface ApiError {
  detail: string;
  status: number;
}

export class ApiErrorClass extends Error {
  public status: number;

  constructor(message: string, status: number) {
    super(message);
    this.name = 'ApiError';
    this.status = status;
  }
}

export interface FileMetadata {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  uploaded_by?: number | null;
  incident_id?: number | null;
  created_at: string;
}

export interface FileResponse {
  id: number;
  filename: string;
  original_filename: string;
  file_size: number;
  mime_type: string;
  incident_id?: number | null;
  folder_id?: number | null;
  file_path: string;
  uploaded_by?: number | null;
  created_at: string;
  updated_at?: string;
}

export interface FileUploadResponse {
  message: string;
  file: FileResponse;
}

// Helper function to get auth headers
// const getAuthHeaders = (): HeadersInit => {
//   const token = localStorage.getItem('auth_token');
//   return {
//     'Content-Type': 'application/json',
//     ...(token && { 'Authorization': `Bearer ${token}` }),
//   };
// };

// Global flag to prevent multiple simultaneous refresh attempts
let isRefreshing = false;
let refreshPromise: Promise<TokenResponse> | null = null;

// Global authentication event emitter for React-friendly logout
let authEventCallbacks: (() => void)[] = [];

export const onAuthExpired = (callback: () => void) => {
  authEventCallbacks.push(callback);
  return () => {
    authEventCallbacks = authEventCallbacks.filter(cb => cb !== callback);
  };
};

const triggerAuthExpired = () => {
  authEventCallbacks.forEach(callback => {
    try {
      callback();
    } catch (error) {
      console.error('Error in auth expired callback:', error);
    }
  });
};

// Helper function to refresh token
async function refreshAuthToken(): Promise<TokenResponse> {
  const refreshToken = localStorage.getItem('refresh_token');
  if (!refreshToken) {
    throw new Error('No refresh token available');
  }

  const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
    method: 'POST',
    headers: { 'Content-Type': 'application/json' },
    body: JSON.stringify({ refresh_token: refreshToken }),
  });

  if (!response.ok) {
    throw new Error('Failed to refresh token');
  }

  return response.json();
}

// Helper function to handle API responses with automatic token refresh
async function handleApiResponse<T>(response: Response, originalRequest?: () => Promise<Response>): Promise<T> {
  // If unauthorized and we have a refresh token, try to refresh
  if (response.status === 401 && originalRequest) {
    const refreshToken = localStorage.getItem('refresh_token');

    if (refreshToken && !isRefreshing) {
      try {
        // Prevent multiple simultaneous refresh attempts
        if (!refreshPromise) {
          isRefreshing = true;
          refreshPromise = refreshAuthToken();
        }

        const tokenResponse = await refreshPromise;

        // Update stored tokens
        localStorage.setItem('auth_token', tokenResponse.access_token);
        if (tokenResponse.refresh_token) {
          localStorage.setItem('refresh_token', tokenResponse.refresh_token);
        }

        // Reset refresh state
        isRefreshing = false;
        refreshPromise = null;

        // Retry the original request with new token
        const retryResponse = await originalRequest();
        return handleApiResponse<T>(retryResponse);

      } catch (refreshError) {
        // Refresh failed - clear tokens and trigger auth expired event
        localStorage.removeItem('auth_token');
        localStorage.removeItem('refresh_token');
        localStorage.removeItem('user_data');

        // Reset refresh state
        isRefreshing = false;
        refreshPromise = null;

        // Trigger auth expired callbacks for React components to handle
        triggerAuthExpired();

        throw new Error('Session expired. Please login again.');
      }
    } else {
      // No refresh token or already refreshing - trigger auth expired event
      localStorage.removeItem('auth_token');
      localStorage.removeItem('refresh_token');
      localStorage.removeItem('user_data');
      triggerAuthExpired();
      throw new Error('Session expired. Please login again.');
    }
  }

  if (!response.ok) {
    const error: ApiError = {
      detail: `HTTP ${response.status}: ${response.statusText}`,
      status: response.status,
    };

    try {
      const errorData = await response.json();
      const detail = errorData?.detail;

      if (typeof detail === 'string') {
        error.detail = detail;
      } else if (Array.isArray(detail)) {
        error.detail = detail
          .map((item: any) => {
            const location = Array.isArray(item?.loc) ? item.loc.join('.') : undefined;
            const message = item?.msg || item?.message;
            return location && message ? `${location}: ${message}` : message || JSON.stringify(item);
          })
          .join('; ');
      } else if (detail && typeof detail === 'object') {
        error.detail = (detail as any).message || JSON.stringify(detail);
      }
    } catch {
      // Use default error message if response is not JSON
    }

    throw new Error(error.detail);
  }

  return response.json();
}

// Helper function to make authenticated requests with retry logic
async function makeAuthenticatedRequest(url: string, options: RequestInit = {}): Promise<Response> {
  const token = localStorage.getItem('auth_token');
  const headers = {
    'Content-Type': 'application/json',
    ...(token && { 'Authorization': `Bearer ${token}` }),
    ...options.headers,
  };

  return fetch(url, {
    ...options,
    headers,
  });
}

// Authentication API
export const authApi = {
  async login(credentials: LoginRequest): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/login`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    return handleApiResponse<TokenResponse>(response);
  },

  async refreshToken(refreshToken: string): Promise<TokenResponse> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/refresh`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify({ refresh_token: refreshToken }),
    });

    return handleApiResponse<TokenResponse>(response);
  },

  async register(credentials: { email: string; password: string; first_name: string; last_name: string }): Promise<void> {
    const response = await fetch(`${API_BASE_URL}/api/v1/auth/register`, {
      method: 'POST',
      headers: { 'Content-Type': 'application/json' },
      body: JSON.stringify(credentials),
    });

    return handleApiResponse<void>(response);
  },

  async logout(): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/auth/logout`, {
      method: 'POST',
    });

    const response = await makeRequest();
    await handleApiResponse(response, makeRequest);
  },

  async getCurrentUser(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/auth/me`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },
};

// Users API
export const usersApi = {
  async getUsers(params?: {
    skip?: number;
    limit?: number; // Maximum limit is defined in APP_CONFIG.api.limits.users (100)
    search?: string;
    role?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.role) searchParams.append('role', params.role);

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/?${searchParams}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<any[]>(response, makeRequest);
  },

  async getUser(userId: string): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/${userId}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<any>(response, makeRequest);
  },

  async createUser(userData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/`, {
      method: 'POST',
      body: JSON.stringify(userData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async updateUser(userId: string, userData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/${userId}`, {
      method: 'PUT',
      body: JSON.stringify(userData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async deleteUser(userId: string): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/${userId}`, {
      method: 'DELETE',
    });

    const response = await makeRequest();
    await handleApiResponse(response, makeRequest);
  },

  async updateUserRole(userId: string, roleData: { role?: string; role_id?: number }): Promise<any> {
    // Convert to the format expected by the backend API
    const backendRoleData = {
      role_id: roleData.role_id || (roleData.role ? parseInt(roleData.role) : undefined)
    };

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/users/${userId}/role`, {
      method: 'PUT',
      headers: {
        'Content-Type': 'application/json'
      },
      body: JSON.stringify(backendRoleData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },
};

// Cameras API
export const camerasApi = {
  async getCameras(params?: {
    skip?: number;
    limit?: number;
    location?: string;
    status?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.location) searchParams.append('location', params.location);
    if (params?.status) searchParams.append('status', params.status);

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/cameras/?${searchParams}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<any[]>(response, makeRequest);
  },

  async createCamera(cameraData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/cameras/`, {
      method: 'POST',
      body: JSON.stringify(cameraData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async updateCamera(cameraId: string, cameraData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/cameras/${cameraId}`, {
      method: 'PUT',
      body: JSON.stringify(cameraData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async deleteCamera(cameraId: string): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/cameras/${cameraId}`, {
      method: 'DELETE',
    });

    const response = await makeRequest();
    await handleApiResponse(response, makeRequest);
  },

  async getCameraCount(): Promise<{ count: number }> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/cameras/count`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<{ count: number }>(response, makeRequest);
  },
};

// Incidents API
export const incidentsApi = {
  async getIncidents(params?: {
    skip?: number;
    limit?: number;
    incident_type?: string;
    start_date?: string;
    end_date?: string;
  }): Promise<any[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip) searchParams.append('skip', params.skip.toString());
    if (params?.limit) searchParams.append('limit', params.limit.toString());
    if (params?.incident_type) searchParams.append('incident_type', params.incident_type);
    if (params?.start_date) searchParams.append('start_date', params.start_date);
    if (params?.end_date) searchParams.append('end_date', params.end_date);

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/incidents/?${searchParams}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<any[]>(response, makeRequest);
  },

  async createIncident(incidentData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/incidents/`, {
      method: 'POST',
      body: JSON.stringify(incidentData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async updateIncident(incidentId: string, incidentData: any): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/incidents/${incidentId}`, {
      method: 'PUT',
      body: JSON.stringify(incidentData),
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async deleteIncident(incidentId: string): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/incidents/${incidentId}`, {
      method: 'DELETE',
    });

    const response = await makeRequest();
    await handleApiResponse(response, makeRequest);
  },

  async getIncidentTypes(): Promise<any[]> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/incidents/types`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<any[]>(response, makeRequest);
  },
};

// Dashboard API
export const dashboardApi = {
  async getDashboardStats(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/dashboard/stats`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async getIncidentsSummary(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/dashboard/incidents/summary`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async getCamerasSummary(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/dashboard/cameras/summary`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async getEmployeesSummary(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/dashboard/employees/summary`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },

  async getQuickStats(): Promise<any> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/dashboard/quick-stats`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse(response, makeRequest);
  },
};

// Files API
export const filesApi = {
  async getFiles(params?: {
    skip?: number;
    limit?: number;
    incident_id?: number | null;
    folder_id?: number | null;
  }): Promise<FileMetadata[]> {
    const queryParams = new URLSearchParams();
    if (params?.skip !== undefined) queryParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) queryParams.append('limit', params.limit.toString());
    if (params?.incident_id !== undefined && params?.incident_id !== null) {
      queryParams.append('incident_id', params.incident_id.toString());
    }
    if (params?.folder_id !== undefined && params?.folder_id !== null) {
      queryParams.append('folder_id', params.folder_id.toString());
    }

    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/?${queryParams.toString()}`
    );

    return handleApiResponse<FileMetadata[]>(response, () =>
      makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/files/?${queryParams.toString()}`)
    );
  },

  async uploadFile(file: File, incident_id?: number, folder_id?: number): Promise<FileUploadResponse> {
    const formData = new FormData();
    formData.append('file', file);

    // Build URL with query parameters
    const url = new URL(`${API_BASE_URL}/api/v1/files/upload`);
    if (incident_id) {
      url.searchParams.append('incident_id', incident_id.toString());
    }
    if (folder_id) {
      url.searchParams.append('folder_id', folder_id.toString());
    }

    const token = localStorage.getItem('auth_token');
    const response = await fetch(url.toString(), {
      method: 'POST',
      headers: {
        ...(token && { 'Authorization': `Bearer ${token}` }),
        // Don't set Content-Type for FormData, let browser set it with boundary
      },
      body: formData,
    });

    return handleApiResponse<FileUploadResponse>(response, () =>
      fetch(url.toString(), {
        method: 'POST',
        headers: {
          ...(token && { 'Authorization': `Bearer ${token}` }),
        },
        body: formData,
      })
    );
  },

  async downloadFile(fileId: number): Promise<Blob> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/${fileId}`
    );

    if (!response.ok) {
      throw new ApiErrorClass(`Failed to download file: ${response.status}`, response.status);
    }

    return response.blob();
  },

  // Generate URL for file preview (for images, PDFs, etc.)
  getPreviewUrl(fileId: number): string {
    // For preview in img/iframe, we'll use the same endpoint as download
    // but rely on proper CORS and authentication headers when possible
    return `${API_BASE_URL}/api/v1/files/${fileId}`;
  },

  // Generate URL for direct file access with token as query param (fallback)
  getFileUrlWithToken(fileId: number): string {
    const token = localStorage.getItem('auth_token');
    const url = `${API_BASE_URL}/api/v1/files/${fileId}`;

    if (token) {
      return `${url}?token=${encodeURIComponent(token)}`;
    }
    return url;
  },

  // Generate URL for direct file access
  getFileUrl(fileId: number): string {
    return `${API_BASE_URL}/api/v1/files/${fileId}`;
  },

  // Fetch file as blob for download
  async downloadFileBlob(fileId: number): Promise<{ blob: Blob; filename: string }> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/${fileId}`
    );

    if (!response.ok) {
      throw new ApiErrorClass(`Failed to download file: ${response.status}`, response.status);
    }

    // Try to get filename from Content-Disposition header
    const contentDisposition = response.headers.get('Content-Disposition');
    let filename = `file_${fileId}`;

    if (contentDisposition) {
      const filenameMatch = contentDisposition.match(/filename="?([^"]+)"?/);
      if (filenameMatch) {
        filename = filenameMatch[1];
      }
    }

    const blob = await response.blob();
    return { blob, filename };
  },

  // Fetch file content as text (for text file previews)
  async getFileContent(fileId: number): Promise<string> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/${fileId}`
    );

    if (!response.ok) {
      throw new ApiErrorClass(`Failed to fetch file content: ${response.status}`, response.status);
    }

    return response.text();
  },

  async deleteFile(fileId: number): Promise<void> {
    const response = await makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/${fileId}`,
      { method: 'DELETE' }
    );

    return handleApiResponse<void>(response, () =>
      makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/files/${fileId}`, { method: 'DELETE' })
    );
  },

  async moveFile(fileId: number, newFolderId?: number | null): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/${fileId}/move`,
      {
        method: 'PUT',
        body: JSON.stringify({ new_folder_id: newFolderId }),
      }
    );

    const response = await makeRequest();
    return handleApiResponse<void>(response, makeRequest);
  },
};

// Folders API
export const foldersApi = {
  async getFolders(parentId?: number | null): Promise<Folder[]> {
    const queryParams = new URLSearchParams();
    if (parentId !== undefined && parentId !== null) {
      queryParams.append('parent_id', parentId.toString());
    }

    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/?${queryParams.toString()}`
    );

    const response = await makeRequest();
    return handleApiResponse<Folder[]>(response, makeRequest);
  },

  async createFolder(folderData: FolderCreate): Promise<Folder> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/`,
      {
        method: 'POST',
        body: JSON.stringify(folderData),
      }
    );

    const response = await makeRequest();
    return handleApiResponse<Folder>(response, makeRequest);
  },

  async updateFolder(folderId: number, folderData: FolderUpdate): Promise<Folder> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/${folderId}`,
      {
        method: 'PUT',
        body: JSON.stringify(folderData),
      }
    );

    const response = await makeRequest();
    return handleApiResponse<Folder>(response, makeRequest);
  },

  async deleteFolder(folderId: number): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/${folderId}`,
      { method: 'DELETE' }
    );

    const response = await makeRequest();
    return handleApiResponse<void>(response, makeRequest);
  },

  async getFolderTree(): Promise<FolderTree[]> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/tree`
    );

    const response = await makeRequest();
    return handleApiResponse<FolderTree[]>(response, makeRequest);
  },

  async getFolderStats(): Promise<FolderStats> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/stats`
    );

    const response = await makeRequest();
    return handleApiResponse<FolderStats>(response, makeRequest);
  },

  async getFolderChildren(folderId: number): Promise<FolderWithFiles[]> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/${folderId}/children`
    );

    const response = await makeRequest();
    return handleApiResponse<FolderWithFiles[]>(response, makeRequest);
  },

  async moveFolder(folderId: number, newParentId?: number | null): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/folders/${folderId}/move`,
      {
        method: 'PUT',
        body: JSON.stringify({ new_parent_id: newParentId }),
      }
    );

    const response = await makeRequest();
    return handleApiResponse<void>(response, makeRequest);
  },

  async getFilesInFolder(folderId: number): Promise<FileMetadata[]> {
    const makeRequest = () => makeAuthenticatedRequest(
      `${API_BASE_URL}/api/v1/files/folder/${folderId}`
    );

    const response = await makeRequest();
    return handleApiResponse<FileMetadata[]>(response, makeRequest);
  },
};

// Events API
export const eventsApi = {
  async getEvents(params?: {
    skip?: number;
    limit?: number;
    search?: string;
    event_type?: string;
    camera_id?: number;
    user_id?: number;
  }): Promise<Event[]> {
    const searchParams = new URLSearchParams();
    if (params?.skip !== undefined) searchParams.append('skip', params.skip.toString());
    if (params?.limit !== undefined) searchParams.append('limit', params.limit.toString());
    if (params?.search) searchParams.append('search', params.search);
    if (params?.event_type) searchParams.append('event_type', params.event_type);
    if (params?.camera_id !== undefined) searchParams.append('camera_id', params.camera_id.toString());
    if (params?.user_id !== undefined) searchParams.append('user_id', params.user_id.toString());

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/?${searchParams}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<Event[]>(response, makeRequest);
  },

  async getEventById(eventId: number): Promise<Event> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/${eventId}`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<Event>(response, makeRequest);
  },

  async createEvent(eventData: EventCreate): Promise<Event> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/`, {
      method: 'POST',
      body: JSON.stringify(eventData),
    });

    const response = await makeRequest();
    return handleApiResponse<Event>(response, makeRequest);
  },

  async updateEvent(eventId: number, eventData: EventUpdate): Promise<Event> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/${eventId}`, {
      method: 'PUT',
      body: JSON.stringify(eventData),
    });

    const response = await makeRequest();
    return handleApiResponse<Event>(response, makeRequest);
  },

  async deleteEvent(eventId: number): Promise<void> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/${eventId}`, {
      method: 'DELETE',
    });

    const response = await makeRequest();
    return handleApiResponse<void>(response, makeRequest);
  },

  async getEventTypes(): Promise<EventType[]> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/types`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<EventType[]>(response, makeRequest);
  },

  async getEventsSummary(): Promise<EventSummary> {
    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/summary`, {
      method: 'GET',
    });

    const response = await makeRequest();
    return handleApiResponse<EventSummary>(response, makeRequest);
  },

  async exportEvents(params?: {
    event_type?: string;
    camera_id?: number;
  }): Promise<Blob> {
    const searchParams = new URLSearchParams();
    if (params?.event_type) searchParams.append('event_type', params.event_type);
    if (params?.camera_id !== undefined) searchParams.append('camera_id', params.camera_id.toString());

    const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/events/export?${searchParams}`, {
      method: 'GET',
    });

    const response = await makeRequest();

    if (!response.ok) {
      throw new ApiErrorClass(`Failed to export events: ${response.status}`, response.status);
    }

    return response.blob();
  },
};

// Roles API - работает с бэкендом для получения доступных ролей
export const rolesApi = {
  async getRoles(): Promise<Role[]> {
    // Получаем роли с бэкенда используя новый endpoint
    try {
      const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/roles/`, {
        method: 'GET',
      });

      const response = await makeRequest();
      const backendRoles: RoleResponse[] = await handleApiResponse<any[]>(response, makeRequest);

      // Get user counts for each role (keyed by numeric role id)
      const userCountsById: Record<number, number> = {};

      await Promise.all(
        backendRoles.map(async (role) => {
          try {
            // Get user count for this role (API may expect role name or id)
            const users = await usersApi.getUsers({
              role: role.name || role.id.toString(),
              limit: APP_CONFIG.api.limits.users,
            });
            userCountsById[role.id] = users.length;
          } catch (error) {
            console.warn(`Failed to get user count for role ${role.name || role.id}:`, error);
            userCountsById[role.id] = 0;
          }
        })
      );

      // Преобразуем ответ бэкенда в формат Role и корректно маппим permissions -> string ids
      return transformRolesFromBackend(backendRoles, userCountsById);
    } catch (error) {
      console.warn('Backend roles endpoint not available, falling back to local roles:', error);

      // Fallback к локальным ролям с подсчетом пользователей
      const users = await usersApi.getUsers({ limit: APP_CONFIG.api.limits.users });
      const rolesWithCounts = SYSTEM_ROLES.map((role) => ({
        ...role,
        user_count: users.filter((user) => user.role === role.id).length,
      }));

      return rolesWithCounts;
    }
  },

  // Новый метод для получения простого списка ролей для dropdown
  async getAvailableRoles(): Promise<{ id: string, name: string, description?: string }[]> {
    // Используем новый endpoint для получения ролей
    try {
      const makeRequest = () => makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/roles/`, {
        method: 'GET',
      });

      const response = await makeRequest();
      const backendRoles = await handleApiResponse<any[]>(response, makeRequest);

      // Преобразуем ответ бэкенда в формат для dropdown
      return backendRoles.map(role => ({
        id: role.name || role.id, // Используем name как id для передачи в API
        name: role.display_name || role.name,
        description: role.description
      }));
    } catch (error) {
      console.warn('Failed to get roles from backend, falling back to local roles:', error);

      // Fallback к локальным ролям
      return SYSTEM_ROLES.map(role => ({
        id: role.id,
        name: role.name,
        description: role.description
      }));
    }
  },

  async getRole(roleId: string): Promise<Role | null> {
    try {
      const numericId = safeParseId(roleId);
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/roles/${numericId}`, {
        method: 'GET'
      });

      if (!response.ok) {
        if (response.status === 404) {
          return null;
        }
        throw new ApiErrorClass(`Failed to fetch role: ${response.statusText}`, response.status);
      }

      const backendRole: RoleResponse = await response.json();

      // Get user count for this role
      const users = await usersApi.getUsers({ role: roleId, limit: APP_CONFIG.api.limits.users });

      return transformRoleFromBackend(backendRole, users.length);
    } catch (error) {
      console.error(`Failed to fetch role ${roleId}:`, error);
      throw error;
    }
  },

  async createRole(roleData: RoleCreate): Promise<Role> {
    try {
      // Support legacy frontend payloads that pass `permissions: string[]`
      const payload: RoleCreate = (roleData as any).permissions
        ? (transformRoleCreateToBackend as any)(roleData)
        : roleData;

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/roles/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to create role', response.status);
      }

      const backendRole: RoleResponse = await response.json();

      return transformRoleFromBackend(backendRole, 0);
    } catch (error) {
      console.error('Failed to create role:', error);
      throw error;
    }
  },

  async updateRole(roleId: string, roleData: RoleUpdate): Promise<Role> {
    try {
      const numericId = safeParseId(roleId);

      // Support legacy frontend payloads that pass `permissions: string[]`
      const payload: RoleUpdate = (roleData as any).permissions
        ? (transformRoleUpdateToBackend as any)(roleData)
        : roleData;

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/roles/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(payload)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to update role', response.status);
      }

      const backendRole: RoleResponse = await response.json();

      // Get current user count
      const users = await usersApi.getUsers({ role: roleId, limit: APP_CONFIG.api.limits.users });

      return transformRoleFromBackend(backendRole, users.length);
    } catch (error) {
      console.error(`Failed to update role ${roleId}:`, error);
      throw error;
    }
  },

  async assignRole(request: AssignRoleRequest): Promise<void> {
    try {
      const numericRoleId = safeParseId(request.role_id);
      await usersApi.updateUserRole(request.user_id.toString(), { role_id: numericRoleId });
    } catch (error) {
      console.error('Failed to assign role:', error);
      throw error;
    }
  },

  async getRoleUsers(roleId: string): Promise<any[]> {
    return usersApi.getUsers({ role: roleId, limit: APP_CONFIG.api.limits.users });
  },

  // New method for assigning permissions to roles
  async assignPermissionToRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const numericRoleId = safeParseId(roleId);
      const numericPermissionId = safeParseId(permissionId);

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/roles/${numericRoleId}/permissions/${numericPermissionId}`,
        {
          method: 'POST'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to assign permission to role', response.status);
      }
    } catch (error) {
      console.error(`Failed to assign permission ${permissionId} to role ${roleId}:`, error);
      throw error;
    }
  },

  // New method for removing permissions from roles
  async removePermissionFromRole(roleId: string, permissionId: string): Promise<void> {
    try {
      const numericRoleId = safeParseId(roleId);
      const numericPermissionId = safeParseId(permissionId);

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/roles/${numericRoleId}/permissions/${numericPermissionId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to remove permission from role', response.status);
      }
    } catch (error) {
      console.error(`Failed to remove permission ${permissionId} from role ${roleId}:`, error);
      throw error;
    }
  }
};

// Permissions API - Real backend integration
export const permissionsApi = {
  async getPermissions(): Promise<Permission[]> {
    try {
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/permissions/`, {
        method: 'GET'
      });

      if (!response.ok) {
        throw new ApiErrorClass(`Failed to fetch permissions: ${response.statusText}`, response.status);
      }

      const backendPermissions: PermissionResponse[] = await response.json();
      return transformPermissionsFromBackend(backendPermissions);
    } catch (error) {
      console.error('Failed to fetch permissions:', error);
      throw error;
    }
  },

  async getPermission(permissionId: string): Promise<Permission | null> {
    try {
      // Since there's no single permission endpoint, we'll get all permissions and filter
      const permissions = await this.getPermissions();
      return permissions.find(p => p.id === permissionId) || null;
    } catch (error) {
      console.error(`Failed to fetch permission ${permissionId}:`, error);
      return null;
    }
  },

  async getPermissionsByCategory(category: string): Promise<Permission[]> {
    try {
      const permissions = await this.getPermissions();
      return permissions.filter(permission => permission.category === category);
    } catch (error) {
      console.error(`Failed to fetch permissions for category ${category}:`, error);
      throw error;
    }
  },

  async getPermissionsByResource(resource: string): Promise<Permission[]> {
    try {
      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/permissions/?resource=${encodeURIComponent(resource)}`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new ApiErrorClass(`Failed to fetch permissions for resource: ${response.statusText}`, response.status);
      }

      const backendPermissions: PermissionResponse[] = await response.json();
      return transformPermissionsFromBackend(backendPermissions);
    } catch (error) {
      console.error(`Failed to fetch permissions for resource ${resource}:`, error);
      throw error;
    }
  },

  async createPermission(permissionData: PermissionCreate): Promise<Permission> {
    try {
      // permissionData matches backend schema
      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/permissions/`, {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to create permission', response.status);
      }

      const backendPermission: PermissionResponse = await response.json();
      return transformPermissionFromBackend(backendPermission);
    } catch (error) {
      console.error('Failed to create permission:', error);
      throw error;
    }
  },

  async updatePermission(permissionId: string, permissionData: PermissionUpdate): Promise<Permission> {
    try {
      const numericId = safeParseId(permissionId);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/permissions/${numericId}`, {
        method: 'PUT',
        headers: {
          'Content-Type': 'application/json'
        },
        body: JSON.stringify(permissionData)
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to update permission', response.status);
      }

      const backendPermission: PermissionResponse = await response.json();
      return transformPermissionFromBackend(backendPermission);
    } catch (error) {
      console.error(`Failed to update permission ${permissionId}:`, error);
      throw error;
    }
  },

  async deletePermission(permissionId: string): Promise<void> {
    try {
      const numericId = safeParseId(permissionId);

      const response = await makeAuthenticatedRequest(`${API_BASE_URL}/api/v1/roles/permissions/${numericId}`, {
        method: 'DELETE'
      });

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to delete permission', response.status);
      }
    } catch (error) {
      console.error(`Failed to delete permission ${permissionId}:`, error);
      throw error;
    }
  },

  async getRolePermissions(roleId: string): Promise<Permission[]> {
    try {
      // Placeholder: no dedicated endpoint yet
      console.warn(`Role permissions endpoint not available, returning empty list for role ${roleId}`);
      return [];
    } catch (error) {
      console.error(`Failed to fetch permissions for role ${roleId}:`, error);
      return [];
    }
  },

  // New method for getting user permissions
  async getUserPermissions(userId: string): Promise<Permission[]> {
    try {
      const numericId = safeParseId(userId);

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/users/${numericId}/permissions`,
        {
          method: 'GET'
        }
      );

      if (!response.ok) {
        throw new ApiErrorClass(`Failed to fetch user permissions: ${response.statusText}`, response.status);
      }

      // The API returns an array of user-permission relations
      const userPermissions = await response.json();

      // Get all permissions and filter by the ones the user has
      const allPermissions = await this.getPermissions();
      const userPermissionIds = userPermissions.map((up: any) => up.permission_id?.toString?.() ?? String(up.permission_id));

      return allPermissions.filter(permission => userPermissionIds.includes(permission.id));
    } catch (error) {
      console.error(`Failed to fetch permissions for user ${userId}:`, error);
      throw error;
    }
  },

  // New method for granting permission to user
  async grantUserPermission(userId: string, permissionId: string, expiresAt?: string): Promise<void> {
    try {
      const numericUserId = safeParseId(userId);
      const numericPermissionId = safeParseId(permissionId);

      const requestBody = {
        user_id: numericUserId,
        permission_id: numericPermissionId,
        expires_at: expiresAt || null
      };

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/users/${numericUserId}/permissions`,
        {
          method: 'POST',
          headers: {
            'Content-Type': 'application/json'
          },
          body: JSON.stringify(requestBody)
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to grant user permission', response.status);
      }
    } catch (error) {
      console.error(`Failed to grant permission ${permissionId} to user ${userId}:`, error);
      throw error;
    }
  },

  // New method for revoking permission from user
  async revokeUserPermission(userId: string, permissionId: string): Promise<void> {
    try {
      const numericUserId = safeParseId(userId);
      const numericPermissionId = safeParseId(permissionId);

      const response = await makeAuthenticatedRequest(
        `${API_BASE_URL}/api/v1/roles/users/${numericUserId}/permissions/${numericPermissionId}`,
        {
          method: 'DELETE'
        }
      );

      if (!response.ok) {
        const errorData = await response.json().catch(() => ({ detail: response.statusText }));
        throw new ApiErrorClass(errorData.detail || 'Failed to revoke user permission', response.status);
      }
    } catch (error) {
      console.error(`Failed to revoke permission ${permissionId} from user ${userId}:`, error);
      throw error;
    }
  }
};
