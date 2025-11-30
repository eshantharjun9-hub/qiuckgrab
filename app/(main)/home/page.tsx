"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import Link from "next/link";
import { useRouter } from "next/navigation";
import { Button, Input, Badge, DropdownMenu, DropdownMenuTrigger, DropdownMenuContent, DropdownMenuItem, DropdownMenuSeparator, DropdownMenuLabel, Avatar, AvatarFallback } from "@/components/ui";
import { ItemCardSkeleton } from "@/components/ui/item-card-skeleton";
import { type Item } from "@/components/item-card";
import { Search, Zap, Filter, Mic, User, LogOut, MapPin, Share2, ShoppingBag, Package, HelpCircle, Plus } from "lucide-react";

interface AuthUser {
  id: string;
  name: string;
  email: string;
  photo: string | null;
}

type TabType = "marketplace" | "campus-relay" | "lost-found";

const TABS: { id: TabType; label: string; icon: React.ReactNode; description: string }[] = [
  { id: "marketplace", label: "Marketplace", icon: <ShoppingBag className="h-5 w-5" />, description: "Buy and sell items with verified students" },
  { id: "campus-relay", label: "Campus Relay", icon: <Zap className="h-5 w-5" />, description: "Get items delivered by fellow students" },
  { id: "lost-found", label: "Lost & Found", icon: <HelpCircle className="h-5 w-5" />, description: "Report or find lost items on campus" },
];

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
  const [activeTab, setActiveTab] = useState<TabType>("marketplace");
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

  const activeTabData = TABS.find(tab => tab.id === activeTab);

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Header */}
      <header className="bg-white border-b sticky top-0 z-50">
        <div className="container mx-auto px-4 py-4">
          <div className="flex items-center justify-between">
            <Link href="/home" className="flex items-center space-x-2">
              <div className="bg-orange-600 p-2 rounded-lg">
                <Zap className="h-6 w-6 text-white" />
              </div>
              <div className="flex flex-col">
                <span className="text-xl font-bold text-gray-900">QuickGrab</span>
                <span className="text-xs text-gray-500">Campus Marketplace</span>
              </div>
            </Link>
            <div className="flex items-center space-x-4">
              {currentUser ? (
                <DropdownMenu>
                  <DropdownMenuTrigger asChild>
                    <button className="focus:outline-none focus:ring-2 focus:ring-orange-500 rounded-full">
                      <Avatar>
                        <AvatarFallback className="bg-orange-100 text-orange-600">{currentUser.name?.charAt(0) || "U"}</AvatarFallback>
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
                    <AvatarFallback className="bg-orange-100 text-orange-600">U</AvatarFallback>
                  </Avatar>
                </Link>
              )}
            </div>
          </div>
        </div>
      </header>

      {/* Tab Navigation */}
      <div className="bg-white border-b">
        <div className="container mx-auto px-4">
          <nav className="flex space-x-8">
            {TABS.map((tab) => (
              <button
                key={tab.id}
                onClick={() => setActiveTab(tab.id)}
                className={`flex items-center space-x-2 py-4 border-b-2 transition-colors ${
                  activeTab === tab.id
                    ? "border-orange-600 text-orange-600"
                    : "border-transparent text-gray-600 hover:text-gray-900"
                }`}
              >
                {tab.icon}
                <span className="font-medium">{tab.label}</span>
              </button>
            ))}
          </nav>
        </div>
      </div>

      {/* Main Content */}
      <main className="container mx-auto px-4 py-8">
        {/* Section Header */}
        <div className="flex items-center justify-between mb-6">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">
              {activeTab === "marketplace" && "Campus Marketplace"}
              {activeTab === "campus-relay" && "Campus Relay"}
              {activeTab === "lost-found" && "Lost & Found"}
            </h1>
            <p className="text-gray-600">{activeTabData?.description}</p>
          </div>
          <Link href="/list-item">
            <Button className="bg-orange-600 hover:bg-orange-700 text-white rounded-full">
              <Plus className="h-4 w-4 mr-2" />
              List Item
            </Button>
          </Link>
        </div>

        {/* Search Bar - Optional, can be hidden in mobile */}
        <form onSubmit={handleSearch} className="flex gap-2 mb-8">
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
          <Button type="submit" disabled={loading} className="bg-orange-600 hover:bg-orange-700">
            <Search className="h-4 w-4 mr-2" />
            Search
          </Button>
          <Button type="button" variant="outline">
            <Filter className="h-4 w-4" />
          </Button>
        </form>

        {/* Items Grid */}
        {loading && items.length === 0 ? (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
            {Array.from({ length: 6 }).map((_, i) => (
              <ItemCardSkeleton key={i} />
            ))}
          </div>
        ) : error && items.length === 0 ? (
          <div className="text-center py-20">
            <p className="text-red-500 mb-4">{error}</p>
            <Button onClick={handleRetry} className="bg-orange-600 hover:bg-orange-700">Retry</Button>
          </div>
        ) : items.length === 0 && !loading ? (
          <div className="text-center py-20">
            <Package className="h-16 w-16 text-gray-300 mx-auto mb-4" />
            <p className="text-gray-500 mb-4">No items found</p>
            <Link href="/list-item">
              <Button className="bg-orange-600 hover:bg-orange-700">Be the first to list an item</Button>
            </Link>
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-3 gap-6">
              {items.map((item) => (
                <MarketplaceItemCard key={item.id} item={item} />
              ))}
            </div>
            {/* Infinite scroll trigger */}
            {hasMore && !isSearchMode.current && (
              <div ref={observerTarget} className="h-10 flex items-center justify-center py-8">
                {loadingMore && (
                  <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-orange-600"></div>
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

// New marketplace-style item card component
function MarketplaceItemCard({ item }: { item: Item }) {
  return (
    <div className="bg-white rounded-xl shadow-sm border border-gray-100 overflow-hidden hover:shadow-md transition-shadow">
      {/* Item Image */}
      <Link href={`/item/${item.id}`}>
        <div className="aspect-[4/3] bg-gray-100 relative overflow-hidden">
          {item.photo ? (
            <img
              src={item.photo}
              alt={item.name}
              className="w-full h-full object-cover"
              loading="lazy"
            />
          ) : (
            <div className="w-full h-full flex items-center justify-center text-gray-400">
              <Package className="h-16 w-16" />
            </div>
          )}
          {/* Category Badge */}
          <Badge className="absolute top-3 right-3 bg-white text-gray-800 border-0 shadow-sm">
            {item.category}
          </Badge>
        </div>
      </Link>

      {/* Item Details */}
      <div className="p-4">
        <Link href={`/item/${item.id}`}>
          <h3 className="font-semibold text-gray-900 text-lg mb-1 hover:text-orange-600 transition-colors line-clamp-1">
            {item.name}
          </h3>
        </Link>
        <p className="text-2xl font-bold text-orange-600 mb-2">₹{item.price}</p>
        
        {/* Location - Use first seller badge if available, otherwise show "On Campus" */}
        <div className="flex items-center text-gray-500 text-sm mb-4">
          <MapPin className="h-4 w-4 mr-1" />
          <span>{item.seller.badges?.[0] || "On Campus"}</span>
        </div>

        {/* Actions */}
        <div className="flex gap-2">
          <Link href={`/item/${item.id}`} className="flex-1">
            <Button className="w-full bg-orange-600 hover:bg-orange-700 text-white rounded-lg">
              Buy
            </Button>
          </Link>
          <Button variant="outline" size="icon" className="rounded-lg border-gray-200">
            <Share2 className="h-4 w-4 text-gray-600" />
          </Button>
        </div>
      </div>
    </div>
  );
}
