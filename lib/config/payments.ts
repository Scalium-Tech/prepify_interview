export const paymentConfig = {
    get razorpayKeyId() {
        const key = process.env.NEXT_PUBLIC_RAZORPAY_KEY_ID;
        if (!key) {
            throw new Error("Payment configuration missing: NEXT_PUBLIC_RAZORPAY_KEY_ID is not set");
        }
        return key;
    },

    currency: "INR",
    companyName: "Preply",

    plans: {
        monthly: {
            amount: 799,
            id: "pro_monthly",
        },
        yearly: {
            amount: 7299,
            id: "pro_yearly",
        }
    }
};
