import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/shared/components/legal/LegalPage";

export const metadata = {
  title: "Privacy Policy | FR3SH",
  description:
    "Privacy policy for the FR3SH and Farmers Republic organic produce marketplace.",
};

export default function PrivacyPolicyPage() {
  return (
    <LegalPage
      title="Privacy Policy"
      description="This policy explains how FR3SH / Farmers Republic collects, uses, stores, and shares information when customers, farmers, vendors, delivery partners, and visitors use our website, mobile app, marketplace, and support channels."
      updated="16 June 2026"
    >
      <LegalSection title="Who We Are">
        <p>
          FR3SH and Farmers Republic are operated by Varmtech, with registered
          office at Door No 405, Revenue Ward 5, Narayana Sanidhi Madhurawada,
          Madhurawada, Vishakhapatnam, India. In this policy, "FR3SH", "Farmers
          Republic", "we", "us", and "our" refer to the marketplace available at{" "}
          <a className="text-emerald-800 underline" href="https://fr3sh.in">
            https://fr3sh.in
          </a>
          , the FR3SH mobile app, and related services.
        </p>
        <p>
          The service is focused on India and helps customers discover farmers,
          farmer producer organisations, natural and organic products, harvests,
          orders, wallets, subscriptions, referrals, and community group buying.
        </p>
      </LegalSection>

      <LegalSection title="Information We Collect">
        <LegalList
          items={[
            <>
              <strong>Account and contact details:</strong> name, email address,
              mobile number, account role, login tokens, verification status,
              and hashed password or OTP verification records where applicable.
            </>,
            <>
              <strong>OTP and authentication data:</strong> one-time password
              delivery and verification records used to secure sign-in, password
              reset, mobile/email verification, and abuse prevention.
            </>,
            <>
              <strong>Customer and order details:</strong> cart contents,
              products ordered, delivery address, city, pincode, order notes,
              order status, payment method, totals, invoices, refunds, wallet
              activity, referrals, and subscription status.
            </>,
            <>
              <strong>Farmer, vendor, and delivery partner details:</strong>{" "}
              profile information, phone number, email, farm or business name,
              village, district, pickup location, crops, harvests, product
              listings, pricing, availability, KYC or verification details if
              submitted, and order fulfilment information.
            </>,
            <>
              <strong>Product, farm, and profile content:</strong> photos,
              product descriptions, certifications, community group details,
              support attachments, and other content that users or authorised
              team members upload to the platform.
            </>,
            <>
              <strong>Payment and transaction records:</strong> payment status,
              payment reference, selected payment mode, wallet transactions, and
              records needed for order fulfilment and accounting. We do not
              intentionally store full card numbers, banking passwords, UPI PINs,
              or similar sensitive payment credentials.
            </>,
            <>
              <strong>Support and communications:</strong> emails, support
              requests, data deletion requests, intellectual property reports,
              order issue reports, and messages we send for OTPs, account
              activity, order updates, and service notices.
            </>,
            <>
              <strong>Technical and security data:</strong> IP address, browser
              or app version, device type, server logs, error logs, rate-limit
              signals, cookie/local storage data on the web, and AsyncStorage
              data on the mobile app such as auth tokens, saved user profile,
              and cart data.
            </>,
            <>
              <strong>Voice order data on the web, when used:</strong> spoken or
              typed order text may be transcribed and processed to convert a
              natural-language order into structured order items.
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="How We Use Information">
        <LegalList
          items={[
            "Create and manage customer, farmer, vendor, delivery, and admin accounts.",
            "Verify users with OTPs, maintain sessions, reset passwords, and prevent unauthorised access.",
            "Display farmer profiles, product listings, harvests, FPOs, community groups, and marketplace content.",
            "Process carts, orders, payments, wallet transactions, subscriptions, referrals, prebookings, delivery tracking, cancellations, and refunds.",
            "Share order and delivery information with farmers, vendors, delivery partners, payment partners, and support teams as needed to complete a transaction.",
            "Send transactional messages such as OTPs, order confirmations, order status updates, support replies, and service notices.",
            "Operate analytics, dashboards, reporting, fraud prevention, rate limiting, debugging, security monitoring, and legal compliance.",
            "Improve marketplace quality, product availability, farmer discovery, customer support, and platform reliability.",
          ]}
        />
      </LegalSection>

      <LegalSection title="How We Share Information">
        <p>
          We share information only as needed to operate the marketplace, comply
          with law, protect users, or provide requested services. Examples
          include:
        </p>
        <LegalList
          items={[
            "Farmers, vendors, FPOs, delivery partners, and fulfilment partners who need order, pickup, delivery, or customer contact details to complete a transaction.",
            "Payment service providers and financial partners that process payments, refunds, wallet activity, and transaction verification.",
            "Cloud hosting, database, storage, email, queue, security, logging, and infrastructure providers that help us run FR3SH.",
            "AI or transcription service providers when a user chooses voice order features that require parsing speech or order text.",
            "Professional advisors, authorities, or courts where required to comply with applicable law, enforce our terms, respond to lawful requests, or protect rights and safety.",
          ]}
        />
        <p>
          We do not sell personal information to data brokers and we do not use
          IDFA or third-party advertising tracking in the current FR3SH mobile
          app.
        </p>
      </LegalSection>

      <LegalSection title="Storage, Security, and Retention">
        <p>
          We use reasonable technical and organisational safeguards, including
          HTTPS in transit, access controls, hashed OTPs, rate limits, and
          restricted operational access. No internet service can be guaranteed
          to be completely secure, so users should protect their devices, email,
          mobile number, and login credentials.
        </p>
        <p>
          We keep account data while the account is active, order and payment
          records for business, tax, audit, dispute, and legal requirements, and
          security logs for a limited period needed to protect the service. OTP
          records are short-lived. We may retain anonymised or aggregated data
          that no longer identifies a user.
        </p>
      </LegalSection>

      <LegalSection title="Your Choices and Rights">
        <p>
          You may update account information in the app or website where the
          feature is available. You can request access, correction, deletion, or
          withdrawal of consent by contacting{" "}
          <a className="text-emerald-800 underline" href="mailto:support@fr3sh.in">
            support@fr3sh.in
          </a>
          . You can also use our{" "}
          <Link className="text-emerald-800 underline" href="/data-deletion">
            Data Deletion Request
          </Link>{" "}
          page.
        </p>
        <p>
          Deleting an account may remove profile access and marketplace
          features. We may retain records that are required for completed
          orders, payments, refunds, tax, fraud prevention, disputes, safety, or
          legal compliance.
        </p>
      </LegalSection>

      <LegalSection title="Children">
        <p>
          FR3SH is an organic and natural products marketplace and is not
          directed to children under 13. Users who cannot legally enter into
          marketplace transactions should use FR3SH only with the involvement of
          a parent or guardian.
        </p>
      </LegalSection>

      <LegalSection title="Changes and Contact">
        <p>
          We may update this policy as our services, partners, or legal
          obligations change. The latest version will be posted on this page
          with the updated date.
        </p>
        <p>
          Privacy contact:{" "}
          <a className="text-emerald-800 underline" href="mailto:support@fr3sh.in">
            support@fr3sh.in
          </a>
        </p>
      </LegalSection>
    </LegalPage>
  );
}
