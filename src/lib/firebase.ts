// Import the functions needed from the SDKs
import { initializeApp } from "firebase/app";
import {
  getAuth,
  signInWithEmailAndPassword,
  createUserWithEmailAndPassword,
  updateProfile,
  onAuthStateChanged,
  signOut,
} from "firebase/auth";
import { getFirestore } from "firebase/firestore";
import {
  collection as firestoreCollection,
  addDoc,
  getDocs,
  query as firestoreQuery,
  where as firestoreWhere,
  doc as firestoreDoc,
  getDoc,
  updateDoc,
  deleteDoc,
  orderBy as firestoreOrderBy,
  Timestamp,
  writeBatch,
  setDoc,
  onSnapshot,
} from "firebase/firestore";

// Firebase configuration
const firebaseConfig = {
  apiKey: "AIzaSyCEV31SHaX7G3ODUFeTutIE9BmQrepoiBQ",
  authDomain: "farmedge-4b422.firebaseapp.com",
  databaseURL: "https://farmedge-4b422-default-rtdb.firebaseio.com",
  projectId: "farmedge-4b422",
  storageBucket: "farmedge-4b422.appspot.com",
  messagingSenderId: "866830600136",
  appId: "1:866830600136:web:551c523f109cb992d962fd",
  measurementId: "G-KP2MHNWXNV",
};

// Mock Auth class for local development/testing
class MockAuth {
  currentUser = null;

  onAuthStateChanged(callback) {
    // Check localStorage for user data
    const savedUser = localStorage.getItem("user");
    if (savedUser) {
      this.currentUser = JSON.parse(savedUser);
      callback(this.currentUser);
    } else {
      this.currentUser = null;
      callback(null);
    }
    return () => {};
  }

  async signInWithEmailAndPassword(email, password) {
    // Demo user or any saved user in localStorage
    if (email === "demo@example.com" && password === "password") {
      const user = {
        uid: "1",
        email: "demo@example.com",
        displayName: "Demo User",
        photoURL: "https://api.dicebear.com/7.x/avataaars/svg?seed=demo",
      };
      localStorage.setItem("user", JSON.stringify(user));
      this.currentUser = user;
      return { user };
    }

    // Try to find user in registeredUsers
    const registeredUsers = JSON.parse(
      localStorage.getItem("registeredUsers") || "[]"
    );
    const foundUser = registeredUsers.find((u) => u.email === email);

    if (foundUser && password === "password") {
      localStorage.setItem("user", JSON.stringify(foundUser));
      this.currentUser = foundUser;
      return { user: foundUser };
    }

    throw new Error("Invalid email or password");
  }

  async createUserWithEmailAndPassword(email, password) {
    // Check if user already exists
    const registeredUsers = JSON.parse(
      localStorage.getItem("registeredUsers") || "[]"
    );
    const existingUser = registeredUsers.find((u) => u.email === email);

    if (existingUser) {
      throw new Error("Email already in use");
    }

    // Create new user
    const newUser = {
      uid: `user-${Date.now()}`,
      email,
      displayName: "",
      photoURL: null,
    };

    // Save to localStorage
    localStorage.setItem("user", JSON.stringify(newUser));
    this.currentUser = newUser;
    return { user: newUser };
  }

  async signOut() {
    localStorage.removeItem("user");
    this.currentUser = null;
  }

  async updateProfile(user, profile) {
    if (!user) {
      // Check if we have current user in localStorage
      const savedUser = localStorage.getItem("user");
      if (savedUser) {
        user = JSON.parse(savedUser);
      } else {
        throw new Error("No authenticated user found");
      }
    }

    user.displayName = profile.displayName;
    user.photoURL = profile.photoURL;

    // Update in localStorage
    localStorage.setItem("user", JSON.stringify(user));
    this.currentUser = user;

    // Update in registeredUsers if exists
    const registeredUsers = JSON.parse(
      localStorage.getItem("registeredUsers") || "[]"
    );
    const updatedUsers = registeredUsers.map((u) =>
      u.uid === user.uid
        ? { ...u, displayName: profile.displayName, photoURL: profile.photoURL }
        : u
    );

    if (!registeredUsers.find((u) => u.uid === user.uid)) {
      updatedUsers.push({
        uid: user.uid,
        email: user.email,
        displayName: profile.displayName,
        photoURL: profile.photoURL,
      });
    }

    localStorage.setItem("registeredUsers", JSON.stringify(updatedUsers));
  }
}

