"use client";

import { useState, useEffect } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { supabase } from "@/lib/supabase";
import { MoveLeft, CheckCircle, AlertCircle, Lock, RefreshCw, ArrowRight } from "lucide-react";
import Link from "next/link";
import { AuthError } from "@supabase/supabase-js";

export default function UpdatePasswordPage() {
    const router = useRouter();
    const searchParams = useSearchParams();

    const [email, setEmail] = useState<string | null>(null);
    const [password, setPassword] = useState("");
    const [confirmPassword, setConfirmPassword] = useState("");
    const [loading, setLoading] = useState(true);
    const [updating, setUpdating] = useState(false);
    const [error, setError] = useState("");
    const [success, setSuccess] = useState(false);
    const [isLinkExpired, setIsLinkExpired] = useState(false);

    useEffect(() => {
        // Function to parse hash parameters
        const getHashParams = () => {
            const hash = window.location.hash.substring(1);
            const params = new URLSearchParams(hash);
            return {
                error: params.get("error"),
                error_description: params.get("error_description"),
                error_code: params.get("error_code")
            };
        };

        // Check for error parameters in the URL (query params or hash)
        const queryErrorParam = searchParams.get("error");
        const queryErrorCode = searchParams.get("error_code");
        const queryErrorDescription = searchParams.get("error_description");

        const hashParams = getHashParams();

        const errorParam = queryErrorParam || hashParams.error;
        const errorCode = queryErrorCode || hashParams.error_code;
        const errorDescription = queryErrorDescription || hashParams.error_description?.replace(/\+/g, ' ');

        if (errorParam || errorCode === "otp_expired") {
            setError(errorDescription || "Your password reset link is invalid or has expired.");
            setIsLinkExpired(true);
            setLoading(false);
            return;
        }

        const checkSession = async () => {
            const { data: { session }, error: sessionError } = await supabase.auth.getSession();

            if (session?.user) {
                setEmail(session.user.email || null);
                setLoading(false);
            } else {
                // No session found on load. 
                // We'll wait a brief moment for onAuthStateChange to potentially fire,
                // but if not, we might assume direct access without a valid session.
                const { data: { user }, error: userError } = await supabase.auth.getUser();
                if (user) {
                    setEmail(user.email || null);
                    setLoading(false);
                } else {
                    // If we are here, it likely means the flow is broken or direct access
                    // We don't error immediately to allow the onAuthStateChange listener to work
                }
            }
        };

        checkSession();

        const { data: authListener } = supabase.auth.onAuthStateChange(async (event, session) => {
            console.log("Auth state change:", event);
            if (event === "PASSWORD_RECOVERY" || event === "SIGNED_IN") {
                if (session?.user) {
                    setEmail(session.user.email || null);
                    setError("");
                    setIsLinkExpired(false);
                    setLoading(false);
                }
            }
        });

        return () => {
            authListener.subscription.unsubscribe();
        };
    }, [searchParams]);

    const handleSubmit = async (e: React.FormEvent) => {
        e.preventDefault();
        setError("");

        if (password !== confirmPassword) {
            setError("Passwords do not match");
            return;
        }

        if (password.length < 6) {
            setError("Password must be at least 6 characters");
            return;
        }

        setUpdating(true);

        try {
            const { error: updateError } = await supabase.auth.updateUser({
                password: password,
            });

            if (updateError) {
                setError(updateError.message);
                setUpdating(false);
                return;
            }

            setSuccess(true);
            setUpdating(false);

            // Optional: Redirect after a few seconds
            setTimeout(() => {
                router.push("/login?password_updated=true");
            }, 3000);

        } catch (err) {
            setError("An unexpected error occurred. Please try again.");
            setUpdating(false);
        }
    };

    if (loading) {
        return (
            <div className="min-h-screen flex items-center justify-center bg-white">
                <div className="animate-spin rounded-full h-8 w-8 border-b-2 border-violet-600"></div>
            </div>
        );
    }

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50/50 via-white to-white flex items-center justify-center px-6 py-12">
            <div className="w-full max-w-md">
                <div className="bg-white rounded-2xl shadow-xl border border-gray-100 p-8">
                    {success ? (
                        <div className="text-center py-8">
                            <div className="w-16 h-16 bg-green-100 text-green-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <CheckCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Password Set!</h2>
                            <p className="text-gray-600 mb-6">
                                Your password has been successfully updated. You can now login.
                            </p>
                            <Link
                                href="/login"
                                className="inline-block w-full py-3 px-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors shadow-md"
                            >
                                Go to Login
                            </Link>
                        </div>
                    ) : isLinkExpired ? (
                        <div className="text-center py-6">
                            <div className="w-16 h-16 bg-orange-100 text-orange-600 rounded-full flex items-center justify-center mx-auto mb-4">
                                <AlertCircle className="w-8 h-8" />
                            </div>
                            <h2 className="text-2xl font-bold text-gray-900 mb-2">Link Expired</h2>
                            <p className="text-gray-600 mb-6">
                                This password reset link is invalid or has expired. Please request a new one.
                            </p>
                            <Link
                                href="/forgot-password"
                                className="inline-flex items-center justify-center w-full py-3 px-4 bg-violet-600 text-white rounded-xl font-semibold hover:bg-violet-700 transition-colors shadow-md"
                            >
                                Request New Link
                                <ArrowRight className="w-4 h-4 ml-2" />
                            </Link>
                        </div>
                    ) : (
                        <>
                            <div className="text-center mb-8">
                                <div className="w-12 h-12 bg-violet-100 text-violet-600 rounded-xl flex items-center justify-center mx-auto mb-4">
                                    <Lock className="w-6 h-6" />
                                </div>
                                <h1 className="text-2xl font-bold text-gray-900 mb-2">Set New Password</h1>
                                <p className="text-gray-600">
                                    {email ? (
                                        <>for <span className="font-medium text-gray-900">{email}</span></>
                                    ) : (
                                        "Create a new password for your account"
                                    )}
                                </p>
                            </div>

                            {error && (
                                <div className="mb-6 p-4 bg-red-50 border border-red-200 rounded-xl flex items-start space-x-3 text-red-600 text-sm">
                                    <AlertCircle className="w-5 h-5 flex-shrink-0 mt-0.5" />
                                    <span>{error}</span>
                                </div>
                            )}

                            <form onSubmit={handleSubmit} className="space-y-5">
                                <div>
                                    <label htmlFor="email" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Email Address
                                    </label>
                                    <input
                                        type="email"
                                        id="email"
                                        value={email || ""}
                                        readOnly
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl bg-gray-50 text-gray-500 cursor-not-allowed focus:outline-none"
                                    />
                                </div>

                                <div>
                                    <label htmlFor="password" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="password"
                                        value={password}
                                        onChange={(e) => setPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Enter new password"
                                        required
                                        disabled={updating}
                                        minLength={6}
                                    />
                                </div>

                                <div>
                                    <label htmlFor="confirmPassword" className="block text-sm font-medium text-gray-700 mb-1.5">
                                        Confirm New Password
                                    </label>
                                    <input
                                        type="password"
                                        id="confirmPassword"
                                        value={confirmPassword}
                                        onChange={(e) => setConfirmPassword(e.target.value)}
                                        className="w-full px-4 py-3 border border-gray-300 rounded-xl text-gray-900 placeholder-gray-400 focus:outline-none focus:ring-2 focus:ring-violet-500 focus:border-transparent transition-all duration-200"
                                        placeholder="Confirm new password"
                                        required
                                        disabled={updating}
                                        minLength={6}
                                    />
                                </div>

                                <button
                                    type="submit"
                                    disabled={updating}
                                    className="w-full py-3.5 text-base font-semibold text-white bg-violet-600 rounded-xl hover:bg-violet-700 hover:shadow-lg hover:-translate-y-0.5 transition-all duration-200 shadow-md disabled:opacity-50 disabled:cursor-not-allowed disabled:hover:translate-y-0 disabled:hover:shadow-md"
                                >
                                    {updating ? "Setting Password..." : "Set Password"}
                                </button>
                            </form>
                        </>
                    )}
                </div>
            </div>
        </div>
    );
}
