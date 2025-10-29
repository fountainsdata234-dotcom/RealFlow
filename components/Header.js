function CSSFlippingBookLogo() {
  // This component renders a colorful, continuously flipping book animation using pure CSS.
  return (
    <div className="book">
      <div className="book__page"></div>
      <div className="book__page"></div>
      <div className="book__page"></div>
    </div>
  );
}

function Header() {
  try {
    React.useEffect(() => {
      // Inject the CSS animation keyframes directly into the document head
      const style = document.createElement('style');
      style.textContent = `
        @import url('https://fonts.googleapis.com/css2?family=Great+Vibes&display=swap');
        .brand-font {
          font-family: 'Great Vibes', cursive;
          background: linear-gradient(to right, #60a5fa, #3b82f6);
          -webkit-background-clip: text;
          -webkit-text-fill-color: transparent;
          font-weight: normal; /* Script fonts often look best at normal weight */
          text-shadow: 1px 1px 2px rgba(0, 0, 0, 0.2); /* Adds depth and visibility */
        }
        .book {
          position: relative;
          width: 32px;
          height: 24px;
          transform: perspective(1000px) rotateY(-30deg);
          transform-style: preserve-3d;
        }
        .book__page {
          position: absolute;
          width: 100%;
          height: 100%;
          background: linear-gradient(to right, #4f46e5, #1d4ed8);
          border-radius: 2px;
          transform-origin: left center;
          animation: flip 3s infinite linear;
        }
        .book__page:nth-child(1) { animation-delay: 0s; background: linear-gradient(to right, #ef4444, #f97316); }
        .book__page:nth-child(2) { animation-delay: -1s; background: linear-gradient(to right, #10b981, #22c55e); }
        .book__page:nth-child(3) { animation-delay: -2s; background: linear-gradient(to right, #8b5cf6, #a855f7); }
        @keyframes flip {
          from { transform: rotateY(0deg); }
          to { transform: rotateY(-180deg); }
        }
      `;
      document.head.appendChild(style);
      return () => { document.head.removeChild(style); };
    }, []);

    const [user, setUser] = React.useState(null);
    const [menuOpen, setMenuOpen] = React.useState(false);
    const [currentPage, setCurrentPage] = React.useState('');

    React.useEffect(() => {
      const unsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
      });
      setCurrentPage(window.location.pathname.split('/').pop());
      return () => unsubscribe();
    }, []);

    return (
      <header className="bg-slate-900/30 backdrop-blur-lg sticky top-0 z-50 border-b border-slate-700/50" data-name="header" data-file="components/Header.js">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex justify-between items-center h-16">
            <a href="index.html" className="flex items-center space-x-2">
              <CSSFlippingBookLogo />
              <span className="text-4xl brand-font" style={{lineHeight: '1'}}>RealFlow</span>
            </a>

            <nav className="hidden md:flex items-center space-x-8 font-medium">
              <a href="library.html" className={`transition-colors ${currentPage === 'library.html' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-red-500 hover:text-red-400'}`}>Library</a>
              <a href="about.html" className={`transition-colors ${currentPage === 'about.html' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-red-500 hover:text-red-400'}`}>About</a>
              <a href="contact.html" className={`transition-colors ${currentPage === 'contact.html' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-red-500 hover:text-red-400'}`}>Contact</a>
              {user ? (
                <a href="profile.html" className={`transition-colors ${currentPage === 'profile.html' ? 'text-blue-400 border-b-2 border-blue-400 pb-1' : 'text-red-500 hover:text-red-400'}`}>Profile</a>
              ) : (
                <a href="auth.html" className="btn-primary">Sign In</a>
              )}
            </nav>

            <button onClick={() => setMenuOpen(!menuOpen)} className="md:hidden text-2xl text-blue-400">
              <div className={menuOpen ? "icon-x" : "icon-menu"}></div>
            </button>
          </div>

          {menuOpen && (
            <div className="md:hidden pb-4">
              <a href="library.html" onClick={() => setMenuOpen(false)} className="block py-2 text-red-500 hover:text-red-400">Library</a>
              <a href="about.html" onClick={() => setMenuOpen(false)} className="block py-2 text-red-500 hover:text-red-400">About</a>
              <a href="contact.html" onClick={() => setMenuOpen(false)} className="block py-2 text-red-500 hover:text-red-400">Contact</a>
              <a href={user ? "profile.html" : "auth.html"} onClick={() => setMenuOpen(false)} className="block py-2 text-blue-400 font-medium">
                {user ? "Profile" : "Sign In"}
              </a>
            </div>
          )}
        </div>
      </header>
    );
  } catch (error) {
    console.error('Header component error:', error);
    return null;
  }
}