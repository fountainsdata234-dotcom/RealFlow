function ProfileContent() {
  try {
    const [user, setUser] = React.useState(null);
    const [activeTab, setActiveTab] = React.useState('favorites');
    const [readingHistory, setReadingHistory] = React.useState([]);
    const [favorites, setFavorites] = React.useState([]);
    const [savedBooks, setSavedBooks] = React.useState([]);
    const [offlineBooks, setOfflineBooks] = React.useState([]);
    const [isEditingName, setIsEditingName] = React.useState(false);
    const [newDisplayName, setNewDisplayName] = React.useState('');
    const [isUploading, setIsUploading] = React.useState(false);
    const [isAvatarModalOpen, setIsAvatarModalOpen] = React.useState(false);
    const [isConfirmModalOpen, setIsConfirmModalOpen] = React.useState(false);
    const [notification, setNotification] = React.useState(null);
    const fileInputRef = React.useRef(null);

    React.useEffect(() => {
      const unsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
        if (!currentUser) {
          window.location.href = 'auth.html';
        } else {
          // Check if user has a display name or photo, if not, set a default one
          if (!currentUser.photoURL) {
            const defaultAvatar = `https://api.dicebear.com/6.x/adventurer/svg?seed=${currentUser.uid}`;
            currentUser.updateProfile({ photoURL: defaultAvatar });
          }
          if (!currentUser.displayName) {
            const defaultName = currentUser.email.split('@')[0];
            currentUser.updateProfile({ displayName: defaultName });
          }
          setUser(currentUser); // Use the user object directly
          setNewDisplayName(currentUser.displayName);

          // Fetch Favorites
          const favsUnsubscribe = firebaseDb.collection('users').doc(currentUser.uid).collection('favorites')
            .onSnapshot(snapshot => {
              const favs = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setFavorites(favs);
            });

          // Fetch History
          const historyUnsubscribe = firebaseDb.collection('users').doc(currentUser.uid).collection('readingHistory')
            .orderBy('lastReadTimestamp', 'desc')
            .onSnapshot(snapshot => {
              const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
              setReadingHistory(history);
            });
            
          // Fetch Saved Books
          const savedUnsubscribe = firebaseDb.collection('users').doc(currentUser.uid).collection('savedBooks')
            .onSnapshot(snapshot => {
                const saved = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                setSavedBooks(saved);
            });

          // Load offline books from localStorage
          const cachedOfflineBooks = localStorage.getItem('offlineBooks');
          if (cachedOfflineBooks) {
              setOfflineBooks(JSON.parse(cachedOfflineBooks));
          }

          return () => {
            favsUnsubscribe();
            historyUnsubscribe();
            savedUnsubscribe();
          };
        }
      });
      return () => unsubscribe();
    }, []);

    const handleNameUpdate = async (e) => {
        e.preventDefault();
        if (user && newDisplayName.trim() !== '') {
            await user.updateProfile({ displayName: newDisplayName.trim() });
            setUser(firebaseAuth.currentUser); // Re-fetch the user object to update state
            setIsEditingName(false);
        }
    };

    const handleGenerateAvatar = async () => {
        // This cycles through unique avatars by generating a new random seed
        const newSeed = Math.random().toString(36).substring(7);
        const newAvatar = `https://api.dicebear.com/6.x/adventurer/svg?seed=${newSeed}`;
        await user.updateProfile({ photoURL: newAvatar });
        setUser(firebaseAuth.currentUser); // Re-fetch the user object to update state
        setIsAvatarModalOpen(false);
    };

    const handleUploadClick = () => {
        fileInputRef.current.click();
    };

    const handleFileSelect = async (e) => {
        const file = e.target.files[0];
        if (!file || !user) return;

        setIsUploading(true);
        try {
            const storageRef = firebaseStorage.ref(`avatars/${user.uid}`);
            const snapshot = await storageRef.put(file);
            const downloadURL = await snapshot.ref.getDownloadURL();
            await user.updateProfile({ photoURL: downloadURL });
            setUser(firebaseAuth.currentUser); // Re-fetch the user object to update state
        } catch (error) {
            console.error("Error uploading avatar:", error);
            setNotification({ type: 'error', message: "Failed to upload image. Please try again." });
        } finally {
            setIsUploading(false);
        }
    };

    const AvatarChangeModal = () => {
        if (!isAvatarModalOpen) return null;

        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full relative p-8 text-center">
                    <h3 className="text-2xl font-bold mb-6">Change Profile Picture</h3>
                    <div className="space-y-4">
                        <button onClick={handleUploadClick} className="w-full py-3 bg-blue-600 text-white rounded-lg font-medium hover:bg-blue-700 transition-colors flex items-center justify-center gap-2">
                            <div className="icon-upload-cloud"></div>
                            Upload from device
                        </button>
                        <button onClick={handleGenerateAvatar} className="w-full py-3 bg-gray-200 text-gray-800 rounded-lg font-medium hover:bg-gray-300 transition-colors flex items-center justify-center gap-2">
                            <div className="icon-refresh-cw"></div>
                            Generate a new avatar
                        </button>
                    </div>
                    <button onClick={() => setIsAvatarModalOpen(false)} className="absolute top-4 right-4 text-2xl text-gray-400 hover:text-gray-600">
                        <div className="icon-x"></div>
                    </button>
                </div>
            </div>
        );
    };

    const removeFavorite = async (bookId) => {
        await firebaseDb.collection('users').doc(user.uid).collection('favorites').doc(bookId).delete();
    };

    const handleClearHistory = async () => {
        const historyCollection = firebaseDb.collection('users').doc(user.uid).collection('readingHistory');
        const snapshot = await historyCollection.get();
        const batch = firebaseDb.batch();
        snapshot.docs.forEach(doc => {
            batch.delete(doc.ref);
        });
        await batch.commit();
        setIsConfirmModalOpen(false);
    };

    const ConfirmationModal = () => {
        if (!isConfirmModalOpen) return null;
        return (
            <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
                <div className="bg-white rounded-lg shadow-2xl max-w-sm w-full relative p-8 text-center">
                    <h3 className="text-2xl font-bold mb-4">Are you sure?</h3>
                    <p className="text-gray-600 mb-6">This will permanently delete your entire reading history. This action cannot be undone.</p>
                    <div className="flex justify-center gap-4">
                        <button onClick={() => setIsConfirmModalOpen(false)} className="px-6 py-2 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300">
                            Cancel
                        </button>
                        <button onClick={handleClearHistory} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                            Yes, Delete
                        </button>
                    </div>
                </div>
            </div>
        );
    };

    const downloadBook = (downloadUrl) => {
        window.open(downloadUrl, '_blank');
    };

    const readOffline = (book) => {
        const url = `reader.html?id=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(book.author)}`;
        window.location.href = url;
    };

    const handleSignOut = async () => {
      await firebaseAuth.signOut();
      window.location.href = 'index.html';
    };

    if (!user) return null;
    
    const isGoogleUser = user.providerData.some(provider => provider.providerId === 'google.com');

    const groupedHistory = readingHistory.reduce((acc, book) => {
        if (!book.lastReadTimestamp) return acc;
        const date = book.lastReadTimestamp.toDate();
        const monthYear = new Intl.DateTimeFormat('en-US', { year: 'numeric', month: 'long' }).format(date);
        
        if (!acc[monthYear]) {
            acc[monthYear] = [];
        }
        acc[monthYear].push(book);
        
        return acc;
    }, {});


    return (
      <div className="max-w-6xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
        <div className="bg-white rounded-lg shadow-lg p-8 mb-8 text-gray-800">
          <ConfirmationModal />
          <AvatarChangeModal />
          <div className="flex flex-col md:flex-row items-center gap-6">
            <input type="file" ref={fileInputRef} onChange={handleFileSelect} accept="image/*" className="hidden" />
            <div className="relative group">
                <img src={user.photoURL} alt="Avatar" className="w-32 h-32 rounded-full object-cover" />
                {isUploading && (
                    <div className="absolute inset-0 bg-black/70 rounded-full flex items-center justify-center">
                        <span className="spinner !w-8 !h-8"></span>
                    </div>
                )}
                {!isGoogleUser && (
                    <button onClick={() => setIsAvatarModalOpen(true)} className="absolute inset-0 bg-black/50 rounded-full flex items-center justify-center text-white opacity-0 group-hover:opacity-100 transition-opacity">
                        Change
                    </button>
                )}
            </div>
            <div className="flex-1 text-center md:text-left">
              {isEditingName ? (
                <form onSubmit={handleNameUpdate} className="flex items-center gap-2 mb-2">
                    <input type="text" value={newDisplayName} onChange={(e) => setNewDisplayName(e.target.value)} className="text-3xl font-bold p-1 border-b-2 border-blue-500" autoFocus />
                    <button type="submit" className="text-green-600"><div className="icon-check"></div></button>
                    <button type="button" onClick={() => setIsEditingName(false)} className="text-red-600"><div className="icon-x"></div></button>
                </form>
              ) : (
                <div className="flex items-center gap-3 mb-2 justify-center md:justify-start">
                    <h1 className="text-3xl font-bold">{user.displayName}</h1>
                    {!isGoogleUser && <button onClick={() => setIsEditingName(true)} className="text-gray-500 hover:text-blue-600"><div className="icon-edit-2"></div></button>}
                </div>
              )}
              <p className="text-gray-500 mb-4">{user.email}</p>
              {isGoogleUser && <p className="text-sm text-gray-500 mb-4">To change your name or picture, please visit your Google account settings.</p>}
              <button onClick={handleSignOut} className="px-6 py-2 bg-red-600 text-white rounded-lg hover:bg-red-700">
                Sign Out
              </button>
            </div>
          </div>
        </div>

        <div className="bg-white rounded-lg shadow-lg p-8 text-gray-800">
          <div className="flex gap-4 mb-6 border-b">
            <button
              onClick={() => setActiveTab('favorites')}
              className={`px-4 py-2 font-medium ${activeTab === 'favorites' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Favorites ({favorites.length})
            </button>
            <button
              onClick={() => setActiveTab('history')}
              className={`px-4 py-2 font-medium ${activeTab === 'history' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Reading History
            </button>
            <button
              onClick={() => setActiveTab('saved')}
              className={`px-4 py-2 font-medium ${activeTab === 'saved' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Saved for Download ({savedBooks.length})
            </button>
            <button
              onClick={() => setActiveTab('offline')}
              className={`px-4 py-2 font-medium ${activeTab === 'offline' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-600'}`}
            >
              Offline Books ({offlineBooks.length})
            </button>
          </div>

          {activeTab === 'history' && (
            <div className="max-h-[60vh] overflow-y-auto pr-4">
              {Object.keys(groupedHistory).length > 0 ? (
                Object.entries(groupedHistory).map(([monthYear, books]) => (
                  <div key={monthYear} className="mb-8">
                    <div className="flex justify-between items-center mb-4">
                        <h3 className="text-xl font-semibold text-gray-700">{monthYear}</h3>
                        {monthYear === Object.keys(groupedHistory)[0] && ( // Show button only on the first group
                            <button onClick={() => setIsConfirmModalOpen(true)} className="text-sm text-red-600 hover:underline">Clear History</button>
                        )}
                    </div>
                    <div className="space-y-4">
                      {books.map(book => (
                        <div key={book.id} className="border rounded-lg p-4 flex items-center gap-4">
                          <img src={book.coverUrl} alt={book.title} className="w-12 h-16 object-cover rounded" />
                          <div className="flex-1"><h4 className="font-semibold text-lg">{book.title}</h4><p className="text-sm text-gray-500">by {book.author}</p></div>
                        </div>
                      ))}
                    </div>
                  </div>
                ))
              ) : <p>No reading history yet. Go read some books!</p>}
            </div>
          )}

          {activeTab === 'favorites' && (
            <div>
                {favorites.length >= 40 && <p className="text-center text-yellow-600 bg-yellow-100 p-3 rounded-lg mb-4">Your favorites list is full (40/40). Please remove a book to add a new one.</p>}
                <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                    {favorites.slice(0, 20).map((book) => (
                        <div key={book.id} className="relative group flex-shrink-0 w-40">
                            <img src={book.coverUrl} alt={book.title} className="w-full h-56 object-cover rounded-lg shadow-lg" />
                            <button onClick={() => removeFavorite(book.id)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                <div className="icon-minus"></div>
                            </button>
                        </div>
                    ))}
                </div>
                {favorites.length > 20 && (
                    <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4 mt-6">
                        {favorites.slice(20, 40).map((book) => (
                            <div key={book.id} className="relative group flex-shrink-0 w-40">
                                <img src={book.coverUrl} alt={book.title} className="w-full h-56 object-cover rounded-lg shadow-lg" />
                                <button onClick={() => removeFavorite(book.id)} className="absolute top-1 right-1 bg-black/50 text-white rounded-full w-6 h-6 flex items-center justify-center opacity-0 group-hover:opacity-100 transition-opacity">
                                    <div className="icon-minus"></div>
                                </button>
                            </div>
                        ))}
                    </div>
                )}
                {favorites.length === 0 && <p>No favorite books yet. Find a book you love and click the heart icon!</p>}
            </div>
          )}

          {activeTab === 'saved' && (
            <div>
                <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                    {savedBooks.map((book) => (
                        <div key={book.id} className="flex-shrink-0 w-40 text-center">
                            <img src={book.coverUrl} alt={book.title} className="w-full h-56 object-cover rounded-lg shadow-lg mb-2" />
                            <button
                                onClick={() => downloadBook(book.downloadUrl)}
                                className="w-full px-3 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >Download ({book.format})</button>
                        </div>
                    ))}
                </div>
                {savedBooks.length === 0 && <p>No books saved for download yet. Find a book with a PDF version available to save it here.</p>}
            </div>
          )}

          {activeTab === 'offline' && (
            <div>
                <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                    {offlineBooks.map((book) => (
                        <div key={book.id} className="flex-shrink-0 w-40 text-center">
                            <img src={book.coverUrl} alt={book.title} className="w-full h-56 object-cover rounded-lg shadow-lg mb-2" />
                            <button
                                onClick={() => readOffline(book)}
                                className="w-full px-3 py-2 bg-blue-600 text-white text-sm font-semibold rounded-lg hover:bg-blue-700 transition-colors"
                            >Read Offline</button>
                        </div>
                    ))}
                </div>
                {offlineBooks.length === 0 && <p>No books saved for offline reading yet. Click "Save for Offline" on a book's details to read it without an internet connection.</p>}
            </div>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('ProfileContent error:', error);
    return null;
  }
}