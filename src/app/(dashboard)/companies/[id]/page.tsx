'use client';

import { useEffect, useState, use } from 'react';
import { db, storage } from '@/lib/firebase/config';
import { doc, getDoc, collection, onSnapshot, addDoc, deleteDoc } from 'firebase/firestore';
import { ref, uploadBytes, getDownloadURL } from 'firebase/storage';
import { useRouter } from 'next/navigation';
import { ArrowLeft, Building2, MapPin, Globe, Phone, Mail, Edit, Trash, Plus, ShieldAlert, FileSignature, Briefcase, Users, Download, ExternalLink, Star } from 'lucide-react';
import { toast } from 'sonner';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function CompanyDetailPage({ params }: { params: Promise<{ id: string }> }) {
  const router = useRouter();
  const { id } = use(params);
  const [company, setCompany] = useState<any>(null);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState('profile');

  // Subcollections data
  const [projects, setProjects] = useState<any[]>([]);
  const [staff, setStaff] = useState<any[]>([]);
  const [risks, setRisks] = useState<any[]>([]);
  const [docsList, setDocsList] = useState<any[]>([]);
  
  // Forms states for subcollections
  const [showProjectForm, setShowProjectForm] = useState(false);
  const [showStaffForm, setShowStaffForm] = useState(false);
  const [showRiskForm, setShowRiskForm] = useState(false);
  const [showDocForm, setShowDocForm] = useState(false);
  const [uploadingDoc, setUploadingDoc] = useState(false);
  const [docFile, setDocFile] = useState<File | null>(null);
  const [tempData, setTempData] = useState<any>({});

  useEffect(() => {
    const fetchCompany = async () => {
      const docSnap = await getDoc(doc(db, 'companies', id));
      if (docSnap.exists()) {
        setCompany({ id: docSnap.id, ...docSnap.data() });
      } else {
        toast.error('ไม่พบข้อมูล Partner');
        router.push('/companies');
      }
      setLoading(false);
    };

    fetchCompany();

    const unsubProjects = onSnapshot(collection(db, 'companies', id, 'projects'), (snap) => setProjects(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubStaff = onSnapshot(collection(db, 'companies', id, 'staff'), (snap) => setStaff(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubRisks = onSnapshot(collection(db, 'companies', id, 'risks'), (snap) => setRisks(snap.docs.map(d => ({ id: d.id, ...d.data() }))));
    const unsubDocs = onSnapshot(collection(db, 'companies', id, 'documents'), (snap) => setDocsList(snap.docs.map(d => ({ id: d.id, ...d.data() }))));

    return () => { unsubProjects(); unsubStaff(); unsubRisks(); unsubDocs(); };
  }, [id, router]);

  const handleAddProject = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'companies', id, 'projects'), tempData);
      toast.success('เพิ่มโปรเจกต์สำเร็จ');
      setShowProjectForm(false);
      setTempData({});
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const handleAddStaff = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'companies', id, 'staff'), tempData);
      toast.success('เพิ่มบุคลากรสำเร็จ');
      setShowStaffForm(false);
      setTempData({});
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const handleAddRisk = async (e: React.FormEvent) => {
    e.preventDefault();
    try {
      await addDoc(collection(db, 'companies', id, 'risks'), tempData);
      toast.success('บันทึกความเสี่ยงสำเร็จ');
      setShowRiskForm(false);
      setTempData({});
    } catch (e: unknown) { toast.error((e as Error).message); }
  };

  const handleAddDoc = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!docFile) {
      toast.error('กรุณาเลือกไฟล์ PDF');
      return;
    }
    setUploadingDoc(true);
    try {
      const storageRef = ref(storage, `companies/${id}/documents/${Date.now()}_${docFile.name}`);
      await uploadBytes(storageRef, docFile);
      const fileUrl = await getDownloadURL(storageRef);
      
      const finalData = { ...tempData, fileUrl };
      await addDoc(collection(db, 'companies', id, 'documents'), finalData);
      toast.success('อัปโหลดเอกสารสำเร็จ');
      setShowDocForm(false);
      setTempData({});
      setDocFile(null);
    } catch (e: unknown) {
      toast.error((e as Error).message);
    } finally {
      setUploadingDoc(false);
    }
  };

  const handleDeleteSubDoc = async (col: string, subId: string) => {
    if (confirm('คุณต้องการลบข้อมูลนี้ใช่หรือไม่?')) {
      try {
        await deleteDoc(doc(db, 'companies', id, col, subId));
        toast.success('ลบข้อมูลสำเร็จ');
      } catch (e: unknown) { toast.error((e as Error).message); }
    }
  };

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  if (!company) return null;

  return (
    <div className="max-w-7xl mx-auto space-y-8 animate-in fade-in duration-500 pb-10">
      
      {/* Header Banner */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-8 lg:p-10 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex items-center justify-between mb-8">
          <button onClick={() => router.push('/companies')} className="p-2.5 bg-white/10 backdrop-blur-md border border-white/20 rounded-full hover:bg-white/20 transition text-white">
            <ArrowLeft size={20} />
          </button>
          <button onClick={() => router.push(`/companies/${company.id}/edit`)} className="px-5 py-2.5 bg-white text-blue-900 rounded-full hover:bg-blue-50 transition font-bold text-sm flex items-center gap-2 shadow-lg">
            <Edit size={16} /> แก้ไขข้อมูล
          </button>
        </div>

        <div className="relative z-10 flex flex-col md:flex-row gap-8 items-start">
          <div className="w-32 h-32 rounded-3xl border-4 border-white/20 bg-white/10 backdrop-blur-md shadow-xl flex items-center justify-center shrink-0 p-4 relative overflow-hidden">
          {company.logoUrl ? (
            // eslint-disable-next-line @next/next/no-img-element
            <img src={company.logoUrl} className="w-full h-full object-contain" alt={company.name} />
          ) : (
            <span className="font-bold text-slate-300 text-4xl">{company.name.substring(0, 1)}</span>
          )}
          </div>
          
          <div className="flex-1">
            <h1 className="text-4xl font-black text-white tracking-tight leading-tight drop-shadow-md mb-3">{company.name}</h1>
            <div className="flex flex-wrap items-center gap-3 mb-6">
              <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-white/20 ${
                company.tier === 'Strategic Partner' ? 'bg-amber-500 text-white' :
                company.tier === 'Gold Partner' ? 'bg-yellow-400 text-yellow-900' :
                company.tier === 'Silver Partner' ? 'bg-slate-200 text-slate-800' :
                'bg-blue-500 text-white'
              }`}>
                {company.tier === 'Strategic Partner' && <Star size={12} className="inline mr-1" />}
                {company.tier || 'Registered Partner'}
              </span>
              <span className={`text-[11px] px-3 py-1 rounded-full font-bold uppercase tracking-wider shadow-sm border border-white/20 ${
                company.status === 'Active' ? 'bg-emerald-500 text-white' :
                company.status === 'Restricted' ? 'bg-rose-500 text-white' :
                'bg-slate-500 text-white'
              }`}>{company.status || 'Active'}</span>
              
              <span className="text-sm font-medium text-blue-100 flex items-center gap-1.5 ml-2">
                <Building2 size={16} className="opacity-70" /> {company.registrationType || 'ไม่ระบุประเภท'}
              </span>
            </div>
            
            <p className="text-blue-50 text-base leading-relaxed max-w-3xl opacity-90">
              {company.summary || 'ยังไม่มีข้อมูลสรุปเกี่ยวกับ Partner รายนี้'}
            </p>
          </div>
        </div>
      </div>

      {/* Tabs Navigation */}
      <div className="flex items-center gap-2 border-b border-slate-200 overflow-x-auto custom-scrollbar pb-1">
        {[
          { id: 'profile', label: 'Profile Insight', icon: Building2 },
          { id: 'projects', label: 'Project Experience', icon: Briefcase },
          { id: 'staff', label: 'Resource Pool', icon: Users },
          { id: 'docs', label: 'Document Vault', icon: FileSignature },
          { id: 'risks', label: 'Risk Assessment', icon: ShieldAlert }
        ].map(t => (
          <button 
            key={t.id} 
            onClick={() => setActiveTab(t.id)} 
            className={`flex items-center gap-2 px-6 py-3.5 rounded-t-xl font-bold text-sm transition-colors border-b-2 ${activeTab === t.id ? 'bg-white text-blue-600 border-blue-600 shadow-[0_-4px_6px_-1px_rgba(0,0,0,0.05)]' : 'text-slate-500 border-transparent hover:text-slate-700 hover:bg-slate-50'}`}
          >
            <t.icon size={18} /> {t.label}
          </button>
        ))}
      </div>

      <div className="py-4">
        {activeTab === 'profile' && (
          <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 animate-in slide-in-from-bottom-2 duration-300">
            {/* Left Col */}
            <div className="space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="font-extrabold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">ข้อมูลบริษัท</h3>
                <div className="space-y-3 text-sm">
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500">เลขผู้เสียภาษี</span><span className="col-span-2 font-medium">{company.taxId || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500">ปีที่ก่อตั้ง</span><span className="col-span-2 font-medium">{company.founded || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500">ทุนจดทะเบียน</span><span className="col-span-2 font-medium">{company.capital || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500">รายได้ต่อปี</span><span className="col-span-2 font-medium">{company.revenue || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500">จำนวนพนักงาน</span><span className="col-span-2 font-medium">{company.employees || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500 flex items-center gap-1"><MapPin size={14}/> ที่ตั้ง</span><span className="col-span-2 font-medium">{company.address || '-'}</span></div>
                  <div className="grid grid-cols-3 gap-2"><span className="text-slate-500 flex items-center gap-1"><Globe size={14}/> เว็บไซต์</span><span className="col-span-2 font-medium text-blue-600">{company.website ? <a href={company.website} target="_blank" rel="noreferrer">{company.website}</a> : '-'}</span></div>
                </div>
              </div>
            </div>

            <div className="lg:col-span-2 space-y-6">
              <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
                <h3 className="font-extrabold text-lg border-b border-slate-100 pb-3 mb-4 text-slate-800">ผู้ประสานงานหลัก (Contact)</h3>
                {(company.contacts && company.contacts.length > 0) ? (
                  <div className="space-y-4 max-h-[300px] overflow-y-auto pr-2">
                    {company.contacts.map((c: any, idx: number) => (
                      <div key={idx} className="p-4 bg-slate-50 border rounded-xl flex flex-col gap-3">
                        <div className="flex items-center gap-3">
                          <div className="w-10 h-10 bg-blue-50 text-blue-600 rounded-full flex items-center justify-center font-bold">{c.name?.substring(0,1)}</div>
                          <div>
                            <p className="font-bold text-slate-800">{c.name}</p>
                            <p className="text-xs text-slate-500">{c.role || 'ไม่ระบุตำแหน่ง'}</p>
                          </div>
                        </div>
                        <div className="space-y-2 text-sm pt-2 border-t border-slate-200">
                          <div className="flex items-center gap-3"><Phone size={14} className="text-slate-400"/><span className="font-medium">{c.phone || '-'}</span></div>
                          <div className="flex items-center gap-3"><Mail size={14} className="text-slate-400"/><span className="font-medium">{c.email || '-'}</span></div>
                          <div className="flex items-center gap-3"><span className="text-slate-400 font-bold text-[10px] bg-slate-200 px-1.5 py-0.5 rounded">LINE</span><span className="font-medium">{c.line || '-'}</span></div>
                        </div>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-400 text-sm">ไม่มีข้อมูลผู้ติดต่อ</p>
                )}
              </div>
            </div>
          </div>
        )}

        {activeTab === 'projects' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-800">ประสบการณ์ (Projects / Track Record)</h3>
              <button onClick={() => setShowProjectForm(!showProjectForm)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition"><Plus size={16}/> เพิ่มผลงาน</button>
            </div>

            {showProjectForm && (
              <form onSubmit={handleAddProject} className="bg-slate-50 p-6 rounded-xl border mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold mb-1">ชื่อโปรเจกต์ *</label><input required type="text" onChange={e=>setTempData({...tempData, name: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">ลูกค้า (Client)</label><input type="text" onChange={e=>setTempData({...tempData, client: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">มูลค่าโครงการ (บาท)</label><input type="text" onChange={e=>setTempData({...tempData, value: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">ปีที่ส่งมอบ</label><input type="text" onChange={e=>setTempData({...tempData, year: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowProjectForm(false)} className="px-4 py-2 bg-white border rounded text-sm font-bold">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">บันทึกผลงาน</button>
                </div>
              </form>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b"><tr><th className="p-4">ชื่อโปรเจกต์</th><th className="p-4">ลูกค้า</th><th className="p-4">ปี</th><th className="p-4">มูลค่า</th><th className="p-4"></th></tr></thead>
              <tbody className="divide-y">
                {projects.length === 0 ? <tr><td colSpan={5} className="text-center p-8 text-slate-400">ยังไม่มีข้อมูล</td></tr> : projects.map(p => (
                  <tr key={p.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold">{p.name}</td><td className="p-4">{p.client || '-'}</td><td className="p-4">{p.year || '-'}</td><td className="p-4">{p.value || '-'}</td>
                    <td className="p-4 text-right"><button onClick={() => handleDeleteSubDoc('projects', p.id)} className="text-slate-400 hover:text-red-500"><Trash size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'staff' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-2 duration-300">
             <div className="flex justify-between items-center mb-6">
              <h3 className="font-bold text-lg">บุคลากรและความเชี่ยวชาญ (Resource Pool)</h3>
              <button onClick={() => setShowStaffForm(!showStaffForm)} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition"><Plus size={16}/> เพิ่มบุคลากร</button>
            </div>
            
            {showStaffForm && (
              <form onSubmit={handleAddStaff} className="bg-slate-50 p-6 rounded-xl border mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div><label className="block text-xs font-bold mb-1">ชื่อ - นามสกุล *</label><input required type="text" onChange={e=>setTempData({...tempData, name: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">ตำแหน่งวิชาชีพ</label><input type="text" onChange={e=>setTempData({...tempData, role: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">ประสบการณ์ (ปี)</label><input type="number" onChange={e=>setTempData({...tempData, experience: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div><label className="block text-xs font-bold mb-1">ใบรับรอง (Certifications)</label><input type="text" onChange={e=>setTempData({...tempData, cert: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                  <div className="col-span-2 mt-2">
                    <label className="block text-xs font-bold mb-2">ระดับวุฒิการศึกษา</label>
                    <div className="flex flex-wrap gap-4">
                      {['ปวช. / ปวส.', 'ปริญญาตรี', 'ปริญญาโท', 'ปริญญาเอก', 'อื่นๆ'].map(ed => (
                        <label key={ed} className="flex items-center gap-1.5 text-sm cursor-pointer">
                          <input 
                            type="checkbox" 
                            checked={(tempData.education || []).includes(ed)} 
                            onChange={() => {
                              const current = tempData.education || [];
                              setTempData({...tempData, education: current.includes(ed) ? current.filter((x: string) => x !== ed) : [...current, ed]});
                            }} 
                            className="w-4 h-4 text-blue-600 rounded border-slate-300 focus:ring-blue-500"
                          />
                          <span className="text-slate-700">{ed}</span>
                        </label>
                      ))}
                    </div>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowStaffForm(false)} className="px-4 py-2 bg-white border rounded text-sm font-bold">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded text-sm font-bold">บันทึกบุคลากร</button>
                </div>
              </form>
            )}

            <table className="w-full text-left text-sm">
              <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b"><tr><th className="p-4">บุคลากร</th><th className="p-4">วุฒิการศึกษา / ประสบการณ์</th><th className="p-4">ความเชี่ยวชาญ / Cert</th><th className="p-4"></th></tr></thead>
              <tbody className="divide-y">
                {staff.length === 0 ? <tr><td colSpan={4} className="text-center p-8 text-slate-400">ยังไม่มีข้อมูล</td></tr> : staff.map(s => (
                  <tr key={s.id} className="hover:bg-slate-50">
                    <td className="p-4"><p className="font-bold">{s.name}</p><p className="text-xs text-blue-600 mt-0.5">{s.role}</p></td>
                    <td className="p-4">
                      <p className="font-semibold text-slate-700">{(s.education || []).join(', ') || '-'}</p>
                      <p className="text-xs text-slate-500 mt-0.5">ประสบการณ์: {s.experience ? `${s.experience} ปี` : '-'}</p>
                    </td>
                    <td className="p-4">{s.cert || '-'}</td>
                    <td className="p-4 text-right"><button onClick={() => handleDeleteSubDoc('staff', s.id)} className="text-slate-400 hover:text-red-500"><Trash size={16}/></button></td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}

        {activeTab === 'docs' && (
          <div className="space-y-6 animate-in slide-in-from-bottom-2 duration-300">
            <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40">
              <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
                <h3 className="font-extrabold text-lg text-slate-800">เอกสารบริษัท (Documents)</h3>
                <button onClick={() => { setShowDocForm(!showDocForm); setTempData({ category: 'หนังสือรับรองบริษัท', importYear: new Date().getFullYear().toString() }); setDocFile(null); }} className="bg-blue-50 text-blue-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-blue-100 transition"><Plus size={16}/> อัปโหลดเอกสาร (PDF)</button>
              </div>
            
              {showDocForm && (
                <form onSubmit={handleAddDoc} className="bg-slate-50 p-6 rounded-xl border mb-6 space-y-4">
                  <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                    <div><label className="block text-xs font-bold mb-1">ปีที่นำเข้า (พ.ศ.) *</label><input required type="text" value={tempData.importYear || ''} onChange={e=>setTempData({...tempData, importYear: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">ชื่อเอกสาร *</label><input required type="text" onChange={e=>setTempData({...tempData, name: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                    <div><label className="block text-xs font-bold mb-1">วันหมดอายุ</label><input type="date" onChange={e=>setTempData({...tempData, expireDate: e.target.value})} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500"/></div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold mb-1">ประเภทเอกสาร</label>
                      <select onChange={e=>setTempData({...tempData, category: e.target.value})} value={tempData.category || 'หนังสือรับรองบริษัท'} className="w-full border rounded p-2 text-sm outline-none focus:border-blue-500">
                        <option>หนังสือรับรองบริษัท</option>
                        <option>บัญชีรายชื่อผู้ถือหุ้น (บอจ.5)</option>
                        <option>ภ.พ.20</option>
                        <option>สำเนาบัตรประชาชนกรรมการ</option>
                        <option>Company Profile</option>
                        <option>NDA</option>
                        <option>Teaming Agreement</option>
                        <option>ISO/Certificate</option>
                        <option>ใบเสนอราคา</option>
                        <option>อื่นๆ</option>
                      </select>
                    </div>
                    <div className="md:col-span-2"><label className="block text-xs font-bold mb-1 text-blue-600">แนบไฟล์ PDF *</label><input required type="file" accept=".pdf,application/pdf" onChange={e=>setDocFile(e.target.files ? e.target.files[0] : null)} className="w-full border bg-white rounded p-1.5 text-sm outline-none"/></div>
                  </div>
                  <div className="flex justify-end gap-3 pt-2">
                    <button type="button" onClick={() => setShowDocForm(false)} className="px-4 py-2 bg-white border rounded text-sm font-bold">ยกเลิก</button>
                    <button type="submit" disabled={uploadingDoc} className={`px-4 py-2 text-white rounded text-sm font-bold flex items-center gap-2 ${uploadingDoc ? 'bg-slate-400' : 'bg-blue-600 hover:bg-blue-700'}`}>
                      {uploadingDoc ? 'กำลังอัปโหลด...' : 'บันทึกเอกสาร'}
                    </button>
                  </div>
                </form>
              )}

              <table className="w-full text-left text-sm">
                <thead className="bg-slate-50 text-slate-500 text-xs uppercase border-b"><tr><th className="p-4">ปี</th><th className="p-4">ชื่อเอกสาร</th><th className="p-4">ประเภท</th><th className="p-4">วันหมดอายุ</th><th className="p-4 text-right">จัดการ</th></tr></thead>
                <tbody className="divide-y">
                  {docsList.length === 0 ? <tr><td colSpan={5} className="text-center p-8 text-slate-400">ยังไม่มีเอกสารในระบบ</td></tr> : docsList.map(d => {
                    const isExpired = d.expireDate && new Date(d.expireDate) < new Date();
                    return (
                      <tr key={d.id} className="hover:bg-slate-50">
                        <td className="p-4 font-bold">{d.importYear}</td>
                        <td className="p-4">
                          <div className="font-bold flex items-center gap-2">
                            {d.name} 
                            {d.fileUrl && <a href={d.fileUrl} target="_blank" rel="noreferrer" className="text-blue-600 hover:text-blue-800 bg-blue-50 p-1.5 rounded-md" title="เปิดดูเอกสาร"><ExternalLink size={14}/></a>}
                          </div>
                        </td>
                        <td className="p-4"><span className="bg-slate-100 px-2 py-1 rounded-md text-[10px] font-bold text-slate-600 border">{d.category}</span></td>
                        <td className={`p-4 font-bold ${isExpired ? 'text-red-500' : 'text-slate-500'}`}>{d.expireDate ? (isExpired ? `หมดอายุ (${d.expireDate})` : d.expireDate) : '-'}</td>
                        <td className="p-4 text-right flex justify-end gap-3">
                          {d.fileUrl && <a href={d.fileUrl} target="_blank" download rel="noreferrer" className="text-slate-400 hover:text-blue-600"><Download size={16}/></a>}
                          <button onClick={() => handleDeleteSubDoc('documents', d.id)} className="text-slate-400 hover:text-red-500"><Trash size={16}/></button>
                        </td>
                      </tr>
                    );
                  })}
                </tbody>
              </table>
            </div>
          </div>
        )}

        {activeTab === 'risks' && (
          <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 animate-in slide-in-from-bottom-2 duration-300">
            <div className="flex items-center justify-between border-b border-slate-100 pb-3 mb-4">
              <h3 className="font-extrabold text-lg text-slate-800 text-rose-600 flex items-center gap-2"><ShieldAlert size={20}/> ข้อมูลด้านความเสี่ยง (Risk & Compliance)</h3>
              <button onClick={() => setShowRiskForm(!showRiskForm)} className="bg-red-50 text-red-600 px-4 py-2 rounded-xl text-sm font-bold flex items-center gap-2 hover:bg-red-100 transition"><Plus size={16}/> บันทึกความเสี่ยง</button>
            </div>
            
            {showRiskForm && (
              <form onSubmit={handleAddRisk} className="bg-red-50 p-6 rounded-xl border border-red-100 mb-6 space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="col-span-2"><label className="block text-xs font-bold text-red-700 mb-1">รายละเอียดปัญหา *</label><input required type="text" onChange={e=>setTempData({...tempData, issue: e.target.value})} className="w-full border border-red-200 rounded p-2 text-sm outline-none focus:border-red-400"/></div>
                  <div><label className="block text-xs font-bold text-red-700 mb-1">ความรุนแรง</label>
                    <select onChange={e=>setTempData({...tempData, severity: e.target.value})} className="w-full border border-red-200 rounded p-2 text-sm outline-none focus:border-red-400">
                      <option value="High">สูง (High)</option>
                      <option value="Medium">ปานกลาง (Medium)</option>
                      <option value="Low">ต่ำ (Low)</option>
                    </select>
                  </div>
                </div>
                <div className="flex justify-end gap-3 pt-2">
                  <button type="button" onClick={() => setShowRiskForm(false)} className="px-4 py-2 bg-white border border-red-200 text-red-700 rounded text-sm font-bold">ยกเลิก</button>
                  <button type="submit" className="px-4 py-2 bg-red-600 text-white rounded text-sm font-bold hover:bg-red-700">บันทึกความเสี่ยง</button>
                </div>
              </form>
            )}

            <table className="w-full text-left text-sm">
              <tbody className="divide-y">
                {risks.length === 0 ? <tr><td className="text-center p-8 text-slate-400">ไม่มีประวัติความเสี่ยง</td></tr> : risks.map(r => (
                  <tr key={r.id} className="hover:bg-slate-50">
                    <td className="p-4 font-bold text-slate-800">{r.issue}</td>
                    <td className="p-4 text-right">
                      <span className={`px-3 py-1 rounded-md text-[10px] font-bold ${r.severity==='High'?'bg-red-100 text-red-700':'bg-orange-100 text-orange-700'}`}>Level: {r.severity||'High'}</span>
                      <button onClick={() => handleDeleteSubDoc('risks', r.id)} className="text-slate-400 hover:text-red-500 ml-4"><Trash size={16}/></button>
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
        )}
      </div>
    </div>
  );
}
