function AuthForm() {
  try {
    const [isSignUp, setIsSignUp] = React.useState(false);
    const [email, setEmail] = React.useState('');
    const [password, setPassword] = React.useState('');
    const [message, setMessage] = React.useState('');

    const handleSubmit = async (e) => {
      e.preventDefault();
      setMessage('');
      
      try {
        if (isSignUp) {
          await firebaseAuth.createUserWithEmailAndPassword(email, password);
          setMessage('Account created successfully!');
          setTimeout(() => window.location.href = 'library.html', 1500);
        } else {
          await firebaseAuth.signInWithEmailAndPassword(email, password);
          setMessage('Sign in successful!');
          setTimeout(() => window.location.href = 'library.html', 1500);
        }
      } catch (error) {
        setMessage(error.message);
      }
    };

    const handleGoogleSignIn = async () => {
        const provider = new firebase.auth.GoogleAuthProvider();
        try {
            await firebaseAuth.signInWithPopup(provider);
            setMessage('Sign in with Google successful!');
            setTimeout(() => window.location.href = 'library.html', 1500);
        } catch (error) {
            setMessage(error.message);
        }
    };


    return (
      <div className="min-h-[calc(100vh-4rem)] flex items-center justify-center py-12 px-4">
        <div className="max-w-md w-full glass-panel p-8">
          <h2 className="text-3xl font-bold text-center mb-6 text-white">
            {isSignUp ? 'Create Account' : 'Welcome Back'}
          </h2>
          
          <form onSubmit={handleSubmit} className="space-y-4">
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Email</label>
              <input
                type="email"
                value={email}
                onChange={(e) => setEmail(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            <div>
              <label className="block text-sm font-medium mb-2 text-gray-200">Password</label>
              <input
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                className="w-full px-4 py-2 border border-gray-300 rounded-lg focus:ring-2 focus:ring-blue-500 focus:border-transparent"
                required
              />
            </div>
            
            {message && (
              <div className={`p-3 rounded-lg text-sm ${message.includes('success') ? 'bg-green-100 text-green-700' : 'bg-red-100 text-red-700'}`}>
                {message}
              </div>
            )}
            
            <button type="submit" className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors">
              {isSignUp ? 'Sign Up' : 'Sign In'}
            </button>
          </form>

          <div className="my-6 flex items-center">
            <div className="flex-grow border-t border-gray-400"></div>
            <span className="mx-4 text-gray-300">OR</span>
            <div className="flex-grow border-t border-gray-400"></div>
          </div>

          <button onClick={handleGoogleSignIn} className="w-full py-3 bg-white text-gray-800 rounded-lg font-medium hover:bg-gray-200 transition-colors flex items-center justify-center gap-2">
            <img src="https://www.google.com/images/branding/googlelogo/1x/googlelogo_color_272x92dp.png" alt="Google logo" className="w-5 h-5" />
            Continue with Google
          </button>
          
          <div className="mt-6 text-center">
            <button
              onClick={() => setIsSignUp(!isSignUp)}
              className="text-blue-600 dark:text-blue-400 hover:underline"
            >
              {isSignUp ? 'Already have an account? Sign In' : "Don't have an account? Sign Up"}
            </button>
          </div>
        </div>
      </div>
    );
  } catch (error) {
    console.error('AuthForm error:', error);
    return null;
  }
}