// Mock Firestore class for local development/testing
class MockFirestore {
  collection(collectionName) {
    return {
      addDoc: async (data) => {
        // Save to localStorage based on collection
        const id = `doc-${Date.now()}`;
        const storageKey = `${collectionName}`;
        const existingDocs = JSON.parse(
          localStorage.getItem(storageKey) || "[]"
        );

        const newDoc = {
          id,
          ...data,
        };

        // Handle date objects for localStorage
        if (data.date && typeof data.date.toDate === "function") {
          newDoc.date = new Date(data.date.toDate()).toISOString();
        } else if (data.date) {
          newDoc.date = data.date;
        } else {
          newDoc.date = new Date().toISOString();
        }

        if (data.createdAt && typeof data.createdAt.toDate === "function") {
          newDoc.createdAt = new Date(data.createdAt.toDate()).toISOString();
        } else if (data.createdAt) {
          newDoc.createdAt = data.createdAt;
        } else {
          newDoc.createdAt = new Date().toISOString();
        }

        existingDocs.push(newDoc);
        localStorage.setItem(storageKey, JSON.stringify(existingDocs));
        return { id };
      },
      getDocs: async () => {
        const storageKey = `${collectionName}`;
        const docs = JSON.parse(localStorage.getItem(storageKey) || "[]");

        return {
          forEach: (callback) => {
            docs.forEach((doc) =>
              callback({
                id: doc.id,
                data: () => doc,
                exists: () => true,
              })
            );
          },
          docs: docs.map((doc) => ({
            id: doc.id,
            data: () => doc,
            exists: () => true,
          })),
        };
      },
      doc: (docId) => ({
        get: async () => {
          const storageKey = `${collectionName}`;
          const docs = JSON.parse(localStorage.getItem(storageKey) || "[]");
          const found = docs.find((doc) => doc.id === docId);

          return {
            exists: () => !!found,
            id: docId,
            data: () => found,
          };
        },
        update: async (updates) => {
          const storageKey = `${collectionName}`;
          const docs = JSON.parse(localStorage.getItem(storageKey) || "[]");
          const updatedDocs = docs.map((doc) =>
            doc.id === docId ? { ...doc, ...updates } : doc
          );

          localStorage.setItem(storageKey, JSON.stringify(updatedDocs));
        },
      }),
      where: (field, operator, value) => ({
        orderBy: (sortField, direction) => ({
          getDocs: async () => {
            const storageKey = `${collectionName}`;
            const docs = JSON.parse(localStorage.getItem(storageKey) || "[]");

            // Filter by where condition
            let filteredDocs = docs;
            if (field && operator) {
              filteredDocs = docs.filter((doc) => {
                if (operator === "==") return doc[field] === value;
                if (operator === ">") return doc[field] > value;
                if (operator === "<") return doc[field] < value;
                if (operator === ">=") return doc[field] >= value;
                if (operator === "<=") return doc[field] <= value;
                return true;
              });
            }

            // Sort by orderBy
            if (sortField) {
              filteredDocs.sort((a, b) => {
                if (direction === "desc") {
                  return a[sortField] > b[sortField] ? -1 : 1;
                }
                return a[sortField] > b[sortField] ? 1 : -1;
              });
            }

            return {
              forEach: (callback) => {
                filteredDocs.forEach((doc) =>
                  callback({
                    id: doc.id,
                    data: () => doc,
                    exists: () => true,
                  })
                );
              },
              docs: filteredDocs.map((doc) => ({
                id: doc.id,
                data: () => doc,
                exists: () => true,
              })),
            };
          },
        }),
      }),
    };
  }
}

// Create the auth and db exports
let auth, db;

try {
  // Try to initialize real Firebase
  const firebaseApp = initializeApp(firebaseConfig);
  const firebaseAuth = getAuth(firebaseApp);
  const firebaseDb = getFirestore(firebaseApp);

  // Create real Firebase methods wrapper
  auth = {
    get currentUser() {
      return firebaseAuth.currentUser;
    },
    onAuthStateChanged: (callback) =>
      onAuthStateChanged(firebaseAuth, callback),
    signInWithEmailAndPassword: (_, email, password) =>
      signInWithEmailAndPassword(firebaseAuth, email, password),
    createUserWithEmailAndPassword: (_, email, password) =>
      createUserWithEmailAndPassword(firebaseAuth, email, password),
    updateProfile: (user, profile) => updateProfile(user, profile),
    signOut: () => signOut(firebaseAuth),
  };

  db = firebaseDb;
  console.log("Using real Firebase");
} catch (error) {
  console.warn(
    "Firebase initialization failed, using mock Firebase instead:",
    error
  );

  // Use mock implementations
  const mockAuthInstance = new MockAuth();
  const mockDbInstance = new MockFirestore();

  // Initialize mock auth by checking localStorage
  const savedUser = localStorage.getItem("user");
  if (savedUser) {
    mockAuthInstance.currentUser = JSON.parse(savedUser);
  }

  // Create mock methods wrapper
  auth = {
    get currentUser() {
      return mockAuthInstance.currentUser;
    },
    onAuthStateChanged: (callback) =>
      mockAuthInstance.onAuthStateChanged(callback),
    signInWithEmailAndPassword: (_, email, password) =>
      mockAuthInstance.signInWithEmailAndPassword(email, password),
    createUserWithEmailAndPassword: (_, email, password) =>
      mockAuthInstance.createUserWithEmailAndPassword(email, password),
    updateProfile: (user, profile) =>
      mockAuthInstance.updateProfile(user, profile),
    signOut: () => mockAuthInstance.signOut(),
  };

  db = mockDbInstance;
  console.log("Using mock Firebase");
}

// Export the auth and db objects
export { auth, db };

// Use Firebase emulators if in development
if (process.env.NODE_ENV === "development") {
  // Uncomment if you have Firebase emulators running
  // connectFirestoreEmulator(db, 'localhost', 8080);
  // connectAuthEmulator(auth, 'http://localhost:9099');
}
