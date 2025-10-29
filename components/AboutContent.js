function AboutContent() {
  try {
    React.useEffect(() => {
      const observer = new IntersectionObserver((entries) => {
        entries.forEach(entry => {
          if (entry.isIntersecting) {
            entry.target.classList.add('animate-on-scroll');
          }
        });
      }, { threshold: 0.1 });

      const elements = document.querySelectorAll('.scroll-target');
      elements.forEach(el => observer.observe(el));

      return () => elements.forEach(el => observer.unobserve(el));
    }, []);

    return (
      <div className="py-16">
        <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            <h1 className="text-5xl font-bold text-center mb-12 text-white scroll-target opacity-0">About <span className="brand-font">RealFlow</span></h1>
        </div>

        <div className="bg-white py-20">
          <div className="max-w-5xl mx-auto px-4 sm:px-6 lg:px-8">
            {/* Our Mission Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24 scroll-target opacity-0">
              <div className="order-2 md:order-1">
                <h2 className="text-4xl font-semibold mb-4 text-blue-600">Our Mission</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  RealFlow is dedicated to bringing the joy of reading to everyone, everywhere. 
                  We believe that access to great literature should be unlimited, convenient, and magical.
                </p>
              </div>
              <div className="order-1 md:order-2 flex justify-center scroll-target opacity-0">
                 <dotlottie-wc src="https://lottie.host/1d6bce41-350f-460b-afca-c6806041d3b8/U30zV0uwk2.lottie" style={{ width: '250px', height: '250px' }} autoplay loop></dotlottie-wc>
              </div>
            </div>

            {/* Our Core Values Section */}
            <div className="text-center mb-24 scroll-target opacity-0">
                <h2 className="text-4xl font-semibold mb-10 text-blue-600">Our Core Values</h2>
                <div className="grid md:grid-cols-3 gap-8">
                    <div className="p-6">
                        <div className="icon-globe text-4xl text-blue-500 mx-auto mb-4"></div>
                        <h3 className="text-2xl font-semibold mb-2">Accessibility</h3>
                        <p className="text-gray-600">Making literature available to everyone, regardless of location or device.</p>
                    </div>
                    <div className="p-6">
                        <div className="icon-compass text-4xl text-blue-500 mx-auto mb-4"></div>
                        <h3 className="text-2xl font-semibold mb-2">Discovery</h3>
                        <p className="text-gray-600">Helping you find your next favorite book through intuitive design and curation.</p>
                    </div>
                    <div className="p-6">
                        <div className="icon-users text-4xl text-blue-500 mx-auto mb-4"></div>
                        <h3 className="text-2xl font-semibold mb-2">Community</h3>
                        <p className="text-gray-600">Connecting readers and fostering a shared passion for stories.</p>
                    </div>
                </div>
            </div>

            {/* How It Works Section */}
            <div className="grid md:grid-cols-2 gap-12 items-center mb-24 scroll-target opacity-0">
              <div className="flex justify-center order-1 scroll-target opacity-0">
                <dotlottie-wc src="https://lottie.host/e7518453-c57b-463b-b2e4-2a592a9b7953/V41dcc9XOS.lottie" style={{ width: '250px', height: '250px' }} autoplay loop></dotlottie-wc>
              </div>
              <div className="order-2">
                <h2 className="text-4xl font-semibold mb-4 text-blue-600">How It Works</h2>
                <p className="text-lg text-gray-700 leading-relaxed">
                  Our platform provides a seamless reading experience with a vast collection of books 
                  spanning all genres, from timeless classics to contemporary bestsellers, all accessible on any device.
                </p>
              </div>
            </div>

            {/* Join Us Section */}
            <div className="text-center scroll-target opacity-0">
                <h2 className="text-4xl font-semibold mb-4 text-blue-600">Join Our Community</h2>
                <p className="text-lg text-gray-700 max-w-2xl mx-auto mb-8">
                    Ready to dive in? Start building your personal library today and discover a universe of stories waiting for you.
                </p>
                <a href="auth.html" className="inline-block px-10 py-4 bg-blue-600 text-white text-lg font-semibold rounded-lg hover:bg-blue-700 transition-colors">
                    Get Started for Free
                </a>
            </div>

          </div>
        </div>

      </div>
    );
  } catch (error) {
    console.error('AboutContent error:', error);
    return null;
  }
}