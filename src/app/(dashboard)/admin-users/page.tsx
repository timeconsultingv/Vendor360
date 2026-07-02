/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, doc, updateDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { useAuth } from '@/lib/contexts/AuthContext';
import { toast } from 'sonner';
import Image from 'next/image';

export default function AdminUsersPage() {
  const [users, setUsers] = useState<any[]>([]);
  const [systemConfig, setSystemConfig] = useState<{ allowGuestAccess: boolean }>({ allowGuestAccess: true });
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const unsubUsers = onSnapshot(collection(db, 'users'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setUsers(data);
    });

    const unsubConfig = onSnapshot(doc(db, 'system_config', 'settings'), (doc) => {
      if (doc.exists()) {
        setSystemConfig(doc.data() as any);
      }
      setLoading(false);
    });

    return () => { unsubUsers(); unsubConfig(); };
  }, [profile]);

  const toggleGuestAccess = async () => {
    const newVal = !systemConfig.allowGuestAccess;
    const actionText = newVal ? 'เปิด' : 'ปิด';
    if (confirm(`ยืนยันการ${actionText}ระบบ Guest หรือไม่?`)) {
      try {
        await updateDoc(doc(db, 'system_config', 'settings'), { allowGuestAccess: newVal });
        toast.success(`${actionText}ระบบ Guest สำเร็จ`);
      } catch (e: any) {
        toast.error('เกิดข้อผิดพลาด: ' + e.message);
      }
    }
  };

  const handleUpdateUser = async (userId: string, field: string, value: string) => {
    if (confirm(`ยืนยันการปรับสิทธิ์ผู้ใช้งานรายนี้?`)) {
      try {
        await updateDoc(doc(db, 'users', userId), { [field]: value });
        toast.success('อัปเดตสิทธิ์สำเร็จ');
      } catch (e: any) {
        toast.error('เกิดข้อผิดพลาด: ' + e.message);
      }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-purple-600"></div>
      </div>
    );
  }

  if (profile?.role !== 'admin') {
    return (
      <div className="flex justify-center items-center h-full text-slate-500">
        คุณไม่มีสิทธิ์เข้าถึงหน้านี้
      </div>
    );
  }

  return (
    <div className="max-w-5xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">จัดการสิทธิ์ผู้ใช้งานระบบ (Admin Controls)</h2>
      
      <div className="bg-white rounded-2xl border p-6 shadow-sm flex items-center justify-between">
        <div>
          <h3 className="font-bold text-lg mb-1">ระบบ Guest Access</h3>
          <p className="text-sm text-slate-500">อนุญาตให้บุคคลภายนอก Login เข้าดูข้อมูลชั่วคราวได้แบบไม่ระบุตัวตน (Anonymous)</p>
        </div>
        
        <div className="relative inline-block w-12 mr-2 align-middle select-none transition duration-200 ease-in">
          <input 
            type="checkbox" 
            checked={systemConfig.allowGuestAccess} 
            onChange={toggleGuestAccess} 
            className="toggle-checkbox absolute block w-6 h-6 rounded-full bg-white border-4 appearance-none cursor-pointer transition-all duration-300" 
            style={{top: '2px', left: systemConfig.allowGuestAccess ? '26px' : '2px'}}
          />
          <label className={`toggle-label block overflow-hidden h-7 rounded-full cursor-pointer transition-colors duration-300 ${systemConfig.allowGuestAccess ? 'bg-blue-600' : 'bg-slate-300'}`}></label>
        </div>
      </div>

      <div className="bg-white rounded-2xl border shadow-sm overflow-hidden">
        <div className="overflow-x-auto">
          <table className="w-full text-left text-sm whitespace-nowrap">
            <thead className="bg-slate-50 border-b text-xs uppercase text-slate-500 tracking-wider">
              <tr>
                <th className="p-4 px-6">ผู้ใช้งาน</th>
                <th className="p-4 px-6">ตำแหน่ง</th>
                <th className="p-4 px-6">Role (สิทธิ์)</th>
                <th className="p-4 px-6">สถานะ (Status)</th>
              </tr>
            </thead>
            <tbody className="divide-y">
              {users.map(u => (
                <tr key={u.id} className="hover:bg-slate-50 transition">
                  <td className="p-4 px-6 flex items-center gap-3">
                    <div className="w-10 h-10 rounded-full bg-slate-200 overflow-hidden shrink-0 border relative">
                      {u.profilePicUrl ? (
                        <Image src={u.profilePicUrl} alt={u.name} fill className="object-cover" />
                      ) : (
                        <div className="w-full h-full flex items-center justify-center font-bold text-slate-400">
                          {u.name?.substring(0,2).toUpperCase()}
                        </div>
                      )}
                    </div>
                    <div>
                      <p className="font-bold text-slate-800">{u.name}</p>
                      <p className="text-[10px] text-slate-500 mt-0.5">{u.email}</p>
                    </div>
                  </td>
                  <td className="p-4 px-6 text-slate-600">{u.title || '-'}</td>
                  <td className="p-4 px-6">
                    <select 
                      value={u.role} 
                      onChange={(e)=>handleUpdateUser(u.id, 'role', e.target.value)} 
                      className={`border rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer ${u.role === 'admin' ? 'bg-purple-50 text-purple-700 border-purple-200' : 'bg-slate-50 text-slate-700'}`}
                    >
                      <option value="user">User ทั่วไป</option>
                      <option value="admin">System Admin</option>
                    </select>
                  </td>
                  <td className="p-4 px-6">
                    <select 
                      value={u.status} 
                      onChange={(e)=>handleUpdateUser(u.id, 'status', e.target.value)} 
                      className={`border rounded-lg p-1.5 text-xs font-bold outline-none cursor-pointer ${
                        u.status === 'active' ? 'bg-green-50 text-green-700 border-green-200' : 
                        u.status === 'pending' ? 'bg-amber-50 text-amber-700 border-amber-200' : 
                        'bg-red-50 text-red-700 border-red-200'
                      }`}
                    >
                      <option value="active">🟢 ใช้งานปกติ (Active)</option>
                      <option value="pending">🟡 รออนุมัติ (Pending)</option>
                      <option value="banned">🔴 ระงับสิทธิ์ (Banned)</option>
                    </select>
                  </td>
                </tr>
              ))}
            </tbody>
          </table>
        </div>
      </div>
    </div>
  );
}
