"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/shared/context/UserContext";
import {
  ArrowLeft,
  BadgeCheck,
  ChevronDown,
  Leaf,
  ShieldCheck,
  Sprout,
  Users,
} from "lucide-react";

const BENEFITS = [
  { icon: Users, text: "Connect directly with local farmers" },
  { icon: Leaf, text: "Discover fresh seasonal produce" },
  { icon: ShieldCheck, text: "Trusted community marketplace" },
  { icon: BadgeCheck, text: "Support farmers in your region" },
];

const INPUT_CLASS =
  "mt-1.5 w-full rounded-xl border border-border bg-background px-4 py-2.5 text-sm text-foreground-heading placeholder:text-foreground-muted outline-none transition focus:border-primary focus:ring-4 focus:ring-primary/10";

export default function AuthPage() {
  const router = useRouter();
  const { login } = useUser();
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    type: "Farmer",
  });

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>
  ) => setForm({ ...form, [e.target.name]: e.target.value });

  const handleSubmit = async (e: React.SyntheticEvent) => {
    e.preventDefault();
    setLoading(true);
    try {
      const endpoint = isLogin ? "/api/v1/auth/login" : "/api/v1/auth/register";
      const body = isLogin
        ? { email: form.email, password: form.password }
        : {
            name: form.name,
            email: form.email,
            password: form.password,
            phoneNumber: form.phoneNumber,
            type: form.type,
          };

      const res = await fetch(endpoint, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(body),
        credentials: "include",
      });
      const data = await res.json();

      if (!res.ok || !data.success) {
        toast.error(
          data?.message || (isLogin ? "Login failed" : "Registration failed")
        );
        return;
      }

      const u = data.data ?? data.userData ?? data;
      login({
        id: u.id ?? u._id ?? "",
        name: u.name,
        email: u.email,
        phoneNumber: u.phoneNumber,
        type: u.type,
        photo: u.photo,
      });
      toast.success(data.message || (isLogin ? "Welcome!" : "Account created!"));
      router.push("/");
    } catch {
      toast.error("Network error");
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="min-h-screen lg:grid lg:grid-cols-2">
      {/* ── Left: Brand panel ─────────────────────────── */}
      <div className="hidden lg:flex flex-col justify-between bg-primary-hover px-12 py-10 text-primary-foreground">
        <div className="flex items-center gap-2.5">
          <Sprout className="h-6 w-6 text-secondary" />
          <span className="text-xl font-semibold tracking-tight">
            {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
          </span>
        </div>

        <div>
          <h1 className="text-4xl font-semibold leading-[1.08] tracking-tight">
            Food that feels
            <br />
            closer to the farm.
          </h1>
          <p className="mt-4 max-w-sm text-base leading-7 text-primary-foreground/70">
            Discover farmers by what they grow, build trust before you buy, and
            keep your kitchen connected to fresh seasonal produce.
          </p>
          <ul className="mt-10 space-y-4">
            {BENEFITS.map(({ icon: Icon, text }) => (
              <li
                key={text}
                className="flex items-center gap-3 text-sm text-primary-foreground/80"
              >
                <span className="flex h-8 w-8 flex-shrink-0 items-center justify-center rounded-full bg-secondary/15">
                  <Icon className="h-4 w-4 text-secondary" />
                </span>
                {text}
              </li>
            ))}
          </ul>
        </div>

        <div className="rounded-2xl border border-primary-foreground/20 bg-primary-foreground/10 p-4">
          <p className="text-sm font-semibold">Direct from farmers</p>
          <p className="mt-1 text-sm leading-6 text-primary-foreground/70">
            Better discovery for buyers, more predictable demand for farmers.
          </p>
        </div>
      </div>

      {/* ── Right: Form panel ─────────────────────────── */}
      <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12 lg:px-12">
        {/* Mobile logo */}
        <div className="mb-8 flex items-center gap-2 lg:hidden">
          <Sprout className="h-5 w-5 text-primary" />
          <span className="text-lg font-semibold text-foreground-heading">
            {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
          </span>
        </div>

        <div className="w-full max-w-sm">
          <h2 className="text-2xl font-semibold tracking-tight text-foreground-heading">
            {isLogin ? "Welcome back" : "Create an account"}
          </h2>
          <p className="mt-1.5 text-sm text-foreground-muted">
            {isLogin
              ? "Sign in to continue to your account"
              : "Join the farming community today"}
          </p>

          <form onSubmit={handleSubmit} className="mt-8 space-y-4">
            {!isLogin && (
              <>
                <div>
                  <label className="block text-sm font-medium text-foreground-body">
                    Full Name
                  </label>
                  <input
                    type="text"
                    name="name"
                    value={form.name}
                    onChange={handleChange}
                    placeholder="Your full name"
                    className={INPUT_CLASS}
                    required
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-body">
                    Phone Number
                  </label>
                  <input
                    type="tel"
                    name="phoneNumber"
                    value={form.phoneNumber}
                    onChange={handleChange}
                    placeholder="+91 00000 00000"
                    className={INPUT_CLASS}
                  />
                </div>

                <div>
                  <label className="block text-sm font-medium text-foreground-body">
                    I am a
                  </label>
                  <div className="relative">
                    <select
                      name="type"
                      value={form.type}
                      onChange={handleChange}
                      className={INPUT_CLASS + " appearance-none pr-10"}
                    >
                      <option value="Farmer">Farmer</option>
                      <option value="Buyer">Buyer</option>
                      <option value="Logistics Provider">Delivery Person</option>
                      <option value="FPO">FPO (Farmer Producer Organisation)</option>
                    </select>
                    <ChevronDown className="pointer-events-none absolute right-3 top-1/2 h-4 w-4 -translate-y-1/2 text-foreground-muted" />
                  </div>
                </div>
              </>
            )}

            <div>
              <label className="block text-sm font-medium text-foreground-body">
                Email Address
              </label>
              <input
                type="email"
                name="email"
                value={form.email}
                onChange={handleChange}
                placeholder="you@example.com"
                className={INPUT_CLASS}
                required
              />
            </div>

            <div>
              <div className="flex items-center justify-between">
                <label className="block text-sm font-medium text-foreground-body">
                  Password
                </label>
                {isLogin && (
                  <button
                    type="button"
                    onClick={() => router.push("/forgot-password")}
                    className="text-xs font-medium text-primary hover:underline"
                  >
                    Forgot password?
                  </button>
                )}
              </div>
              <input
                type="password"
                name="password"
                value={form.password}
                onChange={handleChange}
                placeholder="••••••••"
                className={INPUT_CLASS}
                required
              />
            </div>

            <button
              type="submit"
              disabled={loading}
              className="mt-2 w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground shadow-lg shadow-primary/20 transition hover:bg-primary-hover disabled:opacity-60"
            >
              {loading ? "Processing…" : isLogin ? "Sign in" : "Create account"}
            </button>
          </form>

          <p className="mt-6 text-center text-sm text-foreground-muted">
            {isLogin ? "Don't have an account?" : "Already have an account?"}{" "}
            <button
              onClick={() => setIsLogin(!isLogin)}
              className="font-medium text-primary hover:underline"
            >
              {isLogin ? "Register here" : "Sign in"}
            </button>
          </p>

          <div className="mt-8">
            <button
              onClick={() => router.push("/")}
              className="flex w-full items-center justify-center gap-1.5 text-xs text-foreground-muted transition hover:text-foreground-body"
            >
              <ArrowLeft className="h-3.5 w-3.5" />
              Back to home
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
