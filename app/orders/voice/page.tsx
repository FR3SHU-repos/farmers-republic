// This is for listing and creating voice orders

// app/orders/voice/page.tsx
"use client";

import { FormEvent, useEffect, useState } from "react";
import { useSpeechToText } from "@/shared/hooks/useSpeechToText";

type FormState = {
  name: string;
  phone: string;
  email: string;
  address: string;
  city: string;
};

const initialState: FormState = {
  name: "",
  phone: "",
  email: "",
  address: "",
  city: "",
};

export default function VoiceFormPage() {
  const [form, setForm] = useState<FormState>(initialState);
  const [loadingAgent, setLoadingAgent] = useState(false);
  const [agentMessage, setAgentMessage] = useState("");
  const { isListening, transcript, startListening, stopListening } =
    useSpeechToText();

  // When transcript is ready, send to backend
  useEffect(() => {
    const run = async () => {
      if (!transcript || isListening) return;
      setLoadingAgent(true);
      setAgentMessage("Got it, understanding your details…");

      try {
        const res = await fetch("/api/v1/orders/voice", {
          method: "POST",
          headers: { "Content-Type": "application/json" },
          body: JSON.stringify({ transcript }),
        });

        const json = await res.json();
        if (!res.ok) throw new Error(json.error || "Error");

        setForm((prev) => ({
          ...prev,
          ...json.data,
        }));

        setAgentMessage(
          "I filled the form based on what you said. Please check once."
        );

        // Optional: speak it out loud
        if (typeof window !== "undefined" && "speechSynthesis" in window) {
          const msg = new SpeechSynthesisUtterance(
            "I have filled your details. Please review and submit."
          );
          window.speechSynthesis.speak(msg);
        }
      } catch (e: any) {
        console.error(e);
        setAgentMessage("Sorry, I couldn't understand. Please try again.");
      } finally {
        setLoadingAgent(false);
      }
    };

    run();
  }, [transcript, isListening]);

  const handleChange = (
    e: React.ChangeEvent<HTMLInputElement | HTMLTextAreaElement>
  ) => {
    const { name, value } = e.target;
    setForm((prev) => ({ ...prev, [name]: value }));
  };

  const handleSubmit = (e: FormEvent) => {
    e.preventDefault();
    console.log("Submit form", form);
    // TODO: send voice order to backend
  };

  return (
    <div className="min-h-screen bg-stone-50 text-stone-800 pb-20">
      <main className="max-w-3xl mx-auto px-4 sm:px-6 lg:px-8 py-8">
        {/* Card wrapper – similar to product/profile pages */}
        <div className="bg-white rounded-2xl shadow-sm border border-stone-100 p-6 sm:p-8">
          <div className="flex items-center justify-between gap-3">
            <div>
              <h1 className="text-2xl sm:text-3xl font-bold text-stone-900">
                Voice Order Form
              </h1>
              <p className="mt-1 text-sm text-stone-500">
                Speak your details and we’ll fill the form for you ✨
              </p>
            </div>

            <span className="hidden sm:inline-flex items-center gap-2 text-xs px-3 py-1 rounded-full bg-green-50 text-green-700 border border-green-100">
              Beta
            </span>
          </div>

          {/* Voice button + status */}
          <div className="mt-6 flex flex-col gap-3 sm:flex-row sm:items-center sm:justify-between">
            <button
              type="button"
              onClick={isListening ? stopListening : startListening}
              className="inline-flex items-center gap-2 rounded-full bg-green-600 text-white px-5 py-2.5 text-sm font-medium shadow-sm hover:bg-green-700 transition-colors"
            >
              {isListening ? "Stop Listening" : "Speak to Fill Form"}
              <span
                className={
                  "text-lg " + (isListening ? "animate-pulse" : "animate-none")
                }
              >
                🎤
              </span>
            </button>

            <div className="text-xs text-stone-500">
              {isListening ? (
                <span className="inline-flex items-center gap-1">
                  <span className="w-2 h-2 rounded-full bg-green-500 animate-pulse" />
                  Listening…
                </span>
              ) : transcript ? (
                "Captured your voice. Processing…"
              ) : (
                "Tap the mic and speak your name, phone, address, city, etc."
              )}
            </div>
          </div>

          {/* Transcript preview */}
          {transcript && (
            <div className="mt-4 rounded-xl bg-stone-50 border border-stone-100 px-4 py-3 text-xs text-stone-600">
              <span className="font-semibold text-stone-700">You said: </span>
              <span className="italic">{transcript}</span>
            </div>
          )}

          {/* Agent message */}
          {agentMessage && (
            <p className="mt-3 text-sm text-stone-700 flex items-center gap-2">
              <span>🤖</span>
              <span>
                {agentMessage}
                {loadingAgent && (
                  <span className="text-stone-400"> (thinking…)</span>
                )}
              </span>
            </p>
          )}

          {/* Form */}
          <form onSubmit={handleSubmit} className="mt-6 grid gap-4">
            <div>
              <label className="block text-xs font-medium text-stone-500">
                Name
              </label>
              <input
                name="name"
                value={form.name}
                onChange={handleChange}
                placeholder="Full name"
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500">
                  Phone
                </label>
                <input
                  name="phone"
                  value={form.phone}
                  onChange={handleChange}
                  placeholder="10-digit mobile number"
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>

              <div>
                <label className="block text-xs font-medium text-stone-500">
                  Email
                </label>
                <input
                  name="email"
                  value={form.email}
                  onChange={handleChange}
                  placeholder="you@example.com"
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div>
              <label className="block text-xs font-medium text-stone-500">
                Address
              </label>
              <textarea
                name="address"
                value={form.address}
                onChange={handleChange}
                placeholder="House no, street, area"
                rows={3}
                className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
              />
            </div>

            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label className="block text-xs font-medium text-stone-500">
                  City
                </label>
                <input
                  name="city"
                  value={form.city}
                  onChange={handleChange}
                  placeholder="Eg: Vizag"
                  className="mt-1 w-full border border-stone-200 rounded-xl px-3 py-2.5 text-sm focus:outline-none focus:ring-2 focus:ring-green-500 focus:border-green-500"
                />
              </div>
            </div>

            <div className="pt-2 flex flex-col sm:flex-row gap-3 sm:items-center sm:justify-between">
              <p className="text-xs text-stone-400">
                Review your details before submitting. You can edit anything
                the assistant filled in.
              </p>

              <button
                type="submit"
                className="inline-flex justify-center items-center rounded-full bg-green-600 text-white px-6 py-2.5 text-sm font-semibold shadow-sm hover:bg-green-700 transition-colors"
              >
                Submit Order
              </button>
            </div>
          </form>
        </div>
      </main>
    </div>
  );
}

