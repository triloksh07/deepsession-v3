// manifesto/page.tsx
import { Navigation } from '../_components/Navigation';
import { Footer } from '../_components/Footer';
import { ArrowRight, Feather } from 'lucide-react';
import Link from 'next/link';

export default function Manifesto() {
  return (
    <div className="bg-background text-foreground min-h-screen">
      <Navigation />
      
      <main className="max-w-3xl mx-auto px-6 pt-32 pb-20">
        <div className="mb-16 border-b border-border pb-8">
          <div className="flex items-center gap-2 text-emerald-500 mb-4">
            <Feather size={20} />
            <span className="text-sm font-mono uppercase tracking-wider">The Philosophy</span>
          </div>
          <h1 className="text-4xl md:text-5xl font-bold tracking-tight mb-6 leading-tight">
            Built for the <br/> continuity of thought.
          </h1>
        </div>

        <div className="prose prose-lg prose-slate dark:prose-invert max-w-none space-y-12">
          
          <section className="space-y-6">
            <p className="text-xl font-medium text-foreground leading-relaxed">
              We believe the most valuable work happens when thinking is continuous.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              The hardest part of deep work isn't finding time. It is holding the context in your mind. Every interruption fractures that context. Every restart requires reconstruction.
            </p>
            <p className="text-muted-foreground leading-relaxed">
              Tools should not demand your attention; they should preserve your intent. They should act as a quiet layer that holds your mental state while you rest.
            </p>
          </section>

          <section className="space-y-8 pt-8 border-t border-border">
            <h2 className="text-2xl font-bold text-foreground">Our Core Beliefs</h2>
            
            <div className="space-y-8">
              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Depth requires patience</h3>
                <p className="text-muted-foreground">
                  Real understanding takes time. We build for the kind of thinking that needs silence, space, and a lack of urgency. We optimize for the quality of the session, not the speed of the check-in.
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Context is currency</h3>
                <p className="text-muted-foreground">
                  The real cost of stopping work is the loss of context. Preserving your mental state is the most valuable service a tool can provide. It bridges the gap between "now" and "later."
                </p>
              </div>

              <div>
                <h3 className="text-lg font-bold text-foreground mb-2">Work compounds</h3>
                <p className="text-muted-foreground">
                  Great projects are not built in sprints; they are built in layers. We build for work that accumulates meaning over time, ensuring that today's effort connects seamlessly to yesterday's thinking.
                </p>
              </div>
            </div>
          </section>

          <div className="pt-12">
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 font-medium py-3 px-6 rounded-lg transition-colors">
                Begin Your Session
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