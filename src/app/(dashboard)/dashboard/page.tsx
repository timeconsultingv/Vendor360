'use client';

import { useEffect, useState } from 'react';
import { collection, onSnapshot, collectionGroup } from 'firebase/firestore';
import { db } from '@/lib/firebase/config';
import { Building2, Tags, Activity, FileSignature, PieChart as PieChartIcon, BarChart3, TrendingUp } from 'lucide-react';
import { PieChart, Pie, Cell, ResponsiveContainer, Tooltip, Legend, BarChart, Bar, XAxis, YAxis, CartesianGrid } from 'recharts';
import Link from 'next/link';

/* eslint-disable @typescript-eslint/no-explicit-any */
export default function DashboardPage() {
  const [companies, setCompanies] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [expiringDocsCount, setExpiringDocsCount] = useState(0);

  useEffect(() => {
    const unsub = onSnapshot(collection(db, 'companies'), (snap) => {
      const data = snap.docs.map(doc => ({ id: doc.id, ...doc.data() }));
      setCompanies(data);
      setLoading(false);
    });

    const unsubDocs = onSnapshot(collectionGroup(db, 'documents'), (snap) => {
      let count = 0;
      const now = new Date();
      const ninetyDaysFromNow = new Date();
      ninetyDaysFromNow.setDate(now.getDate() + 90);

      snap.forEach(doc => {
        const data = doc.data();
        if (data.expireDate) {
          const expireDate = new Date(data.expireDate);
          if (expireDate <= ninetyDaysFromNow) {
            count++;
          }
        }
      });
      setExpiringDocsCount(count);
    });

    return () => {
      unsub();
      unsubDocs();
    };
  }, []);

  if (loading) {
    return (
      <div className="flex justify-center items-center h-full">
        <div className="animate-spin rounded-full h-10 w-10 border-b-2 border-blue-600"></div>
      </div>
    );
  }

  // Calculate stats
  const totalPartners = companies.length;
  const activePartners = companies.filter(c => c.status === 'Active').length;
  
  // Extract tags
  const tagCounts: Record<string, number> = {};
  companies.forEach(c => {
    (c.tags || []).forEach((t: string) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
    (c.techTags || []).forEach((t: string) => {
      tagCounts[t] = (tagCounts[t] || 0) + 1;
    });
  });

  const topTags = Object.entries(tagCounts)
    .sort((a, b) => b[1] - a[1])
    .slice(0, 15);

  const chartData = topTags.slice(0, 6).map(([name, count]) => ({ name, count }));

  // Calculate tier stats
  const tierCounts: Record<string, number> = {};
  companies.forEach(c => {
    const tier = c.tier || 'ไม่ระบุ';
    tierCounts[tier] = (tierCounts[tier] || 0) + 1;
  });

  const tierData = Object.entries(tierCounts).map(([name, value]) => ({ name, value })).sort((a, b) => b.value - a.value);
  const PIE_COLORS = ['#3b82f6', '#8b5cf6', '#ec4899', '#f59e0b', '#10b981', '#64748b'];

  return (
    <div className="animate-in fade-in slide-in-from-bottom-4 duration-700 max-w-7xl mx-auto space-y-8 pb-10">
      
      {/* Header Section */}
      <div className="relative overflow-hidden bg-gradient-to-r from-blue-900 via-indigo-900 to-purple-900 rounded-3xl p-8 lg:p-10 text-white shadow-2xl shadow-blue-900/20">
        <div className="absolute inset-0 bg-[url('https://www.transparenttextures.com/patterns/cubes.png')] opacity-10 mix-blend-overlay"></div>
        <div className="absolute -top-24 -right-24 w-64 h-64 bg-blue-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob"></div>
        <div className="absolute -bottom-24 -left-24 w-64 h-64 bg-purple-500 rounded-full mix-blend-multiply filter blur-3xl opacity-50 animate-blob animation-delay-2000"></div>
        
        <div className="relative z-10 flex flex-col md:flex-row md:items-center justify-between gap-6">
          <div>
            <h2 className="text-3xl md:text-4xl font-extrabold tracking-tight mb-2 drop-shadow-md">Dashboard Overview</h2>
            <p className="text-blue-100 text-lg opacity-90 max-w-xl">ภาพรวมข้อมูลพาร์ทเนอร์และสถิติสำคัญของระบบ Vendor 360</p>
          </div>
          <div className="hidden md:flex items-center gap-3 bg-white/10 backdrop-blur-md px-5 py-3 rounded-2xl border border-white/20">
             <Activity className="text-blue-300" size={24} />
             <div>
               <div className="text-xs text-blue-200 uppercase tracking-wider font-semibold">System Status</div>
               <div className="text-sm font-bold text-white flex items-center gap-2">
                 <span className="w-2 h-2 rounded-full bg-green-400 animate-pulse"></span>
                 All Systems Normal
               </div>
             </div>
          </div>
        </div>
      </div>

      {/* Stats Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
        {/* Card 1 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-blue-100 to-blue-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-br from-blue-500 to-blue-600 text-white rounded-2xl shadow-lg shadow-blue-500/30">
              <Building2 size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">Partner ทั้งหมด</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-slate-800 tracking-tight">{totalPartners}</p>
              <p className="text-xs font-semibold text-green-500 bg-green-50 px-2 py-1 rounded-lg mb-1 flex items-center gap-1"><TrendingUp size={12}/> 100%</p>
            </div>
          </div>
        </div>

        {/* Card 2 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-emerald-100 to-emerald-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-br from-emerald-400 to-emerald-500 text-white rounded-2xl shadow-lg shadow-emerald-500/30">
              <Activity size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">Partner ที่ใช้งาน (Active)</h3>
            <div className="flex items-end gap-3">
              <p className="text-4xl font-black text-slate-800 tracking-tight">{activePartners}</p>
            </div>
          </div>
        </div>

        {/* Card 3 */}
        <div className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-transform duration-300">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-purple-100 to-purple-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-br from-purple-500 to-purple-600 text-white rounded-2xl shadow-lg shadow-purple-500/30">
              <Tags size={24} />
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">หมวดหมู่ & เทคโนโลยี</h3>
            <p className="text-4xl font-black text-slate-800 tracking-tight">{Object.keys(tagCounts).length}</p>
          </div>
        </div>

        {/* Card 4 (Link) */}
        <Link href="/expiring-docs" className="bg-white rounded-3xl p-6 border border-slate-100 shadow-xl shadow-slate-200/40 relative overflow-hidden group hover:-translate-y-1 transition-all duration-300 hover:ring-2 hover:ring-rose-400 hover:shadow-rose-200/50">
          <div className="absolute top-0 right-0 w-24 h-24 bg-gradient-to-br from-rose-100 to-rose-50 rounded-bl-full -z-10 group-hover:scale-110 transition-transform duration-500"></div>
          <div className="flex justify-between items-start mb-4">
            <div className="p-3.5 bg-gradient-to-br from-rose-400 to-rose-500 text-white rounded-2xl shadow-lg shadow-rose-500/30 relative">
               <FileSignature size={24} />
               {expiringDocsCount > 0 && (
                 <span className="absolute -top-2 -right-2 bg-red-600 text-white text-[10px] font-bold px-2 py-0.5 rounded-full border-2 border-white animate-bounce">
                   {expiringDocsCount}
                 </span>
               )}
            </div>
          </div>
          <div>
            <h3 className="text-slate-500 text-sm font-semibold mb-1">เอกสารใกล้หมดอายุ</h3>
            <div className="flex items-center justify-between">
              <p className="text-4xl font-black text-rose-600 tracking-tight">{expiringDocsCount}</p>
              <div className="text-xs font-semibold text-rose-600 bg-rose-50 px-3 py-1.5 rounded-xl group-hover:bg-rose-600 group-hover:text-white transition-colors">
                ดูรายละเอียด &rarr;
              </div>
            </div>
          </div>
        </Link>
      </div>

      {/* Charts Section */}
      <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 mt-8">
        
        {/* Bar Chart - Top Tags */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-blue-50 text-blue-600 rounded-xl">
                <BarChart3 size={20} />
              </div>
              Top Expertise & Tech Tags
            </h3>
          </div>
          
          <div className="flex-1 w-full min-h-[320px]">
            {chartData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">ไม่มีข้อมูล</div>
            ) : (
              <ResponsiveContainer width="100%" height="100%">
                <BarChart data={chartData} margin={{ top: 10, right: 10, left: -20, bottom: 0 }}>
                  <defs>
                    <linearGradient id="colorCount" x1="0" y1="0" x2="0" y2="1">
                      <stop offset="5%" stopColor="#3b82f6" stopOpacity={0.8}/>
                      <stop offset="95%" stopColor="#8b5cf6" stopOpacity={0.8}/>
                    </linearGradient>
                  </defs>
                  <CartesianGrid strokeDasharray="3 3" vertical={false} stroke="#e2e8f0" />
                  <XAxis dataKey="name" axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} dy={10} />
                  <YAxis axisLine={false} tickLine={false} tick={{fill: '#64748b', fontSize: 12}} />
                  <Tooltip 
                    cursor={{fill: '#f1f5f9'}}
                    contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1), 0 8px 10px -6px rgb(0 0 0 / 0.1)', padding: '12px 16px' }}
                    labelStyle={{ color: '#1e293b', fontWeight: 'bold', marginBottom: '4px' }}
                  />
                  <Bar dataKey="count" name="จำนวน (ราย)" fill="url(#colorCount)" radius={[6, 6, 0, 0]} maxBarSize={50} />
                </BarChart>
              </ResponsiveContainer>
            )}
          </div>
        </div>

        {/* Pie Chart - Tier Distribution */}
        <div className="bg-white rounded-3xl p-8 border border-slate-100 shadow-xl shadow-slate-200/40 flex flex-col">
          <div className="flex justify-between items-center mb-8">
            <h3 className="font-extrabold text-xl text-slate-800 flex items-center gap-3">
              <div className="p-2 bg-orange-50 text-orange-500 rounded-xl">
                <PieChartIcon size={20} />
              </div>
              สัดส่วนระดับ Partner (Tier)
            </h3>
          </div>
          
          <div className="flex-1 w-full min-h-[320px] relative">
            {tierData.length === 0 ? (
              <div className="h-full flex items-center justify-center text-slate-400">ไม่มีข้อมูล Tier</div>
            ) : (
              <>
                <div className="absolute inset-0 flex items-center justify-center pointer-events-none -mt-8">
                  <div className="text-center">
                    <p className="text-sm text-slate-400 font-medium">รวมทั้งหมด</p>
                    <p className="text-3xl font-black text-slate-800">{totalPartners}</p>
                  </div>
                </div>
                <ResponsiveContainer width="100%" height="100%">
                  <PieChart>
                    <Pie
                      data={tierData}
                      cx="50%"
                      cy="45%"
                      innerRadius={80}
                      outerRadius={110}
                      paddingAngle={5}
                      dataKey="value"
                      stroke="none"
                      cornerRadius={8}
                    >
                      {tierData.map((entry, index) => (
                        <Cell key={`cell-${index}`} fill={PIE_COLORS[index % PIE_COLORS.length]} style={{ filter: 'drop-shadow(0px 4px 6px rgba(0,0,0,0.1))' }} />
                      ))}
                    </Pie>
                    <Tooltip 
                      formatter={(value: unknown) => {
                        const numericValue = value as number;
                        const total = tierData.reduce((sum, item) => sum + item.value, 0);
                        const percent = ((numericValue / total) * 100).toFixed(1);
                        return [`${numericValue} ราย (${percent}%)`, 'จำนวน'];
                      }}
                      contentStyle={{ borderRadius: '16px', border: 'none', boxShadow: '0 10px 25px -5px rgb(0 0 0 / 0.1)' }}
                      itemStyle={{ fontWeight: 'bold' }}
                    />
                    <Legend 
                      verticalAlign="bottom" 
                      height={40} 
                      iconType="circle"
                      formatter={(value) => <span className="text-slate-700 font-medium ml-1">{value}</span>}
                    />
                  </PieChart>
                </ResponsiveContainer>
              </>
            )}
          </div>
        </div>

      </div>
    </div>
  );
}
