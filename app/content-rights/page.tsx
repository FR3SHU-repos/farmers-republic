import Link from "next/link";
import { LegalList, LegalPage, LegalSection } from "@/shared/components/legal/LegalPage";

export const metadata = {
  title: "Content Rights | FR3SH",
  description:
    "Content rights and intellectual property information for FR3SH and Farmers Republic.",
};

export default function ContentRightsPage() {
  return (
    <LegalPage
      title="Content Rights and Intellectual Property"
      description="This page explains how FR3SH handles marketplace content, farmer and vendor listings, product photos, brand assets, and intellectual property reports."
      updated="16 June 2026"
    >
      <LegalSection title="Our Content">
        <p>
          FR3SH, Farmers Republic, the FR3SH app, website design, software,
          workflows, logos, trade names, copy, visual identity, and platform
          materials created by us are owned by or licensed to Varmtech. You may
          not copy, scrape, reproduce, modify, resell, or use our content except
          as permitted by the platform or with written permission.
        </p>
      </LegalSection>

      <LegalSection title="Farmer, Vendor, and User Content">
        <p>
          Farmers, vendors, FPOs, delivery partners, customers, and community
          users may submit content such as farm profiles, product listings,
          product photos, harvest details, community group information, support
          messages, and order notes. The submitting party remains responsible
          for ensuring that the content is accurate, lawful, and does not
          infringe any third-party rights.
        </p>
        <p>
          By submitting content, the user grants FR3SH a worldwide,
          non-exclusive, royalty-free licence to host, store, display, resize,
          format, translate, promote, and use that content to operate, improve,
          market, and support the marketplace.
        </p>
      </LegalSection>

      <LegalSection title="Content Rights for App Store Connect">
        <p>
          FR3SH displays content from farmers, vendors, FPOs, customers, and
          marketplace partners. We have permission to display this content
          through our Terms & Conditions, farmer/vendor onboarding, and
          marketplace submission process. We also provide reporting and takedown
          channels for intellectual property or rights concerns.
        </p>
        <p>
          If App Store Connect asks whether the app contains, shows, or accesses
          third-party content, FR3SH should answer yes and confirm that it has
          the necessary rights or licences to display that content.
        </p>
      </LegalSection>

      <LegalSection title="Report Intellectual Property Concerns">
        <p>
          Rights owners can report trademark, copyright, listing, image, or
          brand misuse concerns by emailing{" "}
          <a className="text-emerald-800 underline" href="mailto:support@fr3sh.in">
            support@fr3sh.in
          </a>
          .
        </p>
        <LegalList
          items={[
            "Your name, organisation, and contact email or phone number.",
            "A description of the protected work, brand, image, listing, or right.",
            "The FR3SH URL, product, farmer profile, community content, or screenshot involved.",
            "A statement that you believe the reported use is unauthorised.",
            "Any supporting registration, ownership, authorisation, or representative documents.",
          ]}
        />
        <p>
          We may remove or restrict content while reviewing a report, contact
          the submitting user, request more information, or restore content if a
          report appears incomplete or invalid.
        </p>
      </LegalSection>

      <LegalSection title="Related Policies">
        <p>
          Read the{" "}
          <Link className="text-emerald-800 underline" href="/terms">
            Terms & Conditions
          </Link>{" "}
          and{" "}
          <Link className="text-emerald-800 underline" href="/privacy">
            Privacy Policy
          </Link>{" "}
          for the complete marketplace rules.
        </p>
      </LegalSection>
    </LegalPage>
  );
}
