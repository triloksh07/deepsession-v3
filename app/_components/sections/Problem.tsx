import { AlertCircle, ZapOff, Loader2 } from 'lucide-react';

export function Problem() {
  return (
    <section className="py-24 bg-secondary/30 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="grid md:grid-cols-2 gap-16 items-center">
          <div>
            <h2 className="text-3xl font-bold text-foreground mb-6">
              The "Cold Start" Problem
            </h2>
            <div className="space-y-6">
              <p className="text-lg text-muted-foreground">
                You don't procrastinate because you're lazy. You procrastinate because the <strong>cognitive cost of loading context</strong> is too high.
              </p>
              <p className="text-lg text-muted-foreground">
                Every time you close your laptop, your mental model evaporates. When you return, you spend 20 minutes just trying to remember where you left off.
              </p>
              <div className="flex items-center gap-3 text-destructive/80 font-medium pt-2">
                <ZapOff size={20} />
                <span>This is where momentum dies.</span>
              </div>
            </div>
          </div>

          {/* Visualizing the "Ramp Up" */}
          <div className="relative bg-card border border-border rounded-xl p-8 shadow-sm">
            <div className="space-y-4">
              <div className="flex items-center justify-between text-sm text-muted-foreground mb-2">
                <span>Typical Workflow</span>
                <span className="text-destructive">High Friction</span>
              </div>
              
              <div className="space-y-2">
                <div className="h-2 bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-1/4 bg-destructive/40"></div>
                </div>
                <div className="flex justify-between text-xs text-muted-foreground">
                  <span>Open Laptop</span>
                  <span>Trying to focus...</span>
                  <span>Actual Work</span>
                </div>
              </div>

              <div className="mt-8 p-4 bg-destructive/10 rounded-lg border border-destructive/20 text-sm text-destructive">
                <div className="flex gap-3">
                  <Loader2 className="animate-spin shrink-0" size={18} />
                  <p>"Wait, what was I debugging? Why did I leave this tab open? What's the next step?"</p>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}