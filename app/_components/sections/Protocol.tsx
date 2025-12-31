import { Save, Play, GitMerge } from 'lucide-react';

export function Protocol() {
  return (
    <section className="py-24 bg-secondary/20 border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            How it works
          </h2>
          <p className="text-lg text-muted-foreground">
            Capture state, not tasks.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="relative">
            <div className="w-12 h-12 bg-blue-500/10 text-blue-500 rounded-lg flex items-center justify-center mb-6">
              <Save size={24} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">1. Capture state</h3>
            <p className="text-muted-foreground leading-relaxed">
              At the end of a session, you don't log what you finished. You capture where your mind was — the problem you were solving, the questions still open, the thread you were following.
            </p>
          </div>

          <div className="relative">
            <div className="w-12 h-12 bg-emerald-500/10 text-emerald-500 rounded-lg flex items-center justify-center mb-6">
              <Play size={24} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">2. Resume with intent</h3>
            <p className="text-muted-foreground leading-relaxed">
              When you return, DeepSession restores that context. You see what you were thinking, not just what you were doing. The cognitive warm-up time collapses.
            </p>
          </div>

          <div className="relative">
            <div className="w-12 h-12 bg-purple-500/10 text-purple-500 rounded-lg flex items-center justify-center mb-6">
              <GitMerge size={24} />
            </div>
            <h3 className="text-xl font-bold text-foreground mb-3">3. Build narrative</h3>
            <p className="text-muted-foreground leading-relaxed">
              Over time, you see how thinking evolved. Sessions connect into a story of progress. The work feels coherent, not fragmented.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}