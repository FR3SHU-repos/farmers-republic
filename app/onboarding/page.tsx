"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import toast from "react-hot-toast";
import { Sprout } from "lucide-react";

import { createAuthBrowserClient } from "@/shared/lib/supabase/auth-client";
import { ginFetch } from "@/shared/lib/auth/gin";
import { INPUT_CLS } from "@/shared/components/auth/parts";

const LANGUAGES = ["English", "हिन्दी", "తెలుగు", "தமிழ்", "ಕನ್ನಡ", "മലയാളം"];

export default function OnboardingPage() {
  const router = useRouter();
  const supabase = createAuthBrowserClient();

  const [options, setOptions] = useState<{ type: string; label: string }[]>([]);
  const [form, setForm] = useState({
    fullName: "",
    preferredLanguage: "English",
    accountType: "",
    location: "",
    organizationName: "",
    acceptedTerms: false,
    acceptedPrivacy: false,
  });
  const [saving, setSaving] = useState(false);

  useEffect(() => {
    (async () => {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.replace("/login?next=/onboarding");
        return;
      }
      const res = await ginFetch("/onboarding/account-types").catch(() => null);
      if (res?.ok) {
        const json = await res.json();
        const opts = (json?.data?.options ?? []) as {
          type: string;
          label: string;
        }[];
        setOptions(opts);
        setForm((f) => ({ ...f, accountType: f.accountType || opts[0]?.type || "" }));
      }
      // Already onboarded? Skip.
      const st = await ginFetch("/onboarding/status").catch(() => null);
      if (st?.ok) {
        const j = await st.json();
        if (j?.data?.onboardingComplete) router.replace("/");
      }
    })();
  }, [router, supabase]);

  const needsOrg = ["FPO"].includes(form.accountType);

  async function onSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (saving) return;
    if (!form.fullName.trim()) {
      toast.error("Please enter your full name.");
      return;
    }
    if (!form.acceptedTerms || !form.acceptedPrivacy) {
      toast.error("Please accept the terms and privacy policy.");
      return;
    }
    setSaving(true);
    const res = await ginFetch("/onboarding", {
      method: "POST",
      body: JSON.stringify(form),
    });
    setSaving(false);
    if (!res.ok) {
      const j = await res.json().catch(() => ({}));
      toast.error(j?.message || "Could not save your profile.");
      return;
    }
    toast.success("You're all set!");
    router.replace("/");
  }

  return (
    <div className="flex min-h-screen flex-col items-center justify-center bg-surface-card px-6 py-12">
      <div className="mb-6 flex items-center gap-2">
        <Sprout className="h-5 w-5 text-primary" />
        <span className="text-lg font-semibold text-foreground-heading">
          {process.env.NEXT_PUBLIC_APP_NAME || "Farmers Republic"}
        </span>
      </div>
      <div className="w-full max-w-md">
        <h2 className="text-2xl font-semibold tracking-tight text-foreground-heading">
          Tell us a bit about you
        </h2>
        <p className="mt-1.5 text-sm text-foreground-muted">
          This helps us set up the right experience for your account.
        </p>

        <form onSubmit={onSubmit} className="mt-8 space-y-4">
          <Field label="Full name">
            <input
              required
              value={form.fullName}
              onChange={(e) => setForm({ ...form, fullName: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>

          <Field label="Preferred language">
            <select
              value={form.preferredLanguage}
              onChange={(e) =>
                setForm({ ...form, preferredLanguage: e.target.value })
              }
              className={INPUT_CLS}
            >
              {LANGUAGES.map((l) => (
                <option key={l} value={l}>
                  {l}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Account type">
            <select
              required
              value={form.accountType}
              onChange={(e) =>
                setForm({ ...form, accountType: e.target.value })
              }
              className={INPUT_CLS}
            >
              <option value="" disabled>
                Select an account type
              </option>
              {options.map((o) => (
                <option key={o.type} value={o.type}>
                  {o.label}
                </option>
              ))}
            </select>
          </Field>

          <Field label="Location (city / district)">
            <input
              value={form.location}
              onChange={(e) => setForm({ ...form, location: e.target.value })}
              className={INPUT_CLS}
            />
          </Field>

          {needsOrg && (
            <Field label="Organisation name">
              <input
                value={form.organizationName}
                onChange={(e) =>
                  setForm({ ...form, organizationName: e.target.value })
                }
                className={INPUT_CLS}
              />
            </Field>
          )}

          <label className="flex items-start gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={form.acceptedTerms}
              onChange={(e) =>
                setForm({ ...form, acceptedTerms: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            I accept the Terms of Service.
          </label>
          <label className="flex items-start gap-2 text-xs text-foreground-muted">
            <input
              type="checkbox"
              checked={form.acceptedPrivacy}
              onChange={(e) =>
                setForm({ ...form, acceptedPrivacy: e.target.checked })
              }
              className="mt-0.5 h-4 w-4 rounded border-border text-primary"
            />
            I accept the Privacy Policy.
          </label>

          <button
            type="submit"
            disabled={saving}
            className="w-full rounded-full bg-primary py-3 text-sm font-semibold text-primary-foreground disabled:opacity-60"
          >
            {saving ? "Saving…" : "Continue"}
          </button>
        </form>
      </div>
    </div>
  );
}

function Field({
  label,
  children,
}: {
  label: string;
  children: React.ReactNode;
}) {
  return (
    <div>
      <label className="block text-sm font-medium text-foreground-body">
        {label}
      </label>
      {children}
    </div>
  );
}
