'use client';

import { Search, Plus } from 'lucide-react';
import { useRouter, useSearchParams, usePathname } from 'next/navigation';
import { useState } from 'react';

export default function Header() {
  const router = useRouter();
  const pathname = usePathname();
  const searchParams = useSearchParams();
  const [query, setQuery] = useState(searchParams.get('q') || '');

  const currentQuery = searchParams.get('q') || '';
  const [prevQuery, setPrevQuery] = useState(currentQuery);

  if (currentQuery !== prevQuery) {
    setPrevQuery(currentQuery);
    setQuery(currentQuery);
  }

  const handleSearch = (e: React.ChangeEvent<HTMLInputElement>) => {
    const value = e.target.value;
    setQuery(value);
    
    // Redirect to companies page if not there
    if (!pathname.startsWith('/companies')) {
      if (value.trim()) {
        router.push(`/companies?q=${encodeURIComponent(value)}`);
      }
    } else {
      // Just update the query string
      const params = new URLSearchParams(Array.from(searchParams.entries()));
      if (value.trim()) {
        params.set('q', value);
      } else {
        params.delete('q');
      }
      
      const newQuery = params.toString();
      const newUrl = pathname + (newQuery ? `?${newQuery}` : '');
      router.push(newUrl);
    }
  };

  const handleAddPartner = () => {
    router.push('/companies/new');
  };

  return (
    <header className="bg-white h-16 border-b flex items-center justify-between px-6 shrink-0 z-0 shadow-sm">
      <div className="flex items-center bg-slate-100 rounded-lg px-4 py-2 w-[400px]">
        <Search size={18} className="text-slate-400" />
        <input 
          type="text" 
          placeholder="ค้นหา Partner, Tag, Technology..." 
          value={query}
          onChange={handleSearch}
          className="bg-transparent border-none outline-none ml-3 text-sm w-full font-medium text-slate-700" 
        />
      </div>
      <button 
        onClick={handleAddPartner} 
        className="bg-blue-600 hover:bg-blue-700 transition text-white px-5 py-2 rounded-xl text-sm font-bold flex items-center gap-2 shadow-sm"
      >
        <Plus size={16} />เพิ่ม Partner
      </button>
    </header>
  );
}
