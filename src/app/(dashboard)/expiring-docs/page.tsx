'use client';

import { useEffect, useState } from 'react';
import { collectionGroup, collection, onSnapshot, getDocs } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { ArrowLeft, AlertTriangle, ExternalLink } from 'lucide-react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function ExpiringDocsPage() {
  const router = useRouter();
  const [expiringDocs, setExpiringDocs] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchExpiringDocs = async () => {
      try {
        // Fetch all companies first to map company names
        const companiesSnap = await getDocs(collection(db, 'companies'));
        const companiesMap: Record<string, string> = {};
        companiesSnap.forEach(doc => {
          companiesMap[doc.id] = doc.data().name;
        });

        // Use collectionGroup to fetch all documents
        const unsub = onSnapshot(collectionGroup(db, 'documents'), (snap) => {
          const docs: any[] = [];
          const now = new Date();
          const ninetyDaysFromNow = new Date();
          ninetyDaysFromNow.setDate(now.getDate() + 90);

          snap.forEach(doc => {
            const data = doc.data();
            if (data.expireDate) {
              const expireDate = new Date(data.expireDate);
              // Check if expiring in less than 90 days (or already expired)
              if (expireDate <= ninetyDaysFromNow) {
                // Get company ID from the document reference path
                // Path format: companies/{companyId}/documents/{docId}
                const companyId = doc.ref.parent.parent?.id;
                const companyName = companyId ? companiesMap[companyId] || 'Unknown Company' : 'Unknown Company';
                
                docs.push({
                  id: doc.id,
                  companyId,
                  companyName,
                  ...data,
                  daysLeft: Math.ceil((expireDate.getTime() - now.getTime()) / (1000 * 60 * 60 * 24))
                });
              }
            }
          });
          
          // Sort by days left (ascending)
          docs.sort((a, b) => a.daysLeft - b.daysLeft);
          setExpiringDocs(docs);
          setLoading(false);
        });
        
        return () => unsub();
      } catch (error) {
        console.error('Error fetching expiring docs:', error);
        setLoading(false);
      }
    };

    fetchExpiringDocs();
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-red-600"></div>
      </div>
    );
  }

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-500 max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Premium Gradient Header */}
      <div className="relative overflow-hidden bg-gradient-to-r from-red-600 via-rose-600 to-orange-500 rounded-3xl p-8 lg:p-10 text-white shadow-2xl shadow-red-900/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-orange-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-rose-400 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row items-start md:items-center justify-between gap-6">
          <div className="flex items-center gap-4">
            <button onClick={() => router.back()} className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition text-white">
              <ArrowLeft size={20} />
            </button>
            <div className="w-14 h-14 rounded-2xl border-2 border-white/20 bg-white/10 backdrop-blur-md shadow-xl flex items-center justify-center shrink-0">
              <AlertTriangle size={28} className="text-white drop-shadow-md" />
            </div>
            <div>
              <h2 className="text-3xl font-black text-white tracking-tight drop-shadow-md mb-1">
                เอกสารที่ใกล้หมดอายุ
              </h2>
              <p className="text-red-50 text-sm font-medium">รายการเอกสารที่มีวันหมดอายุเหลือน้อยกว่า 90 วัน</p>
            </div>
          </div>
        </div>
      </div>

      <div className="bg-white rounded-3xl border border-slate-100 shadow-xl shadow-slate-200/40 overflow-hidden">
        <table className="w-full text-left text-sm">
          <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b">
            <tr>
              <th className="p-4">Partner</th>
              <th className="p-4">ชื่อเอกสาร</th>
              <th className="p-4">ประเภท</th>
              <th className="p-4">วันหมดอายุ</th>
              <th className="p-4">สถานะ</th>
            </tr>
          </thead>
          <tbody className="divide-y">
            {expiringDocs.length === 0 ? (
              <tr>
                <td colSpan={5} className="text-center p-8 text-slate-400">
                  ไม่มีเอกสารที่ใกล้หมดอายุ
                </td>
              </tr>
            ) : (
              expiringDocs.map(doc => {
                const isExpired = doc.daysLeft < 0;
                return (
                  <tr key={doc.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-blue-600">
                      <Link href={`/companies/${doc.companyId}`} className="hover:underline">
                        {doc.companyName}
                      </Link>
                    </td>
                    <td className="p-4">
                      <div className="font-bold flex items-center gap-2">
                        {doc.name} 
                        {doc.fileUrl && (
                          <a href={doc.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-md" title="เปิดดูเอกสาร">
                            <ExternalLink size={14}/>
                          </a>
                        )}
                      </div>
                    </td>
                    <td className="p-4">
                      <span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 border">
                        {doc.category}
                      </span>
                    </td>
                    <td className="p-4 font-medium">{doc.expireDate}</td>
                    <td className="p-4">
                      {isExpired ? (
                        <span className="bg-red-100 text-red-700 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                          หมดอายุแล้ว ({Math.abs(doc.daysLeft)} วัน)
                        </span>
                      ) : (
                        <span className="bg-orange-100 text-orange-700 px-2 py-1 rounded-md text-xs font-bold whitespace-nowrap">
                          เหลืออีก {doc.daysLeft} วัน
                        </span>
                      )}
                    </td>
                  </tr>
                );
              })
            )}
          </tbody>
        </table>
      </div>
    </div>
  );
}
