import { notFound } from "next/navigation";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import Image from "next/image";
import Link from "next/link";
import { Calendar, Clock, ArrowLeft, Share2 } from "lucide-react";
import { getBlogPostBySlug, getAllBlogPosts } from "@/lib/blog-data";
import type { Metadata } from "next";

interface BlogPostPageProps {
    params: {
        slug: string;
    };
}

// Generate static paths for all blog posts
export async function generateStaticParams() {
    const posts = getAllBlogPosts();
    return posts.map((post) => ({
        slug: post.slug,
    }));
}

// Generate metadata for SEO
export async function generateMetadata({ params }: BlogPostPageProps): Promise<Metadata> {
    const post = getBlogPostBySlug(params.slug);

    if (!post) {
        return {
            title: "Blog Post Not Found",
        };
    }

    return {
        title: `${post.title} - Preply Blog`,
        description: post.excerpt,
        openGraph: {
            title: post.title,
            description: post.excerpt,
            images: [post.image],
        },
    };
}

export default function BlogPostPage({ params }: BlogPostPageProps) {
    const post = getBlogPostBySlug(params.slug);

    if (!post) {
        notFound();
    }

    return (
        <div className="min-h-screen bg-white">
            <Header />

            <article className="py-12 px-6">
                <div className="max-w-4xl mx-auto">
                    {/* Back Button */}
                    <Link
                        href="/blog"
                        className="inline-flex items-center space-x-2 text-sm text-gray-600 hover:text-blue-600 transition-colors mb-8 group"
                    >
                        <ArrowLeft className="w-4 h-4 group-hover:-translate-x-1 transition-transform" />
                        <span>Back to Blog</span>
                    </Link>

                    {/* Category Badge */}
                    <div className="mb-4">
                        <span className="inline-block px-4 py-1.5 text-sm font-semibold text-blue-600 bg-blue-50 rounded-full">
                            {post.category}
                        </span>
                    </div>

                    {/* Title */}
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-6 leading-tight">
                        {post.title}
                    </h1>

                    {/* Meta Info */}
                    <div className="flex flex-wrap items-center gap-6 mb-8 pb-8 border-b border-gray-200">
                        <div className="flex items-center space-x-3">
                            <Image
                                src={post.author.avatar}
                                alt={post.author.name}
                                width={48}
                                height={48}
                                className="rounded-full"
                            />
                            <div>
                                <p className="font-semibold text-gray-900">{post.author.name}</p>
                                <p className="text-sm text-gray-600">{post.author.role}</p>
                            </div>
                        </div>

                        <div className="flex items-center space-x-6 text-sm text-gray-600">
                            <div className="flex items-center space-x-2">
                                <Calendar className="w-4 h-4" />
                                <span>{post.date}</span>
                            </div>
                            <div className="flex items-center space-x-2">
                                <Clock className="w-4 h-4" />
                                <span>{post.readTime}</span>
                            </div>
                        </div>


                    </div>

                    {/* Featured Image */}
                    <div className="relative w-full h-96 rounded-2xl overflow-hidden mb-12 bg-gradient-to-br from-blue-100 to-blue-200">
                        <Image
                            src={post.image}
                            alt={post.title}
                            fill
                            className="object-cover"
                            priority
                        />
                    </div>

                    {/* Article Content */}
                    <div className="prose prose-lg max-w-none">
                        {/* Introduction */}
                        <p className="text-xl text-gray-700 leading-relaxed mb-8">
                            {post.content.introduction}
                        </p>

                        {/* Sections */}
                        {post.content.sections.map((section, index) => (
                            <div key={index} className="mb-10">
                                <h2 className="text-3xl font-bold text-gray-900 mb-4 mt-8">
                                    {section.title}
                                </h2>
                                <p className="text-gray-700 leading-relaxed text-lg">
                                    {section.content}
                                </p>
                            </div>
                        ))}

                        {/* Conclusion */}
                        <div className="mt-12 p-6 bg-gradient-to-r from-blue-50 to-indigo-50 rounded-xl border border-blue-100">
                            <h2 className="text-2xl font-bold text-gray-900 mb-4">Conclusion</h2>
                            <p className="text-gray-700 leading-relaxed text-lg">
                                {post.content.conclusion}
                            </p>
                        </div>
                    </div>

                    {/* Author Bio */}
                    <div className="mt-16 p-8 bg-gray-50 rounded-2xl border border-gray-200">
                        <div className="flex items-start space-x-4">
                            <Image
                                src={post.author.avatar}
                                alt={post.author.name}
                                width={80}
                                height={80}
                                className="rounded-full"
                            />
                            <div>
                                <h3 className="text-xl font-bold text-gray-900 mb-1">
                                    About {post.author.name}
                                </h3>
                                <p className="text-sm text-blue-600 mb-3">{post.author.role}</p>
                                <p className="text-gray-600 leading-relaxed">
                                    {post.author.name} is a passionate {post.author.role.toLowerCase()} at Preply,
                                    dedicated to helping businesses transform their operations through intelligent automation.
                                    With years of experience in the industry, they bring valuable insights and practical
                                    expertise to every article.
                                </p>
                            </div>
                        </div>
                    </div>

                    {/* Related Articles CTA */}
                    <div className="mt-16 text-center">
                        <Link
                            href="/blog"
                            className="inline-flex items-center justify-center space-x-2 px-8 py-4 bg-blue-600 text-white font-semibold rounded-xl hover:bg-blue-700 transition-colors shadow-lg hover:shadow-xl"
                        >
                            <span>Read More Articles</span>
                            <ArrowLeft className="w-5 h-5 rotate-180" />
                        </Link>
                    </div>
                </div>
            </article>

            <Footer />
        </div>
    );
}
