function Features() {
  try {
    const features = [
      {
        icon: "library",
        title: "Personal Library",
        description: "Build your own collection of favorite books and access them anytime, anywhere."
      },
      {
        icon: "history",
        title: "Reading History",
        description: "Track your reading progress and revisit books you've enjoyed."
      },
      {
        icon: "heart",
        title: "Favorites",
        description: "Mark books as favorites and create custom reading lists."
      },
      {
        icon: "user",
        title: "Personal Profile",
        description: "Customize your profile, change your avatar, and manage your account."
      }
    ];

    return (
      <section className="py-20 bg-white" data-name="features" data-file="components/Features.js">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <h2 className="text-4xl font-bold text-center text-[var(--text-primary)] mb-12">
            Everything You Need
          </h2>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => (
              <div key={index} className="text-center p-6 rounded-lg hover:shadow-lg transition-shadow">
                <div className="w-16 h-16 mx-auto mb-4 bg-blue-100 rounded-full flex items-center justify-center">
                  <div className={`icon-${feature.icon} text-2xl text-[var(--primary-color)]`}></div>
                </div>
                <h3 className="text-xl font-semibold mb-2">{feature.title}</h3>
                <p className="text-[var(--text-secondary)]">{feature.description}</p>
              </div>
            ))}
          </div>
        </div>
      </section>
    );
  } catch (error) {
    console.error('Features component error:', error);
    return null;
  }
}