import React, { createContext, useContext, useState, useEffect } from "react";
import AsyncStorage from "@react-native-async-storage/async-storage";

interface UserContextType {
  profileImage: string | null;
  setProfileImage: (image: string | null) => void;
}

const UserContext = createContext<UserContextType | undefined>(undefined);

export function UserProvider({ children }: { children: React.ReactNode }) {
  const [profileImage, setProfileImage] = useState<string | null>(null);

  useEffect(() => {
    // Load profile image from storage on mount
    AsyncStorage.getItem("profileImage").then((image) => {
      if (image) {
        setProfileImage(image);
      }
    });
  }, []);

  const updateProfileImage = async (image: string | null) => {
    setProfileImage(image);
    if (image) {
      await AsyncStorage.setItem("profileImage", image);
    } else {
      await AsyncStorage.removeItem("profileImage");
    }
  };

  return (
    <UserContext.Provider
      value={{ profileImage, setProfileImage: updateProfileImage }}
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
