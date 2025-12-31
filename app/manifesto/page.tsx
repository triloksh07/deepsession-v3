import { Navigation } from '../_components/Navigation';
import { Footer } from '../_components/Footer';
import { ArrowRight } from 'lucide-react';
import Link from 'next/link';

export default function Manifesto() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-16 border-b border-border pb-8">
          <p className="text-sm font-mono text-muted-foreground mb-4">DEEPSESSION MANIFESTO</p>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6">
            Built for depth, <br/>not speed.
          </h1>
        </div>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none space-y-12">
          
          <section className="space-y-6">
            <p className="font-medium text-foreground text-xl">
              Deep work isn't broken because people lack discipline. It's broken because tools treat thinking like assembly line work.
            </p>
            <p>
              The hardest part of deep work isn't finding time. It's recovering context after interruption. Most productivity tools optimize time. Time is not the bottleneck. Cognitive continuity is.
            </p>
            <p>
              People don't need more task lists. They need less friction when resuming thought. DeepSession exists to preserve what tools usually erase: the mental thread that holds work together.
            </p>
          </section>

          <section className="space-y-4 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground">Our Stance</h2>
            
            <ul className="space-y-6 list-none pl-0">
              <li className="pl-4 border-l-2 border-emerald-500">
                <strong className="block text-foreground mb-1">We refuse to optimize for speed at the cost of depth.</strong>
                <span className="text-muted-foreground">Real understanding takes time.</span>
              </li>
              <li className="pl-4 border-l-2 border-emerald-500">
                <strong className="block text-foreground mb-1">We refuse to treat thinking like data entry.</strong>
                <span className="text-muted-foreground">Your brain is not a checkbox machine.</span>
              </li>
              <li className="pl-4 border-l-2 border-emerald-500">
                <strong className="block text-foreground mb-1">We refuse to gamify work or manufacture urgency.</strong>
                <span className="text-muted-foreground">No streaks. No badges. Just progress.</span>
              </li>
              <li className="pl-4 border-l-2 border-emerald-500">
                <strong className="block text-foreground mb-1">We refuse to pretend context is free to recreate.</strong>
                <span className="text-muted-foreground">State preservation is the most valuable feature.</span>
              </li>
            </ul>
          </section>

          <section className="space-y-4 pt-8">
            <p className="text-lg font-medium text-foreground">
              We build for people who think in sessions, not sprints. <br/>
              We build for work that compounds, not work that resets daily. <br/>
              We build for the kind of thinking that needs silence, space, and continuity.
            </p>
            <p className="text-xl text-muted-foreground italic pt-4">
              DeepSession is not here to make you productive. It's here to help you think without starting over.
            </p>
          </section>

          <div className="pt-12">
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium py-3 px-6 rounded-lg transition-colors">
                Start Your First Deep Session
                <ArrowRight size={18} />
              </button>
            </Link>
          </div>
        </div>
      </main>
      <Footer />
    </div>
  );
}