// app/(auth)/reset-password/page.tsx

"use client";

import { useState } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!form.email || !form.otp || !form.password || !form.confirmPassword) {
      toast.error("Please fill all fields");
      return;
    }
    if (form.password !== form.confirmPassword) {
      toast.error("Passwords do not match");
      return;
    }
    if (form.password.length < 8) {
      toast.error("Password must be at least 8 characters");
      return;
    }

    setLoading(true);
    try {
      const res = await fetch("/api/v1/auth/verify-reset-otp", {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({
          email: form.email.trim().toLowerCase(),
          otp: form.otp.trim(),
          newPassword: form.password,
        }),
      });

      const data = await res.json();
      if (!res.ok) {
        toast.error(data?.error || "Failed to reset password");
        return;
      }

      toast.success("Password reset successful. Please login.");
      router.push("/login"); // adjust route if different
    } catch (err) {
      console.error(err);
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-green-50 p-6">
      <div className="w-full max-w-md bg-white rounded-2xl p-6 shadow">
        <h2 className="text-2xl font-bold text-center text-green-700 mb-4">Reset Password</h2>

        <form onSubmit={handleSubmit} className="space-y-4">
          <div>
            <label className="block text-sm text-gray-600">Email</label>
            <input
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              type="email"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">OTP</label>
            <input
              name="otp"
              value={form.otp}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              type="text"
              inputMode="numeric"
              pattern="\d{6}"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">New password</label>
            <input
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              type="password"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Confirm new password</label>
            <input
              name="confirmPassword"
              value={form.confirmPassword}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2"
              type="password"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md"
          >
            {loading ? "Processing..." : "Reset Password"}
          </button>
        </form>
      </div>
    </div>
  );
}
