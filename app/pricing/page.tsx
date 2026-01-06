"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import { useAuth } from "@/app/context/AuthContext";
import { useSubscription } from "@/app/context/SubscriptionContext";
import Header from "@/components/Header";
import Footer from "@/components/Footer";
import { Check, X, Sparkles, Crown, Loader2 } from "lucide-react";
import { toast } from "sonner"; // Assuming sonner is used as per project convention linked in Resume component

declare global {
    interface Window {
        Razorpay: any;
    }
}

interface PlanFeature {
    text: string;
    included: boolean;
}

// Plan features as per user requirements
const FREE_FEATURES: PlanFeature[] = [
    { text: "1 interview (lifetime)", included: true },
    { text: "1 report download", included: true },
    { text: "AI-powered feedback", included: true },
    { text: "Dashboard access", included: true },
    { text: "Progress tracking", included: true },
    { text: "Interview history", included: true },
];

const PRO_FEATURES: PlanFeature[] = [
    { text: "Everything in Free", included: true },
    { text: "Unlimited interviews", included: true },
    { text: "Unlimited report downloads", included: true },
    { text: "Dashboard access", included: true },
    { text: "Progress tracking", included: true },
    { text: "Interview history", included: true },
];

const PRO_PRICING = {
    monthly: { amount: 100, display: "1", period: "/month", billingCycle: "monthly" as const },
    yearly: { amount: 200, display: "2", period: "/year", billingCycle: "yearly" as const },
};

