'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, deleteDoc, doc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Search, MapPin, Globe, ChevronRight, Trash, Edit, Star } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { toast } from 'sonner';

interface CompanyData {
  id: string;
  name: string;
  tags?: string[];
  techTags?: string[];
  contacts?: unknown[];
  created_at?: { toMillis?: () => number };
  logoUrl?: string;
  tier?: string;
  status?: string;
  summary?: string;
  address?: string;
  website?: string;
}

export default function CompaniesPage() {
  const [companies, setCompanies] = useState<CompanyData[]>([]);
  const [loading, setLoading] = useState(true);
  const router = useRouter();
  const searchParams = useSearchParams();
  const query = searchParams.get('q') || '';

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'companies'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() } as CompanyData));
      data.sort((a, b) => {
        const timeA = a.created_at?.toMillis?.() || 0;
        const timeB = b.created_at?.toMillis?.() || 0;
        return timeB - timeA;
      });
      setCompanies(data);
      setLoading(false);
    });
    return () => unsub();
  }, []);

  const handleDelete = async (e: React.MouseEvent, id: string, name: string) => {
    e.stopPropagation();
    if (confirm(`คุณต้องการลบข้อมูล "${name}" อย่างถาวรใช่หรือไม่?`)) {
      try {
        await deleteDoc(doc(db, 'companies', id));
        toast.success(`ลบ ${name} สำเร็จ`);
        // TODO: Log timeline
      } catch (error: unknown) {
        toast.error('เกิดข้อผิดพลาด: ' + (error as Error).message);
      }
    }
  };

  const filteredCompanies = companies.filter(c => {
    const s = query.toLowerCase();
    const tagsMatch = (c.tags || []).some((t: string) => t.toLowerCase().includes(s));
    const techMatch = (c.techTags || []).some((t: string) => t.toLowerCase().includes(s));
    return c.name.toLowerCase().includes(s) || tagsMatch || techMatch;
  });

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in duration-500 max-w-7xl mx-auto space-y-8 pb-10">
      <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4 mb-8">
        <div>
          <h2 className="text-3xl font-extrabold text-slate-800 tracking-tight">ฐานข้อมูล Partner ทั้งหมด</h2>
          <p className="text-slate-500 mt-1 text-sm font-medium">จัดการและค้นหาพันธมิตรทางธุรกิจในระบบ</p>
        </div>
        <div className="text-sm text-slate-600 bg-white px-5 py-2.5 rounded-full border border-slate-100 shadow-sm font-semibold flex items-center gap-2">
          ผลลัพธ์การค้นหา <span className="text-blue-600 bg-blue-50 px-2 py-0.5 rounded-md">{filteredCompanies.length}</span> รายการ
        </div>
      </div>

      <div className="grid grid-cols-1 xl:grid-cols-2 gap-6">
        {filteredCompanies.map(c => {
          return (
            <div 
              key={c.id} 
              onClick={() => router.push(`/companies/${c.id}`)}
              className="bg-white p-6 rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 hover:-translate-y-1 transition-transform duration-300 cursor-pointer group flex flex-col relative overflow-hidden"
            >
              <div className="absolute top-0 right-0 w-32 h-32 bg-gradient-to-br from-slate-50 to-white rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
              <div className="flex justify-between items-start mb-5 gap-4 relative z-10">
                <div className="flex items-start gap-5">
                  <div className="w-16 h-16 rounded-2xl border border-slate-100 shadow-sm bg-slate-50 flex items-center justify-center p-2 shrink-0 group-hover:scale-105 group-hover:shadow-md transition-all duration-300">
                    {c.logoUrl ? (
                      // eslint-disable-next-line @next/next/no-img-element
                      <img src={c.logoUrl} className="w-full h-full object-contain" alt={c.name} />
                    ) : (
                      <span className="font-bold text-slate-400 text-xl">{c.name.substring(0, 1)}</span>
                    )}
                  </div>
                  <div>
                    <h3 className="font-bold text-lg text-slate-800 leading-tight group-hover:text-blue-600 transition">{c.name}</h3>
                    <div className="flex items-center gap-2 mt-1.5">
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        c.tier === 'Strategic Partner' ? 'bg-amber-100 text-amber-700' :
                        c.tier === 'Gold Partner' ? 'bg-yellow-100 text-yellow-700' :
                        c.tier === 'Silver Partner' ? 'bg-slate-200 text-slate-700' :
                        'bg-blue-50 text-blue-600'
                      }`}>
                        {c.tier === 'Strategic Partner' && <Star size={10} className="inline mr-1" />}
                        {c.tier || 'Registered Partner'}
                      </span>
                      <span className={`text-[10px] px-2 py-0.5 rounded-md font-bold uppercase tracking-wider ${
                        c.status === 'Active' ? 'bg-green-100 text-green-700' :
                        c.status === 'Restricted' ? 'bg-red-100 text-red-700' :
                        'bg-slate-100 text-slate-600'
                      }`}>{c.status || 'Active'}</span>
                    </div>
                  </div>
                </div>
                <div className="flex items-center gap-1 opacity-0 group-hover:opacity-100 transition">
                  <button 
                    onClick={(e) => { e.stopPropagation(); router.push(`/companies/${c.id}/edit`); }}
                    className="p-1.5 text-slate-400 hover:text-blue-600 hover:bg-blue-50 rounded"
                  >
                    <Edit size={16} />
                  </button>
                  <button 
                    onClick={(e) => handleDelete(e, c.id, c.name)}
                    className="p-1.5 text-slate-400 hover:text-red-600 hover:bg-red-50 rounded"
                  >
                    <Trash size={16} />
                  </button>
                </div>
              </div>

              <p className="text-sm text-slate-500 line-clamp-2 mb-4 leading-relaxed flex-1">
                {c.summary || 'ยังไม่มีข้อมูลสรุป...'}
              </p>

              {c.tags && c.tags.length > 0 && (
                <div className="flex flex-wrap gap-1.5 mb-5">
                  {c.tags.slice(0, 3).map((tag, i) => (
                    <span key={i} className="text-[10px] px-2 py-1 bg-slate-100 text-slate-600 rounded-md font-medium">
                      {tag}
                    </span>
                  ))}
                  {c.tags.length > 3 && (
                    <span className="text-[10px] px-2 py-1 bg-slate-50 text-slate-400 rounded-md font-medium">
                      +{c.tags.length - 3}
                    </span>
                  )}
                </div>
              )}

              <div className="flex items-center justify-between text-xs text-slate-500 pt-4 border-t border-slate-100 relative z-10">
                <div className="flex items-center gap-4">
                  <div className="flex items-center gap-1.5"><MapPin size={14} className="text-slate-400"/> {c.address ? 'มีข้อมูลที่ตั้ง' : '-'}</div>
                  <div className="flex items-center gap-1.5"><Globe size={14} className="text-slate-400"/> {c.website ? 'มีเว็บไซต์' : '-'}</div>
                </div>
                <div className="bg-blue-50 p-1.5 rounded-full text-blue-500 group-hover:bg-blue-600 group-hover:text-white transition-colors duration-300">
                  <ChevronRight size={16} className="translate-x-0 group-hover:translate-x-0.5 transition-transform" />
                </div>
              </div>
            </div>
          );
        })}
      </div>
      
      {filteredCompanies.length === 0 && !loading && (
        <div className="text-center py-20 bg-white rounded-2xl border shadow-sm">
          <Search size={40} className="mx-auto text-slate-300 mb-4" />
          <p className="text-slate-500">ไม่พบ Partner ที่ตรงกับ &quot;{query}&quot;</p>
        </div>
      )}
    </div>
  );
}
