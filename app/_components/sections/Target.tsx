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
            DeepSession is for people whose work unfolds over time — not in one sitting.
          </p>

          <div className="grid md:grid-cols-2 gap-8">
            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Non-Linear Thinker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You work on problems that evolve as you think.
                  Your progress isn&apos;t linear — and that&apos;s not a flaw.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Session Worker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You work in focused bursts.
                  What matters is carrying momentum forward, not starting over.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Depth Seeker</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You value clarity over speed.
                  You&apos;d rather think well than move fast.
                </p>
              </div>
            </div>

            <div className="flex gap-4">
              <CheckCircle2 className="text-emerald-500 shrink-0 mt-1" size={20} />
              <div>
                <h3 className="font-bold text-foreground">The Long-Game Builder</h3>
                <p className="text-muted-foreground mt-1 text-sm">
                  You know meaningful work compounds.
                  Progress lives across sessions, not sprints.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}