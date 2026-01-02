// Data validation utilities for the AMS application

import type { User, Camera, Incident, AttendanceRecord } from '../types';

// Base validation result interface
export interface ValidationResult {
  isValid: boolean;
  errors: string[];
}

// Generic validation function type
export type ValidatorFunction<T> = (data: T) => ValidationResult;

// Email validation regex
const EMAIL_REGEX = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;

// Phone number validation regex (simple international format)
const PHONE_REGEX = /^\+?[\d\s-()]+$/;

// Helper functions
export const isValidEmail = (email: string): boolean => {
  return EMAIL_REGEX.test(email);
};

export const isValidPhone = (phone: string): boolean => {
  return PHONE_REGEX.test(phone);
};

export const isValidDate = (dateString: string): boolean => {
  const date = new Date(dateString);
  return !isNaN(date.getTime());
};

export const isValidId = (id: any): boolean => {
  return typeof id === 'number' && id > 0;
};

export const isNonEmptyString = (str: any): boolean => {
  return typeof str === 'string' && str.trim().length > 0;
};

// User validation
export const validateUser: ValidatorFunction<User> = (user) => {
  const errors: string[] = [];

  if (!isValidId(user.id)) {
    errors.push('User ID must be a positive number');
  }

  if (!isNonEmptyString(user.name)) {
    errors.push('User name is required and must be a non-empty string');
  }

  if (!isValidEmail(user.email)) {
    errors.push('User email must be a valid email address');
  }

  if (!isNonEmptyString(user.role)) {
    errors.push('User role is required and must be a non-empty string');
  }

  if (user.age && !isNonEmptyString(user.age)) {
    errors.push('User age must be a non-empty string if provided');
  }

  if (user.hired && !isNonEmptyString(user.hired)) {
    errors.push('User hire date must be a non-empty string if provided');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Camera validation
export const validateCamera: ValidatorFunction<Camera> = (camera) => {
  const errors: string[] = [];

  if (!isValidId(camera.id)) {
    errors.push('Camera ID must be a positive number');
  }

  if (!isNonEmptyString(camera.name)) {
    errors.push('Camera name is required and must be a non-empty string');
  }

  if (!isNonEmptyString(camera.location)) {
    errors.push('Camera location is required and must be a non-empty string');
  }

  if (!isNonEmptyString(camera.description)) {
    errors.push('Camera description is required and must be a non-empty string');
  }

  if (!['active', 'inactive'].includes(camera.status)) {
    errors.push('Camera status must be either "active" or "inactive"');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Incident validation
export const validateIncident: ValidatorFunction<Incident> = (incident) => {
  const errors: string[] = [];

  if (!isValidId(incident.id)) {
    errors.push('Incident ID must be a positive number');
  }

  if (!isNonEmptyString(incident.name)) {
    errors.push('Incident name is required and must be a non-empty string');
  }

  if (!isValidEmail(incident.email)) {
    errors.push('Incident email must be a valid email address');
  }

  if (!isNonEmptyString(incident.incidentType)) {
    errors.push('Incident type is required and must be a non-empty string');
  }

  if (!isNonEmptyString(incident.details)) {
    errors.push('Incident details are required and must be a non-empty string');
  }

  if (typeof incident.isLate !== 'boolean') {
    errors.push('Incident isLate must be a boolean value');
  }

  if (!isNonEmptyString(incident.time)) {
    errors.push('Incident time is required and must be a non-empty string');
  }

  if (!isNonEmptyString(incident.date)) {
    errors.push('Incident date is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Attendance record validation
export const validateAttendanceRecord: ValidatorFunction<AttendanceRecord> = (attendance) => {
  const errors: string[] = [];

  if (!isValidId(attendance.id)) {
    errors.push('Attendance ID must be a positive number');
  }

  if (!isNonEmptyString(attendance.name)) {
    errors.push('Attendance name is required and must be a non-empty string');
  }

  if (!isValidEmail(attendance.email)) {
    errors.push('Attendance email must be a valid email address');
  }

  if (!isNonEmptyString(attendance.status)) {
    errors.push('Attendance status is required and must be a non-empty string');
  }

  if (!isNonEmptyString(attendance.details)) {
    errors.push('Attendance details are required and must be a non-empty string');
  }

  if (typeof attendance.presence !== 'boolean') {
    errors.push('Attendance presence must be a boolean value');
  }

  if (!isNonEmptyString(attendance.time)) {
    errors.push('Attendance time is required and must be a non-empty string');
  }

  if (!isNonEmptyString(attendance.date)) {
    errors.push('Attendance date is required and must be a non-empty string');
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Array validation functions
export const validateUsers = (users: User[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!Array.isArray(users)) {
    return {
      isValid: false,
      errors: ['Users data must be an array']
    };
  }

  users.forEach((user, index) => {
    const userValidation = validateUser(user);
    if (!userValidation.isValid) {
      errors.push(`User at index ${index}: ${userValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateCameras = (cameras: Camera[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!Array.isArray(cameras)) {
    return {
      isValid: false,
      errors: ['Cameras data must be an array']
    };
  }

  cameras.forEach((camera, index) => {
    const cameraValidation = validateCamera(camera);
    if (!cameraValidation.isValid) {
      errors.push(`Camera at index ${index}: ${cameraValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateIncidents = (incidents: Incident[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!Array.isArray(incidents)) {
    return {
      isValid: false,
      errors: ['Incidents data must be an array']
    };
  }

  incidents.forEach((incident, index) => {
    const incidentValidation = validateIncident(incident);
    if (!incidentValidation.isValid) {
      errors.push(`Incident at index ${index}: ${incidentValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

export const validateAttendanceRecords = (attendance: AttendanceRecord[]): ValidationResult => {
  const errors: string[] = [];
  
  if (!Array.isArray(attendance)) {
    return {
      isValid: false,
      errors: ['Attendance data must be an array']
    };
  }

  attendance.forEach((record, index) => {
    const recordValidation = validateAttendanceRecord(record);
    if (!recordValidation.isValid) {
      errors.push(`Attendance record at index ${index}: ${recordValidation.errors.join(', ')}`);
    }
  });

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Generic object validation
export const validateObject = <T>(
  data: T,
  validator: ValidatorFunction<T>
): ValidationResult => {
  if (!data || typeof data !== 'object') {
    return {
      isValid: false,
      errors: ['Data must be a valid object']
    };
  }

  return validator(data);
};

// Utility to validate API responses
export const validateApiResponse = <T>(
  response: any,
  dataValidator: ValidatorFunction<T[]>
): ValidationResult => {
  const errors: string[] = [];

  if (!response || typeof response !== 'object') {
    return {
      isValid: false,
      errors: ['API response must be a valid object']
    };
  }

  if (!Array.isArray(response.data)) {
    errors.push('API response must contain a data array');
  } else {
    const dataValidation = dataValidator(response.data);
    if (!dataValidation.isValid) {
      errors.push(...dataValidation.errors);
    }
  }

  return {
    isValid: errors.length === 0,
    errors
  };
};

// Validation middleware for data fetching
export const withValidation = <T>(
  dataFetcher: () => Promise<T[]>,
  validator: ValidatorFunction<T[]>
) => {
  return async (): Promise<T[]> => {
    const data = await dataFetcher();
    const validation = validator(data);
    
    if (!validation.isValid) {
      console.warn('Data validation failed:', validation.errors);
      // In development, you might want to throw an error
      // In production, you might want to log and return sanitized data
      if (process.env.NODE_ENV === 'development') {
        throw new Error(`Data validation failed: ${validation.errors.join(', ')}`);
      }
    }
    
    return data;
  };
};
