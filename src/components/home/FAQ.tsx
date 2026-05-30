import { ChevronDown } from 'lucide-react';
import { useState } from 'react';
import { useQuery } from '@tanstack/react-query';
import { supabase } from '@/integrations/supabase/client';

interface Faq {
  id: string;
  question: string;
  answer: string;
}

export default function FAQ() {
  const [open, setOpen] = useState<string | null>(null);

  const { data: faqs = [] } = useQuery<Faq[]>({
    queryKey: ['faq'],
    queryFn: async () => {
      const { data } = await supabase.from('faq').select('*').eq('is_active', true).order('sort_order');
      return data || [];
    },
  });

  if (faqs.length === 0) return null;

  return (
    <section className="py-14 bg-background">
      <div className="container mx-auto px-4 max-w-3xl">
        <div className="text-center mb-10">
          <div className="inline-flex items-center gap-2 bg-primary/10 text-primary text-xs font-medium px-3 py-1.5 rounded-full mb-3">
            <span>Pertanyaan Umum</span>
          </div>
          <h2 className="text-2xl md:text-3xl font-bold text-foreground">FAQ</h2>
          <p className="text-muted-foreground mt-2 text-sm">Jawaban atas pertanyaan yang sering ditanyakan</p>
        </div>

        <div className="space-y-3">
          {faqs.map(faq => (
            <div key={faq.id} className="bg-card border border-border rounded-xl overflow-hidden shadow-card">
              <button
                onClick={() => setOpen(open === faq.id ? null : faq.id)}
                className="w-full flex items-center justify-between px-5 py-4 text-left hover:bg-muted/40 transition-colors"
              >
                <span className="font-medium text-sm text-foreground pr-4">{faq.question}</span>
                <ChevronDown className={`w-4 h-4 text-muted-foreground flex-shrink-0 transition-transform ${open === faq.id ? 'rotate-180' : ''}`} />
              </button>
              {open === faq.id && (
                <div className="px-5 pb-4 animate-fade-in">
                  <p className="text-sm text-muted-foreground leading-relaxed border-t border-border pt-3">{faq.answer}</p>
                </div>
              )}
            </div>
          ))}
        </div>
      </div>
    </section>
  );
}
