import { ArrowRight, BrainCircuit, History } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      {/* Subtle Grid Background */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808012_1px,transparent_1px),linear-gradient(to_bottom,#80808012_1px,transparent_1px)] bg-[size:24px_24px]"></div>

      <div className="relative max-w-5xl mx-auto w-full text-center z-10 pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary border border-border mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <span className="w-2 h-2 bg-emerald-500 rounded-full animate-pulse"></span>
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">System v3.0 Live</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          Stop losing <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">mental context.</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          DeepSession is not a timer. It is a <strong>cognitive continuity engine</strong> that helps you save your mental state, so you can resume deep work instantly—without the 20-minute ramp-up.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium py-3 px-8 rounded-lg transition-all">
              <BrainCircuit size={18} />
              Enter Focus State
            </button>
          </Link>
          <Link href="/manifesto">
            <button className="w-full sm:w-auto inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-8 rounded-lg transition-all border border-border">
              Read the Philosophy
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>

        {/* Social Proof / Metrics (Reframed for Cognitive Impact) */}
        <div className="mt-20 grid grid-cols-2 md:grid-cols-3 gap-8 border-t border-border/50 pt-10 opacity-70">
          <div>
            <div className="text-2xl font-bold text-foreground">Zero</div>
            <div className="text-sm text-muted-foreground">Cloud Latency</div>
          </div>
          <div>
            <div className="text-2xl font-bold text-foreground">100%</div>
            <div className="text-sm text-muted-foreground">Context Restoration</div>
          </div>
          <div className="hidden md:block">
            <div className="text-2xl font-bold text-foreground">Local</div>
            <div className="text-sm text-muted-foreground">First Architecture</div>
          </div>
        </div>
      </div>
    </section>
  );
}