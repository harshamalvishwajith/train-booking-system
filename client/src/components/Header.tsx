import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Train } from 'lucide-react';

export default function Header() {
  return (
    <header className="sticky top-0 z-50 w-full border-b border-border/40 bg-background/95 backdrop-blur supports-[backdrop-filter]:bg-background/60">
      <div className="container mx-auto flex h-16 items-center justify-between px-4 md:px-8">
        <Link href="/" className="flex items-center space-x-2 transition-opacity hover:opacity-80">
          <div className="bg-primary/10 p-2 rounded-xl">
            <Train className="h-6 w-6 text-primary" />
          </div>
          <span className="font-bold text-xl tracking-tight hidden sm:inline-block">ExpressRail</span>
        </Link>
        <nav className="hidden md:flex items-center gap-8 text-sm font-medium">
          <Link href="/" className="text-muted-foreground transition-colors hover:text-primary">Home</Link>
          <Link href="/search" className="text-muted-foreground transition-colors hover:text-primary">Live Trains</Link>
          <Link href="/manage" className="text-muted-foreground transition-colors hover:text-primary">Manage Bookings</Link>
        </nav>
        <div className="flex items-center gap-4">
          <Button variant="ghost" size="sm" className="hidden sm:inline-flex">Log in</Button>
          <Button size="sm" className="rounded-full shadow-sm">Sign Up</Button>
        </div>
      </div>
    </header>
  );
}
