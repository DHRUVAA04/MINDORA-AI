import React, { useEffect, useState } from 'react';
import { Card } from '../components/ui/Card';
import { Button } from '../components/ui/Button';
import { BookOpen, Search, ExternalLink, Video, Sparkles } from 'lucide-react';
import { apiClient } from '../api/client';

interface ResourceItem {
  id: string;
  title: string;
  category: string;
  type: string;
  url: string;
  recommended_for: string;
  duration: string;
}

export const ResourcesPage: React.FC = () => {
  const [searchTerm, setSearchTerm] = useState('');
  const [resources, setResources] = useState<ResourceItem[]>([]);
  const [prototypeLabel, setPrototypeLabel] = useState('Curated Engineering Library (Prototype)');

  useEffect(() => {
    apiClient<{ resources: ResourceItem[]; prototype_label?: string }>('/api/user/resources')
      .then((res) => {
        setResources(res.resources || []);
        if (res.prototype_label) setPrototypeLabel(res.prototype_label);
      })
      .catch((err) => {
        console.warn('Could not load resources:', err);
      });
  }, []);

  const filtered = resources.filter(
    (r) =>
      r.title.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.category.toLowerCase().includes(searchTerm.toLowerCase()) ||
      r.recommended_for.toLowerCase().includes(searchTerm.toLowerCase())
  );

  return (
    <div className="space-y-6 max-w-5xl mx-auto animate-in fade-in duration-300">
      <div>
        <div className="flex flex-wrap items-center gap-2 mb-1">
          <span className="px-2.5 py-0.5 rounded-full bg-brand-cyan/20 border border-brand-cyan/40 text-brand-cyan text-[11px] font-bold inline-flex items-center gap-1">
            <Sparkles className="w-3 h-3" /> {prototypeLabel}
          </span>
        </div>
        <h2 className="text-2xl sm:text-3xl font-extrabold text-brand-midnight dark:text-white tracking-tight flex items-center gap-2">
          <BookOpen className="w-6 h-6 text-brand-violet" />
          Curated Educational Resources
        </h2>
        <p className="text-xs sm:text-sm text-brand-slate/70 dark:text-gray-300 mt-1">
          Hand-picked high-yield lecture videos from MIT OpenCourseWare, NPTEL, and top engineering educators.
        </p>
      </div>

      {/* Search Bar */}
      <div className="relative">
        <Search className="w-4 h-4 absolute left-3.5 top-3.5 text-brand-slate/40" />
        <input
          type="text"
          value={searchTerm}
          onChange={(e) => setSearchTerm(e.target.value)}
          placeholder="Search resources by topic, subject, or lecture title..."
          className="w-full pl-10 pr-4 py-2.5 text-xs sm:text-sm rounded-xl border border-brand-violet/20 bg-white dark:bg-[#151231] text-brand-slate dark:text-white placeholder:text-brand-slate/40 focus:outline-none focus:ring-2 focus:ring-brand-cyan"
        />
      </div>

      {/* Resource Cards */}
      <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
        {filtered.map((res) => (
          <Card key={res.id} padding="md" className="flex flex-col justify-between space-y-4">
            <div>
              <div className="flex items-center justify-between mb-2">
                <span className="text-[10px] uppercase font-bold tracking-wider text-brand-cyan">
                  {res.category}
                </span>
                <span className="text-[10px] px-2 py-0.5 rounded-full bg-brand-violet/10 dark:bg-brand-violet/20 font-semibold text-brand-violet dark:text-brand-cyan flex items-center gap-1">
                  <Video className="w-3 h-3 text-red-500" /> {res.type}
                </span>
              </div>
              <h3 className="text-sm sm:text-base font-bold text-brand-midnight dark:text-white leading-snug">
                {res.title}
              </h3>
              <p className="text-xs text-brand-slate/60 dark:text-gray-400 mt-1.5">
                ⭐ {res.recommended_for} • {res.duration}
              </p>
            </div>

            <div className="pt-3 border-t border-brand-violet/10 dark:border-brand-violet/20 flex justify-end">
              <a
                href={res.url}
                target="_blank"
                rel="noopener noreferrer"
                className="inline-flex items-center gap-1.5 px-3 py-1.5 rounded-xl text-xs font-semibold bg-brand-violet text-white hover:bg-brand-violet/90 shadow-sm transition-colors focus-visible:ring-2 focus-visible:ring-brand-cyan"
              >
                Watch on YouTube <ExternalLink className="w-3.5 h-3.5" />
              </a>
            </div>
          </Card>
        ))}

        {filtered.length === 0 && (
          <div className="col-span-full">
            <Card padding="lg" className="text-center py-8 text-xs text-brand-slate/60 dark:text-gray-400">
              No matching resources found for "{searchTerm}".
            </Card>
          </div>
        )}
      </div>
    </div>
  );
};
