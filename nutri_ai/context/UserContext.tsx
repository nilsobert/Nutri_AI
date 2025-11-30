import React, { createContext, useContext, useState, useEffect } from "react";
import { StorageService } from "../services/storage";
import { User } from "../types/user";

interface UserContextType {
  profileImage: string | null;
  setProfileImage: (image: string | null) => Promise<void>;
  user: User | null;
  setUser: (user: User | null) => void;
  saveUser: (user: User) => Promise<void>;
  logout: () => Promise<void>;
  isLoading: boolean;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profileImage, setProfileImage] = useState<string | null>(null);
  const [user, setUserState] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    loadData();
  }, []);

  const loadData = async () => {
    setIsLoading(true);
    try {
      const [loadedImage, loadedUser] = await Promise.all([
        StorageService.loadProfileImage(),
        StorageService.loadUser(),
      ]);

      if (loadedImage) {
        setProfileImage(loadedImage);
      }
      if (loadedUser) {
        setUserState(loadedUser);
      }
    } catch (error) {
      console.error("Failed to load user data", error);
    } finally {
      setIsLoading(false);
    }
  };

  const updateProfileImage = async (image: string | null) => {
    setProfileImage(image);
    if (image) {
      await StorageService.saveProfileImage(image);
    } else {
      await StorageService.removeProfileImage();
    }
  };

  const saveUser = async (newUser: User) => {
    setUserState(newUser);
    await StorageService.saveUser(newUser);
  };

  const logout = async () => {
    setUserState(null);
    setProfileImage(null);
    await StorageService.clearUser();
    await StorageService.removeProfileImage();
    // Optionally clear meals too if they are user-specific and we want to wipe data on logout
    // await StorageService.clearAll(); 
  };

  return (
    <UserContext.Provider
      value={{
        profileImage,
        setProfileImage: updateProfileImage,
        user,
        setUser: setUserState,
        saveUser,
        logout,
        isLoading,
      }}
    >
      {children}
    </UserContext.Provider>
  );
}

export function useUser() {
  const context = useContext(UserContext);
  if (context === undefined) {
    throw new Error("useUser must be used within a UserProvider");
  }
  return context;
}
