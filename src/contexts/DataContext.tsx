import React, { createContext, useContext, useState, useCallback } from 'react';
import type { ReactNode } from 'react';
import type { Camera, User, Incident, AttendanceRecord } from '../types';
import { useAsyncState } from '../hooks/useAsyncState';

// Data context interface
interface DataContextType {
  // Camera data
  cameras: Camera[] | null;
  camerasLoading: boolean;
  camerasError: Error | null;
  loadCameras: (fetchFn: () => Promise<Camera[]>) => Promise<void>;
  refreshCameras: () => void;
  
  // User data
  users: User[] | null;
  usersLoading: boolean;
  usersError: Error | null;
  loadUsers: (fetchFn: () => Promise<User[]>) => Promise<void>;
  refreshUsers: () => void;
  
  // Incident data
  incidents: Incident[] | null;
  incidentsLoading: boolean;
  incidentsError: Error | null;
  loadIncidents: (fetchFn: () => Promise<Incident[]>) => Promise<void>; 
  refreshIncidents: () => void;
  
  // Attendance data
  attendance: AttendanceRecord[] | null;
  attendanceLoading: boolean;
  attendanceError: Error | null;
  loadAttendance: (fetchFn: () => Promise<AttendanceRecord[]>) => Promise<void>;
  refreshAttendance: () => void;
  
  // Global refresh
  refreshAllData: () => void;
}

const DataContext = createContext<DataContextType | undefined>(undefined);

interface DataProviderProps {
  children: ReactNode;
}

export const DataProvider: React.FC<DataProviderProps> = ({ children }) => {
  // Camera state
  const {
    data: cameras,
    loading: camerasLoading,
    error: camerasError,
    execute: loadCameras
  } = useAsyncState<Camera[]>({ initialData: null });

  // User state
  const {
    data: users,
    loading: usersLoading,
    error: usersError,
    execute: loadUsers
  } = useAsyncState<User[]>({ initialData: null });

  // Incident state
  const {
    data: incidents,
    loading: incidentsLoading,
    error: incidentsError,
    execute: loadIncidents
  } = useAsyncState<Incident[]>({ initialData: null });

  // Attendance state
  const {
    data: attendance,
    loading: attendanceLoading,
    error: attendanceError,
    execute: loadAttendance
  } = useAsyncState<AttendanceRecord[]>({ initialData: null });

  // Store fetch functions for refresh
  const [fetchFunctions, setFetchFunctions] = useState<{
    cameras?: () => Promise<Camera[]>;
    users?: () => Promise<User[]>;
    incidents?: () => Promise<Incident[]>;
    attendance?: () => Promise<AttendanceRecord[]>;
  }>({});

  // Refresh functions
  const refreshCameras = useCallback(() => {
    if (fetchFunctions.cameras) {
      loadCameras(fetchFunctions.cameras);
    }
  }, [fetchFunctions.cameras, loadCameras]);

  const refreshUsers = useCallback(() => {
    if (fetchFunctions.users) {
      loadUsers(fetchFunctions.users);
    }
  }, [fetchFunctions.users, loadUsers]);

  const refreshIncidents = useCallback(() => {
    if (fetchFunctions.incidents) {
      loadIncidents(fetchFunctions.incidents);
    }
  }, [fetchFunctions.incidents, loadIncidents]);

  const refreshAttendance = useCallback(() => {
    if (fetchFunctions.attendance) {
      loadAttendance(fetchFunctions.attendance);
    }
  }, [fetchFunctions.attendance, loadAttendance]);

  const refreshAllData = useCallback(() => {
    refreshCameras();
    refreshUsers();
    refreshIncidents();
    refreshAttendance();
  }, [refreshCameras, refreshUsers, refreshIncidents, refreshAttendance]);

  // Enhanced load functions that store fetch functions for refresh
  const enhancedLoadCameras = useCallback(async (fetchFn: () => Promise<Camera[]>) => {
    setFetchFunctions(prev => ({ ...prev, cameras: fetchFn }));
    return loadCameras(fetchFn);
  }, [loadCameras]);

  const enhancedLoadUsers = useCallback(async (fetchFn: () => Promise<User[]>) => {
    setFetchFunctions(prev => ({ ...prev, users: fetchFn }));
    return loadUsers(fetchFn);
  }, [loadUsers]);

  const enhancedLoadIncidents = useCallback(async (fetchFn: () => Promise<Incident[]>) => {
    setFetchFunctions(prev => ({ ...prev, incidents: fetchFn }));
    return loadIncidents(fetchFn);
  }, [loadIncidents]);

  const enhancedLoadAttendance = useCallback(async (fetchFn: () => Promise<AttendanceRecord[]>) => {
    setFetchFunctions(prev => ({ ...prev, attendance: fetchFn }));
    return loadAttendance(fetchFn);
  }, [loadAttendance]);

  const value: DataContextType = {
    // Camera data
    cameras,
    camerasLoading,
    camerasError,
    loadCameras: enhancedLoadCameras,
    refreshCameras,
    
    // User data
    users,
    usersLoading,
    usersError,
    loadUsers: enhancedLoadUsers,
    refreshUsers,
    
    // Incident data
    incidents,
    incidentsLoading,
    incidentsError,
    loadIncidents: enhancedLoadIncidents,
    refreshIncidents,
    
    // Attendance data
    attendance,
    attendanceLoading,
    attendanceError,
    loadAttendance: enhancedLoadAttendance,
    refreshAttendance,
    
    // Global refresh
    refreshAllData,
  };

  return (
    <DataContext.Provider value={value}>
      {children}
    </DataContext.Provider>
  );
};

export const useDataContext = (): DataContextType => {
  const context = useContext(DataContext);
  if (context === undefined) {
    throw new Error('useDataContext must be used within a DataProvider');
  }
  return context;
};
