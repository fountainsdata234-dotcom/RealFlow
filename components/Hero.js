function Hero() {
  try {
    return (
      <section className="bg-gradient-to-br from-blue-50 to-indigo-100 py-20" data-name="hero" data-file="components/Hero.js">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <h1 className="text-5xl md:text-6xl font-bold text-[var(--text-primary)] mb-6">
              Welcome to <span className="brand-font">RealFlow</span>
            </h1>
            <p className="text-xl text-[var(--text-secondary)] mb-8 max-w-2xl mx-auto">
              Dive into countless books with your personal digital library. Read, track, and discover your next favorite story.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <a href="auth.html" className="btn-primary">Get Started</a>
              <a href="library.html" className="btn-secondary">Browse Library</a>
            </div>
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Hero component error:', error);
    return null;
  }
}