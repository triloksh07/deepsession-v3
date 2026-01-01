import { Save, Play, BookOpen } from 'lucide-react';

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

        <div className="grid md:grid-cols-3 gap-12 relative">
           {/* Connecting Line (Desktop) */}
           <div className="hidden md:block absolute top-12 left-[16%] right-[16%] h-0.5 bg-gradient-to-r from-blue-500/20 via-emerald-500/20 to-purple-500/20"></div>

          <div className="relative pt-6">
            <div className="w-12 h-12 bg-background border border-border text-blue-500 rounded-xl flex items-center justify-center mb-6 mx-auto relative z-10 shadow-sm">
              <Save size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">1. Capture State</h3>
              <p className="text-muted-foreground leading-relaxed">
                At the end of a session, you don't just log what you finished. You capture where your mind was—the problem you were solving and the thread you were following.
              </p>
            </div>
          </div>

          <div className="relative pt-6">
            <div className="w-12 h-12 bg-background border border-border text-emerald-500 rounded-xl flex items-center justify-center mb-6 mx-auto relative z-10 shadow-sm">
              <Play size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">2. Resume with Intent</h3>
              <p className="text-muted-foreground leading-relaxed">
                When you return, DeepSession restores that context. You see what you were thinking, not just what you were doing. The cognitive warm-up time collapses.
              </p>
            </div>
          </div>

          <div className="relative pt-6">
            <div className="w-12 h-12 bg-background border border-border text-purple-500 rounded-xl flex items-center justify-center mb-6 mx-auto relative z-10 shadow-sm">
              <BookOpen size={24} />
            </div>
            <div className="text-center">
              <h3 className="text-xl font-bold text-foreground mb-3">3. Build Narrative</h3>
              <p className="text-muted-foreground leading-relaxed">
                Over time, you see how thinking evolved. Sessions connect into a story of progress. The work feels coherent, not fragmented.
              </p>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}