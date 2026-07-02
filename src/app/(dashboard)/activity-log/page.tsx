/* eslint-disable react-hooks/set-state-in-effect, @typescript-eslint/no-explicit-any */
'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, query, orderBy } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Clock, Users } from 'lucide-react';
import { useAuth } from '@/lib/contexts/AuthContext';

export default function ActivityLogPage() {
  const [timeline, setTimeline] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const { profile } = useAuth();

  useEffect(() => {
    if (profile?.role !== 'admin') {
      setLoading(false);
      return;
    }

    const q = query(collection(db, 'timeline'), orderBy('timestamp', 'desc'));
    const unsub = onSnapshot(q, (snap) => {
      setTimeline(snap.docs.map(doc => ({ id: doc.id, ...doc.data() })));
      setLoading(false);
    });

    return () => unsub();
  }, [profile]);

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
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <h2 className="text-2xl font-bold text-slate-800">ประวัติกิจกรรมระบบ (Activity Log)</h2>
      <div className="bg-white rounded-2xl border p-8 shadow-sm">
        {timeline.length === 0 ? (
          <p className="text-sm text-slate-400 text-center py-10">ยังไม่มีประวัติกิจกรรม</p>
        ) : (
          <div className="space-y-8">
            {timeline.map(act => (
              <div key={act.id} className="flex gap-4 items-start relative before:absolute before:top-6 before:bottom-[-32px] before:left-[7px] before:w-px before:bg-slate-100 last:before:hidden">
                <div className={`w-3.5 h-3.5 mt-1 rounded-full border-2 border-white z-10 shrink-0 ${act.type==='alert'?'bg-red-500':act.type==='status'?'bg-amber-500':'bg-blue-500'}`}></div>
                <div>
                  <p className="text-sm font-bold text-slate-800">{act.text}</p>
                  <p className="text-xs text-slate-500 mt-1.5 flex items-center gap-1.5">
                    <Clock size={12}/> {act.time} &nbsp;&nbsp;
                    <Users size={12}/> ผู้ดำเนินการ: <span className="font-semibold text-slate-700">{act.user}</span>
                  </p>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </div>
  );
}
