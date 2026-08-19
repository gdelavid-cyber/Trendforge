'use client';

import { motion } from 'framer-motion';
import { Store, Download, DollarSign, FileText, Search } from 'lucide-react';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { useState } from 'react';
import { toast } from 'sonner';

interface Props {
  templates: { id: string; title: string; description: string; price: number; category: string; downloads: number; userName: string }[];
}

export function MarketplaceClient({ templates }: Props) {
  const [search, setSearch] = useState('');
  const filtered = (templates ?? []).filter((t: any) => !search || (t?.title ?? '').toLowerCase().includes(search.toLowerCase()));

  return (
    <div className="max-w-[1200px] mx-auto px-4 py-8">
      <div className="mb-8">
        <h1 className="font-display font-bold text-3xl flex items-center gap-2 mb-1">
          <Store className="w-7 h-7 text-gold" /> Template Marketplace
        </h1>
        <p className="text-muted-foreground">Buy and sell templates, checklists, and resources</p>
        <p className="text-xs text-muted-foreground mt-1">Creators earn 80% of each sale · 20% platform commission</p>
      </div>

      <div className="relative mb-6">
        <Search className="absolute left-3 top-1/2 -translate-y-1/2 w-4 h-4 text-muted-foreground" />
        <Input className="pl-10 bg-card-bg border-border-subtle" placeholder="Search templates..." value={search} onChange={(e: any) => setSearch(e.target?.value ?? '')} />
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-4">
        {filtered.map((tpl: any, i: number) => (
          <motion.div key={tpl.id} initial={{ opacity: 0, y: 20 }} animate={{ opacity: 1, y: 0 }} transition={{ delay: i * 0.05 }}
            className="bg-card-bg border border-border-subtle rounded-lg p-5 hover:border-gold/20 transition-all">
            <div className="flex items-start gap-3 mb-3">
              <FileText className="w-8 h-8 text-gold flex-shrink-0" />
              <div>
                <h3 className="font-semibold text-sm">{tpl.title}</h3>
                <span className="text-xs text-muted-foreground">by {tpl.userName}</span>
              </div>
            </div>
            <p className="text-sm text-muted-foreground line-clamp-2 mb-4">{tpl.description}</p>
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3 text-xs text-muted-foreground">
                <span className="flex items-center gap-1"><Download className="w-3 h-3" />{tpl.downloads}</span>
                <span className="bg-dark-navy px-2 py-0.5 rounded">{tpl.category}</span>
              </div>
              <Button size="sm" className="gold-gradient text-black font-bold" onClick={() => toast.info('Purchase flow coming soon!')}>
                <DollarSign className="w-3 h-3 mr-1" />${tpl.price}
              </Button>
            </div>
          </motion.div>
        ))}
      </div>

      {filtered.length === 0 && (
        <div className="bg-card-bg border border-border-subtle rounded-lg p-8 text-center">
          <Store className="w-8 h-8 text-muted-foreground mx-auto mb-3" />
          <p className="text-muted-foreground">No templates found</p>
        </div>
      )}
    </div>
  );
}
