// This is for forgot pwd page for the application

"use client";

import { useState, useEffect } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";

export default function ForgotPasswordPage() {
  const router = useRouter();
  const [email, setEmail] = useState("");
  const [loading, setLoading] = useState(false);
  const [cooldown, setCooldown] = useState(0);
  const COOLDOWN_SECS = 60;

  useEffect(() => {
    let t: NodeJS.Timeout;
    if (cooldown > 0) {
      t = setTimeout(() => setCooldown((c) => c - 1), 1000);
    }
    return () => clearTimeout(t);
  }, [cooldown]);

  function validateEmail(e: string) {
    return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(e);
  }

  async function sendOtp(e?: React.FormEvent) {
    e?.preventDefault();
    if (!validateEmail(email)) {
      toast.error("Please enter a valid email address.");
      return;
    }
    if (cooldown > 0) {
      toast.error(`Please wait ${cooldown}s before resending.`);
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/send-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ email }),
      });

      const json = await res.json().catch(() => ({}));

      if (!res.ok) {
        toast.error(json?.error || "Failed to send OTP. Try again later.");
        return;
      }

      toast.success("OTP sent. Check your inbox (and spam).");
      setCooldown(COOLDOWN_SECS);

      // navigate to reset page (user will enter OTP + new password)
      // change path if your reset page route is different
      router.push(`/reset-password?email=${encodeURIComponent(email)}`);
    } catch (err) {
      console.error("send-reset-otp error:", err);
      toast.error("Network error. Try again.");
    } finally {
      setLoading(false);
    }
  }

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100 p-6">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700">Forgot Password</h2>

        <form onSubmit={sendOtp} className="mt-6 space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email Address</label>
            <input
              type="email"
              name="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Sending..." : "Send OTP"}
          </button>
        </form>

        <div className="mt-4 flex items-center justify-between text-sm text-gray-600">
          <button
            onClick={() => sendOtp()}
            disabled={loading || cooldown > 0}
            className="text-green-600 hover:underline disabled:opacity-40"
          >
            {cooldown > 0 ? `Resend OTP (${cooldown}s)` : "Resend OTP"}
          </button>

          <button
            onClick={() => router.push("/auth/login")}
            className="text-green-600 hover:underline"
          >
            Back to login
          </button>
        </div>

        <p className="mt-4 text-xs text-gray-500">
          After receiving the OTP, you'll be redirected to the Reset Password page to enter the code and set a new password.
        </p>
      </div>
    </div>
  );
}
