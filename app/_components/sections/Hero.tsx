import { ArrowRight, BrainCircuit, Activity } from 'lucide-react';
import Link from 'next/link';

export function Hero() {
  return (
    <section className="relative min-h-[90vh] flex items-center justify-center px-4 sm:px-6 lg:px-8 overflow-hidden bg-background">
      {/* Background: Subtle neural-like noise or grid */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#80808008_1px,transparent_1px),linear-gradient(to_bottom,#80808008_1px,transparent_1px)] bg-[size:32px_32px]"></div>
      
      <div className="relative max-w-4xl mx-auto w-full text-center z-10 pt-20">
        <div className="inline-flex items-center gap-2 px-3 py-1 rounded-full bg-secondary/50 border border-border mb-8 animate-in fade-in slide-in-from-bottom-4 duration-500">
          <Activity size={14} className="text-emerald-500" />
          <span className="text-xs font-medium text-muted-foreground uppercase tracking-wider">Cognitive Continuity System</span>
        </div>

        <h1 className="text-5xl md:text-7xl font-bold tracking-tight text-foreground mb-6 animate-in fade-in slide-in-from-bottom-6 duration-700">
          Resume deep work <br className="hidden md:block" />
          <span className="text-transparent bg-clip-text bg-gradient-to-r from-blue-500 to-emerald-500">without the friction.</span>
        </h1>

        <p className="text-xl text-muted-foreground max-w-2xl mx-auto mb-10 leading-relaxed animate-in fade-in slide-in-from-bottom-8 duration-700 delay-100">
          Your brain is not a machine you can just switch on.
          <br className="hidden sm:block" />
          DeepSession is a cognitive scaffold that preserves your <strong>context, intent, and mental state</strong>—so you don't start from zero every time you open your laptop.
        </p>

        <div className="flex flex-col sm:flex-row items-center justify-center gap-4 animate-in fade-in slide-in-from-bottom-10 duration-700 delay-200">
          <Link href="/dashboard" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium py-3 px-8 rounded-lg transition-all">
              <BrainCircuit size={18} />
              Restore Context
            </button>
          </Link>
          <Link href="/manifesto" className="w-full sm:w-auto">
            <button className="w-full inline-flex items-center justify-center gap-2 bg-secondary hover:bg-secondary/80 text-secondary-foreground font-medium py-3 px-8 rounded-lg transition-all border border-border">
              Read the Philosophy
              <ArrowRight size={18} />
            </button>
          </Link>
        </div>

        <p className="mt-12 text-sm text-muted-foreground opacity-70">
          Not a todo list. Not a timer. A thinking companion.
        </p>
      </div>
    </section>
  );
}