import React, { useEffect, useState } from "react";
import { PayPalScriptProvider, PayPalButtons } from "@paypal/react-paypal-js";

const PayPalCheckout = ({ amount, onApprove }) => {
    const [usdAmount, setUsdAmount] = useState(null);
    const [loading, setLoading] = useState(true);

    useEffect(() => {
        const fetchExchangeRate = async () => {
            try {
                const res = await fetch('https://v6.exchangerate-api.com/v6/f2681ad79c8a18b219c57423/latest/KRW');
                const data = await res.json();

                if (data.result !== 'success') throw new Error('Failed to fetch exchange rate data.');

                const rate = data.conversion_rates?.USD;
                if (!rate) throw new Error('USD rate not found in exchange data.');

                const converted = (amount * rate).toFixed(2); // KRW to USD
                setUsdAmount(converted);
                setLoading(false);
            } catch (e) {
                console.error("Exchange rate fetch failed:", e);
                alert("⚠️ Failed to load exchange rate information.");
                setUsdAmount(null);
                setLoading(false);
            }
        };

        if (amount > 0) fetchExchangeRate();
    }, [amount]);

    if (loading) return <div>💱 Calculating exchange rate...</div>;
    if (!usdAmount) return <div>❌ Failed to calculate exchange rate.</div>;

    return (
        <PayPalScriptProvider options={{ "client-id": "AQi_AJnk65vTtX_SStVX-HDGMx8AN5JzYlvBpY0oQL4rk5Zj7JfHMhIUscA7DeNZhJMrP4D-W0z2Il2a", currency: "USD" }}>
            <PayPalButtons
                style={{ layout: "vertical" }}
                createOrder={(data, actions) => {
                    return actions.order.create({
                        purchase_units: [{
                            amount: {
                                value: usdAmount,
                            },
                        }],
                    });
                }}
                onApprove={(data, actions) => {
                    return actions.order.capture().then((details) => {
                        alert(`✅ Payment completed. Thank you, ${details.payer.name.given_name}!`);
                        if (onApprove) onApprove(details);
                    });
                }}
                onError={(err) => {
                    console.error("Payment error:", err);
                    alert("❌ An error occurred during the payment process.");
                }}
            />
        </PayPalScriptProvider>
    );
};

export default PayPalCheckout;
