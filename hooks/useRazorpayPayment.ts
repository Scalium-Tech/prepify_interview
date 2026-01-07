import { useState, useCallback } from "react";
import { toast } from "sonner";
import { paymentConfig } from "@/lib/config/payments";
import { RazorpayOrderResponse, RazorpayOptions, RazorpayHandlerResponse, RazorpayErrorResponse } from "@/types/razorpay";

// Script URL
const RAZORPAY_SCRIPT = "https://checkout.razorpay.com/v1/checkout.js";

interface UseRazorpayPaymentProps {
    userId: string;
    email: string;
    onSuccess?: () => void;
    onError?: (error: string) => void;
}

export function useRazorpayPayment({ userId, email, onSuccess, onError }: UseRazorpayPaymentProps) {
    const [isLoading, setIsLoading] = useState(false);
    const [error, setError] = useState<string | null>(null);

    const loadScript = (): Promise<boolean> => {
        return new Promise((resolve) => {
            if (window.Razorpay) {
                resolve(true);
                return;
            }
            const script = document.createElement("script");
            script.src = RAZORPAY_SCRIPT;
            script.onload = () => resolve(true);
            script.onerror = () => {
                // Ad-blocker or network error
                resolve(false);
            };
            document.body.appendChild(script);
        });
    };

    const buyPro = useCallback(async (isYearly: boolean) => {
        setIsLoading(true);
        setError(null);

        try {
            // 1. Load Script
            const isLoaded = await loadScript();
            if (!isLoaded) {
                throw new Error("Payment SDK failed to load. Please disable ad-blocker and try again.");
            }

            // Check Key (Fail fast)
            if (!paymentConfig.razorpayKeyId) {
                throw new Error("Payment system not configured.");
            }

            // 2. Create Order
            const billingCycle = isYearly ? "yearly" : "monthly";
            const orderRes = await fetch("/api/razorpay/create-order", {
                method: "POST",
                headers: { "Content-Type": "application/json" },
                body: JSON.stringify({
                    userId,
                    billingCycle,
                }),
            });

            const orderData: RazorpayOrderResponse = await orderRes.json();

            if (!orderRes.ok) {
                throw new Error(orderData.error || "Failed to create order");
            }

            if (!orderData.orderId) {
                throw new Error("Invalid order response from server");
            }

            // 3. Open Razorpay
            const options: RazorpayOptions = {
                key: paymentConfig.razorpayKeyId,
                amount: orderData.amount,
                currency: orderData.currency,
                name: paymentConfig.companyName,
                description: `Pro Plan - ${isYearly ? "Yearly" : "Monthly"}`,
                order_id: orderData.orderId,

                handler: async (response: RazorpayHandlerResponse) => {
                    try {
                        // 4. Verify Payment
                        const verifyRes = await fetch("/api/razorpay/verify-payment", {
                            method: "POST",
                            headers: { "Content-Type": "application/json" },
                            body: JSON.stringify({
                                razorpay_order_id: response.razorpay_order_id,
                                razorpay_payment_id: response.razorpay_payment_id,
                                razorpay_signature: response.razorpay_signature,
                            })
                        });

                        const verifyData = await verifyRes.json();

                        if (!verifyRes.ok || !verifyData.success) {
                            // CRITICAL: Payment succeeded but verification failed
                            const msg = "Payment received but verification is pending. Please contact support.";
                            toast.warning(msg, { duration: 10000 });
                            console.error("Verification failed:", verifyData);
                            if (onError) onError(msg);
                            return;
                        }

                        // Success
                        toast.success("Welcome to Pro! Your subscription is active.");
                        if (onSuccess) onSuccess();

                    } catch (verificationError) {
                        console.error("Verification error:", verificationError);
                        const msg = "Payment successful, but verification failed locally. Support has been notified.";
                        toast.error(msg);
                        if (onError) onError(msg);
                    } finally {
                        setIsLoading(false);
                    }
                },

                prefill: {
                    email: email,
                },
                theme: {
                    color: "#7c3aed", // Violet-600
                },
                modal: {
                    ondismiss: () => {
                        setIsLoading(false);
                        toast.info("Payment cancelled");
                    }
                }
            };

            const rzp = new window.Razorpay(options);

            // Handle failures (Strict typing)
            rzp.on("payment.failed", function (response: RazorpayErrorResponse) {
                const msg = response.error.description || "Payment failed";
                toast.error(msg);
                setError(msg);
                if (onError) onError(msg);
                setIsLoading(false);
            });

            rzp.open();

        } catch (err) {
            console.error("Payment initiation error:", err);
            const msg = err instanceof Error ? err.message : "An unexpected error occurred";
            setError(msg);
            toast.error(msg);
            setIsLoading(false);
            if (onError) onError(msg);
        }
    }, [userId, email, onSuccess, onError]);

    return { buyPro, isLoading, error };
}
