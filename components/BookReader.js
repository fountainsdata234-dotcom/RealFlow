function Notification({ message, type, onDismiss }) {
    React.useEffect(() => {
        const timer = setTimeout(onDismiss, 5000);
        return () => clearTimeout(timer);
    }, [onDismiss]);

    const bgColor = type === 'success' ? 'bg-green-600' : 'bg-red-600';

    return (
        <div className={`fixed top-5 right-5 ${bgColor} text-white px-6 py-3 rounded-lg shadow-lg z-50 animate-slide-in-down`}>
            <div className="flex items-center justify-between">
                <p>{message}</p>
                <button onClick={onDismiss} className="ml-4 text-xl">&times;</button>
            </div>
        </div>
    );
}
function BookReader() {
  try {
    const [user, setUser] = React.useState(null);
    const [book, setBook] = React.useState(null);
    const [loading, setLoading] = React.useState(true);
    const [bookSource, setBookSource] = React.useState({ type: null, content: null });
    const [isFavorite, setIsFavorite] = React.useState(false);
    const [initialPosition, setInitialPosition] = React.useState(0);
    const [animateHeart, setAnimateHeart] = React.useState(false);
    const [notification, setNotification] = React.useState(null);    const [isUpgrading, setIsUpgrading] = React.useState(false); // New state for text-to-HTML upgrade
    const [fontSize, setFontSize] = React.useState(() => parseInt(localStorage.getItem('readerFontSize') || '22', 10)); // Increased default font size
    const [lineHeight, setLineHeight] = React.useState(() => parseFloat(localStorage.getItem('readerLineHeight') || '1.6'));
    const [loadingMessage, setLoadingMessage] = React.useState("Fetching book details...");

    const readerRef = React.useRef(null);

    React.useEffect(() => {
      const unsubscribe = firebaseAuth.onAuthStateChanged((currentUser) => {
        if (!currentUser) {
          window.location.href = 'auth.html';
          return;
        }
        setUser(currentUser);

        const params = new URLSearchParams(window.location.search);
        const bookId = params.get('id');
        const title = params.get('title');
        const author = params.get('author');
        const position = params.get('position');
        if (position) setInitialPosition(parseInt(position, 10));

        if (bookId && title && author) {
          fetchBookContent(bookId, title, author, currentUser.uid, position);
        } else {
          setLoading(false);
        }
      });
      return () => unsubscribe();
    }, []);

    // Effect to save scroll position
    React.useEffect(() => {
      if (!user || !book || !readerRef.current) return;
  
      // The scrollable element is either the iframe's content window or the div itself
      const scrollableElement = bookSource.type === 'html' ? readerRef.current.contentWindow : readerRef.current;
  
      if (!scrollableElement) return;
  
      const handleScroll = () => {
        const scrollTop = scrollableElement.scrollY || scrollableElement.scrollTop;
        const historyRef = firebaseDb.collection('users').doc(user.uid).collection('readingHistory').doc(book.id);
        historyRef.set({ 
            lastPosition: scrollTop,
            lastReadTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });
      };
  
      const debouncedScroll = debounce(handleScroll, 3000); // Save every 3 seconds
      scrollableElement.addEventListener('scroll', debouncedScroll);
  
      return () => {
        scrollableElement.removeEventListener('scroll', debouncedScroll);
      };
    }, [user, book, bookSource.type]); // FIX: Re-run when bookSource type changes

    // Effect to scroll to position AFTER content has rendered
    React.useEffect(() => {
        if (initialPosition > 0 && readerRef.current && bookSource.content) {
            const scrollableElement = bookSource.type === 'html' ? readerRef.current.contentWindow : readerRef.current;
            if (!scrollableElement) return;

            const timer = setTimeout(() => {
                scrollableElement.scrollTo({ top: initialPosition, behavior: 'smooth' });
            }, 100); // A short delay is often sufficient
            return () => clearTimeout(timer);
        }
    }, [bookSource, initialPosition]); // Reruns when bookSource changes

    // Persist reader settings
    React.useEffect(() => {
        localStorage.setItem('readerFontSize', fontSize);
    }, [fontSize]);

    React.useEffect(() => {
        localStorage.setItem('readerLineHeight', lineHeight);
    }, [lineHeight]);


    // AbortController for fetch timeout
    const fetchWithTimeout = (resource, options = {}) => {
        const { timeout = 15000 } = options; // 15 second timeout
        
        const controller = new AbortController();
        const id = setTimeout(() => controller.abort(), timeout);

        return fetch(resource, { ...options, signal: controller.signal })
            .finally(() => clearTimeout(id));
    };

    // --- ENHANCED: Internet Archive Fallback with Multi-tiered Search ---
    const fetchFromInternetArchive = async (title, author) => {
        setLoadingMessage("Gutenberg failed. Searching Internet Archive...");
        console.log(`Fallback: Searching Internet Archive for "${title}" by ${author}`);
        
        // Tier 1: Precise search with title and author
        let searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(title)}) AND creator:(${encodeURIComponent(author)}) AND mediatype:(texts)&fl[]=identifier&output=json&rows=1`;
        let identifier;

        try {
            const searchResponse = await fetchWithTimeout(searchUrl);
            if (searchResponse.ok) {
                const searchData = await searchResponse.json();
                identifier = searchData.response?.docs[0]?.identifier;
            }
        } catch (error) {
            console.warn("IA precise search failed, will try broader search. Reason:", error);
        }

        // Tier 2: If precise search fails, try a broader search with just the title
        if (!identifier) {
            console.log("Precise search failed. Trying broader search with title only.");
            setLoadingMessage("Broadening search on Internet Archive...");
            searchUrl = `https://archive.org/advancedsearch.php?q=title:(${encodeURIComponent(title)}) AND mediatype:(texts)&fl[]=identifier&output=json&rows=1`;
            try {
                const searchResponse = await fetchWithTimeout(searchUrl);
                if (searchResponse.ok) {
                    const searchData = await searchResponse.json();
                    identifier = searchData.response?.docs[0]?.identifier;
                }
            } catch (error) {
                console.warn("IA broad search also failed:", error);
            }
        }

        // If an identifier was found by either search, fetch the content
        if (identifier) {
            try {
            setLoadingMessage("Found on Internet Archive! Downloading...");
            const contentUrl = `https://archive.org/stream/${identifier}/${identifier}_djvu.txt`;
            const contentResponse = await fetchWithTimeout(contentUrl);
            if (!contentResponse.ok) throw new Error("Failed to fetch IA book content.");
            const textContent = await contentResponse.text();
            const paragraphs = textContent.split(/\r?\n\r?\n/).map(p => p.trim()).filter(p => p.length > 0);
            
            console.log("Successfully loaded from Internet Archive fallback.");
            setBookSource({ type: 'text', content: paragraphs });
            return true; // Indicate success
        } catch (error) {
            console.warn("IA content fetch failed even with identifier:", error);
            return false; // Indicate failure
        }
        }

        return false; // Indicate failure if no identifier was found
    };

    const fetchBookContent = async (bookId, title, author, userId, position) => {
      try {
        setLoadingMessage("Fetching book details..."); // This is the initial message

        // --- OFFLINE FIRST ---
        // Check if the book is available in the cache first.
        if ('caches' in window) {
            const contentCache = await caches.open('book-content-v1');
            const cachedResponse = await contentCache.match(`/book-content/${bookId}`);
            if (cachedResponse) {
                console.log("Loading book from offline cache.");
                setLoadingMessage("Loading from offline storage...");
                const htmlContent = await cachedResponse.text();
                setBook({ id: bookId, title, author, coverUrl: '' }); // Set basic book info
                setBookSource({ type: 'html', content: htmlContent });
                setLoading(false);
                return; // Stop here, no need to fetch from network
            }
        }

        const response = await fetchWithTimeout(`https://gutendex.com/books/${bookId}`);
        if (!response.ok) throw new Error('Book metadata not found.');
        const data = await response.json();

        // Prioritize HTML version for iframe, fallback to plain text
        const coverUrl = data.formats['image/jpeg'];
        const htmlUrl = data.formats['text/html'] || data.formats['text/html; charset=utf-8'];
        const textUrl = data.formats['text/plain'] || data.formats['text/plain; charset=utf-8'];

        setBook({ id: bookId, title, author, coverUrl });

        // Perform fast UI updates immediately
        await checkIfFavorite(bookId, userId);
        await updateReadingHistory(bookId, title, author, userId, coverUrl);
        
        // --- KEY CHANGE FOR INSTANT LOADING ---
        // Turn off the main loader immediately and prepare for content streaming.
        setLoading(false);

        const proxyUrl = 'https://api.allorigins.win/raw?url=';

        // Data Saver Mode: On slow connections, only fetch the plain text version.
        const isSlowConnection = navigator.connection?.saveData || ['slow-2g', '2g'].includes(navigator.connection?.effectiveType);        

        // --- ROBUST LOADING WITH FALLBACK ---
        let contentLoaded = false;

        // 1. Try to load HTML first (unless on a slow connection)
        if (htmlUrl && !isSlowConnection) {
            setLoadingMessage("Downloading book...");
            try {
                const response = await fetchWithTimeout(proxyUrl + encodeURIComponent(htmlUrl));
                if (!response.ok) throw new Error('HTML response not OK');
                const htmlContent = await response.text();

                // Gutenberg sometimes returns an error page with a 200 status, so we check the content.
                if (htmlContent.includes("Sorry, but our website does not have the page you requested")) {
                    throw new Error("Gutenberg returned a 404 error page for HTML.");
                }

                console.log("Successfully loaded HTML version.");
                const defaultStyles = `<style>body { color: #1f2937; background-color: #f9fafb; font-family: sans-serif; padding: 1rem; } a { color: #2563eb; }</style>`;
                const baseUrl = `<base href="${new URL(htmlUrl).origin}">`;
                const finalHtml = `<!DOCTYPE html><html><head>${baseUrl}${defaultStyles}</head><body>${htmlContent}</body></html>`;
                setBookSource({ type: 'html', content: finalHtml });
                contentLoaded = true;
            } catch (err) {
                console.warn("HTML load failed, will try fallback to plain text. Reason:", err);
            }
        }

        // 2. If HTML failed or was skipped, try to load plain text.
        if (!contentLoaded && textUrl) {
            setLoadingMessage("Falling back to plain text version...");
            try {
                const response = await fetchWithTimeout(proxyUrl + encodeURIComponent(textUrl));
                if (!response.ok) throw new Error('Text response not OK');

                console.log("Streaming plain text as fallback.");
                setBookSource({ type: 'text', content: [] }); // Initialize for streaming

                const reader = response.body.getReader();
                const decoder = new TextDecoder();
                let buffer = '';

                // eslint-disable-next-line no-constant-condition
                while (true) {
                    const { done, value } = await reader.read();
                    if (done) break;

                    buffer += decoder.decode(value, { stream: true });
                    const parts = buffer.split(/\r?\n\r?\n/);
                    buffer = parts.pop(); // Keep incomplete part

                    const newParagraphs = parts.map(p => p.trim()).filter(p => p.length > 0);
                    if (newParagraphs.length > 0) {
                        setBookSource(current => ({ type: 'text', content: [...current.content, ...newParagraphs] }));
                    }
                }
                contentLoaded = true;
            } catch (err) {
                console.error("Plain text fallback also failed:", err);
            }
        }

        // 3. If nothing loaded, throw an error.
        if (!contentLoaded) {
            // --- NEW: Trigger Internet Archive Fallback ---
            const fallbackSuccess = await fetchFromInternetArchive(title, author);
            if (!fallbackSuccess) {
                // Only throw the final error if the fallback also fails
                throw new Error("No readable format could be loaded from any source.");
            }
        }

      } catch (error) {
        console.error("Failed to fetch book content:", error);
        let errorMessage = error.message;
        if (error.name === 'AbortError') {
            errorMessage = "The book is taking too long to load. Please try again.";
        }
        setBookSource(current => current.content ? current : { type: 'error', content: errorMessage });
      } finally {
        // This is now a fallback to ensure the loader is always turned off,
        // especially if the text streaming path fails and only HTML is loaded.
        // setLoading(false) is now called earlier for a faster perceived load.
        setIsUpgrading(false);
      }
    };

    const updateReadingHistory = async (bookId, title, author, userId, coverUrl) => {
        const historyCollection = firebaseDb.collection('users').doc(userId).collection('readingHistory');
        const historyRef = historyCollection.doc(bookId);

        await historyRef.set({
            title,
            author,
            coverUrl,
            lastReadTimestamp: firebase.firestore.FieldValue.serverTimestamp()
        }, { merge: true });

        // Enforce a limit of 20 books
        const snapshot = await historyCollection.orderBy('lastReadTimestamp', 'desc').get();
        if (snapshot.size > 20) {
            const oldestDoc = snapshot.docs[snapshot.size - 1];
            await oldestDoc.ref.delete();
        }
    };

    const checkIfFavorite = async (bookId, userId) => {
      try {
        const favDoc = await firebaseDb.collection('users').doc(userId).collection('favorites').doc(bookId).get();
        setIsFavorite(favDoc.exists);
      } catch (error) {
        console.error("Failed to check favorite status:", error);
      }
    };

    const toggleFavorite = async () => {
      if (!user || !book) return;
      
      const favsRef = firebaseDb.collection('users').doc(user.uid).collection('favorites');
      
      if (!isFavorite) {
        const snapshot = await favsRef.get();
        if (snapshot.size >= 40) {
            setNotification({ type: 'error', message: "Your favorites list is full (40 books max)." });
            return;
        }
      }

      const newIsFavorite = !isFavorite;
      setIsFavorite(newIsFavorite);
      if (newIsFavorite) {
        setAnimateHeart(true);
        setTimeout(() => setAnimateHeart(false), 500); // Reset animation state
      }

      if (newIsFavorite) {
        await favsRef.doc(book.id).set({ 
            title: book.title,
            author: book.author,
            coverUrl: book.coverUrl
        });
      } else {
        await favsRef.doc(book.id).delete();
      }
    };

    const handleShare = async () => {
        if (!book) return;
        const shareUrl = window.location.href;
        const shareText = `Check out "${book.title}" by ${book.author} on RealFlow!`;

        if (navigator.share) {
            try {
                await navigator.share({
                    title: book.title,
                    text: shareText,
                    url: shareUrl,
                });
            } catch (error) {
                console.error('Error sharing:', error);
            }
        } else {
            navigator.clipboard.writeText(`${shareText} ${shareUrl}`);
            setNotification({ type: 'success', message: 'Link copied to clipboard!' });
        }
    };

    return (
      <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 py-12">
        {notification && <Notification message={notification.message} type={notification.type} onDismiss={() => setNotification(null)} />}
        <div className="rounded-lg shadow-lg p-6 md:p-8 bg-white text-gray-800 min-h-[80vh] flex flex-col">
          {loading ? (
            <div className="flex-grow flex flex-col justify-center items-center">
              <span className="spinner !w-12 !h-12"></span>
              <p className="mt-4 text-gray-600">
                {loadingMessage}
              </p>
            </div>
          ) : bookSource.type === 'error' ? (
            <div className="flex-grow flex flex-col justify-center items-center text-center">
              <h1 className="text-3xl font-bold">Book not found</h1>
              <p className="text-gray-600 mt-4">A readable version of this book could not be found. Please go back to the library and try another one.</p>
              <a href="library.html" className="mt-6 inline-block px-6 py-3 bg-blue-600 text-white rounded-lg hover:bg-blue-700 font-semibold">
                Back to Library
              </a>
            </div>
          ) : (
            <>
              <div className="flex justify-between items-center mb-6">
                <div>
                  <h1 className="text-3xl font-bold">{book?.title}</h1>
                  <p className="mt-2 text-gray-600">by {book?.author}</p>
                </div>
                <div className="flex items-center gap-4">
                    <button onClick={handleShare} className="text-gray-500 hover:text-blue-600 text-2xl">
                        <div className="icon-share-2"></div>
                    </button>
                    <button
                      onClick={toggleFavorite}
                      className={`text-2xl relative ${isFavorite ? 'text-red-500' : 'text-gray-400'}`}
                    >
                      <div className={`${isFavorite ? 'icon-heart-fill' : 'icon-heart'} ${animateHeart ? 'animate-pop animate-splash' : ''}`}></div>
                    </button>
                </div>
              </div>

              <div className="relative flex-grow flex flex-col">
                {isUpgrading && (
                    <div className="absolute inset-0 bg-white/70 backdrop-blur-sm flex justify-center items-center z-20 rounded-lg">
                        <span className="spinner !w-10 !h-10"></span>
                    </div>
                )}
              {bookSource.type === 'html' ? (
                <iframe
                  ref={readerRef}
                  className="w-full h-full flex-grow border rounded-lg"
                  srcDoc={bookSource.content}
                  key={book.id}
                  title={book.title}
                  sandbox="allow-same-origin allow-scripts"
                ></iframe>
              ) : (
                <div
                  ref={readerRef}
                  className="flex-grow overflow-y-auto border rounded-lg p-4 md:p-8 bg-gray-50 border-gray-200"
                >
                  <div className="prose max-w-none text-gray-800" style={{'--font-size': `${fontSize}px`, '--line-height': lineHeight}}>
                    {Array.isArray(bookSource.content) && bookSource.content.length > 0 
                        ? bookSource.content.map((p, i) => <p key={i} className="mb-4 text-[length:var(--font-size)] leading-[var(--line-height)]" style={{ fontFamily: 'sans-serif' }}>{p}</p>) 
                        : (
                            <div className="space-y-4 animate-pulse">
                                <div className="h-4 bg-gray-200 rounded w-3/4"></div>
                                <div className="h-4 bg-gray-200 rounded w-full"></div>
                                <div className="h-4 bg-gray-200 rounded w-5/6"></div>
                            </div>
                        )}
                  </div>
                </div>
              )}
              </div>
            </>
          )}
        </div>
      </div>
    );
  } catch (error) {
    console.error('BookReader error:', error);
    return null;
  }
}

// Simple debounce function to limit how often we save the scroll position
function debounce(func, wait) {
    let timeout;
    return function executedFunction(...args) {
        const later = () => {
            clearTimeout(timeout);
            func(...args);
        };
        clearTimeout(timeout);
        timeout = setTimeout(later, wait);
    };
}