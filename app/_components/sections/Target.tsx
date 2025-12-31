import { Check, X } from 'lucide-react';

export function Target() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <h2 className="text-3xl font-bold text-foreground text-center mb-16">Who this is for</h2>
        
        <div className="grid md:grid-cols-2 gap-12">
          {/* For You */}
          <div className="space-y-6">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-emerald-500/10 flex items-center justify-center">
                <Check className="text-emerald-500" size={16} />
              </div>
              <h3 className="text-xl font-bold text-foreground">This works for you if:</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3 text-muted-foreground">
                <Check className="text-emerald-500 shrink-0 mt-1" size={16} />
                <span>You do deep, non-linear work (coding, writing, research, design).</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <Check className="text-emerald-500 shrink-0 mt-1" size={16} />
                <span>You lose momentum between sessions and want to preserve it.</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <Check className="text-emerald-500 shrink-0 mt-1" size={16} />
                <span>You think in sessions, not checklists.</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <Check className="text-emerald-500 shrink-0 mt-1" size={16} />
                <span>You value depth over velocity.</span>
              </li>
            </ul>
          </div>

          {/* Not For You */}
          <div className="space-y-6 bg-secondary/20 p-8 rounded-xl border border-border/50">
            <div className="flex items-center gap-3 mb-6">
              <div className="w-8 h-8 rounded-full bg-destructive/10 flex items-center justify-center">
                <X className="text-destructive" size={16} />
              </div>
              <h3 className="text-xl font-bold text-foreground">This won't work if:</h3>
            </div>
            
            <ul className="space-y-4">
              <li className="flex gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={16} />
                <span>You want a task manager or project tracker.</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={16} />
                <span>You're looking for productivity hacks or time optimization.</span>
              </li>
              <li className="flex gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={16} />
                <span>Your work is mostly linear, checklist-driven tasks.</span>
              </li>
            </ul>
          </div>
        </div>
      </div>
    </section>
  );
}