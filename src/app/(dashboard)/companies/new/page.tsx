'use client';

import CompanyForm from '@/components/companies/CompanyForm';
import { ArrowLeft } from 'lucide-react';
import { useRouter } from 'next/navigation';

export default function NewCompanyPage() {
  const router = useRouter();

  return (
    <div className="max-w-4xl mx-auto space-y-6 animate-in fade-in duration-300">
      <div className="flex items-center gap-4">
        <button onClick={() => router.back()} className="p-2 bg-white border rounded-full hover:bg-slate-100 transition">
          <ArrowLeft size={20} className="text-slate-600" />
        </button>
        <div>
          <h2 className="text-2xl font-bold text-slate-800">ลงทะเบียน Partner ใหม่</h2>
          <p className="text-sm text-slate-500">เพิ่มข้อมูล Vendor เข้าสู่ระบบ Vendor360</p>
        </div>
      </div>
      
      <CompanyForm />
    </div>
  );
}
