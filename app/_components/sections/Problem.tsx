import { Quote } from 'lucide-react';

export function Problem() {
  return (
    <section className="py-24 bg-secondary/20 border-b border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            The real friction isn't time.
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            It is the loss of context.
          </p>
        </div>

        <div className="grid md:grid-cols-2 gap-8">
          <div className="bg-card border border-border p-8 rounded-xl hover:border-blue-500/30 transition-colors">
            <Quote className="text-blue-500 mb-4 opacity-50" size={24} />
            <h3 className="text-xl font-bold text-foreground mb-3">"I lose momentum every time I stop."</h3>
            <p className="text-muted-foreground leading-relaxed">
              Context dies between sessions. You remember what you did, but not why. Restarting feels like starting over.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-xl hover:border-blue-500/30 transition-colors">
            <Quote className="text-blue-500 mb-4 opacity-50" size={24} />
            <h3 className="text-xl font-bold text-foreground mb-3">"I worked today, but I don't feel progress."</h3>
            <p className="text-muted-foreground leading-relaxed">
              Effort is invisible. There's no narrative connecting yesterday's work to today's. No sense of accumulation.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-xl hover:border-blue-500/30 transition-colors">
            <Quote className="text-blue-500 mb-4 opacity-50" size={24} />
            <h3 className="text-xl font-bold text-foreground mb-3">"I can't resume deep work quickly."</h3>
            <p className="text-muted-foreground leading-relaxed">
              Every session begins with mental archaeology — reconstructing what you were thinking, where you were headed.
            </p>
          </div>

          <div className="bg-card border border-border p-8 rounded-xl hover:border-blue-500/30 transition-colors">
            <Quote className="text-blue-500 mb-4 opacity-50" size={24} />
            <h3 className="text-xl font-bold text-foreground mb-3">"I fade after 3–5 days."</h3>
            <p className="text-muted-foreground leading-relaxed">
              No closure. No emotional loop. No continuity. Motivation drains when progress feels fragmented.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}