import { Brain, GitBranch, Layers } from 'lucide-react';

export function Positioning() {
  return (
    <section className="py-24 bg-background border-b border-border">
      <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-6">
            A Cognitive Continuity System
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            DeepSession acts as an external working memory for your deep work.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          <div className="bg-secondary/20 border border-border rounded-xl p-8 hover:bg-secondary/30 transition-colors">
            <Layers className="text-emerald-500 mb-6" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">A Cognitive Scaffold</h3>
            {/* <p className="text-muted-foreground leading-relaxed">
              Complex problems require holding many variables in your head. DeepSession preserves this structure so you don't have to rebuild it every time you open your laptop.
            </p> */}
            <p className="text-muted-foreground leading-relaxed">
              It preserves the structure of your problem-solving process so you don't have to rebuild the mental model every time you open your laptop.
            </p>
          </div>

          <div className="bg-secondary/20 border border-border rounded-xl p-8 hover:bg-secondary/30 transition-colors">
            <Brain className="text-blue-500 mb-6" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">Thinking Companion</h3>
            <p className="text-muted-foreground leading-relaxed">
              It captures the "edges" of your thinking—the open questions, the active blockers, and the next logic leap—ensuring your intent survives the break.
            </p>
          </div>

          <div className="bg-secondary/20 border border-border rounded-xl p-8 hover:bg-secondary/30 transition-colors">
            <GitBranch className="text-purple-500 mb-6" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">Continuity Layer</h3>
            {/* <p className="text-muted-foreground leading-relaxed">
              Work shouldn't feel like starting from zero every day. DeepSession threads your sessions together, turning isolated efforts into a coherent narrative of progress.
            </p> */}
            <p className="text-muted-foreground leading-relaxed">
              It threads your sessions together, turning isolated bursts of effort into a coherent, cumulative narrative of progress.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}