export default function PricingPage() {
    const router = useRouter();
    const { user, loading: authLoading } = useAuth();
    const { isPro, loading: subLoading, interviewsTaken } = useSubscription();
    const [isYearly, setIsYearly] = useState(false);
    const [processingPlan, setProcessingPlan] = useState<string | null>(null);
    const [showPopup, setShowPopup] = useState(false);

    useEffect(() => {
        if (!subLoading && !isPro && interviewsTaken > 0) {
            setShowPopup(true);
            const timer = setTimeout(() => {
                setShowPopup(false);
            }, 2000);
            return () => clearTimeout(timer);
        }
    }, [subLoading, isPro, interviewsTaken]);

    const loadRazorpayScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = "https://checkout.razorpay.com/v1/checkout.js";
            script.onload = () => resolve(true);
            script.onerror = () => resolve(false);
            document.body.appendChild(script);
        });
    };

    const handleFreePlan = () => {
        router.push("/interview-setup");
    };

    const handleProPlan = async () => {
        if (!user) {
            router.push("/login?redirect=/pricing");
            return;
        }

        if (isPro) {
            router.push("/dashboard");
            return;
        }

        const selectedPricing = isYearly ? PRO_PRICING.yearly : PRO_PRICING.monthly;
        setProcessingPlan("pro");

        try {
            const scriptLoaded = await loadRazorpayScript();
            if (!scriptLoaded) {
                toast.error("Failed to load payment gateway. Please try again.");
                setProcessingPlan(null);
                return;
            }

            const orderResponse = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    billingCycle: selectedPricing.billingCycle,
                    userId: user.id,
                }),
            });

            const orderData = await orderResponse.json();

            if (!orderData.orderId) {
                toast.error(orderData.error || "Failed to create order. Please try again.");
                setProcessingPlan(null);
                return;
            }

            const options = {
                key: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
                amount: orderData.amount,
                currency: orderData.currency,
                name: "Preply",
                description: `Pro Plan - ${isYearly ? "Yearly" : "Monthly"}`,
                order_id: orderData.orderId,
                handler: async (response: any) => {
                    const verifyResponse = await fetch("/api/razorpay/verify-payment", {
                        method: "POST",
                        headers: { "Content-Type": "application/json" },
                        body: JSON.stringify({
                            razorpay_order_id: response.razorpay_order_id,
                            razorpay_payment_id: response.razorpay_payment_id,
                            razorpay_signature: response.razorpay_signature,
                            userId: user.id,
                            billingCycle: selectedPricing.billingCycle,
                        }),
                    });

                    const verifyData = await verifyResponse.json();

                    if (verifyData.success) {
                        toast.success("Payment successful! Welcome to Pro.");
                        router.push("/dashboard?payment=success");
                    } else {
                        toast.error("Payment verification failed. Please contact support.");
                    }
                    setProcessingPlan(null);
                },
                prefill: {
                    email: user.email,
                },
                theme: {
                    color: "#7c3aed",
                },
                modal: {
                    ondismiss: () => {
                        setProcessingPlan(null);
                    },
                },
            };

            const razorpay = new window.Razorpay(options);
            razorpay.open();
        } catch (error) {
            console.error("Payment error:", error);
            toast.error("An error occurred. Please try again.");
            setProcessingPlan(null);
        }
    };

    if (authLoading || subLoading) {
        return (
            <div className="min-h-screen flex items-center justify-center">
                <Loader2 className="w-8 h-8 animate-spin text-violet-600" />
            </div>
        );
    }

    const currentPrice = isYearly ? PRO_PRICING.yearly : PRO_PRICING.monthly;

    return (
        <div className="min-h-screen bg-gradient-to-b from-violet-50/30 via-white to-white">
            {/* Pop-up for Free users who have completed an interview */}
            {showPopup && (
                <div className="fixed inset-0 z-[100] flex items-center justify-center bg-black/40 backdrop-blur-sm animate-in fade-in duration-300">
                    <div className="bg-white px-8 py-6 rounded-2xl shadow-2xl flex flex-col items-center gap-4 animate-in zoom-in-95 duration-300 border-2 border-violet-100">
                        <div className="w-12 h-12 bg-violet-100 rounded-full flex items-center justify-center">
                            <Crown className="w-6 h-6 text-violet-600" />
                        </div>
                        <div className="text-center">
                            <h3 className="text-xl font-bold text-gray-900 mb-1">Get the Paid Version</h3>
                            <p className="text-gray-500 text-sm">Unlock unlimited potential</p>
                        </div>
                    </div>
                </div>
            )}

            <Header />

            <main className="max-w-5xl mx-auto px-6 py-16">
                {/* Header */}
                <div className="text-center mb-12">
                    <div className="inline-flex items-center gap-2 px-4 py-2 bg-violet-100 rounded-full text-violet-700 text-sm font-medium mb-6">
                        <Sparkles className="w-4 h-4" />
                        Choose Your Plan
                    </div>
                    <h1 className="text-4xl md:text-5xl font-bold text-gray-900 mb-4">
                        Invest in Your Career
                    </h1>
                    <p className="text-xl text-gray-600 max-w-2xl mx-auto">
                        Practice unlimited interviews, track your progress, and land your dream job.
                    </p>
                </div>

                {/* Monthly/Yearly Toggle */}
                <div className="flex items-center justify-center gap-4 mb-12">
                    <span className={`text-sm font-medium transition-colors ${!isYearly ? "text-gray-900" : "text-gray-400"}`}>
                        Monthly
                    </span>
                    <button
                        onClick={() => setIsYearly(!isYearly)}
                        className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${isYearly ? "bg-violet-600" : "bg-gray-300"
                            }`}
                    >
                        <span
                            className={`absolute top-0.5 left-0.5 w-6 h-6 bg-white rounded-full shadow-md transition-transform duration-300 ${isYearly ? "translate-x-7" : "translate-x-0"
                                }`}
                        />
                    </button>
                    <span className={`text-sm font-medium transition-colors ${isYearly ? "text-gray-900" : "text-gray-400"}`}>
                        Yearly
                    </span>
                </div>

                {/* Pricing Cards */}
                <div className="grid md:grid-cols-2 gap-8 max-w-4xl mx-auto">
                    {/* Free Plan Card */}
                    <div className="relative bg-white rounded-3xl border-2 border-gray-200 p-8 shadow-sm hover:shadow-lg transition-all duration-300">
                        <h3 className="text-2xl font-bold text-gray-900 mb-2">Free</h3>

                        {/* Price */}
                        <div className="mb-2">
                            <span className="text-5xl font-bold text-gray-900">₹0</span>
                            <span className="text-gray-500 ml-1">forever</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8">Everything you need to get started</p>

                        {/* Features */}
                        <ul className="space-y-4 mb-8">
                            {FREE_FEATURES.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    {feature.included ? (
                                        <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                            <Check className="w-3 h-3 text-violet-600" />
                                        </div>
                                    ) : (
                                        <div className="w-5 h-5 rounded-full bg-gray-100 flex items-center justify-center flex-shrink-0">
                                            <X className="w-3 h-3 text-gray-400" />
                                        </div>
                                    )}
                                    <span className={feature.included ? "text-gray-700" : "text-gray-400"}>
                                        {feature.text}
                                    </span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA Button */}
                        <button
                            onClick={handleFreePlan}
                            className="w-full py-4 px-6 rounded-xl font-semibold text-gray-700 bg-gray-100 hover:bg-gray-200 transition-all duration-200"
                        >
                            Start Free
                        </button>
                    </div>

                    {/* Pro Plan Card */}
                    <div className="relative bg-white rounded-3xl border-2 border-violet-500 p-8 shadow-lg shadow-violet-100">
                        {/* Most Popular Badge */}
                        <div className="absolute -top-4 left-1/2 -translate-x-1/2">
                            <span className="inline-flex items-center gap-1.5 px-4 py-1.5 bg-gradient-to-r from-violet-600 to-purple-600 text-white text-sm font-semibold rounded-full shadow-lg">
                                <Sparkles className="w-4 h-4" />
                                Most Popular
                            </span>
                        </div>

                        <h3 className="text-2xl font-bold text-gray-900 mb-2 mt-2">Pro</h3>

                        {/* Price */}
                        <div className="mb-2">
                            <span className="text-5xl font-bold text-violet-600">₹{currentPrice.display}</span>
                            <span className="text-gray-500 ml-1">{currentPrice.period}</span>
                        </div>
                        <p className="text-gray-500 text-sm mb-8">For serious growth-seekers</p>

                        {/* Features */}
                        <ul className="space-y-4 mb-8">
                            {PRO_FEATURES.map((feature, index) => (
                                <li key={index} className="flex items-center gap-3">
                                    <div className="w-5 h-5 rounded-full bg-violet-100 flex items-center justify-center flex-shrink-0">
                                        <Check className="w-3 h-3 text-violet-600" />
                                    </div>
                                    <span className="text-gray-700">{feature.text}</span>
                                </li>
                            ))}
                        </ul>

                        {/* CTA Button */}
                        <button
                            onClick={handleProPlan}
                            disabled={processingPlan !== null}
                            className="w-full py-4 px-6 rounded-xl font-semibold text-white bg-gradient-to-r from-violet-600 to-purple-600 hover:from-violet-700 hover:to-purple-700 shadow-lg hover:shadow-xl transition-all duration-200 disabled:opacity-50 disabled:cursor-not-allowed flex items-center justify-center gap-2"
                        >
                            {processingPlan === "pro" ? (
                                <>
                                    <Loader2 className="w-5 h-5 animate-spin" />
                                    Processing...
                                </>
                            ) : isPro ? (
                                "Current Plan"
                            ) : (
                                "Upgrade to Pro"
                            )}
                        </button>
                    </div>
                </div>

                {/* Trust Badges */}
                <div className="text-center mt-16">
                    <p className="text-gray-500 mb-4">Trusted payment powered by</p>
                    <div className="flex flex-col sm:flex-row items-center justify-center gap-4 sm:gap-8">
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M12 2C6.48 2 2 6.48 2 12s4.48 10 10 10 10-4.48 10-10S17.52 2 12 2zm-2 15l-5-5 1.41-1.41L10 14.17l7.59-7.59L19 8l-9 9z" />
                            </svg>
                            <span className="text-sm">Secure Checkout</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <svg className="w-6 h-6" viewBox="0 0 24 24" fill="currentColor">
                                <path d="M18 8h-1V6c0-2.76-2.24-5-5-5S7 3.24 7 6v2H6c-1.1 0-2 .9-2 2v10c0 1.1.9 2 2 2h12c1.1 0 2-.9 2-2V10c0-1.1-.9-2-2-2zm-6 9c-1.1 0-2-.9-2-2s.9-2 2-2 2 .9 2 2-.9 2-2 2zm3.1-9H8.9V6c0-1.71 1.39-3.1 3.1-3.1 1.71 0 3.1 1.39 3.1 3.1v2z" />
                            </svg>
                            <span className="text-sm">256-bit SSL</span>
                        </div>
                        <div className="flex items-center gap-2 text-gray-400">
                            <img
                                src="https://razorpay.com/favicon.png"
                                alt="Razorpay"
                                className="w-5 h-5"
                            />
                            <span className="text-sm">Razorpay</span>
                        </div>
                    </div>
                </div>

                {/* FAQ */}
                <div className="mt-20 max-w-3xl mx-auto">
                    <h2 className="text-2xl font-bold text-center text-gray-900 mb-8">
                        Frequently Asked Questions
                    </h2>
                    <div className="space-y-4">
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Can I cancel anytime?
                            </h3>
                            <p className="text-gray-600">
                                Yes! Your Pro subscription is a one-time payment. It expires after the selected duration with no auto-renewal.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                What happens after my Free interview?
                            </h3>
                            <p className="text-gray-600">
                                After using your free interview, you&apos;ll need to upgrade to Pro to continue practicing. Your free report can be downloaded once.
                            </p>
                        </div>
                        <div className="bg-white rounded-xl border border-gray-200 p-6">
                            <h3 className="font-semibold text-gray-900 mb-2">
                                Is my payment secure?
                            </h3>
                            <p className="text-gray-600">
                                Absolutely! We use Razorpay, India&apos;s most trusted payment gateway with bank-grade security.
                            </p>
                        </div>
                    </div>
                </div>
            </main>

            <Footer />
        </div>
    );
}
