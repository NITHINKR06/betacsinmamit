import { initializeApp } from 'firebase/app';
import { getAuth, GoogleAuthProvider } from 'firebase/auth';
import { 
  getFirestore, 
  initializeFirestore,
  doc as firebaseDoc,
  setDoc as firebaseSetDoc,
  getDoc as firebaseGetDoc,
  updateDoc as firebaseUpdateDoc,
  serverTimestamp as firebaseServerTimestamp,
  collection as firebaseCollection 
} from 'firebase/firestore';
import { getStorage } from 'firebase/storage';

// --- Mock Firestore Implementation for Demo Mode ---
const mockFirestore = {
  // Mock collection reference
  collection: (name) => ({
    _name: name,
    // Mock doc reference
    doc: (id) => ({
      _id: id,
      _path: `${name}/${id}`,
      // Mock setDoc
      set: async (data, options) => {
        console.log(`[Mock Firestore] Setting doc ${name}/${id}:`, data, options);
        // Simulate potential errors based on data (e.g., if data contains undefined)
        if (Object.values(data).some(v => v === undefined)) {
           throw new Error("Mock Firestore Error: Function setDoc() called with invalid data. Unsupported field value: undefined");
        }
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
        return Promise.resolve();
      },
      // Mock getDoc
      get: async () => {
        console.log(`[Mock Firestore] Getting doc ${name}/${id}`);
        await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
        // Simulate finding or not finding the doc
        if (id.startsWith('nonexistent')) {
          return Promise.resolve({ exists: () => false, data: () => undefined });
        }
        // Simulate returning some data for adminOTPs
         if (name === 'adminOTPs') {
           return Promise.resolve({
             exists: () => true,
             data: () => ({
               otp: 'mockHashedOtp', // Return a consistent mock hash
               email: decodeURIComponent(id), // Decode the ID back to email for data
               expiryTime: Date.now() + 10 * 60 * 1000, // Expires in 10 mins
               used: false,
               createdAt: new Date(),
               attempts: 0
             })
           });
         }
        return Promise.resolve({ 
          exists: () => true, 
          data: () => ({ mockField: 'mockValue', id: id }) 
        });
      },
       // Mock updateDoc
      update: async (data) => {
         console.log(`[Mock Firestore] Updating doc ${name}/${id}:`, data);
         await new Promise(resolve => setTimeout(resolve, 50)); // Simulate async
          // Simulate potential errors based on data (e.g., if data contains undefined)
         if (Object.values(data).some(v => v === undefined)) {
            throw new Error("Mock Firestore Error: Function updateDoc() called with invalid data. Unsupported field value: undefined");
         }
         return Promise.resolve();
      }
    }),
  }),
};

// --- Determine Mode and Initialize ---

// Check if Firebase config is available
const hasFirebaseConfig = import.meta.env.VITE_FIREBASE_API_KEY && 
                          import.meta.env.VITE_FIREBASE_API_KEY !== 'your_firebase_api_key_here';

let app, auth, googleProvider, db, storage, isDemoMode;
// Declare variables for Firestore functions (will hold real or mock)
let doc, setDoc, getDoc, updateDoc, serverTimestamp, collection;

