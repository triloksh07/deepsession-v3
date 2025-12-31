import { Database, WifiOff, ShieldCheck } from 'lucide-react';

export function Architecture() {
  return (
    <section className="py-24 bg-secondary/20 border-t border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Engineered for Silence
          </h2>
          <p className="text-xl text-muted-foreground max-w-2xl">
            We built DeepSession to be invisible. It works when the internet doesn't.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-card p-8 rounded-xl border border-border hover:border-blue-500/30 transition-colors">
            <WifiOff className="text-blue-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-foreground mb-2">True Offline First</h3>
            <p className="text-muted-foreground leading-relaxed">
              Your data lives on your device. Network latency never breaks your flow. Sync happens quietly in the background when connection returns.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl border border-border hover:border-emerald-500/30 transition-colors">
            <Database className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-foreground mb-2">Optimistic State</h3>
            <p className="text-muted-foreground leading-relaxed">
              Zero loading spinners. Interactions are instant because we update the UI immediately and reconcile data later.
            </p>
          </div>

          <div className="bg-card p-8 rounded-xl border border-border hover:border-purple-500/30 transition-colors">
            <ShieldCheck className="text-purple-500 mb-4" size={32} />
            <h3 className="text-lg font-bold text-foreground mb-2">Privacy by Design</h3>
            <p className="text-muted-foreground leading-relaxed">
              We track your sessions, not you. No analytics trackers, no "social sharing" defaults. Your deep work is private.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}