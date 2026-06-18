import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/shared/components/legal/LegalPage";

export const metadata = {
  title: "Contact Support | FR3SH",
  description:
    "Contact FR3SH support for account, order, farmer, payment, privacy, and content rights help.",
};

export default function SupportPage() {
  return (
    <LegalPage
      title="Contact and Support"
      description="Get help with FR3SH orders, accounts, farmer/vendor profiles, payments, refunds, delivery, privacy, content rights, and App Store review questions."
    >
      <LegalSection title="Primary Support Contact">
        <p>
          Email{" "}
          <a className="text-emerald-800 underline" href="mailto:hello@farmers-republic.com">
            hello@farmers-republic.com
          </a>{" "}
          for customer, farmer, vendor, delivery, privacy, payment, or account
          support.
        </p>
        <p>
          For order help, include the order ID, registered phone number, and a
          short description of the issue. For farmer/vendor support, include
          your profile name, registered phone number, and product or harvest
          details where relevant.
        </p>
      </LegalSection>

      <LegalSection title="Common Requests">
        <LegalList
          items={[
            <>
              Account deletion and privacy choices:{" "}
              <Link className="text-emerald-800 underline" href="/data-deletion">
                Data Deletion Request
              </Link>
            </>,
            <>
              Privacy practices:{" "}
              <Link className="text-emerald-800 underline" href="/privacy">
                Privacy Policy
              </Link>
            </>,
            <>
              Marketplace rules:{" "}
              <Link className="text-emerald-800 underline" href="/terms">
                Terms & Conditions
              </Link>
            </>,
            <>
              Intellectual property and listing rights:{" "}
              <Link className="text-emerald-800 underline" href="/content-rights">
                Content Rights
              </Link>
            </>,
          ]}
        />
      </LegalSection>

      <LegalSection title="Safety and Content Reports">
        <p>
          Report unsafe listings, misleading organic or natural claims,
          inappropriate community content, suspected fraud, impersonation,
          rights violations, or account abuse to{" "}
          <a className="text-emerald-800 underline" href="mailto:hello@farmers-republic.com?subject=FR3SH%20Safety%20or%20Content%20Report">
            hello@farmers-republic.com
          </a>
          . We review reports and may remove content, restrict accounts, or
          request more information.
        </p>
      </LegalSection>

      <LegalSection title="App Store Review Access">
        <p>
          If Apple App Review needs assistance, use{" "}
          <a className="text-emerald-800 underline" href="mailto:hello@farmers-republic.com">
            hello@farmers-republic.com
          </a>{" "}
          as the support contact and provide a working demo account in App Store
          Connect if any reviewed feature requires sign-in.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
