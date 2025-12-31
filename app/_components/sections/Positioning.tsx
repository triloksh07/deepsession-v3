import { X, Check } from 'lucide-react';

export function Positioning() {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              Not Another Productivity Tool
            </h2>
            <p className="text-lg text-muted-foreground mb-8">
              Most productivity tools optimize for task completion. They help you work faster. <strong>DeepSession optimizes for thinking continuity.</strong>
            </p>
            
            <div className="space-y-4">
              <div className="flex items-start gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={18} />
                <p><strong>Not a task manager.</strong> It doesn't track what to do next.</p>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={18} />
                <p><strong>Not a timer.</strong> It doesn't optimize work intervals.</p>
              </div>
              <div className="flex items-start gap-3 text-muted-foreground">
                <X className="text-destructive shrink-0 mt-1" size={18} />
                <p><strong>Not a habit tracker.</strong> It doesn't gamify consistency.</p>
              </div>
            </div>
          </div>

          <div className="bg-secondary/20 border border-border rounded-xl p-8">
            <h3 className="text-xl font-bold text-foreground mb-6">What DeepSession Is</h3>
            <div className="space-y-6">
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-1" size={18} />
                <p className="text-foreground">A cognitive scaffold that preserves your mental state.</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-1" size={18} />
                <p className="text-foreground">A thinking companion that maintains context.</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-1" size={18} />
                <p className="text-foreground">A mental continuity layer for deep work.</p>
              </div>
              <div className="flex items-start gap-3">
                <Check className="text-emerald-500 shrink-0 mt-1" size={18} />
                <p className="text-foreground">Built for people who think in sessions, not checklists.</p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}