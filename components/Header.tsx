"use client";

import Link from "next/link";
import { usePathname, useRouter } from "next/navigation";
import { useState, useRef, useEffect } from "react";
import { useAuth } from "@/app/context/AuthContext";
import { LayoutDashboard, LogOut, ChevronDown, MessageSquareHeart } from "lucide-react";

export default function Header() {
  const pathname = usePathname();
  const router = useRouter();
  const { user, loading, signOut } = useAuth();
  const [isDropdownOpen, setIsDropdownOpen] = useState(false);
  const dropdownRef = useRef<HTMLDivElement>(null);

  // Close dropdown when clicking outside
  useEffect(() => {
    const handleClickOutside = (event: MouseEvent) => {
      if (dropdownRef.current && !dropdownRef.current.contains(event.target as Node)) {
        setIsDropdownOpen(false);
      }
    };

    document.addEventListener("mousedown", handleClickOutside);
    return () => document.removeEventListener("mousedown", handleClickOutside);
  }, []);

  const handleLogout = async () => {
    setIsDropdownOpen(false);
    await signOut();
    router.push("/");
    router.refresh();
  };

  const isActive = (path: string) => pathname === path;

  // Get first character of email for avatar
  const getInitial = () => {
    if (user?.email) {
      return user.email.charAt(0).toUpperCase();
    }
    return "U";
  };

  // Smooth scroll to section
  const scrollToSection = (sectionId: string) => {
    if (pathname !== "/") {
      router.push(`/#${sectionId}`);
    } else {
      const element = document.getElementById(sectionId);
      if (element) {
        element.scrollIntoView({ behavior: "smooth", block: "start" });
      }
    }
  };

  return (
    <header className="sticky top-0 z-50 bg-white/95 backdrop-blur-sm border-b border-gray-200 shadow-sm">
      <div className="max-w-7xl mx-auto px-6 py-4">
        <div className="flex items-center justify-between">
          <Link href="/" className="flex items-center space-x-2 hover:opacity-80 transition-opacity">
            <div className="w-6 h-6 bg-gradient-to-br from-violet-500 to-purple-600 rounded shadow-sm"></div>
            <span className="text-xl font-semibold text-gray-900">Preply</span>
          </Link>

          <nav className="hidden md:flex items-center space-x-8">
            <Link
              href="/"
              className={`text-sm font-medium transition-colors ${isActive("/")
                ? "text-violet-600 font-semibold"
                : "text-gray-700 hover:text-violet-600"
                }`}
            >
              Home
            </Link>
            <button
              onClick={() => scrollToSection("features")}
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              Features
            </button>
            <button
              onClick={() => scrollToSection("how-it-works")}
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              How It Works
            </button>
            <Link
              href="/pricing"
              className={`text-sm font-medium transition-colors ${isActive("/pricing")
                ? "text-violet-600 font-semibold"
                : "text-gray-700 hover:text-violet-600"
                }`}
            >
              Pricing
            </Link>
            <button
              onClick={() => scrollToSection("faq")}
              className="text-sm font-medium text-gray-700 hover:text-violet-600 transition-colors"
            >
              FAQ
            </button>
            <Link
              href="/feedback"
              onClick={(e) => {
                if (!user) {
                  e.preventDefault();
                  router.push("/login?redirect=/feedback");
                }
              }}
              className={`flex items-center gap-1.5 text-sm font-medium transition-colors ${isActive("/feedback")
                ? "text-violet-600 font-semibold"
                : "text-gray-700 hover:text-violet-600"
                }`}
            >
              <MessageSquareHeart className="w-4 h-4" />
              Feedback
            </Link>
          </nav>

          <div className="flex items-center space-x-3">
            {!loading && (
              <>
                {user ? (
                  <div className="relative" ref={dropdownRef}>
                    {/* Profile Avatar Button */}
                    <button
                      onClick={() => setIsDropdownOpen(!isDropdownOpen)}
                      className="flex items-center gap-2 p-1 rounded-full hover:bg-gray-100 transition-colors"
                    >
                      <div className="w-10 h-10 bg-gradient-to-br from-violet-500 to-purple-600 rounded-full flex items-center justify-center text-white font-bold text-sm shadow-md">
                        {getInitial()}
                      </div>
                      <ChevronDown className={`w-4 h-4 text-gray-500 transition-transform duration-200 ${isDropdownOpen ? 'rotate-180' : ''}`} />
                    </button>

                    {/* Dropdown Menu */}
                    {isDropdownOpen && (
                      <div className="absolute right-0 mt-2 w-56 bg-white rounded-xl shadow-lg border border-gray-200 py-2 animate-dropdown">
                        {/* User Info */}
                        <div className="px-4 py-3 border-b border-gray-100">
                          <p className="text-sm font-medium text-gray-900 truncate">{user.email}</p>
                          <p className="text-xs text-gray-500">Logged in</p>
                        </div>

                        {/* Menu Items */}
                        <div className="py-1">
                          <Link
                            href="/dashboard"
                            onClick={() => setIsDropdownOpen(false)}
                            className="flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-violet-50 hover:text-violet-600 transition-colors"
                          >
                            <LayoutDashboard className="w-4 h-4" />
                            Dashboard
                          </Link>
                          <button
                            onClick={handleLogout}
                            className="w-full flex items-center gap-3 px-4 py-2.5 text-sm text-gray-700 hover:bg-red-50 hover:text-red-600 transition-colors"
                          >
                            <LogOut className="w-4 h-4" />
                            Logout
                          </button>
                        </div>
                      </div>
                    )}
                  </div>
                ) : (
                  <>
                    <Link
                      href="/signup"
                      className="px-5 py-2 text-sm font-medium text-white bg-violet-600 rounded-lg hover:bg-violet-700 hover:shadow-md transition-all duration-200"
                    >
                      Sign Up
                    </Link>
                    <Link
                      href="/login"
                      className="px-5 py-2 text-sm font-medium text-gray-700 border border-gray-300 rounded-lg hover:bg-gray-50 hover:border-gray-400 transition-all duration-200"
                    >
                      Login
                    </Link>
                  </>
                )}
              </>
            )}
          </div>
        </div>
      </div>

      {/* Dropdown Animation Styles */}
      <style jsx>{`
        @keyframes dropdown {
          from {
            opacity: 0;
            transform: translateY(-8px) scale(0.95);
          }
          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
        .animate-dropdown {
          animation: dropdown 0.2s ease-out forwards;
        }
      `}</style>
    </header>
  );
}