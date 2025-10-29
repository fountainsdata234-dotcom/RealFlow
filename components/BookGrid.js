function SearchAndFilter({
  searchQuery,
  setSearchQuery,
  suggestions,
  handleSuggestionClick,
  isSearching,
  loadingGenre,
  selectedGenre,
  handleGenreClick,
}) {
  const genres = ["Fantasy", "Mystery", "Adventure", "Romance", "History", "Thriller"];
  return (
    <div className="mb-10">
      <div className="relative mb-6">
        <input
          type="text"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search for books or authors..."
          className="w-full pl-4 pr-12 py-3 bg-white/10 border border-white/20 rounded-lg text-white placeholder-white/50 focus:outline-none focus:ring-2 focus:ring-blue-400"
        />
        <div className="absolute right-4 top-1/2 -translate-y-1/2 text-white/70">
          {isSearching && !loadingGenre ? <span className="spinner"></span> : <div className="icon-search"></div>}
        </div>
        {suggestions.length > 0 && (
          <div className="absolute top-full left-0 right-0 mt-2 bg-slate-800 border border-slate-700 rounded-lg shadow-lg z-20 max-h-80 overflow-y-auto">
            {suggestions.map(book => (
              <div
                key={book.id}
                onClick={() => handleSuggestionClick(book.title)}
                className="px-4 py-2 text-white hover:bg-slate-700 cursor-pointer"
              >
                {book.title}
              </div>
            ))}
          </div>
        )}
      </div>
      <div className="relative z-10 flex flex-wrap justify-center gap-3">
        <button
          onClick={() => handleGenreClick(null)}
          disabled={loadingGenre !== null}
          className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 disabled:opacity-50 ${!selectedGenre ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
        >
          {loadingGenre === 'all' ? <span className="spinner"></span> : 'All'}
        </button>
        {genres.map(genre => (
          <button
            key={genre}
            onClick={() => handleGenreClick(genre.toLowerCase())}
            disabled={loadingGenre !== null}
            className={`px-5 py-2 text-sm font-medium rounded-full transition-all duration-300 disabled:opacity-50 ${selectedGenre === genre.toLowerCase() ? 'bg-blue-500 text-white scale-110 shadow-lg' : 'bg-white/10 text-white/80 hover:bg-white/20'}`}
          >
            {loadingGenre === genre.toLowerCase() ? <span className="spinner"></span> : genre}
          </button>
        ))}
      </div>
    </div>
  );
}

function BookGrid() {
  try {
    const initialLoad = React.useRef(true);
    const [books, setBooks] = React.useState([]);
    const [page, setPage] = React.useState(1);
    const [loading, setLoading] = React.useState(true);
    const [hasMore, setHasMore] = React.useState(true);
    const [user, setUser] = React.useState(null);
    const [isModalOpen, setIsModalOpen] = React.useState(false);
    const [selectedBook, setSelectedBook] = React.useState(null);
    const [bookRatings, setBookRatings] = React.useState({});
    const [carouselBooks, setCarouselBooks] = React.useState([]);
    const [currentSlide, setCurrentSlide] = React.useState(0);
    const [lastReadBooks, setLastReadBooks] = React.useState([]);
    const [searchQuery, setSearchQuery] = React.useState("");
    const [selectedGenre, setSelectedGenre] = React.useState(null);
    const [suggestions, setSuggestions] = React.useState([]);
    const [isSearching, setIsSearching] = React.useState(false);
    const [loadingMore, setLoadingMore] = React.useState(false);
    const [loadingGenre, setLoadingGenre] = React.useState(null);
    const [gridBookRatings, setGridBookRatings] = React.useState({});
    const [modalTab, setModalTab] = React.useState('details'); // State lifted from modal
    const [newComment, setNewComment] = React.useState(""); // State for comment text, lifted from modal
    const [isNavigating, setIsNavigating] = React.useState(false); // For showing a spinner on navigation

    // Load initial history from cache for instant UI
    React.useEffect(() => {
        const cachedHistory = localStorage.getItem('lastReadHistory');
        if (cachedHistory) {
            setLastReadBooks(JSON.parse(cachedHistory));
        }
    }, []);

    // Effect for auth and history
    React.useEffect(() => {
      let historyUnsubscribe = () => {};
      const authUnsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
        setUser(currentUser);
        if (currentUser) {
            // If user is logged in, subscribe to their reading history
            const historyRef = firebaseDb.collection('users').doc(currentUser.uid).collection('readingHistory').orderBy('lastReadTimestamp', 'desc').limit(20);
            historyUnsubscribe = historyRef.onSnapshot(snapshot => {
                const history = snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() }));
                localStorage.setItem('lastReadHistory', JSON.stringify(history)); // Cache the fresh data
                setLastReadBooks(history);
            });
        } else {
            // If user is logged out, clear history and unsubscribe from any previous listener
            historyUnsubscribe();
            setLastReadBooks([]);
        }
      });

      return () => { // Cleanup function for when the component unmounts
        authUnsubscribe();
        historyUnsubscribe();
      };
    }, []); // Run only on initial mount

    // Effect for loading the main book grid
    React.useEffect(() => {
        // This effect now runs every time the component mounts to ensure data is loaded.
        const cachedBooks = sessionStorage.getItem('bookGridCache');
        const cachedPage = sessionStorage.getItem('bookGridPage');

        if (cachedBooks && cachedPage) {
            const booksFromCache = JSON.parse(cachedBooks);
            setBooks(booksFromCache);
            setPage(parseInt(cachedPage, 10));

            const shuffled = [...booksFromCache].sort(() => 0.5 - Math.random());
            setCarouselBooks(shuffled.slice(0, 5));

            setLoading(false);
        } else {
            const randomPage = Math.floor(Math.random() * 200) + 1;
            setPage(randomPage);
            fetchBooks(randomPage, true);
        }
    }, []);


    const fetchBooks = async (pageNum, isInitial = false, overrideParams = {}) => {
      if (isInitial) {
        setLoading(true);
      } else {
        setLoadingMore(true);
      }
      let url = `https://gutendex.com/books/?page=${pageNum}&limit=20`;
      const queryToUse = overrideParams.searchQuery !== undefined ? overrideParams.searchQuery : searchQuery;
      const genreToUse = overrideParams.selectedGenre !== undefined ? overrideParams.selectedGenre : selectedGenre;
      if (queryToUse) {
        url += `&search=${encodeURIComponent(queryToUse)}`;
      }
      if (genreToUse) {
        url += `&topic=${genreToUse}`;
      }

      try {
        const response = await fetch(url);
        const data = await response.json();
        const newBooks = data.results;
        if (isInitial) {
            setBooks(newBooks);
            sessionStorage.setItem('bookGridCache', JSON.stringify(newBooks));
            sessionStorage.setItem('bookGridPage', String(pageNum));
            // **FIX**: Robustly select 5 random books for the carousel
            const shuffled = [...newBooks].sort(() => 0.5 - Math.random());
            setCarouselBooks(shuffled.slice(0, 5));
        } else {
            setBooks(prevBooks => [...prevBooks, ...newBooks]);
        }
        setHasMore(data.next !== null);

        // After fetching books, fetch their universal ratings
        if (newBooks.length > 0) {
            const bookIds = newBooks.map(b => String(b.id));
            const ratingsRef = firebaseDb.collection('books').where(firebase.firestore.FieldPath.documentId(), 'in', bookIds);
            const ratingsSnapshot = await ratingsRef.get();
            const ratingsData = {};
            ratingsSnapshot.forEach(doc => {
                ratingsData[doc.id] = doc.data();
            });
            setGridBookRatings(prev => ({ ...prev, ...ratingsData }));
        }
      } catch (error) {
        console.error("Failed to fetch books:", error);
      } finally {
        setLoading(false);
        setIsSearching(false);
        setLoadingMore(false);
        setLoadingGenre(null);
      }
    };

    // Effect for carousel auto-play
    React.useEffect(() => {
        if (carouselBooks.length === 0) return;
        const slideInterval = setInterval(() => {
            setCurrentSlide(prevSlide => (prevSlide + 1) % carouselBooks.length);
        }, 5000); // Change slide every 5 seconds

        return () => clearInterval(slideInterval);
    }, [carouselBooks.length]);



    const loadMoreBooks = () => {
      setLoadingMore(true);
      const nextPage = page + 1;
      setPage(nextPage);
      fetchBooks(nextPage);
    };

    const handleReadClick = (book) => {
      if (!user) {
        setIsNavigating(true); // Show spinner even for auth redirect
        setTimeout(() => window.location.href = 'auth.html', 50);
        return;
      }
      setIsNavigating(true); // Show spinner immediately
      // Pass book details to the reader page
      const authorName = book.authors[0]?.name || 'Unknown Author';
      // Use a small timeout to allow the spinner to render before navigating
      setTimeout(() => {
          window.location.href = `reader.html?id=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(authorName)}&position=${book.lastPosition || 0}`;
      }, 50);
    };

    const handleContinueReading = (book) => {
        const authorName = book.author || 'Unknown Author';
        window.location.href = `reader.html?id=${book.id}&title=${encodeURIComponent(book.title)}&author=${encodeURIComponent(authorName)}&position=${book.lastPosition || 0}`;
    };

    // Debounced effect for live search
    React.useEffect(() => {
        if (searchQuery.length < 3) {
            setSuggestions([]);
            return;
        }

        const handler = setTimeout(() => {
            setIsSearching(true);
            setSelectedGenre(null);
            setPage(1);
            fetchBooks(1, true, { searchQuery: searchQuery, selectedGenre: null });

            // Fetch suggestions
            fetch(`https://gutendex.com/books/?search=${encodeURIComponent(searchQuery)}&limit=10`)
                .then(res => res.json())
                .then(data => setSuggestions(data.results));

        }, 500); // 500ms debounce

        return () => {
            clearTimeout(handler);
        };
    }, [searchQuery]);


    const handleSuggestionClick = (suggestionTitle) => {
        setSearchQuery(suggestionTitle);
        setSuggestions([]);
    };

    const handleGenreClick = (genre) => {
        // --- PERFORMANCE OPTIMIZATION: Genre Caching ---
        // Check if we have cached results for this genre in the current session.
        const cacheKey = `genre-cache-${genre || 'all'}`;
        const cachedBooks = sessionStorage.getItem(cacheKey);
        if (cachedBooks) {
            const booksFromCache = JSON.parse(cachedBooks);
            setBooks(booksFromCache);
            setSelectedGenre(genre);
            setSearchQuery("");
            return; // Load from cache and skip network request
        }

        setLoadingGenre(genre === null ? 'all' : genre.toLowerCase());
        setIsSearching(true);
        setSearchQuery(""); 
        setSuggestions([]);
        setSelectedGenre(genre);
        setPage(1);
        fetchBooks(1, true, { searchQuery: "", selectedGenre: genre });
    };

    // This is an addition to the fetchBooks function to cache genre results.
    React.useEffect(() => {
        if (!isSearching && selectedGenre !== null && books.length > 0) {
            sessionStorage.setItem(`genre-cache-${selectedGenre}`, JSON.stringify(books));
        }
    }, [books, isSearching, selectedGenre]);

    const openDetailsModal = (book) => {
      setSelectedBook(book);
      setModalTab('details'); // Reset tab to 'details' only when a new modal is opened
      setNewComment(""); // Clear any previous comment text
      setIsModalOpen(true);
    };

    const closeDetailsModal = () => {
      setIsModalOpen(false);
      setSelectedBook(null);
    };

    const handleSetRating = async (bookId, rating) => {
      if (!user) return;

      const bookRef = firebaseDb.collection('books').doc(String(bookId));
      const userRatingRef = firebaseDb.collection('users').doc(user.uid).collection('ratings').doc(String(bookId));

      await firebaseDb.runTransaction(async (transaction) => {
        const bookDoc = await transaction.get(bookRef);
        const userRatingDoc = await transaction.get(userRatingRef);

        const oldRating = userRatingDoc.exists ? userRatingDoc.data().rating : 0;
        const newTotalRating = (bookDoc.exists ? bookDoc.data().totalRating : 0) - oldRating + rating;
        const newRatingCount = (bookDoc.exists ? bookDoc.data().ratingCount : 0) + (oldRating === 0 ? 1 : 0);

        transaction.set(bookRef, {
          totalRating: newTotalRating, 
          ratingCount: newRatingCount,
        }, { merge: true });

        transaction.set(userRatingRef, { rating });
      });

      setBookRatings(prev => ({ ...prev, [bookId]: rating }));

      // Add public rating info
      const publicRatingRef = firebaseDb.collection('books').doc(String(bookId)).collection('raters').doc(user.uid);
      await publicRatingRef.set({
          name: user.displayName,
          avatar: user.photoURL,
          rating: rating
      });
    };

    const getBestDownloadFormat = (formats) => {
        const preference = [
            { key: 'application/epub+zip', type: 'EPUB', suggestion: 'Google Play Books or Lithium' },
            { key: 'application/x-mobipocket-ebook', type: 'MOBI', suggestion: 'the Kindle app' },
            { key: 'application/pdf', type: 'PDF', suggestion: 'Google Drive PDF Viewer or Adobe Acrobat' },
            { key: 'text/html; charset=utf-8', type: 'HTML', suggestion: 'any web browser' },
            { key: 'text/plain; charset=utf-8', type: 'Text', suggestion: 'any text editor or reader app' },
        ];

        for (const format of preference) {
            if (formats[format.key]) {
                return { url: formats[format.key], type: format.type, suggestion: format.suggestion };
            }
        }
        return null;
    };

    const handleSaveForDownload = async (book) => {
        if (!user) return;

        const downloadFormat = getBestDownloadFormat(book.formats);

        if (!downloadFormat) {
            alert("Sorry, no standard readable download format is available for this book.");
            return;
        }

        const savedRef = firebaseDb.collection('users').doc(user.uid).collection('savedBooks').doc(String(book.id));
        await savedRef.set({
            title: book.title,
            author: book.authors[0]?.name || 'Unknown Author',
            coverUrl: book.formats['image/jpeg'],
            downloadUrl: downloadFormat.url,
            format: downloadFormat.type,
        });
        alert(`'${book.title}' has been saved as a ${downloadFormat.type} file. On Android, you can open it with apps like ${downloadFormat.suggestion}.`);
    };

    const handleSaveForOffline = async (book) => {
        if (!('caches' in window)) {
            alert('Offline storage is not supported in your browser.');
            return;
        }

        const contentCache = await caches.open('book-content-v1');
        const bookId = String(book.id);

        // Check if already cached
        const existing = await contentCache.match(`/book-content/${bookId}`);
        if (existing) {
            alert(`'${book.title}' is already saved for offline reading.`);
            return;
        }

        alert(`Saving '${book.title}' for offline reading. This may take a moment...`);

        const proxyUrl = 'https://api.allorigins.win/raw?url=';
        const htmlUrl = book.formats['text/html'] || book.formats['text/html; charset=utf-8'];
        
        if (htmlUrl) {
            try {
                const response = await fetch(proxyUrl + encodeURIComponent(htmlUrl));
                await contentCache.put(`/book-content/${bookId}`, response);

                // Save metadata to localStorage for the offline profile tab
                const offlineBooks = JSON.parse(localStorage.getItem('offlineBooks') || '[]');
                const newOfflineBook = {
                    id: book.id,
                    title: book.title,
                    author: book.authors[0]?.name || 'Unknown Author',
                    coverUrl: book.formats['image/jpeg']
                };
                if (!offlineBooks.some(b => b.id === newOfflineBook.id)) {
                    localStorage.setItem('offlineBooks', JSON.stringify([...offlineBooks, newOfflineBook]));
                }
                alert(`'${book.title}' has been successfully saved for offline reading!`);
            } catch (error) {
                alert(`Failed to save '${book.title}' for offline reading. Please check your connection and try again.`);
            }
        } else {
            alert("Sorry, a version of this book suitable for offline reading could not be found.");
        }
    };

    // A simple Star Rating component to be used in the modal
    const StarRating = ({ bookId, rating, onRate }) => {
      const [hoverRating, setHoverRating] = React.useState(0);
      return (
        <div className="flex items-center space-x-1">
          <p className="text-sm text-gray-500 mr-2">
            ({rating.count > 0 ? (rating.total / rating.count).toFixed(1) : 'N/A'})
          </p>
          {[1, 2, 3, 4, 5].map((star) => (
            <div
              key={star}
              className="cursor-pointer text-2xl"
              onClick={() => onRate(bookId, star)}
              onMouseEnter={() => setHoverRating(star)}
              onMouseLeave={() => setHoverRating(0)}
            >
              <div className={`icon-star ${ (hoverRating || rating.user) >= star ? 'text-yellow-400' : 'text-gray-300'}`}></div>
            </div>
          ))}
        </div>
      );
    };

    const BookDetailsModal = React.useCallback(() => {
      // By wrapping this entire component in React.useCallback, we ensure it is not
      // recreated on every render of BookGrid (e.g., when the carousel slide changes).
      // This prevents the textarea from losing focus while typing.

      if (!selectedBook) return null;
      // The 'modalTab' state is now controlled by the parent BookGrid component.
      const [universalRating, setUniversalRating] = React.useState({ total: 0, count: 0, user: 0 });
      const [comments, setComments] = React.useState([]);
      const [raters, setRaters] = React.useState([]);

       React.useEffect(() => {
        if (!selectedBook) return;

        // Fetch universal rating
        const bookRatingUnsub = firebaseDb.collection('books').doc(String(selectedBook.id)).onSnapshot(doc => {
            setUniversalRating(prev => ({ ...prev, total: doc.data()?.totalRating || 0, count: doc.data()?.ratingCount || 0 }));
        });

        let userRatingUnsub = () => {};
        let commentsUnsub = () => {};
        let ratersUnsub = () => {};

        if (user) {
            // Fetch user's personal rating
            userRatingUnsub = firebaseDb.collection('users').doc(user.uid).collection('ratings').doc(String(selectedBook.id)).onSnapshot(doc => {
                setUniversalRating(prev => ({ ...prev, user: doc.data()?.rating || 0 }));
            });
            // Fetch comments
            commentsUnsub = firebaseDb.collection('books').doc(String(selectedBook.id)).collection('comments')
                .orderBy('timestamp', 'desc').limit(20).onSnapshot(snapshot => {
                    setComments(snapshot.docs.map(doc => ({ id: doc.id, ...doc.data() })));
                });
            // Fetch raters
            ratersUnsub = firebaseDb.collection('books').doc(String(selectedBook.id)).collection('raters')
                .limit(10).onSnapshot(snapshot => {
                    setRaters(snapshot.docs.map(doc => doc.data()));
                });
        }

        return () => { bookRatingUnsub(); userRatingUnsub(); commentsUnsub(); ratersUnsub(); };
      }, [selectedBook, user]);

      const handlePostComment = async (e) => {
        e.preventDefault();
        if (!user || newComment.trim() === "") return;

        await firebaseDb.collection('books').doc(String(selectedBook.id)).collection('comments').add({
            userId: user.uid,
            userName: user.displayName,
            userAvatar: user.photoURL,
            comment: newComment.trim(),
            timestamp: firebase.firestore.FieldValue.serverTimestamp(),
        });
        setNewComment("");
      };

      return (
        <div className="fixed inset-0 bg-black bg-opacity-70 flex justify-center items-center z-50 p-4">
          <div className="bg-white rounded-lg shadow-2xl max-w-lg w-full relative p-8">
            <button onClick={closeDetailsModal} className="absolute top-4 right-4 text-2xl text-gray-500 hover:text-gray-800">
              <div className="icon-x"></div>
            </button>
            
            <div className="flex border-b mb-4">
                <button onClick={() => setModalTab('details')} className={`px-4 py-2 font-medium ${modalTab === 'details' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Details</button>
                {user && (
                    <button onClick={() => setModalTab('comments')} className={`px-4 py-2 font-medium ${modalTab === 'comments' ? 'text-blue-600 border-b-2 border-blue-600' : 'text-gray-500'}`}>Ratings & Comments</button>
                )}
            </div>

            {modalTab === 'details' && (
                <div>
                    <div className="flex flex-col sm:flex-row gap-8">
                        <img src={selectedBook.formats['image/jpeg']} alt={selectedBook.title} className="w-40 h-auto object-cover rounded-md shadow-lg mx-auto sm:mx-0" />
                        <div className="flex-1 text-center sm:text-left">
                            <h2 className="text-3xl font-bold mb-2">{selectedBook.title}</h2>
                            <p className="text-lg text-gray-600 mb-4">by {selectedBook.authors[0]?.name || 'Unknown Author'}</p>
                            <div className="flex flex-col items-center sm:items-start">
                                {user && (
                                    <p className="font-semibold mb-2">Your Rating:</p>
                                )}
                                <StarRating bookId={selectedBook.id} rating={universalRating} onRate={handleSetRating} />
                            </div>
                        </div>
                    </div>
                    <div className="mt-8 flex flex-col sm:flex-row gap-3 justify-center">
                        <button onClick={() => handleReadClick(selectedBook)} className="w-full sm:w-auto px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 flex items-center justify-center gap-2">
                            <div className="icon-book-open"></div>Read Book
                        </button>
                        <button onClick={() => handleSaveForOffline(selectedBook)} className="w-full sm:w-auto px-6 py-3 bg-green-600 text-white rounded-lg hover:bg-green-700 flex items-center justify-center gap-2">
                            <div className="icon-download-cloud"></div>Save for Offline
                        </button>
                        <button onClick={() => handleSaveForDownload(selectedBook)} className="w-full sm:w-auto px-6 py-3 bg-gray-200 text-gray-800 rounded-lg hover:bg-gray-300 flex items-center justify-center gap-2">
                            <div className="icon-download"></div>Save for Download
                        </button>
                    </div>
                </div>
            )}

            {modalTab === 'comments' && user && (
                <div className="max-h-[60vh] overflow-y-auto pr-2">
                    <h3 className="text-xl font-bold mb-4">Community Ratings</h3>
                    <div className="flex flex-wrap gap-4 mb-6">
                        {raters.map((rater, i) => (
                            <div key={i} className="flex items-center gap-2 bg-gray-100 p-2 rounded-lg">
                                <img src={rater.avatar} alt={rater.name} className="w-8 h-8 rounded-full" />
                                <div>
                                    <p className="text-sm font-semibold">{rater.name}</p>
                                    <p className="text-xs text-yellow-500">{'★'.repeat(rater.rating)}</p>
                                </div>
                            </div>
                        ))}
                        {raters.length === 0 && <p className="text-sm text-gray-500">Be the first to rate this book!</p>}
                    </div>

                    <h3 className="text-xl font-bold mb-4">Comments</h3>
                    {user ? (
                        <form onSubmit={handlePostComment} className="mb-4">
                            <textarea value={newComment} onChange={(e) => setNewComment(e.target.value)} placeholder="Add a public comment..." className="w-full p-2 border rounded-lg mb-2"></textarea>
                            <button type="submit" className="px-4 py-2 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-300" disabled={!newComment.trim()}>Post Comment</button>
                        </form>
                    ) : (
                        <div className="text-center p-4 border rounded-lg bg-gray-50">
                            <p className="text-gray-600">
                                <a href="auth.html" className="text-blue-600 font-semibold hover:underline">Sign in</a> to join the discussion.
                            </p>
                        </div>
                    )}
                    <div className="space-y-4">
                        {comments.map((comment, i) => (
                            <div key={comment.id || i} className="flex items-start gap-3">
                                <img src={comment.userAvatar} alt={comment.userName} className="w-10 h-10 rounded-full" />
                                <div className="bg-gray-100 p-3 rounded-lg flex-1">
                                    <p className="font-semibold">{comment.userName}</p>
                                    <p className="text-gray-700">{comment.comment}</p>
                                </div>
                            </div>
                        ))}
                        {comments.length === 0 && <p className="text-sm text-gray-500">No comments yet.</p>}
                    </div>
                </div>
            )}
          </div>
        </div>
      );
    }, [selectedBook, user, modalTab]); // Dependencies for the memoized modal

    const Carousel = () => {
        if (carouselBooks.length === 0) return null;
        const activeBook = carouselBooks[currentSlide];

        const nextSlide = () => setCurrentSlide(prev => (prev + 1) % carouselBooks.length);
        const prevSlide = () => setCurrentSlide(prev => (prev - 1 + carouselBooks.length) % carouselBooks.length);

        return (
            <div className="relative w-full h-96 mb-12 rounded-lg overflow-hidden shadow-2xl">
                {carouselBooks.map((book, index) => (
                    <div
                        key={book.id}
                        className={`absolute inset-0 transition-opacity duration-1000 ${index === currentSlide ? 'opacity-100' : 'opacity-0'}`}
                    >
                        <img src={book.formats['image/jpeg']} alt={book.title} className="w-full h-full object-cover" />
                    </div>
                ))}
                {/* Overlay and Text Content - Rendered once */}
                <div className="absolute inset-0 bg-black/60"></div>
                <div className="absolute inset-0 flex flex-col justify-center items-center text-center text-white p-4">
                    <div className="transition-all duration-700 ease-out" key={currentSlide}>
                        <h2 className="text-4xl font-bold mb-2 animate-jump-in">{activeBook.title}</h2>
                        <p className="text-lg mb-6 animate-jump-in" style={{animationDelay: '100ms'}}>{activeBook.authors[0]?.name || 'Unknown Author'}</p>
                        <button
                            onClick={() => handleReadClick(activeBook)}
                            className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 transition-colors animate-jump-in"
                            style={{animationDelay: '200ms'}}
                        >
                            Read Now
                        </button>
                    </div>
                </div>
                <button onClick={prevSlide} className="absolute top-1/2 left-4 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10">
                    <div className="icon-chevron-left"></div>
                </button>
                <button onClick={nextSlide} className="absolute top-1/2 right-4 -translate-y-1/2 text-white/70 hover:text-white text-3xl z-10">
                    <div className="icon-chevron-right"></div>
                </button>
                <div className="absolute bottom-4 left-1/2 -translate-x-1/2 flex space-x-2 z-10">
                    {carouselBooks.map((_, index) => (
                        <button
                            key={index}
                            onClick={() => setCurrentSlide(index)}
                            className={`w-3 h-3 rounded-full transition-colors ${index === currentSlide ? 'bg-white' : 'bg-white/50'}`}
                        ></button>
                    ))}
                </div>
            </div>
        );
    };

    const LastReadSection = () => {
        if (lastReadBooks.length === 0) return null;

        return (
            <div className="mb-12">
                <h2 className="text-3xl font-bold mb-6 text-white">Last Read</h2>
                <div className="flex space-x-6 overflow-x-auto pb-4 -mx-4 px-4">
                    {lastReadBooks.map(book => (
                        <div key={book.id} className="flex-shrink-0 w-48">
                            <img src={book.coverUrl} alt={book.title} className="w-full h-64 object-cover rounded-lg shadow-lg mb-3" />
                            <button
                                onClick={() => handleContinueReading(book)}
                                className="w-full px-4 py-2 bg-green-600 text-white text-sm font-semibold rounded-lg hover:bg-green-700 transition-colors"
                            >
                                Continue Reading
                            </button>
                        </div>
                    ))}
                </div>
            </div>
        );
    };

    return (
      <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {isNavigating && (
            <div className="fixed inset-0 bg-slate-900/70 backdrop-blur-sm flex flex-col justify-center items-center z-[100]">
                <span className="spinner !w-12 !h-12"></span>
                <p className="mt-4 text-white">Loading your book...</p>
            </div>
        )}
        <Carousel />
        <LastReadSection />
        <h1 className="text-4xl font-bold mb-4 text-white text-center">Browse Library</h1>
        <SearchAndFilter
          searchQuery={searchQuery} setSearchQuery={setSearchQuery}
          suggestions={suggestions} handleSuggestionClick={handleSuggestionClick}
          isSearching={isSearching} loadingGenre={loadingGenre}
          selectedGenre={selectedGenre} handleGenreClick={handleGenreClick}
        />
        <div className="relative">
            {isSearching && (
                <div className="absolute inset-0 bg-slate-900/50 backdrop-blur-sm flex justify-center items-center z-10 rounded-lg">
                    <span className="spinner !w-12 !h-12"></span>
                </div>
            )}
            <div className="grid grid-cols-2 gap-4 sm:grid-cols-2 md:grid-cols-3 lg:grid-cols-4 sm:gap-6 min-h-[500px]">
          {books.map((book, index) => (
            <div
              key={book.id}
              className="bg-white rounded-lg shadow-md overflow-hidden flex flex-col transition-all duration-300 hover:shadow-xl hover:-translate-y-1 hover:scale-105 animate-fade-in-card"
              style={{ animationDelay: `${index * 30}ms` }}
            >
              <img src={book.formats['image/jpeg']} alt={book.title} className="w-full h-64 object-cover" />
              <div className="p-4 flex flex-col h-[150px]">
                <div className="flex justify-between items-start">
                    <h3 className="font-semibold text-lg mb-1 line-clamp-2" title={book.title}>{book.title}</h3>
                    {gridBookRatings[book.id] && gridBookRatings[book.id].ratingCount > 0 && (
                        <span className="text-sm text-gray-600 flex items-center gap-1 flex-shrink-0 ml-2">★ {(gridBookRatings[book.id].totalRating / gridBookRatings[book.id].ratingCount).toFixed(1)}</span>
                    )}
                </div>
                <p className="text-gray-600 text-sm truncate">{book.authors[0]?.name || 'Unknown Author'}</p>
                <div className="mt-auto pt-4 flex gap-2">
                   <button 
                      onClick={() => openDetailsModal(book)}
                      className="flex-1 px-4 py-2 text-sm bg-gray-200 text-gray-800 rounded-md hover:bg-gray-300 transition-colors"
                    >Details</button>
                   <button 
                      onClick={() => handleReadClick(book)}
                      className="flex-1 px-4 py-2 text-sm bg-blue-600 text-white rounded-md hover:bg-blue-700 transition-colors"
                    >Read</button>
                </div>
              </div>
            </div>
          ))}
            </div>
        </div>
        {hasMore && (
          <div className="mt-12 text-center">
            <button
              onClick={loadMoreBooks}
              className="px-8 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 disabled:bg-blue-400 disabled:cursor-wait"
              disabled={loadingMore}
            >
              {loadingMore ? <span className="spinner"></span> : 'Load More Books'}
            </button>
          </div>
        )}
        {isModalOpen && <BookDetailsModal key={selectedBook.id} />}
      </div>
    );
  } catch (error) {
    console.error('BookGrid error:', error);
    return null;
  }
}