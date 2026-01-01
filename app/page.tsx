import { Navigation } from './_components/Navigation';
import { Hero } from './_components/sections/Hero';
import { Architecture } from './_components/sections/Architecture';
import { Problem } from './_components/sections/Problem';
import { Positioning } from './_components/sections/Positioning';
import { Protocol } from './_components/sections/Protocol';
import { Target } from './_components/sections/Target';
import { Footer } from './_components/Footer';
import type { Metadata } from "next";

export const metadata: Metadata = {
  title: "DeepSession - Track | Analyse | Improve",
  description: "Boost your productivity with AI-driven focus sessions and personalized insights",
};

function App() {
  return (
    <div className="bg-background text-foreground selection:bg-primary/20">
      <Navigation />
      <Hero />
      <Problem />
      <Positioning />
      <section id="protocol">
        <Protocol />
      </section>
      <section id="architecture">
        <Architecture />
      </section>
      <Target />
      <Footer />
    </div>
  );
}

export default App;