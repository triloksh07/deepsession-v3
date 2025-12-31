import { Navigation } from '../_components/Navigation';
import { Footer } from '../_components/Footer';
import { ArrowRight, Brain, Clock, Zap } from 'lucide-react';
import Link from 'next/link';

export default function Manifesto() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        {/* Header */}
        <div className="mb-16 border-b border-border pb-8">
          <p className="text-sm font-mono text-muted-foreground mb-4">INTERNAL MEMO // PUBLIC RELEASE</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            The Cognitive Continuity Manifesto
          </h1>
          <p className="text-xl text-muted-foreground leading-relaxed">
            Why we are building a tool to fix the "broken state" of modern deep work.
          </p>
        </div>

        {/* Essay Content */}
        <div className="prose prose-slate dark:prose-invert max-w-none space-y-12">
          
          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Clock className="text-blue-500" />
              The 20-Minute Penalty
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Every time you stop working, you pay a tax. Not a time tax, but a <strong>cognitive tax</strong>.
              When you close your laptop, your mental model of the problem—the complex graph of variables, constraints, and next steps—evaporates.
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground mt-4">
              When you return, you don't just "resume." You rebuild. You spend 15 to 20 minutes re-loading that context into your working memory. We call this the <strong>Context Penalty</strong>. It is the silent killer of momentum.
            </p>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Brain className="text-emerald-500" />
              Not a Timer. A State Machine.
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              Most productivity tools are built for managers, not makers. They track <em>output</em> (did you finish the task?) but ignore <em>state</em> (are you in the zone?).
            </p>
            <p className="text-lg leading-relaxed text-muted-foreground mt-4">
              <strong>DeepSession is different.</strong> We treat your brain like a computer that needs to "save state" to disk before shutting down.
            </p>
            <ul className="list-disc pl-6 space-y-2 mt-4 text-muted-foreground">
              <li><strong>The Check-In:</strong> Instead of staring at a blank screen, we show you exactly where you left off. Your last thought. Your active blocker. Your next micro-step.</li>
              <li><strong>The Check-Out:</strong> We don't let you just quit. You must "dump" your cache. Write down the open loop. Clear the RAM. This allows you to disconnect without anxiety.</li>
            </ul>
          </section>

          <section>
            <h2 className="text-2xl font-bold mb-4 flex items-center gap-3">
              <Zap className="text-purple-500" />
              Who This Is For
            </h2>
            <p className="text-lg leading-relaxed text-muted-foreground">
              We did not build this for people with 50 small tasks a day. We built this for <strong>The Deep Workers</strong>.
            </p>
            <div className="grid sm:grid-cols-2 gap-4 mt-6">
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <h3 className="font-bold text-foreground">The Architect</h3>
                <p className="text-sm text-muted-foreground mt-1">Developers and Systems Thinkers who need to hold complex logic structures in their head.</p>
              </div>
              <div className="p-4 bg-secondary/30 rounded-lg border border-border">
                <h3 className="font-bold text-foreground">The Researcher</h3>
                <p className="text-sm text-muted-foreground mt-1">Academics and writers who navigate long, unstructured periods of intense focus.</p>
              </div>
            </div>
          </section>

          <section className="bg-card border border-border rounded-xl p-8 mt-12">
            <h3 className="text-xl font-bold mb-2">Ready to regain control?</h3>
            <p className="text-muted-foreground mb-6">
              Stop losing momentum. Start saving your mental state.
            </p>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium py-3 px-6 rounded-lg transition-colors">
                Start Your First Deep Session
                <ArrowRight size={18} />
              </button>
            </Link>
          </section>
        </div>
      </main>

      <Footer />
    </div>
  );
}