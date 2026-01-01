'use client';
import { useState, useEffect } from 'react';
import { BrainCircuit, Menu, X, ArrowRight } from 'lucide-react';
import Link from 'next/link';
import { usePathname } from 'next/navigation';

export function Navigation() {
  const [isOpen, setIsOpen] = useState(false);
  const [scrolled, setScrolled] = useState(false);
  const pathname = usePathname();
  const isHome = pathname === '/';

  // Handle scroll effect for glassmorphism
  useEffect(() => {
    const handleScroll = () => {
      setScrolled(window.scrollY > 20);
    };
    window.addEventListener('scroll', handleScroll);
    return () => window.removeEventListener('scroll', handleScroll);
  }, []);

  const scrollToSection = (id: string) => {
    if (!isHome) {
      window.location.href = `/${id}`; // Fallback if on another page
      return;
    }
    const element = document.getElementById(id);
    if (element) {
      element.scrollIntoView({ behavior: 'smooth' });
      setIsOpen(false);
    }
  };

  return (
    <nav 
      className={`fixed top-0 left-0 right-0 z-50 transition-all duration-300 border-b ${
        scrolled 
          ? 'bg-background/80 backdrop-blur-md border-border shadow-sm' 
          : 'bg-transparent border-transparent'
      }`}
    >
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8">
        <div className="flex justify-between items-center h-16">
          {/* Logo */}
          <Link href="/" className="flex items-center gap-2 group">
            <div className="flex items-center justify-center w-8 h-8 rounded-lg bg-primary text-primary-foreground transition-transform group-hover:scale-105">
              <BrainCircuit size={18} />
            </div>
            <span className="text-foreground font-bold text-lg tracking-tight">DeepSession</span>
          </Link>

          {/* Desktop Links */}
          <div className="hidden md:flex items-center gap-8">
            <Link 
              href="/manifesto" 
              className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
            >
              Philosophy
            </Link>
            
            {isHome && (
              <>
                <button
                  onClick={() => scrollToSection('protocol')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  The Protocol
                </button>
                <button
                  onClick={() => scrollToSection('architecture')}
                  className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors"
                >
                  Architecture
                </button>
              </>
            )}

            <div className="h-4 w-px bg-border mx-2"></div>

            <Link href="/login" className="text-sm font-medium text-muted-foreground hover:text-foreground transition-colors">
              Sign In
            </Link>
            <Link href="/dashboard">
              <button className="inline-flex items-center gap-2 bg-foreground text-background hover:bg-foreground/90 text-sm font-medium py-2 px-4 rounded-md transition-colors">
                Start Session
              </button>
            </Link>
          </div>

          {/* Mobile Menu Button */}
          <button
            className="md:hidden p-2 text-foreground"
            onClick={() => setIsOpen(!isOpen)}
          >
            {isOpen ? <X size={24} /> : <Menu size={24} />}
          </button>
        </div>

        {/* Mobile Menu */}
        {isOpen && (
          <div className="md:hidden absolute top-16 left-0 right-0 bg-background border-b border-border p-4 space-y-4 shadow-xl animate-in slide-in-from-top-2">
            <Link 
              href="/manifesto"
              className="block text-base font-medium text-muted-foreground hover:text-foreground"
              onClick={() => setIsOpen(false)}
            >
              Philosophy
            </Link>
            {isHome && (
              <>
                <button
                  onClick={() => scrollToSection('protocol')}
                  className="block w-full text-left text-base font-medium text-muted-foreground hover:text-foreground"
                >
                  The Protocol
                </button>
                <button
                  onClick={() => scrollToSection('architecture')}
                  className="block w-full text-left text-base font-medium text-muted-foreground hover:text-foreground"
                >
                  Architecture
                </button>
              </>
            )}
            <div className="pt-4 border-t border-border flex flex-col gap-3">
              <Link href="/login" className="block text-center text-sm font-medium text-muted-foreground">
                Sign In
              </Link>
              <Link href="/dashboard">
                <button className="w-full bg-foreground text-background py-3 rounded-lg font-medium">
                  Start Session
                </button>
              </Link>
            </div>
          </div>
        )}
      </div>
    </nav>
  );
}