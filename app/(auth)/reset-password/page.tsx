"use client";

import { useState, useEffect } from "react";
import toast from "react-hot-toast";
import { useRouter } from "next/navigation";
import { ArrowLeft, KeyRound, Sprout } from "lucide-react";

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function ResetPasswordPage() {
  const router = useRouter();

  const [form, setForm] = useState({
    email: "",
    otp: "",
    password: "",
    confirmPassword: "",
  });
  const [loading, setLoading] = useState(false);

  // Pre-fill email from the URL query param (?email=...)
  useEffect(() => {
    const params = new URLSearchParams(window.location.search);
    const emailParam = params.get("email");
    if (emailParam) setForm((f) => ({ ...f, email: emailParam }));
  }, []);

  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) =>
    setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.SyntheticEvent) => {
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
        toast.error(data?.message || data?.error || "Failed to reset password");
        return;
      }
      toast.success("Password reset successful. Please sign in.");
      router.push("/login");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="flex min-h-screen items-center justify-center bg-surface px-6 py-12">
      <div className="w-full max-w-sm">
        {/* Logo */}
        <div className="mb-8 flex items-center gap-2">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground-heading">
            {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
          </span>
        </div>

        <div className="rounded-2xl border border-border bg-surface-card p-8 shadow-sm">
          {/* Icon */}
          <div className="flex h-12 w-12 items-center justify-center rounded-2xl bg-secondary-subtle">
            <KeyRound className="h-6 w-6 text-primary" />
          </div>

          <h1 className="mt-5 text-xl font-semibold tracking-tight text-foreground-heading">
            Reset your password
          </h1>
          <p className="mt-1.5 text-sm text-foreground-muted">
            Enter the OTP sent to your email and choose a new password.
          </p>

          <form onSubmit={handleSubmit} className="mt-6 space-y-4">
            <div>
              <label className="block text-sm font-medium text-foreground-body">
                Email Address
              </label>
              <input
                name="email"
                value={form.email}
                onChange={handleChange}
                type="email"
                placeholder="you@example.com"
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-body">
                OTP Code
              </label>
              <input
                name="otp"
                value={form.otp}
                onChange={handleChange}
                type="text"
                inputMode="numeric"
                pattern="\d{6}"
                placeholder="123456"
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-body">
                New Password
              </label>
              <input
                name="password"
                value={form.password}
                onChange={handleChange}
                type="password"
                placeholder="Min. 8 characters"
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <label className="block text-sm font-medium text-foreground-body">
                Confirm New Password
              </label>
              <input
                name="confirmPassword"
                value={form.confirmPassword}
                onChange={handleChange}
                type="password"
                placeholder="••••••••"
                className={INPUT_CLASS}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Resetting…" : "Reset Password"}
            </button>
          </form>
        </div>

        <button
          onClick={() => router.push("/login")}
          className="mt-6 flex w-full items-center justify-center gap-1.5 text-sm text-foreground-muted transition hover:text-foreground-body"
        >
          <ArrowLeft className="h-4 w-4" />
          Back to sign in
        </button>
      </div>
    </div>
  );
}
