import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/shared/components/legal/LegalPage";

export const metadata = {
  title: "Terms & Conditions | FR3SH",
  description:
    "Terms for using the FR3SH and Farmers Republic organic produce marketplace.",
};

export default function TermsPage() {
  return (
    <LegalPage
      title="Terms & Conditions"
      description="These terms govern access to FR3SH / Farmers Republic, including the website, mobile app, farmer and vendor tools, customer accounts, orders, payments, subscriptions, referrals, community groups, and support channels."
      updated="16 June 2026"
    >
      <LegalSection title="Platform Owner">
        <p>
          FR3SH and Farmers Republic are operated by Varmtech, with registered
          office at Door No 405, Revenue Ward 5, Narayana Sanidhi Madhurawada,
          Madhurawada, Vishakhapatnam, India. The platform is available at{" "}
          <a className="text-emerald-800 underline" href="https://fr3sh.in">
            https://fr3sh.in
          </a>{" "}
          and through the FR3SH mobile app.
        </p>
        <p>
          By using the platform, you agree to these Terms, the{" "}
          <Link className="text-emerald-800 underline" href="/privacy">
            Privacy Policy
          </Link>
          , and transaction policies such as shipping, return, and refund
          policies where applicable.
        </p>
      </LegalSection>

      <LegalSection title="Marketplace Role">
        <p>
          FR3SH is an organic and natural products marketplace that helps
          customers discover and buy from farmers, vendors, farmer producer
          organisations, and related fulfilment partners. Product availability,
          harvest timing, delivery slots, and prices may change because fresh
          produce is seasonal and perishable.
        </p>
        <p>
          We may facilitate listings, discovery, ordering, payments, support,
          delivery coordination, wallet activity, subscriptions, referrals, and
          community orders. We may also remove, edit, or reject listings or
          content that is inaccurate, unsafe, unlawful, misleading, or contrary
          to these Terms.
        </p>
      </LegalSection>

      <LegalSection title="Accounts and Verification">
        <LegalList
          items={[
            "You must provide accurate account, contact, delivery, farm, business, and payment information.",
            "You are responsible for activity under your account and for keeping your device, email, mobile number, and login access secure.",
            "We may use OTP, email, mobile verification, profile review, KYC, or manual checks before allowing sensitive account, farmer, vendor, wallet, or order actions.",
            "We may suspend or restrict accounts that appear fraudulent, unsafe, inactive, abusive, or in violation of these Terms.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Customer Orders, Payments, and Delivery">
        <p>
          When you place an order, you authorise FR3SH and its fulfilment
          partners to process the order, share necessary details with the
          farmer/vendor/delivery partner, collect payment, and contact you about
          fulfilment. Orders may be modified, delayed, substituted, cancelled,
          or refunded if products are unavailable, quality checks fail, delivery
          is not serviceable, payment fails, or fraud checks require action.
        </p>
        <p>
          Prices, taxes, delivery fees, offers, wallet balances, subscriptions,
          and payment methods shown in the app or website are subject to final
          confirmation at checkout. FR3SH does not ask for UPI PINs, card PINs,
          banking passwords, or OTPs outside official payment and verification
          flows.
        </p>
      </LegalSection>

      <LegalSection title="Farmers, Vendors, and Listed Content">
        <LegalList
          items={[
            "Farmers and vendors must list only lawful products they are authorised to sell and must keep prices, stock, quality, location, and fulfilment details accurate.",
            "Organic, natural, certification, health, origin, pesticide-free, or similar claims must be truthful and backed by records where required.",
            "Uploaded photos, descriptions, farm names, community content, and product details must not infringe third-party rights or mislead customers.",
            "Farmers and vendors grant FR3SH a licence to host, display, edit for formatting, translate, promote, and use submitted marketplace content for operating and marketing the platform.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Community and User Content">
        <p>
          Some features may allow users to create community groups, order notes,
          support messages, farmer profiles, listings, or other content. You
          must not post illegal, abusive, hateful, sexually explicit,
          misleading, infringing, unsafe, spam, or fraudulent content. We may
          moderate, remove, restrict, or report content and accounts where
          needed to protect users and comply with law.
        </p>
        <p>
          Report content, safety, or intellectual property concerns at{" "}
          <a className="text-emerald-800 underline" href="mailto:hello@farmers-republic.com">
            hello@farmers-republic.com
          </a>
          .
        </p>
      </LegalSection>

      <LegalSection title="Subscriptions, Wallet, Referrals, and Offers">
        <p>
          FR3SH may offer service memberships, wallet features, referral
          rewards, credits, badges, discounts, or promotional offers. These are
          subject to eligibility, fraud checks, serviceability, expiry dates,
          and the specific terms shown in the app or website. Credits and
          benefits are not cash unless expressly required by law or stated by
          FR3SH.
        </p>
      </LegalSection>

      <LegalSection title="Intellectual Property and Content Rights">
        <p>
          FR3SH, Farmers Republic, logos, interface designs, software,
          documentation, and platform content created by us are owned by or
          licensed to us. User, farmer, and vendor content remains owned by the
          submitting party or its rights holder, subject to the marketplace
          licence described above.
        </p>
        <p>
          For our content rights and reporting process, see{" "}
          <Link className="text-emerald-800 underline" href="/content-rights">
            Content Rights
          </Link>
          .
        </p>
      </LegalSection>

      <LegalSection title="Disclaimers and Liability">
        <p>
          FR3SH works to keep marketplace information accurate, but fresh
          product availability, quality, harvest timelines, delivery estimates,
          and third-party services can change. To the fullest extent permitted
          by law, FR3SH is not liable for indirect, incidental, consequential,
          or punitive damages arising from use of the platform.
        </p>
        <p>
          Product information on FR3SH is not medical advice. Customers should
          use their own judgement for allergies, dietary restrictions, health
          conditions, and household suitability.
        </p>
      </LegalSection>

      <LegalSection title="Termination, Governing Law, and Contact">
        <p>
          We may suspend, terminate, or restrict access where necessary to
          protect users, comply with law, prevent abuse, or enforce these Terms.
          These Terms are governed by the laws of India, and disputes are
          subject to courts in Vishakhapatnam, Andhra Pradesh, unless applicable
          law requires otherwise.
        </p>
        <p>
          Contact us at{" "}
          <a className="text-emerald-800 underline" href="mailto:hello@farmers-republic.com">
            hello@farmers-republic.com
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
