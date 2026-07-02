'use client';

import { useEffect, useState, use } from 'react';
import CompanyForm from '@/components/companies/CompanyForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter, useSearchParams } from 'next/navigation';
import { doc, getDoc } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { toast } from 'sonner';

/* eslint-disable @typescript-eslint/no-explicit-any */
function EditCompanyContent() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const id = searchParams.get('id');
  const [initialData, setInitialData] = useState<any>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    const fetchCompany = async () => {
      if (!id) return;
      try {
        const docRef = doc(db, 'companies', id);
        const docSnap = await getDoc(docRef);
        if (docSnap.exists()) {
          setInitialData(docSnap.data());
        } else {
          toast.error('ไม่พบข้อมูล Partner');
          router.push('/companies');
        }
      } catch {
        toast.error('เกิดข้อผิดพลาดในการโหลดข้อมูล');
      }
      setLoading(false);
    };

    fetchCompany();
  }, [id, router]);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white border rounded-full hover:bg-slate-100 transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">แก้ไขข้อมูล Partner</h2>
          <p className="text-sm text-slate-500">ปรับปรุงข้อมูลของ {initialData?.name}</p>
        </div>
      </div>
      
      {initialData && id && <CompanyForm initialData={initialData} isEdit={true} id={id} />}
    </div>
  );
}

import { Suspense } from 'react';
export default function EditCompanyPage() {
  return (
    <Suspense fallback={<div className="p-10 text-center">Loading...</div>}>
      <EditCompanyContent />
    </Suspense>
  );
}
