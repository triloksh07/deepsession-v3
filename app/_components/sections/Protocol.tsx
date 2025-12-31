import { ArrowDown, Brain, Save, History } from 'lucide-react';

export function Protocol() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            State Management for your Brain
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl">
            DeepSession is a protocol designed to bridge the gap between "now" and "later."
          </p>
        </div>

        <div className="space-y-4">
          {/* Phase 1 */}
          <div className="group relative bg-card border border-border rounded-xl p-8 hover:border-blue-500/50 transition-colors">
            <div className="absolute top-8 right-8 text-6xl font-bold text-secondary/50 select-none group-hover:text-blue-500/10 transition-colors">01</div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="mt-1 p-3 bg-blue-500/10 text-blue-500 rounded-lg">
                <Brain size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Context Restoration</h3>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  <strong>The problem:</strong> "Where was I?"<br/>
                  <strong>The solution:</strong> Before the timer starts, DeepSession presents your previous "Check-Out" note. You see your last thought, your active blocker, and your intent. You don't ramp up; you resume.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 2 */}
          <div className="group relative bg-card border border-border rounded-xl p-8 hover:border-emerald-500/50 transition-colors">
            <div className="absolute top-8 right-8 text-6xl font-bold text-secondary/50 select-none group-hover:text-emerald-500/10 transition-colors">02</div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="mt-1 p-3 bg-emerald-500/10 text-emerald-500 rounded-lg">
                <History size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Continuity, Not Streaks</h3>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  <strong>The problem:</strong> "I broke my streak, so I quit."<br/>
                  <strong>The solution:</strong> We track total deep work volume and narrative, not arbitrary daily streaks. Miss a day? Your context is still safe. Your history is still valid.
                </p>
              </div>
            </div>
          </div>

          {/* Phase 3 */}
          <div className="group relative bg-card border border-border rounded-xl p-8 hover:border-purple-500/50 transition-colors">
            <div className="absolute top-8 right-8 text-6xl font-bold text-secondary/50 select-none group-hover:text-purple-500/10 transition-colors">03</div>
            <div className="flex items-start gap-6 relative z-10">
              <div className="mt-1 p-3 bg-purple-500/10 text-purple-500 rounded-lg">
                <Save size={24} />
              </div>
              <div>
                <h3 className="text-xl font-bold text-foreground mb-2">Cognitive Closure</h3>
                <p className="text-muted-foreground max-w-xl leading-relaxed">
                  <strong>The problem:</strong> "I can't disconnect."<br/>
                  <strong>The solution:</strong> You cannot just stop the timer. You must "Check Out." DeepSession forces you to dump your open loops and current mental state to disk. This grants you permission to rest.
                </p>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}