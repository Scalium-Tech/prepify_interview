import { NextRequest, NextResponse } from "next/server";
import Razorpay from "razorpay";
import { createClient } from "@supabase/supabase-js";

// Pricing configuration (amounts in paise)
const PRICING = {
    monthly: { amount: 79900, duration: 1 }, // ₹799.00
    yearly: { amount: 729900, duration: 12 }, // ₹7,299.00
};

export async function POST(request: NextRequest) {
    try {
        // Check environment variables
        if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
            console.error("Razorpay credentials not configured");
            return NextResponse.json(
                { error: "Payment service not configured. Please contact support." },
                { status: 503 }
            );
        }

        if (!process.env.NEXT_PUBLIC_SUPABASE_URL || !process.env.SUPABASE_SERVICE_ROLE_KEY) {
            console.error("Supabase credentials not configured");
            return NextResponse.json(
                { error: "Database service not configured. Please contact support." },
                { status: 503 }
            );
        }

        // Initialize clients inside handler (lazy initialization)
        const razorpay = new Razorpay({
            key_id: process.env.RAZORPAY_KEY_ID,
            key_secret: process.env.RAZORPAY_KEY_SECRET,
        });

        const supabaseAdmin = createClient(
            process.env.NEXT_PUBLIC_SUPABASE_URL,
            process.env.SUPABASE_SERVICE_ROLE_KEY
        );

        const { billingCycle, userId } = await request.json();

        console.log("Creating order for:", { billingCycle, userId });

        // Validate billing cycle
        if (!billingCycle || !PRICING[billingCycle as keyof typeof PRICING]) {
            return NextResponse.json(
                { error: "Invalid billing cycle selected" },
                { status: 400 }
            );
        }

        if (!userId) {
            return NextResponse.json(
                { error: "Please login to continue" },
                { status: 401 }
            );
        }

        // Idempotency: Check if user is already Pro
        const { data: existingSub } = await supabaseAdmin
            .from("subscriptions")
            .select("status, expires_at")
            .eq("user_id", userId)
            .eq("status", "active")
            .single();

        if (existingSub) {
            if (new Date(existingSub.expires_at) > new Date()) {
                return NextResponse.json(
                    { error: "You already have an active Pro subscription." },
                    { status: 409 }
                );
            }
        }

        const pricing = PRICING[billingCycle as keyof typeof PRICING];

        // Create Razorpay order
        console.log("Creating Razorpay order with amount:", pricing.amount);

        let order;
        try {
            order = await razorpay.orders.create({
                amount: pricing.amount,
                currency: "INR",
                receipt: `preply_${userId.substring(0, 8)}_${Date.now()}`,
                notes: {
                    userId,
                    billingCycle,
                    plan: "pro",
                },
            });
        } catch (razorpayError: any) {
            console.error("Razorpay order creation failed:", razorpayError);
            return NextResponse.json(
                { error: `Razorpay error: ${razorpayError.error?.description || razorpayError.message || "Unknown error"}` },
                { status: 500 }
            );
        }

        console.log("Order created:", order.id);

        // Create payment record in Supabase
        try {
            await supabaseAdmin.from("payments").insert({
                user_id: userId,
                plan: "pro",
                billing_cycle: billingCycle,
                amount: pricing.amount,
                razorpay_order_id: order.id,
                status: "created",
            });
        } catch (dbError) {
            console.error("Failed to save payment record (non-critical):", dbError);
            // Don't fail the order creation if DB insert fails
        }

        return NextResponse.json({
            orderId: order.id,
            amount: pricing.amount,
            currency: "INR",
            keyId: process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID,
        });
    } catch (error: any) {
        console.error("Error creating order:", error);
        return NextResponse.json(
            { error: error.message || "Failed to create order. Please try again." },
            { status: 500 }
        );
    }
}
