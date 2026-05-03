import SearchForm from "@/components/SearchForm";

export default function Home() {
  return (
    <div className="flex flex-col flex-1">
      {/* Hero Section */}
      <section className="relative flex flex-col items-center justify-center px-4 pt-24 pb-32 text-center overflow-hidden h-[80vh] min-h-[600px]">
        {/* Background Gradients and Image Simulation */}
        <div className="absolute inset-0 z-0 bg-slate-950">
          <div className="absolute inset-0 bg-gradient-to-br from-indigo-900/50 via-slate-900/80 to-slate-950" />
          <div className="absolute top-0 left-0 right-0 h-px bg-gradient-to-r from-transparent via-indigo-500/50 to-transparent" />
          <div className="absolute bottom-0 left-0 right-0 h-32 bg-gradient-to-t from-background to-transparent z-10" />
        </div>

        <div className="relative z-20 w-full max-w-5xl mx-auto space-y-8">
          <h1 className="text-5xl md:text-7xl font-extrabold tracking-tight text-white drop-shadow-md">
            Your Journey <span className="text-transparent bg-clip-text bg-gradient-to-r from-red-400 to-indigo-400">Starts Here</span>
          </h1>
          <p className="max-w-2xl mx-auto text-lg md:text-xl text-slate-300 drop-shadow">
            Experience the scenic beauty of Sri Lanka. Book your train tickets instantly with real-time availability and dynamic pricing.
          </p>

          <SearchForm />
        </div>
      </section>

      {/* Features Section */}
      <section className="py-24 bg-background px-4">
        <div className="container mx-auto">
          <div className="grid grid-cols-1 md:grid-cols-3 gap-12 text-center">
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Lightning Fast</h3>
              <p className="text-muted-foreground">Book your tickets in seconds with our optimized platform.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.03 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Secure Booking</h3>
              <p className="text-muted-foreground">Your payments and personal information are heavily encrypted.</p>
            </div>
            <div className="space-y-4">
              <div className="mx-auto flex h-16 w-16 items-center justify-center rounded-2xl bg-indigo-100 dark:bg-indigo-900/30">
                <svg className="h-8 w-8 text-indigo-600 dark:text-indigo-400" fill="none" viewBox="0 0 24 24" stroke="currentColor">
                  <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M15 17h5l-1.405-1.405A2.032 2.032 0 0118 14.158V11a6.002 6.002 0 00-4-5.659V5a2 2 0 10-4 0v.341C7.67 6.165 6 8.388 6 11v3.159c0 .538-.214 1.055-.595 1.436L4 17h5m6 0v1a3 3 0 11-6 0v-1m6 0H9" />
                </svg>
              </div>
              <h3 className="text-xl font-bold">Real-time Updates</h3>
              <p className="text-muted-foreground">Get instant notifications about your train schedule and delays.</p>
            </div>
          </div>
        </div>
      </section>
    </div>
  );
}
