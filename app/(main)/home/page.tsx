"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Avatar, AvatarFallback } from "@/components/ui";
import { ItemCardSkeleton } from "@/components/ui/item-card-skeleton";
import { ItemCard, type Item } from "@/components/item-card";
import { Search, Zap, Filter, Mic, User, LogOut } from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}


export default function HomePage() {
  const router = useRouter();
  const [searchQuery, setSearchQuery] = useState("");
  const [items, setItems] = useState<Item[]>([]);
  const [loading, setLoading] = useState(false);
  const [loadingMore, setLoadingMore] = useState(false);
  const [page, setPage] = useState(1);
  const [hasMore, setHasMore] = useState(true);
  const [error, setError] = useState<string | null>(null);
  const [isListening, setIsListening] = useState(false);
  const [currentUser, setCurrentUser] = useState<AuthUser | null>(null);
  const observerTarget = useRef<HTMLDivElement>(null);
  const isSearchMode = useRef(false);

  // Load user from localStorage on mount
  useEffect(() => {
    const userStr = localStorage.getItem("user");
    if (userStr) {
      try {
        const user = JSON.parse(userStr);
        // Validate user object has required fields
        if (user && typeof user.id === "string" && typeof user.name === "string") {
          setCurrentUser(user);
        } else {
          setCurrentUser(null);
        }
      } catch {
        // Invalid JSON in localStorage
        setCurrentUser(null);
      }
    }
  }, []);

  // Start global message notifier when user is logged in
  useEffect(() => {
    if (currentUser?.id) {
      import("@/lib/services/message-notifier").then(({ messageNotifier }) => {
        messageNotifier.start(currentUser.id);
      });

      return () => {
        import("@/lib/services/message-notifier").then(({ messageNotifier }) => {
          messageNotifier.stop();
        });
      };
    }
  }, [currentUser?.id]);

  // Load cached items from sessionStorage on mount
  useEffect(() => {
    try {
      const cached = sessionStorage.getItem("homeItems");
      const cachedPage = sessionStorage.getItem("homePage");
      if (cached && cachedPage) {
        const parsedItems = JSON.parse(cached);
        const parsedPage = parseInt(cachedPage, 10);
        if (parsedItems.length > 0) {
          setItems(parsedItems);
          setPage(parsedPage);
          setHasMore(parsedItems.length >= 10 * parsedPage);
        }
      }
    } catch {
      // Ignore cache errors
    }
  }, []);

  // Fetch items with pagination
  const fetchItems = useCallback(async (pageNum: number = 1, append: boolean = false) => {
    if (append) {
      setLoadingMore(true);
    } else {
      setLoading(true);
      setError(null);
    }

    try {
      const res = await fetch(`/api/items?page=${pageNum}&limit=10`);
      if (!res.ok) {
        throw new Error("Failed to fetch items");
      }
      const data = await res.json();
      const newItems = data.items || [];
      
      if (append) {
        setItems((prev) => [...prev, ...newItems]);
      } else {
        setItems(newItems);
        // Cache items in sessionStorage
        try {
          sessionStorage.setItem("homeItems", JSON.stringify(newItems));
          sessionStorage.setItem("homePage", pageNum.toString());
        } catch {
          // Ignore storage errors
        }
      }

      setHasMore(newItems.length === 10 && pageNum < (data.pagination?.totalPages || 1));
      setPage(pageNum);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Failed to load items");
      // If we have cached items and this is initial load, show them
      if (!append) {
        try {
          const cached = sessionStorage.getItem("homeItems");
          if (cached) {
            const parsedItems = JSON.parse(cached);
            setItems(parsedItems);
          }
        } catch {
          // Ignore cache errors
        }
      }
    } finally {
      setLoading(false);
      setLoadingMore(false);
    }
  }, []);

  // Initial fetch on mount (only if no cached items)
  useEffect(() => {
    if (items.length === 0) {
      fetchItems(1, false);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const handleLogout = () => {
    // Clear user session data from localStorage
    localStorage.removeItem("token");
    localStorage.removeItem("user");
    setCurrentUser(null);
    // Redirect to signin page
    router.push("/signin");
  };

  const handleSearch = useCallback(async (e: React.FormEvent) => {
    e.preventDefault();
    if (!searchQuery.trim()) {
      isSearchMode.current = false;
      setPage(1);
      setHasMore(true);
      fetchItems(1, false);
      return;
    }

    isSearchMode.current = true;
    setLoading(true);
    setError(null);
    setPage(1);
    setHasMore(false);
    
    try {
      const res = await fetch("/api/search", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ query: searchQuery, page: 1, limit: 10 }),
      });
      if (!res.ok) {
        throw new Error("Search failed");
      }
      const data = await res.json();
      setItems(data.items || []);
      setHasMore((data.items?.length || 0) === 10 && (data.pagination?.totalPages || 1) > 1);
    } catch (err) {
      setError(err instanceof Error ? err.message : "Search failed");
    } finally {
      setLoading(false);
    }
  }, [searchQuery, fetchItems]);

  // Infinite scroll observer
  useEffect(() => {
    if (!observerTarget.current || !hasMore || loadingMore || loading || isSearchMode.current) {
      return;
    }

    const observer = new IntersectionObserver(
      (entries) => {
        if (entries[0]?.isIntersecting && hasMore && !loadingMore) {
          fetchItems(page + 1, true);
        }
      },
      { threshold: 0.1 }
    );

    observer.observe(observerTarget.current);

    return () => {
      observer.disconnect();
    };
  }, [hasMore, loadingMore, loading, page, fetchItems]);

  const handleRetry = useCallback(() => {
    if (isSearchMode.current) {
      handleSearch(new Event("submit") as unknown as React.FormEvent);
    } else {
      fetchItems(page, false);
    }
  }, [handleSearch, fetchItems, page]);

  const startVoiceSearch = () => {
    // Check for browser support
    const windowWithSpeech = window as Window & {
      SpeechRecognition?: new () => {
        lang: string;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
        start: () => void;
      };
      webkitSpeechRecognition?: new () => {
        lang: string;
        onstart: (() => void) | null;
        onend: (() => void) | null;
        onresult: ((event: { results: { transcript: string }[][] }) => void) | null;
        start: () => void;
      };
    };

    if (!windowWithSpeech.SpeechRecognition && !windowWithSpeech.webkitSpeechRecognition) {
      alert("Voice search is not supported in your browser");
      return;
    }

    const SpeechRecognitionClass = windowWithSpeech.SpeechRecognition || windowWithSpeech.webkitSpeechRecognition;
    if (!SpeechRecognitionClass) return;
    
    const recognition = new SpeechRecognitionClass();
    recognition.lang = "en-US";

    recognition.onstart = () => setIsListening(true);
    recognition.onend = () => setIsListening(false);
    recognition.onresult = (event) => {
      const transcript = event.results[0][0].transcript;
      setSearchQuery(transcript);
    };

    recognition.start();
  };

  const getPriceRatingColor = useCallback((rating: string) => {
    switch (rating) {
      case "Great Deal":
        return "success";
      case "Fair":
        return "secondary";
      case "Overpriced":
        return "destructive";
      default:
        return "secondary";
    }
  }, []);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between mb-4">
            <Link href="/home" className="flex items-center space-x-2">
              <Zap className="h-8 w-8 text-blue-600" />
              <span className="text-2xl font-bold">QuickGrab</span>
            </Link>
            <div className="flex items-center space-x-4">
              <Link href="/list-item">
                <Button>List Item</Button>
              </Link>
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-blue-500 rounded-full">
                      <Avatar>
                        <AvatarFallback>{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
                      </Avatar>
                    </button>
                  </DropdownMenuTrigger>
                  <DropdownMenuContent align="end" className="w-56">
                    <DropdownMenuLabel className="font-normal">
                      <div className="flex flex-col space-y-1">
                        <p className="text-sm font-medium leading-none">{currentUser.name}</p>
                        <p className="text-xs leading-none text-gray-500">{currentUser.email}</p>
                      </div>
                    </DropdownMenuLabel>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem asChild>
                      <Link href={`/profile/${currentUser.id}`} className="flex items-center cursor-pointer">
                        <User className="mr-2 h-4 w-4" />
                        <span>Profile</span>
                      </Link>
                    </DropdownMenuItem>
                    <DropdownMenuSeparator />
                    <DropdownMenuItem onClick={handleLogout} className="text-red-600 focus:text-red-600 focus:bg-red-50">
                      <LogOut className="mr-2 h-4 w-4" />
                      <span>Log out</span>
                    </DropdownMenuItem>
                  </DropdownMenuContent>
                </DropdownMenu>
              ) : (
                <Link href="/signin">
                  <Avatar>
                    <AvatarFallback>U</AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>

          {/* Search Bar */}
          <form onSubmit={handleSearch} className="flex gap-2">
            <div className="relative flex-1">
              <Search className="absolute left-3 top-3 h-5 w-5 text-gray-400" />
              <Input
                placeholder="Search for items... (e.g., 'need iPhone charger urgent')"
                className="pl-10 pr-12"
                value={searchQuery}
                onChange={(e) => setSearchQuery(e.target.value)}
              />
              <button
                type="button"
                onClick={startVoiceSearch}
                className={`absolute right-3 top-2.5 p-1 rounded-full ${
                  isListening ? "bg-red-100 text-red-600" : "text-gray-400 hover:text-gray-600"
                }`}
              >
                <Mic className="h-5 w-5" />
              </button>
            </div>
            <Button type="submit" disabled={loading}>
              <Search className="h-4 w-4 mr-2" />
              Search
            </Button>
            <Button type="button" variant="outline">
              <Filter className="h-4 w-4" />
            </Button>
          </form>
        </div>
      </header>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRetry}>Retry</Button>
          </div>
        ) : items.length === 0 && !loading ? (
          <div className="text-center py-20">
            <p className="text-gray-500 mb-4">No items found</p>
            <Link href="/list-item">
              <Button>Be the first to list an item</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 xl:grid-cols-4 gap-6">
              {items.map((item) => (
                <ItemCard key={item.id} item={item} getPriceRatingColor={getPriceRatingColor} />
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {hasMore && !isSearchMode.current && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center py-8">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-blue-600"></div>
                )}
              </div>
            )}
            {error && items.length > 0 && (
              <div className="text-center py-4">
                <p className="text-red-500 text-sm mb-2">{error}</p>
                <Button variant="outline" size="sm" onClick={handleRetry}>
                  Retry
                </Button>
              </div>
            )}
          </>
        )}
      </main>
    </div>
  );
}
