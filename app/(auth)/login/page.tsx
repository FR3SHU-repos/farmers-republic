// app/(auth)/login/page.tsx

// This is the login page for the application

"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { useUser } from "@/shared/context/UserContext";


export default function AuthPage() {
  const router = useRouter();
  const { login } = useUser();


  // UI state
  const [isLogin, setIsLogin] = useState(true);
  const [loading, setLoading] = useState(false);

  // Form data
  const [form, setForm] = useState({
    name: "",
    email: "",
    password: "",
    phoneNumber: "",
    type: "Farmer",
  });

  const handleChange = (e: React.ChangeEvent<HTMLInputElement | HTMLSelectElement>) => {
    setForm({ ...form, [e.target.name]: e.target.value });
  };

  // API call

const handleSubmit = async (e: React.FormEvent) => {
  e.preventDefault();
  setLoading(true);
  try {
    const res = await fetch("/api/v1/auth/login", {
      method: "POST",
      headers: { "Content-Type": "application/json" },
      body: JSON.stringify({ email: form.email, password: form.password }),
      credentials: "include", // IMPORTANT: ensures HttpOnly cookie is saved
    });

    const data = await res.json();
    console.log("login response", res.status, data);

    if (!res.ok || !data.success) {
      toast.error(data?.message || "Login failed");
      return;
    }

    // data.data or data.userData depending on your backend response shape
    // Map backend user -> ILoggedinUser
    const serverUser = data.data ?? data.userData ?? data; // try common names
    const mappedUser = {
      id: serverUser.id ?? serverUser._id ?? serverUser._id?.toString() ?? "",
      name: serverUser.name,
      email: serverUser.email,
      phoneNumber: serverUser.phoneNumber,
      type: serverUser.type,
      photo: serverUser.photo,
    };

    // Save to context + localStorage
    login(mappedUser);

    toast.success(data.message || "Welcome!");
    router.push("/"); // or /dashboard
  } catch (err) {
    console.error(err);
    toast.error("Network error");
  } finally {
    setLoading(false);
  }
};

  return (
    <div className="min-h-screen flex items-center justify-center bg-gradient-to-br from-green-50 to-green-100">
      <div className="bg-white shadow-lg rounded-2xl p-8 w-full max-w-md">
        <h2 className="text-2xl font-bold text-center text-green-700">
          {isLogin ? `🌾 ${process.env.NEXT_PUBLIC_APP_NAME} Login` : "🌱 Create an Account"}
        </h2>

        <form onSubmit={handleSubmit} className="mt-6 space-y-4">
          {!isLogin && (
            <>
              <div>
                <label className="block text-sm text-gray-600">Full Name</label>
                <input
                  type="text"
                  name="name"
                  value={form.name}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                  required
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">Phone Number</label>
                <input
                  type="tel"
                  name="phoneNumber"
                  value={form.phoneNumber}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                />
              </div>
              <div>
                <label className="block text-sm text-gray-600">User Type</label>
                <select
                  name="type"
                  value={form.type}
                  onChange={handleChange}
                  className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
                >
                  <option value="Farmer">Farmer</option>
                  <option value="Buyer">Buyer</option>
                  
                </select>
              </div>
            </>
          )}

          <div>
            <label className="block text-sm text-gray-600">Email Address</label>
            <input
              type="email"
              name="email"
              value={form.email}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <div>
            <label className="block text-sm text-gray-600">Password</label>
            <input
              type="password"
              name="password"
              value={form.password}
              onChange={handleChange}
              className="mt-1 w-full border rounded-md px-3 py-2 focus:ring-2 focus:ring-green-400 outline-none"
              required
            />
          </div>

          <button
            type="submit"
            disabled={loading}
            className="w-full bg-green-600 text-white font-semibold py-2 rounded-md hover:bg-green-700 transition disabled:opacity-60"
          >
            {loading ? "Processing..." : isLogin ? "Login" : "Register"}
          </button>
        </form>

        <p className="mt-4 text-center text-sm text-gray-600">
          Forgot your password?{" "}
          <button
            onClick={() => router.push("/forgot-password")}
            className="text-green-600 hover:underline"
          >
            Reset here
          </button><br/>
        
          {isLogin ? "Don’t have an account?" : "Already have an account?"}{" "}
          <button
            onClick={() => setIsLogin(!isLogin)}
            className="text-green-600 hover:underline"
          >
            {isLogin ? "Register here" : "Login here"}
          </button>
        </p>
      </div>
    </div>
  );
}
