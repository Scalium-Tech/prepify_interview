"use client";

import { Facebook, Twitter, Instagram } from "lucide-react";
import Link from "next/link";
import { useRouter, usePathname } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";

export default function Footer() {
  const router = useRouter();
  const pathname = usePathname();
  const { user } = useAuth();

  const handleSectionClick = (sectionId: string) => {
    if (pathname === "/") {
      const element = document.getElementById(sectionId);
      if (element) {
        const headerOffset = 80;
        const elementPosition = element.getBoundingClientRect().top;
        const offsetPosition = elementPosition + window.pageYOffset - headerOffset;

        window.scrollTo({
          top: offsetPosition,
          behavior: "smooth",
        });
      }
    } else {
      router.push(`/#${sectionId}`);
    }
  };

  return (
    <footer className="bg-gradient-to-b from-gray-50 to-white border-t border-gray-200">
      <div className="max-w-7xl mx-auto px-6 py-16">
        <div className="grid grid-cols-1 md:grid-cols-4 gap-10 mb-12">
          <div>
            <div className="flex items-center mb-4">
              <img
                src="/preply_logo.png"
                alt="Preply"
                className="h-10 w-auto"
              />
            </div>
            <p className="text-sm text-gray-600 leading-relaxed">
              Ace your next interview with AI-powered practice and feedback
            </p>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">About</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <button
                  onClick={() => handleSectionClick("features")}
                  className="hover:text-violet-600 transition-colors text-left"
                >
                  Features
                </button>
              </li>
              <li>
                <Link
                  href="/pricing"
                  className="hover:text-violet-600 transition-colors"
                >
                  Pricing
                </Link>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick("how-it-works")}
                  className="hover:text-violet-600 transition-colors text-left"
                >
                  How It Works
                </button>
              </li>
              <li>
                <button
                  onClick={() => handleSectionClick("faq")}
                  className="hover:text-violet-600 transition-colors text-left"
                >
                  FAQs
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Resources</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link href="/about" className="hover:text-violet-600 transition-colors">
                  About Us
                </Link>
              </li>
              <li>
                <Link href="/blog" className="hover:text-violet-600 transition-colors">
                  Blog
                </Link>
              </li>
              <li>
                <Link href="/help-center" className="hover:text-violet-600 transition-colors">
                  Help Center
                </Link>
              </li>
              <li>
                <button
                  onClick={() => {
                    if (user) {
                      router.push("/contact");
                    } else {
                      router.push("/login?redirect=/contact");
                    }
                  }}
                  className="hover:text-violet-600 transition-colors text-left"
                >
                  Contact
                </button>
              </li>
            </ul>
          </div>

          <div>
            <h4 className="font-bold text-gray-900 mb-4">Legal</h4>
            <ul className="space-y-3 text-sm text-gray-600">
              <li>
                <Link href="/terms" className="hover:text-violet-600 transition-colors">
                  Terms & Conditions
                </Link>
              </li>
              <li>
                <Link href="/privacy" className="hover:text-violet-600 transition-colors">
                  Privacy Policy
                </Link>
              </li>
              <li>
                <Link href="/refund" className="hover:text-violet-600 transition-colors">
                  Refund Policy
                </Link>
              </li>
              <li>
                <Link href="/shipping" className="hover:text-violet-600 transition-colors">
                  Shipping Policy
                </Link>
              </li>
            </ul>
          </div>
        </div>

        <div className="pt-8 mt-8 border-t border-gray-200">
          <div className="flex flex-col md:flex-row justify-between items-center gap-4">
            <Link
              href="/signup"
              className="inline-flex items-center justify-center px-8 py-3 text-sm font-semibold text-white bg-violet-600 rounded-lg hover:bg-violet-700 hover:shadow-lg transition-all duration-200"
            >
              Get Started Free
            </Link>
          </div>
        </div>

        <div className="pt-8 border-t border-gray-200 flex flex-col md:flex-row justify-between items-center">
          <p className="text-sm text-gray-600 mb-4 md:mb-0">
            Copyright © Preply, Inc.
          </p>
          <div className="flex space-x-5">
            <a
              href="https://x.com/DafaleNaku75724"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-violet-600 transition-colors"
              aria-label="Twitter"
            >
              <Twitter className="w-5 h-5" />
            </a>
            <a
              href="https://www.facebook.com/nakul.dafale.3"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-violet-600 transition-colors"
              aria-label="Facebook"
            >
              <Facebook className="w-5 h-5" />
            </a>
            <a
              href="https://www.instagram.com/nakuldafale7/"
              target="_blank"
              rel="noopener noreferrer"
              className="text-gray-600 hover:text-violet-600 transition-colors"
              aria-label="Instagram"
            >
              <Instagram className="w-5 h-5" />
            </a>
          </div>
        </div>
      </div>
    </footer>
  );
}
