function AppRouter() {
  try {
    const [path, setPath] = React.useState(window.location.pathname);

    const handleRouteChange = () => {
      setPath(window.location.pathname);
    };

    React.useEffect(() => {
      window.addEventListener('popstate', handleRouteChange);
      return () => window.removeEventListener('popstate', handleRouteChange);
    }, []);

    let Component;
    switch (path) {
      case '/index.html':
      case '/':
        Component = () => (
          <>
            <Hero />
            <Features />
          </>
        );
        break;
      case '/library.html':
        Component = BookGrid;
        break;
      case '/about.html':
        Component = AboutContent;
        break;
      case '/contact.html':
        Component = ContactForm;
        break;
      case '/reader.html':
        Component = BookReader;
        break;
      default:
        Component = () => <p className="text-center text-white py-10">Page not found</p>;
    }

    return (
      <div className="min-h-screen bg-transparent">
        <Header />
        <Component />
        <Footer />
      </div>
    );
  } catch (error) {
    console.error('AppRouter error:', error);
    return null;
  }
}