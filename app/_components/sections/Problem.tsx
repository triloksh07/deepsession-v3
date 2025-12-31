import { Unplug, Ghost, RotateCcw } from 'lucide-react';

export function Problem() {
  return (
    <section className="py-24 bg-secondary/20 border-y border-border">
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="text-center mb-16">
          <h2 className="text-3xl font-bold text-foreground mb-4">
            Why deep work feels so hard
          </h2>
          <p className="text-lg text-muted-foreground max-w-2xl mx-auto">
            It's not because you're lazy. It's because modern tools optimize for tasks, not thinking.
          </p>
        </div>

        <div className="grid md:grid-cols-3 gap-8">
          {/* Problem 1 */}
          <div className="bg-card border border-border p-8 rounded-xl">
            <Unplug className="text-destructive mb-4" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">The Context Penalty</h3>
            <p className="text-muted-foreground leading-relaxed">
              "I lose momentum every time I stop." <br/><br/>
              When you stop, your mental model evaporates. Restarting isn't just opening a laptop; it's reconstructing a complex graph of thoughts from scratch. This friction kills consistency.
            </p>
          </div>

          {/* Problem 2 */}
          <div className="bg-card border border-border p-8 rounded-xl">
            <Ghost className="text-blue-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">Invisible Effort</h3>
            <p className="text-muted-foreground leading-relaxed">
              "I worked all day, but I don't feel progress." <br/><br/>
              You spent 6 hours debugging or researching. No tickets moved. No checkboxes clicked. Standard tools make this work look like "nothing," destroying your morale.
            </p>
          </div>

          {/* Problem 3 */}
          <div className="bg-card border border-border p-8 rounded-xl">
            <RotateCcw className="text-emerald-500 mb-4" size={32} />
            <h3 className="text-xl font-bold text-foreground mb-3">The Fade Out</h3>
            <p className="text-muted-foreground leading-relaxed">
              "I start strong, then quit after 3 days." <br/><br/>
              Productivity apps punish you for missing a day. They lack emotional closure. Without a sense of narrative continuity, you burn out and abandon the system.
            </p>
          </div>
        </div>
      </div>
    </section>
  );
}