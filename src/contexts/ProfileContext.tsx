import React, { createContext, useContext, useState, useEffect } from 'react';
import { useAuth } from './AuthContext';
import toast from 'react-hot-toast';

export interface ProfileData {
  name: string;
  email: string;
  currency: string;
  timezone: string;
  avatar?: string;
  phone?: string;
  dateOfBirth?: string;
  address?: string;
  occupation?: string;
  monthlyIncome?: number;
}

interface ProfileContextType {
  profileData: ProfileData;
  updateProfile: (data: Partial<ProfileData>) => void;
  saveProfile: () => Promise<void>;
  loadProfile: () => void;
  isLoading: boolean;
}

const ProfileContext = createContext<ProfileContextType | undefined>(undefined);

export const useProfile = () => {
  const context = useContext(ProfileContext);
  if (context === undefined) {
    throw new Error('useProfile must be used within a ProfileProvider');
  }
  return context;
};

const defaultProfileData: ProfileData = {
  name: '',
  email: '',
  currency: 'INR',
  timezone: 'Asia/Kolkata',
};

export const ProfileProvider: React.FC<{ children: React.ReactNode }> = ({ children }) => {
  const { currentUser } = useAuth();
  const [profileData, setProfileData] = useState<ProfileData>(defaultProfileData);
  const [isLoading, setIsLoading] = useState(false);

  // Get user-specific storage key
  const getStorageKey = () => {
    return currentUser ? `profile_${currentUser.uid}` : 'profile_guest';
  };

  // Load profile from localStorage
  const loadProfile = () => {
    try {
      const storageKey = getStorageKey();
      const savedProfile = localStorage.getItem(storageKey);
      
      if (savedProfile) {
        const parsedProfile = JSON.parse(savedProfile);
        setProfileData({ ...defaultProfileData, ...parsedProfile });
      } else {
        // Initialize with user email if available
        setProfileData({
          ...defaultProfileData,
          email: currentUser?.email || '',
          name: currentUser?.displayName || currentUser?.email?.split('@')[0] || '',
        });
      }
    } catch (error) {
      console.error('Failed to load profile from localStorage:', error);
      setProfileData({
        ...defaultProfileData,
        email: currentUser?.email || '',
        name: currentUser?.displayName || currentUser?.email?.split('@')[0] || '',
      });
    }
  };

  // Save profile to localStorage
  const saveToLocalStorage = (data: ProfileData) => {
    try {
      const storageKey = getStorageKey();
      localStorage.setItem(storageKey, JSON.stringify(data));
    } catch (error) {
      console.error('Failed to save profile to localStorage:', error);
    }
  };

  // Update profile data
  const updateProfile = (data: Partial<ProfileData>) => {
    setProfileData(prev => ({ ...prev, ...data }));
  };

  // Save profile (with validation)
  const saveProfile = async (): Promise<void> => {
    setIsLoading(true);
    try {
      // Validate required fields
      if (!profileData.name.trim()) {
        throw new Error('Name is required');
      }
      if (!profileData.email.trim()) {
        throw new Error('Email is required');
      }
      
      // Email validation
      const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
      if (!emailRegex.test(profileData.email)) {
        throw new Error('Please enter a valid email address');
      }

      // Save to localStorage
      saveToLocalStorage(profileData);
      
      // Here you could also sync with backend if needed
      // await apiService.updateProfile(profileData);
      
      toast.success('Profile updated successfully!');
    } catch (error) {
      const errorMessage = error instanceof Error ? error.message : 'Failed to save profile';
      toast.error(errorMessage);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Load profile when user changes or component mounts
  useEffect(() => {
    loadProfile();
  }, [currentUser]);

  // Auto-save profile data to localStorage when it changes
  useEffect(() => {
    if (profileData.name || profileData.email) {
      saveToLocalStorage(profileData);
    }
  }, [profileData]);

  const value: ProfileContextType = {
    profileData,
    updateProfile,
    saveProfile,
    loadProfile,
    isLoading,
  };

  return (
    <ProfileContext.Provider value={value}>
      {children}
    </ProfileContext.Provider>
  );
};