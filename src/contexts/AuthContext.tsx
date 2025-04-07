import React, { createContext, useContext, useState, useEffect } from "react";
import { toast } from "sonner";
import { auth } from "@/lib/firebase";

// Define user type
export interface User {
  id: string;
  email: string;
  name: string;
  avatar?: string;
  phone?: string;
}

// Profile update type
export interface ProfileUpdate {
  displayName?: string;
  photoURL?: string;
  phoneNumber?: string;
  [key: string]: any;
}

// Define context type
interface AuthContextType {
  user: User | null;
  isAuthenticated: boolean;
  isLoading: boolean;
  login: (email: string, password: string) => Promise<boolean>;
  signup: (name: string, email: string, password: string) => Promise<boolean>;
  logout: () => Promise<void>;
  updateUserProfile: (profileData: ProfileUpdate) => Promise<boolean>;
}

// Create context
const AuthContext = createContext<AuthContextType | undefined>(undefined);

// Default avatar for new users
const DEFAULT_AVATAR = "https://api.dicebear.com/7.x/avataaars/svg?seed=";

// Sample users for demo purposes
const DEMO_USERS: User[] = [
  {
    id: "1",
    email: "demo@example.com",
    name: "Demo User",
    avatar: `${DEFAULT_AVATAR}demo`,
  },
];

export const AuthProvider: React.FC<{ children: React.ReactNode }> = ({
  children,
}) => {
  const [user, setUser] = useState<User | null>(null);
  const [isLoading, setIsLoading] = useState(true);

  useEffect(() => {
    // Listen for auth state changes
    const unsubscribe = auth.onAuthStateChanged((currentUser: any) => {
      setIsLoading(true);
      if (currentUser) {
        // Check for avatar in localStorage (for mock implementation or persisted base64)
        const savedAvatar = localStorage.getItem("userAvatar");

        // Create user object from Firebase user
        const userObj: User = {
          id: currentUser.uid,
          email: currentUser.email || "",
          name: currentUser.displayName || "",
          phone: currentUser.phoneNumber || "",
          avatar:
            savedAvatar ||
            currentUser.photoURL ||
            `${DEFAULT_AVATAR}${
              currentUser.displayName?.replace(/\s+/g, "") || currentUser.uid
            }`,
        };
        setUser(userObj);
      } else {
        setUser(null);
      }
      setIsLoading(false);
    });

    // Cleanup subscription on unmount
    return () => {
      if (typeof unsubscribe === "function") {
        unsubscribe();
      }
    };
  }, []);

  // Login function
  const login = async (email: string, password: string): Promise<boolean> => {
    try {
      setIsLoading(true);
      await auth.signInWithEmailAndPassword(null, email, password);
      toast.success("Logged in successfully");
      return true;
    } catch (error: any) {
      console.error("Login error:", error);
      toast.error(error.message || "Invalid email or password");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Signup function
  const signup = async (
    name: string,
    email: string,
    password: string
  ): Promise<boolean> => {
    try {
      setIsLoading(true);
      // Create user in auth
      const userCredential = await auth.createUserWithEmailAndPassword(
        null,
        email,
        password
      );
      const firebaseUser = userCredential.user;

      // Update profile with display name
      await auth.updateProfile(firebaseUser, {
        displayName: name,
        photoURL: `${DEFAULT_AVATAR}${name.replace(/\s+/g, "")}`,
      });

      toast.success("Account created successfully");
      return true;
    } catch (error: any) {
      console.error("Signup error:", error);
      toast.error(error.message || "An error occurred during signup");
      return false;
    } finally {
      setIsLoading(false);
    }
  };

  // Update user profile function
  const updateUserProfile = async (
    profileData: ProfileUpdate
  ): Promise<boolean> => {
    try {
      setIsLoading(true);

      if (!auth.currentUser) {
        throw new Error("No authenticated user found");
      }

      // If photoURL is provided and is a base64 string, store it directly
      if (
        profileData.photoURL &&
        profileData.photoURL.startsWith("data:image")
      ) {
        // Store base64 image in localStorage to persist between sessions
        localStorage.setItem("userAvatar", profileData.photoURL);

        // Check if photoURL exceeds Firebase's limits (approximately 1MB)
        // Firebase has internal limits for profile attributes
        if (profileData.photoURL.length > 1024 * 1024) {
          // If too long, don't send to Firebase Auth but keep in localStorage
          const updatedProfileData = { ...profileData };
          delete updatedProfileData.photoURL;

          // Update profile using Firebase Auth with the other attributes
          await auth.updateProfile(auth.currentUser, {
            displayName: updatedProfileData.displayName,
            // photoURL is omitted intentionally
          });

          // Update our local user state with the new data
          if (user) {
            const updatedUser: User = {
              ...user,
              name: profileData.displayName || user.name,
              avatar: profileData.photoURL || user.avatar, // still use the base64 in our app
              phone: profileData.phoneNumber || user.phone,
            };
            setUser(updatedUser);
          }

          return true;
        }
      }

      // Update profile using Firebase Auth
      await auth.updateProfile(auth.currentUser, {
        displayName: profileData.displayName,
        photoURL: profileData.photoURL,
        // Note: phoneNumber typically requires additional verification with Firebase
      });

      // Update our local user state with the new data
      if (user) {
        const updatedUser: User = {
          ...user,
          name: profileData.displayName || user.name,
          avatar: profileData.photoURL || user.avatar,
          phone: profileData.phoneNumber || user.phone,
        };
        setUser(updatedUser);
      }

      return true;
    } catch (error: any) {
      console.error("Profile update error:", error);
      throw error;
    } finally {
      setIsLoading(false);
    }
  };

  // Logout function
  const logout = async () => {
    try {
      await auth.signOut();
      toast.success("Logged out successfully");
    } catch (error: any) {
      console.error("Logout error:", error);
      toast.error(error.message || "An error occurred during logout");
    }
  };

  return (
    <AuthContext.Provider
      value={{
        user,
        isAuthenticated: !!user,
        isLoading,
        login,
        signup,
        logout,
        updateUserProfile,
      }}
    >
      {children}
    </AuthContext.Provider>
  );
};

// Custom hook to use auth context
export const useAuth = () => {
  const context = useContext(AuthContext);
  if (context === undefined) {
    throw new Error("useAuth must be used within an AuthProvider");
  }
  return context;
};
