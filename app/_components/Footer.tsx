import Link from 'next/link'
export function Footer() {
  return (
    <footer className="bg-background border-t border-border py-12">
      <div className="max-w-6xl mx-auto px-4 text-center">
        <p className="text-foreground font-bold text-lg mb-2">DeepSession</p>
        <p className="text-muted-foreground text-sm">
          Cognitive Continuity System v1.0
        </p>
        <div className="flex justify-center gap-6 mt-6 text-sm text-muted-foreground">
          <Link href="/manifesto" className="hover:text-foreground transition-colors">Manifesto</Link>
          <Link href="/login" className="hover:text-foreground transition-colors">Login</Link>
          <Link href="https://github.com/triloksh07/deepsession-v3" target="_blank" className="hover:text-foreground transition-colors">GitHub</Link>
        </div>
      </div>
    </footer>
  );
}