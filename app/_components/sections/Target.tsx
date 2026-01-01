import { CheckCircle2, User } from 'lucide-react';

export function Target() {
  return (
    <section className="py-24 bg-secondary/20 ">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex items-center justify-center gap-3 mb-12">
          <div className="p-2 bg-foreground/5 rounded-full">
            <User className="text-foreground" size={24} />
          </div>
          <h2 className="text-3xl font-bold text-foreground">Who this is for</h2>
        </div>

        <div className="bg-secondary/30 border border-border rounded-2xl p-8 md:p-12">
          <p className="text-xl text-center text-foreground font-medium mb-12 max-w-2xl mx-auto">
            DeepSession is built for people whose work unfolds over time — not in one sitting.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Non-Linear Thinker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You work on problems that don&apos;t move in straight lines.
                  Your thinking branches, loops, and evolves.
                  You need space to hold complexity, not flatten it.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Session Worker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You work in deep, focused bursts. <br />
                  Your best work happens when momentum carries forward — not when you restart from zero.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Depth Seeker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You value clarity over speed.
                  Continuity over hustle.
                  You care about preserving the thread of thought, not just finishing tasks.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Long-Game Builder</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You know meaningful work compounds.
                  Progress isn&apos;t measured in days — it&apos;s built across sessions of focused effort.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}