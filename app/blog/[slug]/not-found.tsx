import Link from "next/link";
import { ArrowLeft } from "lucide-react";

export default function NotFound() {
    return (
        <div className="min-h-screen bg-white flex items-center justify-center px-6">
            <div className="text-center max-w-md">
                <h1 className="text-6xl font-bold text-gray-900 mb-4">404</h1>
                <h2 className="text-2xl font-semibold text-gray-700 mb-4">
                    Blog Post Not Found
                </h2>
                <p className="text-gray-600 mb-8">
                    Sorry, we couldn't find the blog post you're looking for. It may have been
                    moved or deleted.
                </p>
                <Link
                    href="/blog"
                    className="inline-flex items-center space-x-2 px-6 py-3 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors"
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span>Back to Blog</span>
                </Link>
            </div>
        </div>
    );
}
