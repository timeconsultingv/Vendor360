'use client';

import { useAuth } from '@/lib/contexts/AuthContext';
import { Activity, Users, Clock, UserCog, LogOut } from 'lucide-react';
import Image from 'next/image';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export default function Sidebar() {
  const { profile, signOut } = useAuth();
  const pathname = usePathname();

  const getLinkClass = (path: string) => {
    const isActive = pathname === path || pathname.startsWith(`${path}/`);
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-r from-blue-600 to-indigo-600 text-white shadow-lg shadow-blue-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;
  };

  const getAdminLinkClass = (path: string) => {
    const isActive = pathname === path;
    return `flex items-center gap-3 px-3 py-2.5 rounded-xl text-sm font-medium w-full text-left transition-all duration-300 ${
      isActive 
        ? 'bg-gradient-to-r from-purple-600 to-pink-600 text-white shadow-lg shadow-purple-900/50' 
        : 'text-slate-400 hover:bg-slate-800 hover:text-slate-200'
    }`;
  };

  return (
    <div className="w-72 bg-slate-900 text-white flex flex-col shrink-0 z-20 shadow-2xl h-full border-r border-slate-800/50">
      <div className="p-6 flex items-center gap-4 border-b border-slate-800/80 bg-slate-950/30">
        <div className="bg-white p-1 rounded-xl w-12 h-12 flex items-center justify-center shrink-0 overflow-hidden shadow-inner relative">
          <Image src="https://static.wixstatic.com/media/141293_f2c1ef4fe5474172b75fe05846c6c713~mv2.jpg" alt="Logo" fill className="object-contain" unoptimized />
        </div>
        <div>
          <h1 className="font-bold text-lg leading-tight tracking-wide">Vendor360</h1>
          <p className="text-[10px] text-blue-400 font-bold tracking-widest uppercase">Partner Management</p>
        </div>
      </div>
      
      <div className="flex flex-col p-4 gap-1.5 flex-1 overflow-y-auto custom-scrollbar">
        <div className="text-[10px] font-bold text-slate-500 mb-1 mt-2 uppercase pl-3 tracking-wider">Main Menu</div>
        <Link href="/dashboard" className={getLinkClass('/dashboard')}>
          <Activity size={18} /> แดชบอร์ดภาพรวม
        </Link>
        <Link href="/companies" className={getLinkClass('/companies')}>
          <Users size={18} /> ฐานข้อมูล Partner
        </Link>
        
        {profile?.role === 'admin' && (
          <>
            <div className="text-[10px] font-bold text-purple-400 mb-1 mt-6 uppercase pl-3 tracking-wider">System Config (Admin)</div>
            <Link href="/activity-log" className={getAdminLinkClass('/activity-log')}>
              <Clock size={18} /> ประวัติกิจกรรม (Activity Log)
            </Link>
            <Link href="/admin-users" className={getAdminLinkClass('/admin-users')}>
              <UserCog size={18} /> จัดการสิทธิ์ผู้ใช้งาน
            </Link>
          </>
        )}
      </div>

      <div className="p-4 border-t border-slate-800 flex justify-between items-center bg-slate-950/50">
        <Link href="/profile" className="flex items-center gap-3 hover:opacity-80 transition cursor-pointer" title="ตั้งค่าโปรไฟล์">
          <div className="w-9 h-9 rounded-full bg-slate-700 flex items-center justify-center text-xs font-bold overflow-hidden shadow-md border border-slate-600 relative">
            {profile?.profilePicUrl ? (
              <Image src={profile.profilePicUrl} alt={profile.name} fill className="object-cover" />
            ) : (
              <span>{profile?.name?.substring(0, 2).toUpperCase() || 'U'}</span>
            )}
          </div>
          <div className="text-xs">
            <p className="font-semibold truncate w-24 text-slate-100">{profile?.name || 'Loading...'}</p>
            <p className={`text-[10px] ${profile?.role === 'admin' ? 'text-purple-400' : 'text-blue-400'}`}>
              {profile?.role === 'admin' ? 'System Admin' : profile?.title || 'User'}
            </p>
          </div>
        </Link>
        <button onClick={signOut} className="text-slate-400 hover:text-red-400 p-2 transition">
          <LogOut size={16} />
        </button>
      </div>
    </div>
  );
}
