/* eslint-disable @typescript-eslint/no-explicit-any, @typescript-eslint/no-unused-vars */
'use client';

import { useState } from 'react';
import { Camera } from 'lucide-react';
import { auth, db, storage } from '@/lib/firebase/config';
import { 
  signInWithEmailAndPassword, 
  createUserWithEmailAndPassword,
  signInAnonymously,
  updateProfile
} from 'firebase/auth';
import { doc, setDoc, getDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { toast } from 'sonner';
import { useRouter } from 'next/navigation';
import Image from 'next/image';

export default function LoginPage() {
  const [isRegister, setIsRegister] = useState(false);
  const [loading, setLoading] = useState(false);
  const [profilePic, setProfilePic] = useState<File | null>(null);
  const router = useRouter();

  const handleLogin = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = (formData.get('email') as string).trim();
    const password = formData.get('password') as string;

    // Backward compatibility for legacy "Time1" guest login
    if (password === 'Time1') {
      return handleGuestLogin(email);
    }

    setLoading(true);
    try {
      let userCredential = null;
      try {
        userCredential = await signInWithEmailAndPassword(auth, email, password);
      } catch (authError: any) {
        // If login fails in Firebase Auth, check legacy Firestore
        try {
          const legacyUserDoc = await getDoc(doc(db, 'users', email));
          if (legacyUserDoc.exists()) {
            if (legacyUserDoc.data().password === password) {
              // Password matches legacy DB, attempt migration
              userCredential = await createUserWithEmailAndPassword(auth, email, password);
            } else {
              throw new Error('รหัสผ่านไม่ถูกต้อง (อ้างอิงจากฐานข้อมูลเดิม)');
            }
          } else {
            // User not found in legacy DB either, throw original auth error
            throw authError;
          }
        } catch (dbError: any) {
           // If error is from our throw, re-throw it. Otherwise it's a DB error.
           if (dbError.message?.includes('รหัสผ่านไม่ถูกต้อง')) throw dbError;
           if (dbError.code === 'auth/email-already-in-use') throw new Error('บัญชีนี้ถูกโอนย้ายแล้ว แต่รหัสผ่านไม่ถูกต้อง');
           if (dbError.code === 'auth/weak-password') throw dbError; // <--- This ensures the weak password error bubbles up
           throw authError;
        }
      }
      
      // Check status
      const userDoc = await getDoc(doc(db, 'users', userCredential.user.email!));
      if (userDoc.exists()) {
        const userData = userDoc.data();
        if (userData.status === 'pending') {
          toast.error("บัญชีของคุณกำลังรอการอนุมัติจาก System Admin");
          await auth.signOut();
          setLoading(false);
          return;
        }
        if (userData.status === 'banned') {
          toast.error("บัญชีของคุณถูกระงับการใช้งาน ติดต่อ Admin");
          await auth.signOut();
          setLoading(false);
          return;
        }
      }
      
      toast.success('เข้าสู่ระบบสำเร็จ');
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Login Error:", error);
      if (error.code === 'auth/weak-password') {
        toast.error('รหัสผ่านเดิมสั้นกว่า 6 ตัวอักษร โปรดติดต่อ Admin');
      } else if (error.code === 'auth/invalid-credential' || error.code === 'auth/user-not-found') {
        toast.error('ไม่พบบัญชีนี้ในระบบ หรือ รหัสผ่านไม่ถูกต้อง');
      } else {
        toast.error(error.message || 'เกิดข้อผิดพลาดในการเข้าสู่ระบบ');
      }
    }
    setLoading(false);
  };

  const handleGuestLogin = async (guestEmail: string) => {
    setLoading(true);
    try {
      const systemConfigDoc = await getDoc(doc(db, 'system_config', 'settings'));
      if (systemConfigDoc.exists() && systemConfigDoc.data().allowGuestAccess === false) {
        toast.error('ระบบ Guest เข้าใช้งานชั่วคราวถูกปิดโดย Admin');
        setLoading(false);
        return;
      }
      
      let userCred;
      const firebasePassword = 'Time1!'; // เติม ! เพื่อให้ครบ 6 ตัวอักษรตามกฎของ Firebase
      try {
        // ลองล็อกอินด้วยอีเมลที่พิมพ์เข้ามา + รหัส Time1!
        userCred = await signInWithEmailAndPassword(auth, guestEmail, firebasePassword);
      } catch (signInError: any) {
        // ถ้าไม่มีบัญชีนี้ หรือรหัสผ่านผิด (กรณีที่อีเมลนี้ยังไม่มีในระบบ)
        if (
          signInError.code === 'auth/user-not-found' || 
          signInError.code === 'auth/invalid-credential' || 
          signInError.code === 'auth/invalid-login-credentials'
        ) {
          try {
            // สร้างบัญชีใหม่ให้เลยอัตโนมัติ
            userCred = await createUserWithEmailAndPassword(auth, guestEmail, firebasePassword);
            await updateProfile(userCred.user, { displayName: guestEmail });
            
            // สร้างข้อมูลลง Firestore ระบุว่าเป็น guest
            await setDoc(doc(db, 'users', guestEmail), {
              name: guestEmail,
              email: guestEmail,
              role: 'guest',
              status: 'active',
              createdAt: new Date().toISOString()
            });
          } catch (createError: any) {
             if (createError.code === 'auth/email-already-in-use') {
               throw new Error('อีเมลนี้มีอยู่ในระบบแล้วแต่ไม่ใช่รหัส Time1 โปรดใช้อีเมลอื่น');
             }
             throw createError;
          }
        } else {
          throw signInError;
        }
      }
      
      toast.success('เข้าสู่ระบบแบบ Guest สำเร็จ');
      router.push('/dashboard');
    } catch (error: any) {
      console.error("Guest Login Error:", error);
      toast.error('เกิดข้อผิดพลาดในการเข้าสู่ระบบแบบ Guest: ' + error.message);
    }
    setLoading(false);
  };

  const handleRegister = async (e: React.FormEvent<HTMLFormElement>) => {
    e.preventDefault();
    const formData = new FormData(e.currentTarget);
    const email = formData.get('email') as string;
    const password = formData.get('password') as string;
    const confirmPassword = formData.get('confirmPassword') as string;
    const firstName = formData.get('firstName') as string;
    const lastName = formData.get('lastName') as string;
    const title = formData.get('title') as string;

    if (password !== confirmPassword) {
      toast.error('รหัสผ่านและการยืนยันรหัสผ่านไม่ตรงกัน');
      return;
    }
    if (password.length < 6) {
      toast.error('รหัสผ่านต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setLoading(true);
    try {
      const userCredential = await createUserWithEmailAndPassword(auth, email, password);
      
      let picUrl = '';
      if (profilePic) {
        const fileRef = ref(storage, `users/profiles/${email}`);
        await uploadBytes(fileRef, profilePic);
        picUrl = await getDownloadURL(fileRef);
      }

      // We will make the first user an admin automatically, else user
      // Note: In a real app we'd use cloud functions to check total users, but for this prototype we'll assume not first if any error.
      // We will default to 'pending' unless we have a specific way to check.
      // Let's keep it simple: all new users are pending.
      
      const newUser = {
        firstName,
        lastName,
        name: `${firstName} ${lastName}`,
        title,
        email,
        profilePicUrl: picUrl,
        role: 'user', // For prototype, hardcode user role. Admin can change it.
        status: 'pending',
        createdAt: new Date().toISOString()
      };

      await setDoc(doc(db, 'users', email), newUser);
      
      toast.success('ลงทะเบียนสำเร็จ! โปรดรอ Admin อนุมัติการเข้าใช้งาน');
      setIsRegister(false);
      setProfilePic(null);
      await auth.signOut(); // Sign out since they are pending
    } catch (error: any) {
      if (error.code === 'auth/email-already-in-use') {
        toast.error('อีเมลนี้ถูกใช้งานแล้วในระบบ');
      } else {
        toast.error('เกิดข้อผิดพลาด: ' + error.message);
      }
    }
    setLoading(false);
  };

  return (
    <div className="flex h-screen items-center justify-center bg-slate-100 p-4">
      <div className="bg-white p-10 rounded-2xl shadow-xl w-full max-w-md animate-in fade-in zoom-in duration-300 relative overflow-hidden">
        {loading && (
          <div className="absolute inset-0 bg-white/80 z-10 flex items-center justify-center backdrop-blur-sm">
            <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
          </div>
        )}
        
        <div className="flex justify-center mb-6">
          <div className="bg-white p-3 rounded-2xl shadow-sm border border-slate-100 w-28 h-28 mx-auto flex items-center justify-center overflow-hidden relative">
            <Image src="https://static.wixstatic.com/media/141293_f2c1ef4fe5474172b75fe05846c6c713~mv2.jpg" alt="Logo" fill className="object-contain p-2" unoptimized />
          </div>
        </div>
        <h2 className="text-xl font-black mb-2 text-center text-slate-800">Time Consulting Partner Management</h2>
        <p className="text-slate-500 text-sm mb-6 text-center">
          {isRegister ? 'ลงทะเบียนเพื่อขอสิทธิ์เข้าใช้งานระบบ' : 'ลงชื่อเข้าใช้เพื่อบริหารจัดการ Vendor'}
        </p>
        
        {!isRegister ? (
          <form onSubmit={handleLogin} className="space-y-4">
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">อีเมลองค์กร</label>
              <input name="email" type="email" required placeholder="อีเมลของคุณ" className="w-full border rounded-xl p-3.5 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition" />
            </div>
            <div>
              <label className="block text-sm font-bold text-slate-700 mb-1">รหัสผ่าน</label>
              <input name="password" type="password" required placeholder="รหัสผ่านเข้าสู่ระบบ" className="w-full border rounded-xl p-3.5 outline-none focus:border-blue-500 bg-slate-50 focus:bg-white transition" />
            </div>
            <button type="submit" className="w-full bg-blue-600 hover:bg-blue-700 transition-colors text-white font-bold py-3.5 rounded-xl shadow-lg mt-2">เข้าสู่ระบบ</button>
            <p className="text-center text-sm font-semibold text-slate-500 mt-6">
              ยังไม่มีบัญชี? <span onClick={() => setIsRegister(true)} className="text-blue-600 cursor-pointer hover:underline">ลงทะเบียนที่นี่</span>
            </p>
          </form>
        ) : (
          <form onSubmit={handleRegister} className="space-y-4 max-h-[400px] overflow-y-auto px-1 -mx-1 custom-scrollbar">
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ชื่อจริง *</label>
                <input name="firstName" required type="text" className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">นามสกุล *</label>
                <input name="lastName" required type="text" className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">ตำแหน่งงาน *</label>
              <input name="title" required type="text" placeholder="เช่น Business Analyst" className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">อีเมล (ใช้ Login) *</label>
              <input name="email" required type="email" placeholder="example@timeconsulting.com" className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
            </div>
            <div className="grid grid-cols-2 gap-3">
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">รหัสผ่าน *</label>
                <input name="password" required type="password" minLength={6} className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold text-slate-700 mb-1">ยืนยันรหัสผ่าน *</label>
                <input name="confirmPassword" required type="password" minLength={6} className="w-full border rounded-xl p-2.5 text-sm outline-none focus:border-blue-500 bg-slate-50 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold text-slate-700 mb-1">รูปโปรไฟล์ (ตัวเลือก)</label>
              <div className="flex items-center gap-3">
                <div className="w-12 h-12 rounded-full bg-slate-200 border flex items-center justify-center overflow-hidden shrink-0">
                  {profilePic ? (
                    // eslint-disable-next-line @next/next/no-img-element
                    <img src={URL.createObjectURL(profilePic)} className="w-full h-full object-cover" alt="Profile" />
                  ) : (
                    <Camera size={20} className="text-slate-400" />
                  )}
                </div>
                <input type="file" accept="image/*" onChange={e => setProfilePic(e.target.files?.[0] || null)} className="text-xs w-full" />
              </div>
            </div>
            <button type="submit" className="w-full bg-slate-900 hover:bg-slate-800 transition-colors text-white font-bold py-3.5 rounded-xl shadow-lg mt-4">สมัครสมาชิก</button>
            <p className="text-center text-sm font-semibold text-slate-500 mt-4 pb-4">
              มีบัญชีอยู่แล้ว? <span onClick={() => setIsRegister(false)} className="text-blue-600 cursor-pointer hover:underline">กลับไปหน้า Login</span>
            </p>
          </form>
        )}
      </div>
    </div>
  );
}
