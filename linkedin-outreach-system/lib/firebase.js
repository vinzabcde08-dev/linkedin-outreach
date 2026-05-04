import { initializeApp, getApps } from 'firebase/app'
import { getFirestore } from 'firebase/firestore'

const firebaseConfig = {
  apiKey: "AIzaSyATUon51FYzbe8YQJn9fK-jiyldYEcLM6M",
  authDomain: "linkedin-outreach-31ade.firebaseapp.com",
  projectId: "linkedin-outreach-31ade",
  storageBucket: "linkedin-outreach-31ade.firebasestorage.app",
  messagingSenderId: "690903347583",
  appId: "1:690903347583:web:aa05926b70f44083a12a4a",
}

// Prevent duplicate initialization in Next.js hot reload
const app = getApps().length === 0 ? initializeApp(firebaseConfig) : getApps()[0]
export const db = getFirestore(app)
export default app