if (hasFirebaseConfig) {
  // --- Use REAL Firebase configuration ---
  console.log('🔥 Using Firebase configuration');
  isDemoMode = false;
  
  const firebaseConfig = {
    apiKey: import.meta.env.VITE_FIREBASE_API_KEY,
    authDomain: import.meta.env.VITE_FIREBASE_AUTH_DOMAIN,
    projectId: import.meta.env.VITE_FIREBASE_PROJECT_ID,
    storageBucket: import.meta.env.VITE_FIREBASE_STORAGE_BUCKET,
    messagingSenderId: import.meta.env.VITE_FIREBASE_MESSAGING_SENDER_ID,
    appId: import.meta.env.VITE_FIREBASE_APP_ID,
    measurementId: import.meta.env.VITE_FIREBASE_MEASUREMENT_ID
  };

  // Initialize Firebase App
  app = initializeApp(firebaseConfig);

  // Initialize Real Firebase Services
  auth = getAuth(app);
  googleProvider = new GoogleAuthProvider();
  storage = getStorage(app);
  
  // Initialize Real Firestore with networking settings
  try {
    db = initializeFirestore(app, {
      experimentalAutoDetectLongPolling: false, // <-- Set this to false
      useFetchStreams: false,
      experimentalForceLongPolling: true, // Force long polling to avoid WebChannel issues
      cacheSizeBytes: 1048576 // 1 MB cache
    });
    console.log('✅ Firestore initialized with long polling enabled');
  } catch (e) {
    console.warn("Firestore initialization with options failed, falling back:", e);
    try {
      db = getFirestore(app); // Fallback initialization
      console.log('✅ Firestore initialized with default settings');
    } catch (fallbackError) {
      console.error('❌ Firestore initialization completely failed:', fallbackError);
      // Set a flag to indicate Firestore is not available
      window.__FIRESTORE_UNAVAILABLE__ = true;
    }
  }
  
  // Add connection state monitoring
  if (db && typeof window !== 'undefined') {
    // Monitor online/offline status
    window.addEventListener('online', () => {
      console.log('🌐 Network connection restored');
      window.__NETWORK_ONLINE__ = true;
    });
    
    window.addEventListener('offline', () => {
      console.warn('⚠️ Network connection lost');
      window.__NETWORK_ONLINE__ = false;
    });
    
    // Set initial state
    window.__NETWORK_ONLINE__ = navigator.onLine;
  }
  
  // Assign REAL Firestore functions
  doc = firebaseDoc;
  setDoc = firebaseSetDoc;
  getDoc = firebaseGetDoc;
  updateDoc = firebaseUpdateDoc;
  serverTimestamp = firebaseServerTimestamp;
  collection = firebaseCollection;

  // Configure Google Auth Provider
  googleProvider.setCustomParameters({
    prompt: 'select_account'
  });
  
  console.log('✅ Firebase initialized successfully');

} else {
  // --- Use MOCK configuration (Demo Mode) ---
  console.warn('⚠️ Firebase configuration not found. Running in DEMO mode.');
  console.info('📖 Some features may not work as expected in DEMO mode.');
  isDemoMode = true;

  // Assign Mock Objects/Functions
  app = null; // No real app
  auth = { // Mock auth object with minimal methods to avoid errors
      currentUser: null,
      onAuthStateChanged: (callback) => { 
          console.log("[Mock Auth] onAuthStateChanged listener attached");
          setTimeout(() => callback(null), 100); // Simulate no user initially
          return () => console.log("[Mock Auth] onAuthStateChanged listener detached"); // Return unsubscribe function
      },
      signInWithPopup: async () => {
          console.log("[Mock Auth] signInWithPopup called");
          await new Promise(resolve => setTimeout(resolve, 500)); // Simulate delay
           // Simulate a successful login for demo
           const mockUser = {
              uid: 'mockAdminUid123',
              email: 'admin@example.com', // Use an email that passes whitelist if needed
              displayName: 'Mock Admin',
              photoURL: 'https://via.placeholder.com/150'
           };
          return Promise.resolve({ user: mockUser });
      },
      signInWithRedirect: async () => {
          console.log("[Mock Auth] signInWithRedirect called - Simulating redirect...");
           // In a real redirect, the page would reload. We simulate the state change.
           // For simplicity in mock, let's assume redirect leads to popup success state
           await new Promise(resolve => setTimeout(resolve, 500)); 
           // In a real scenario, getRedirectResult would handle this after reload
           return Promise.resolve();
      },
       getRedirectResult: async () => {
          console.log("[Mock Auth] getRedirectResult called - No result in mock");
           // Simulate no redirect result unless specifically set up for testing
          return Promise.resolve(null);
       },
      signOut: async () => {
          console.log("[Mock Auth] signOut called");
          auth.currentUser = null; // Update mock state
          return Promise.resolve();
      }
  };
  googleProvider = null; // No real provider needed for mock
  storage = null; // No real storage
  db = mockFirestore; // Use the mock Firestore object

  // Assign MOCK Firestore function wrappers
  // These wrappers call methods on our mockFirestore object
  doc = (mockDb, collectionName, id) => mockDb.collection(collectionName).doc(id);
  setDoc = (docRef, data, options) => docRef.set(data, options);
  getDoc = (docRef) => docRef.get();
  updateDoc = (docRef, data) => docRef.update(data);
  serverTimestamp = () => new Date(); // Use standard Date in demo mode
  collection = (mockDb, name) => mockDb.collection(name);
}

// Export all potentially mocked services and functions
export { 
  app, 
  auth, 
  googleProvider, 
  db, 
  storage, 
  isDemoMode, 
  // Export the correct functions (real or mock wrappers)
  doc, 
  setDoc, 
  getDoc, 
  updateDoc, 
  serverTimestamp, 
  collection 
};

// Default export (optional, depends on usage)
export default app; 
