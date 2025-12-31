import { ArrowDown, LogIn, LogOut, Save } from 'lucide-react';

export function Protocol() {
  return (
    <section className="py-24 bg-background">
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl md:text-4xl font-bold text-foreground mb-4">
            The Continuity Protocol
          </h2>
          <p className="text-lg text-muted-foreground">
            DeepSession enforces a strict closure ritual to ensure you never start from zero.
          </p>
        </div>

        <div className="relative">
          {/* Vertical Line */}
          <div className="absolute left-8 md:left-1/2 top-0 bottom-0 w-px bg-gradient-to-b from-blue-500/0 via-blue-500/50 to-emerald-500/0 hidden md:block"></div>

          <div className="space-y-12">
            {/* Step 1: Check In */}
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-blue-500/10 text-blue-500 mb-4 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2 bg-card border border-border z-10">
                  <LogIn size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">1. The Ramp</h3>
                <p className="text-muted-foreground">
                  DeepSession presents your previous context immediately. You see exactly what you were thinking, your last blocker, and your next micro-step.
                </p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <p className="font-mono text-sm text-blue-500 mb-2">Previous Session Context</p>
                <p className="text-sm text-muted-foreground">"Stopped at Auth Logic. The JWT token isn't persisting. Next: Check local storage logic."</p>
              </div>
            </div>

            {/* Step 2: Deep Work */}
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="md:col-start-2">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-foreground text-background mb-4 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2 border border-border z-10">
                  <span className="font-bold">2</span>
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">2. The Zone</h3>
                <p className="text-muted-foreground">
                  Distraction-free timer. Offline-first. No notifications. Just you and the task.
                </p>
              </div>
              <div className="md:row-start-2 md:col-start-1 bg-card border border-border p-6 rounded-xl shadow-sm md:text-right">
                <div className="text-4xl font-mono font-bold text-foreground tracking-widest">
                  00:45:00
                </div>
                <p className="text-xs text-muted-foreground mt-2">Deep Work • Offline</p>
              </div>
            </div>

            {/* Step 3: Check Out */}
            <div className="relative grid md:grid-cols-2 gap-8 items-center">
              <div className="md:text-right">
                <div className="inline-flex items-center justify-center w-12 h-12 rounded-xl bg-emerald-500/10 text-emerald-500 mb-4 md:mb-0 md:absolute md:left-1/2 md:-translate-x-1/2 bg-card border border-border z-10">
                  <LogOut size={24} />
                </div>
                <h3 className="text-xl font-bold text-foreground mb-2">3. The Offload</h3>
                <p className="text-muted-foreground">
                  You cannot just "stop." You must offload your mental state. DeepSession forces you to document open loops before you quit.
                </p>
              </div>
              <div className="bg-card border border-border p-6 rounded-xl shadow-sm">
                <div className="flex items-center gap-2 mb-3">
                  <Save size={16} className="text-emerald-500" />
                  <span className="text-sm font-medium">Saving State...</span>
                </div>
                <div className="h-2 w-full bg-secondary rounded-full overflow-hidden">
                  <div className="h-full w-full bg-emerald-500 animate-pulse"></div>
                </div>
              </div>
            </div>
          </div>
        </div>
      </div>
    </section>
  );
}