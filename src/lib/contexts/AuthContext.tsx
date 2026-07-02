'use client';

import { createContext, useContext, useEffect, useState } from 'react';
import { User, onAuthStateChanged, signOut as firebaseSignOut } from 'firebase/auth';
import { auth, db } from '../firebase/config';
import { doc, getDoc } from 'firebase/firestore';
import { useRouter, usePathname } from 'next/navigation';
import { toast } from 'sonner';

interface UserProfile {
  name: string;
  email: string;
  title: string;
  role: 'user' | 'admin';
  status: 'active' | 'pending' | 'banned';
  profilePicUrl?: string;
  isGuest?: boolean;
}

interface AuthContextType {
  user: User | null;
  profile: UserProfile | null;
  loading: boolean;
  signOut: () => Promise<void>;
}

const AuthContext = createContext<AuthContextType>({
  user: null,
  profile: null,
  loading: true,
  signOut: async () => {},
});

export const useAuth = () => useContext(AuthContext);

export function AuthProvider({ children }: { children: React.ReactNode }) {
  const [user, setUser] = useState<User | null>(null);
  const [profile, setProfile] = useState<UserProfile | null>(null);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const pathname = usePathname();

  useEffect(() => {
    const unsubscribe = onAuthStateChanged(auth, async (currentUser) => {
      setUser(currentUser);
      if (currentUser) {
        if (currentUser.isAnonymous) {
           setProfile({
             name: 'Guest User',
             email: 'guest@timeconsulting.com',
             title: 'Guest',
             role: 'user',
             status: 'active',
             isGuest: true
           });
           setLoading(false);
           if (pathname === '/login') {
             router.push('/dashboard');
           }
           return;
        }

        try {
          // Fetch user profile from Firestore users collection (doc ID is email)
          if (currentUser.email) {
             const userDoc = await getDoc(doc(db, 'users', currentUser.email));
             if (userDoc.exists()) {
               setProfile(userDoc.data() as UserProfile);
             } else {
               // Fallback if not found in db yet
               setProfile({
                 name: currentUser.displayName || 'Unknown User',
                 email: currentUser.email,
                 title: '',
                 role: 'user',
                 status: 'pending'
               });
             }
          }
        } catch (error) {
          console.error("Error fetching user profile:", error);
        }
      } else {
        setProfile(null);
        if (pathname !== '/login') {
          router.push('/login');
        }
      }
      setLoading(false);
    });

    return () => unsubscribe();
  }, [pathname, router]);

  const signOut = async () => {
    try {
      await firebaseSignOut(auth);
      toast.success('ออกจากระบบสำเร็จ');
      router.push('/login');
    } catch {
      toast.error('เกิดข้อผิดพลาดในการออกจากระบบ');
    }
  };

  return (
    <AuthContext.Provider value={{ user, profile, loading, signOut }}>
      {children}
    </AuthContext.Provider>
  );
}
