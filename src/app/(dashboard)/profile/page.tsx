'use client';

import { useState, useRef } from 'react';
import { useAuth } from '@/lib/contexts/AuthContext';
import { db, storage } from '@/lib/firebase/config';
import { doc, updateDoc, setDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { updateProfile, updatePassword, EmailAuthProvider, reauthenticateWithCredential } from 'firebase/auth';
import { toast } from 'sonner';
import { Camera, Save, KeyRound, Loader2, User } from 'lucide-react';
import Image from 'next/image';

export default function ProfilePage() {
  const { profile, user } = useAuth();
  
  // States for Personal Info
  const [firstName, setFirstName] = useState((profile as unknown as Record<string, unknown>)?.firstName as string || '');
  const [lastName, setLastName] = useState((profile as unknown as Record<string, unknown>)?.lastName as string || '');
  const [displayName, setDisplayName] = useState(profile?.name || '');
  const [title, setTitle] = useState(profile?.title || '');
  const [isUpdatingInfo, setIsUpdatingInfo] = useState(false);

  // States for Profile Picture
  const [isUploading, setIsUploading] = useState(false);
  const fileInputRef = useRef<HTMLInputElement>(null);

  // States for Password Change
  const [currentPassword, setCurrentPassword] = useState('');
  const [newPassword, setNewPassword] = useState('');
  const [confirmPassword, setConfirmPassword] = useState('');
  const [isChangingPassword, setIsChangingPassword] = useState(false);

  const handleUpdateInfo = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user || !profile) return;
    
    setIsUpdatingInfo(true);
    try {
      const userRef = doc(db, 'users', profile.email);
      await setDoc(userRef, {
        firstName,
        lastName,
        name: displayName,
        title
      }, { merge: true });

      // Update auth profile
      await updateProfile(user, {
        displayName: displayName
      });

      toast.success('อัปเดตข้อมูลส่วนตัวสำเร็จ');
    } catch (error: unknown) {
      toast.error('ไม่สามารถอัปเดตข้อมูลได้: ' + (error as Error).message);
    }
    setIsUpdatingInfo(false);
  };

  const handleFileChange = async (e: React.ChangeEvent<HTMLInputElement>) => {
    const file = e.target.files?.[0];
    if (!file || !user || !profile) return;

    if (file.size > 5 * 1024 * 1024) {
      toast.error('ไฟล์รูปภาพต้องมีขนาดไม่เกิน 5MB');
      return;
    }

    setIsUploading(true);
    try {
      const storageRef = ref(storage, `users/profiles/${profile.email}`);
      await uploadBytes(storageRef, file);
      const downloadURL = await getDownloadURL(storageRef);

      // Update Firestore
      const userRef = doc(db, 'users', profile.email);
      await setDoc(userRef, {
        profilePicUrl: downloadURL
      }, { merge: true });

      // Update Auth Profile
      await updateProfile(user, {
        photoURL: downloadURL
      });

      toast.success('อัปโหลดรูปโปรไฟล์สำเร็จ');
    } catch (error: unknown) {
      console.error("Profile Pic Upload Error:", error);
      toast.error('อัปโหลดรูปล้มเหลว: ' + (error as Error).message);
    }
    setIsUploading(false);
  };

  const handleChangePassword = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!user) return;

    if (newPassword !== confirmPassword) {
      toast.error('รหัสผ่านใหม่ไม่ตรงกัน');
      return;
    }

    if (newPassword.length < 6) {
      toast.error('รหัสผ่านใหม่ต้องมีอย่างน้อย 6 ตัวอักษร');
      return;
    }

    setIsChangingPassword(true);
    try {
      // Re-authenticate user
      const credential = EmailAuthProvider.credential(user.email!, currentPassword);
      await reauthenticateWithCredential(user, credential);

      // Update password in Auth
      await updatePassword(user, newPassword);
      
      // Update password in Firestore (legacy requirement)
      if (profile?.email) {
        const userRef = doc(db, 'users', profile.email);
        await updateDoc(userRef, {
          password: newPassword
        });
      }

      toast.success('เปลี่ยนรหัสผ่านสำเร็จ');
      setCurrentPassword('');
      setNewPassword('');
      setConfirmPassword('');
    } catch (error: unknown) {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const err = error as any;
      if (err.code === 'auth/invalid-credential' || err.code === 'auth/wrong-password') {
        toast.error('รหัสผ่านปัจจุบันไม่ถูกต้อง');
      } else {
        toast.error(err.message || 'เกิดข้อผิดพลาดในการเปลี่ยนรหัสผ่าน');
      }
    }
    setIsChangingPassword(false);
  };

  if (!profile) return null;

  return (
    <div className="flex-1 p-8 overflow-y-auto bg-slate-50">
      <div className="max-w-4xl mx-auto space-y-8">
        
        <div>
          <h1 className="text-3xl font-bold text-slate-800">ตั้งค่าโปรไฟล์</h1>
          <p className="text-slate-500 mt-1">จัดการข้อมูลส่วนตัวและตั้งค่าความปลอดภัยของบัญชี</p>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-8">
          
          {/* Left Column - Profile Picture */}
          <div className="lg:col-span-1">
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200 flex flex-col items-center text-center">
              <div className="relative group mb-6">
                <div className="w-32 h-32 rounded-full overflow-hidden bg-slate-100 border-4 border-white shadow-lg relative">
                  {profile.profilePicUrl ? (
                    <Image src={profile.profilePicUrl} alt={profile.name} fill className="object-cover" />
                  ) : (
                    <div className="w-full h-full flex items-center justify-center text-slate-400">
                      <User size={48} />
                    </div>
                  )}
                  
                  {isUploading && (
                    <div className="absolute inset-0 bg-black/50 flex items-center justify-center">
                      <Loader2 size={24} className="text-white animate-spin" />
                    </div>
                  )}
                </div>
                
                <button 
                  onClick={() => fileInputRef.current?.click()}
                  disabled={isUploading}
                  className="absolute bottom-0 right-0 p-2.5 bg-blue-600 text-white rounded-full shadow-lg hover:bg-blue-700 transition transform hover:scale-105 disabled:opacity-50"
                >
                  <Camera size={18} />
                </button>
                <input 
                  type="file" 
                  ref={fileInputRef} 
                  onChange={handleFileChange} 
                  accept="image/jpeg, image/png, image/webp" 
                  className="hidden" 
                />
              </div>
              
              <h2 className="text-xl font-bold text-slate-800">{profile.name}</h2>
              <p className="text-sm text-slate-500 mb-2">{profile.title}</p>
              <div className={`px-3 py-1 rounded-full text-xs font-medium inline-block ${
                profile.role === 'admin' ? 'bg-purple-100 text-purple-700' : 'bg-blue-100 text-blue-700'
              }`}>
                {profile.role === 'admin' ? 'System Admin' : 'User'}
              </div>
            </div>
          </div>

          {/* Right Column - Forms */}
          <div className="lg:col-span-2 space-y-8">
            
            {/* Personal Info Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <User size={20} className="text-blue-600" />
                <h2 className="text-lg font-bold text-slate-800">ข้อมูลส่วนตัว</h2>
              </div>
              
              <form onSubmit={handleUpdateInfo} className="space-y-5">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อ (First Name)</label>
                    <input 
                      type="text" 
                      value={firstName}
                      onChange={(e) => setFirstName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">นามสกุล (Last Name)</label>
                    <input 
                      type="text" 
                      value={lastName}
                      onChange={(e) => setLastName(e.target.value)}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ชื่อที่แสดง (Display Name)</label>
                  <p className="text-xs text-slate-500 mb-2">ชื่อนี้จะถูกนำไปแสดงในหน้าระบบต่างๆ (สามารถเปลี่ยนเป็นภาษาอังกฤษได้)</p>
                  <input 
                    type="text" 
                    value={displayName}
                    onChange={(e) => setDisplayName(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>

                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">ตำแหน่ง (Title)</label>
                  <input 
                    type="text" 
                    value={title}
                    onChange={(e) => setTitle(e.target.value)}
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-blue-500 focus:ring-2 focus:ring-blue-100 transition-all outline-none"
                  />
                </div>
                
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">อีเมล</label>
                  <input 
                    type="email" 
                    value={profile.email}
                    disabled
                    className="w-full bg-slate-100 border border-slate-200 rounded-xl p-3 text-sm text-slate-500 cursor-not-allowed"
                  />
                  <p className="text-xs text-slate-400 mt-1">อีเมลไม่สามารถแก้ไขได้</p>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isUpdatingInfo}
                    className="flex items-center gap-2 bg-blue-600 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-blue-700 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isUpdatingInfo ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
                    บันทึกข้อมูลส่วนตัว
                  </button>
                </div>
              </form>
            </div>

            {/* Change Password Form */}
            <div className="bg-white rounded-2xl p-6 shadow-sm border border-slate-200">
              <div className="flex items-center gap-2 mb-6">
                <KeyRound size={20} className="text-orange-500" />
                <h2 className="text-lg font-bold text-slate-800">เปลี่ยนรหัสผ่าน</h2>
              </div>
              
              <form onSubmit={handleChangePassword} className="space-y-5">
                <div>
                  <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่านปัจจุบัน</label>
                  <input 
                    type="password" 
                    value={currentPassword}
                    onChange={(e) => setCurrentPassword(e.target.value)}
                    required
                    className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                  />
                </div>
                
                <div className="grid grid-cols-1 md:grid-cols-2 gap-5">
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">รหัสผ่านใหม่</label>
                    <input 
                      type="password" 
                      value={newPassword}
                      onChange={(e) => setNewPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                    <p className="text-xs text-slate-500 mt-1">ต้องมีอย่างน้อย 6 ตัวอักษร</p>
                  </div>
                  <div>
                    <label className="block text-sm font-semibold text-slate-700 mb-1.5">ยืนยันรหัสผ่านใหม่</label>
                    <input 
                      type="password" 
                      value={confirmPassword}
                      onChange={(e) => setConfirmPassword(e.target.value)}
                      required
                      minLength={6}
                      className="w-full bg-slate-50 border border-slate-200 rounded-xl p-3 text-sm focus:bg-white focus:border-orange-500 focus:ring-2 focus:ring-orange-100 transition-all outline-none"
                    />
                  </div>
                </div>

                <div className="flex justify-end pt-2">
                  <button 
                    type="submit" 
                    disabled={isChangingPassword}
                    className="flex items-center gap-2 bg-orange-500 text-white px-6 py-2.5 rounded-xl font-medium hover:bg-orange-600 transition disabled:opacity-70 disabled:cursor-not-allowed shadow-sm"
                  >
                    {isChangingPassword ? <Loader2 size={18} className="animate-spin" /> : <KeyRound size={18} />}
                    อัปเดตรหัสผ่าน
                  </button>
                </div>
              </form>
            </div>

          </div>
        </div>
      </div>
    </div>
  );
}
