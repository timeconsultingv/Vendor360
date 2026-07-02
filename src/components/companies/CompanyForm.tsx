'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import { db } from '@/lib/firebase/config';
import { doc, setDoc, updateDoc, collection, serverTimestamp } from 'firebase/firestore';
import { toast } from 'sonner';
import { Trash } from 'lucide-react';

interface Contact {
  name: string;
  role: string;
  phone: string;
  email: string;
  line: string;
}

interface CompanyData {
  name?: string;
  taxId?: string;
  founded?: string;
  capital?: string;
  revenue?: string;
  employees?: string;
  website?: string;
  logoUrl?: string;
  address?: string;
  tier?: string;
  status?: string;
  tags?: string[];
  techTags?: string[];
  summary?: string;
  contacts?: Contact[];
  [key: string]: unknown;
}

export default function CompanyForm({ initialData, isEdit, id }: { initialData?: CompanyData, isEdit?: boolean, id?: string }) {
  const router = useRouter();
  const [loading, setLoading] = useState(false);

  const [formData, setFormData] = useState({
    name: initialData?.name || '',
    taxId: initialData?.taxId || '',
    founded: initialData?.founded || '',
    capital: initialData?.capital || '',
    revenue: initialData?.revenue || '',
    employees: initialData?.employees || '',
    website: initialData?.website || '',
    logoUrl: initialData?.logoUrl || '',
    address: initialData?.address || '',
    tier: initialData?.tier || 'Registered Partner',
    status: initialData?.status || 'Active',
    tagsStr: initialData?.tags?.join(', ') || '',
    techTagsStr: initialData?.techTags?.join(', ') || '',
    summary: initialData?.summary || '',
    contacts: (initialData?.contacts && initialData.contacts.length > 0) ? initialData.contacts : [{ name: '', role: '', phone: '', email: '', line: '' }]
  });

  const handleContactChange = (index: number, e: React.ChangeEvent<HTMLInputElement>) => {
    const newContacts = [...formData.contacts];
    newContacts[index] = { ...newContacts[index], [e.target.name]: e.target.value };
    setFormData({ ...formData, contacts: newContacts });
  };

  const addContact = () => {
    setFormData({
      ...formData,
      contacts: [...formData.contacts, { name: '', role: '', phone: '', email: '', line: '' }]
    });
  };

  const removeContact = (index: number) => {
    const newContacts = [...formData.contacts];
    newContacts.splice(index, 1);
    setFormData({ ...formData, contacts: newContacts });
  };

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement | HTMLSelectElement>) => {
    setFormData({ ...formData, [e.target.name]: e.target.value });
  };

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    setLoading(true);

    try {
      const domainTags = formData.tagsStr ? formData.tagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      const techTags = formData.techTagsStr ? formData.techTagsStr.split(',').map((t: string) => t.trim()).filter(Boolean) : [];
      
      const payload = {
        name: formData.name,
        taxId: formData.taxId,
        founded: formData.founded,
        capital: formData.capital,
        revenue: formData.revenue,
        employees: formData.employees,
        website: formData.website,
        logoUrl: formData.logoUrl,
        address: formData.address,
        tier: formData.tier,
        status: formData.status,
        tags: domainTags,
        techTags: techTags,
        summary: formData.summary,
        contacts: formData.contacts.filter((c: Contact) => c.name.trim() !== '')
      };

      if (isEdit && id) {
        await updateDoc(doc(db, 'companies', id), payload);
        toast.success('อัปเดตข้อมูลสำเร็จ');
      } else {
        const newRef = doc(collection(db, 'companies'));
        await setDoc(newRef, { ...payload, created_at: serverTimestamp() });
        toast.success('บันทึกข้อมูล Partner ใหม่สำเร็จ');
      }
      
      router.push('/companies');
    } catch (error: unknown) {
      toast.error('เกิดข้อผิดพลาด: ' + (error as Error).message);
    }
    
    setLoading(false);
  };

  return (
    <div className="animate-in fade-in duration-500">
      <form onSubmit={handleSubmit} className="flex flex-col gap-8">
        
        {/* Section 1 */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
          <h4 className="text-lg font-extrabold text-blue-600 border-b border-slate-100 pb-4">ข้อมูลองค์กร (Company Info)</h4>
            <div>
              <label className="block text-xs font-bold mb-1">ชื่อบริษัท *</label>
              <input name="name" required type="text" value={formData.name} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </div>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">เลขผู้เสียภาษี</label>
                <input name="taxId" type="text" value={formData.taxId} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ปีที่ก่อตั้ง</label>
                <input name="founded" type="text" value={formData.founded} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">ทุนจดทะเบียน</label>
                <input name="capital" type="text" value={formData.capital} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">รายได้ต่อปีโดยประมาณ</label>
                <input name="revenue" type="text" value={formData.revenue} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">จำนวนพนักงาน</label>
                <input name="employees" type="text" value={formData.employees} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">เว็บไซต์</label>
                <input name="website" type="text" value={formData.website} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
              <div className="md:col-span-2">
                <label className="block text-xs font-bold mb-1">URL โลโก้บริษัท (ถ้ามี)</label>
                <input name="logoUrl" type="url" placeholder="https://..." value={formData.logoUrl} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">ที่ตั้งสำนักงาน</label>
              <textarea name="address" rows={2} value={formData.address} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white"></textarea>
            </div>
          </div>
        
        {/* Section 2 */}
        <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
          <h4 className="text-lg font-extrabold text-purple-600 border-b border-slate-100 pb-4">ความเชี่ยวชาญและสถานะ (Capability)</h4>
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-bold mb-1">ระดับ Partner</label>
                <select name="tier" value={formData.tier} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white">
                  <option>Strategic Partner</option>
                  <option>Gold Partner</option>
                  <option>Silver Partner</option>
                  <option>Registered Partner</option>
                </select>
              </div>
              <div>
                <label className="block text-xs font-bold mb-1">สถานะ</label>
                <select name="status" value={formData.status} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white">
                  <option>Active</option>
                  <option>Inactive</option>
                  <option>Restricted</option>
                </select>
              </div>
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Business Domain Tags (คั่นด้วยลูกน้ำ เช่น ERP, Cyber Security)</label>
              <input name="tagsStr" type="text" value={formData.tagsStr} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">Technology Tags (คั่นด้วยลูกน้ำ เช่น AWS, SAP, Cisco)</label>
              <input name="techTagsStr" type="text" value={formData.techTagsStr} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
            </div>
            <div>
              <label className="block text-xs font-bold mb-1">สรุปจุดเด่น / บริการหลัก</label>
              <textarea name="summary" rows={3} value={formData.summary} onChange={handleChange} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white"></textarea>
            </div>
          </div>

          {/* Section 3 */}
          <div className="bg-white rounded-3xl p-6 lg:p-8 border border-slate-100 shadow-xl shadow-slate-200/40 space-y-6">
            <div className="flex justify-between items-center border-b border-slate-100 pb-4">
              <h4 className="text-lg font-extrabold text-teal-600">ผู้ประสานงานหลัก (Contact)</h4>
              <button type="button" onClick={addContact} className="text-sm text-teal-700 bg-teal-50 px-4 py-2 rounded-xl font-bold hover:bg-teal-100 transition-colors shadow-sm">+ เพิ่มผู้ติดต่อ</button>
            </div>
            {formData.contacts.map((contact: Contact, index: number) => (
              <div key={index} className="grid grid-cols-1 md:grid-cols-2 gap-5 bg-slate-50/50 p-6 rounded-2xl relative border border-slate-100 shadow-sm">
                {formData.contacts.length > 1 && (
                  <button type="button" onClick={() => removeContact(index)} className="absolute top-4 right-4 text-slate-400 hover:text-rose-500 bg-white p-1.5 rounded-lg shadow-sm border border-slate-100 transition-colors">
                    <Trash size={16} />
                  </button>
                )}
                <div>
                  <label className="block text-xs font-bold mb-1">ชื่อ-นามสกุล</label>
                  <input name="name" type="text" value={contact.name} onChange={(e) => handleContactChange(index, e)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">ตำแหน่ง (Role)</label>
                  <input name="role" type="text" placeholder="เช่น Sales, PM" value={contact.role} onChange={(e) => handleContactChange(index, e)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">เบอร์โทร</label>
                  <input name="phone" type="text" value={contact.phone} onChange={(e) => handleContactChange(index, e)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
                </div>
                <div>
                  <label className="block text-xs font-bold mb-1">อีเมล</label>
                  <input name="email" type="text" value={contact.email} onChange={(e) => handleContactChange(index, e)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
                </div>
                <div className="md:col-span-2">
                  <label className="block text-xs font-bold mb-1">Line ID / Microsoft Teams</label>
                  <input name="line" type="text" value={contact.line} onChange={(e) => handleContactChange(index, e)} className="w-full border border-slate-200 rounded-xl p-3 text-sm outline-none focus:ring-4 focus:ring-blue-500/10 focus:border-blue-500 transition-all duration-300 bg-slate-50/50 focus:bg-white" />
                </div>
              </div>
            ))}
          </div>
        <div className="flex justify-end gap-4 pt-4 sticky bottom-6 z-10">
          <button type="button" onClick={() => router.push('/companies')} disabled={loading} className="px-8 py-3.5 bg-white border border-slate-200 rounded-full text-sm font-bold text-slate-600 shadow-lg hover:bg-slate-50 hover:-translate-y-0.5 transition-all duration-300">
            ยกเลิก
          </button>
          <button type="submit" disabled={loading} className={`px-8 py-3.5 text-white rounded-full text-sm font-bold shadow-lg shadow-blue-500/30 flex items-center justify-center min-w-[140px] hover:-translate-y-0.5 transition-all duration-300 ${loading ? 'bg-slate-400' : 'bg-gradient-to-r from-blue-600 to-indigo-600 hover:from-blue-700 hover:to-indigo-700'}`}>
            {loading ? (
              <div className="flex items-center gap-2"><div className="w-4 h-4 border-2 border-white/30 border-t-white rounded-full animate-spin"></div>กำลังบันทึก...</div>
            ) : (
              'บันทึกข้อมูล'
            )}
          </button>
        </div>
      </form>
    </div>
  );
}
