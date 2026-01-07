import { NextRequest, NextResponse } from "next/server";
import crypto from "crypto";
import { createClient } from "@supabase/supabase-js";

// Duration mapping for calculating expiry
const DURATION_MONTHS: Record<string, number> = {
    monthly: 1,
    yearly: 12,
};

export async function POST(request: NextRequest) {
    try {
        // Check environment variables
        if (!process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay secret not configured");
            return NextResponse.json(
                { error: "Payment service not configured" },
                { status: 503 }
            );
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Supabase credentials not configured");
            return NextResponse.json(
                { error: "Database service not configured" },
                { status: 503 }
            );
        }

        // Initialize Supabase inside handler (lazy initialization)
        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const {
            razorpay_order_id,
            razorpay_payment_id,
            razorpay_signature,
        } = await request.json();

        // Verify signature
        const body = razorpay_order_id + "|" + razorpay_payment_id;
        const expectedSignature = crypto
            .createHmac("sha256", process.env.RAZORPAY_KEY_SECRET)
            .update(body)
            .digest("hex");

        if (expectedSignature !== razorpay_signature) {
            return NextResponse.json(
                { error: "Invalid payment signature" },
                { status: 400 }
            );
        }

        // Fetch trusted order details from DB
        const { data: paymentRecord, error: paymentError } = await supabaseAdmin
            .from("payments")
            .select("billing_cycle, user_id")
            .eq("razorpay_order_id", razorpay_order_id)
            .single();

        if (paymentError || !paymentRecord) {
            console.error("Error fetching payment record:", paymentError);
            return NextResponse.json(
                { error: "Payment record not found" },
                { status: 404 }
            );
        }

        const { billing_cycle, user_id } = paymentRecord;
        const durationMonths = DURATION_MONTHS[billing_cycle] || 1;

        // Fetch current subscription to handle extensions
        const { data: currentSubscription } = await supabaseAdmin
            .from("subscriptions")
            .select("expires_at, status")
            .eq("user_id", user_id)
            .single();

        // Calculate new expiry date
        let baseDate = new Date(); // Start from "now" by default

        // If user has an active subscription that expires in the future, extend from that date
        if (currentSubscription?.expires_at && new Date(currentSubscription.expires_at) > baseDate) {
            baseDate = new Date(currentSubscription.expires_at);
        }

        const expiresAt = new Date(baseDate);
        expiresAt.setMonth(expiresAt.getMonth() + durationMonths);

        // Update payment record
        await supabaseAdmin
            .from("payments")
            .update({
                razorpay_payment_id,
                razorpay_signature,
                status: "captured",
            })
            .eq("razorpay_order_id", razorpay_order_id);

        // Upsert subscription
        const { error: subscriptionError } = await supabaseAdmin
            .from("subscriptions")
            .upsert(
                {
                    user_id: user_id,
                    plan: "pro",
                    billing_cycle: billing_cycle,
                    status: "active",
                    started_at: new Date().toISOString(),
                    expires_at: expiresAt.toISOString(),
                    updated_at: new Date().toISOString(),
                },
                {
                    onConflict: "user_id",
                }
            );

        if (subscriptionError) {
            console.error("Error updating subscription:", subscriptionError);
            return NextResponse.json(
                { error: "Failed to update subscription" },
                { status: 500 }
            );
        }

        return NextResponse.json({
            success: true,
            message: "Payment verified and subscription activated",
            expiresAt: expiresAt.toISOString(),
        });
    } catch (error) {
        console.error("Error verifying payment:", error);
        return NextResponse.json(
            { error: "Failed to verify payment" },
            { status: 500 }
        );
    }
}
