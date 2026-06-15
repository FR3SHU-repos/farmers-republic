import { LegalList, LegalPage, LegalSection } from "@/shared/components/legal/LegalPage";

export const metadata = {
  title: "Data Deletion Request | FR3SH",
  description:
    "Request account deletion, privacy choices, or personal data removal for FR3SH.",
};

export default function DataDeletionPage() {
  return (
    <LegalPage
      title="Data Deletion Request"
      description="Use this page to request deletion of your FR3SH account or personal data, or to ask about privacy choices related to the FR3SH mobile app and website."
      updated="16 June 2026"
    >
      <LegalSection title="How to Request Deletion">
        <p>
          Email{" "}
          <a className="text-emerald-800 underline" href="mailto:support@fr3sh.in?subject=FR3SH%20Data%20Deletion%20Request">
            support@fr3sh.in
          </a>{" "}
          with the subject "FR3SH Data Deletion Request". You can also start
          the request from the FR3SH mobile app by opening Settings and choosing
          Delete My Account.
        </p>
        <LegalList
          items={[
            "Full name used on the account.",
            "Registered mobile number and email address.",
            "Whether the account is a customer, farmer, vendor, delivery partner, or admin account.",
            "Any order ID or farmer/vendor profile ID that helps us verify the account.",
            "Whether you want account deletion, correction of specific data, export/access information, or withdrawal of consent.",
          ]}
        />
      </LegalSection>

      <LegalSection title="Verification and Timeline">
        <p>
          We verify deletion requests to protect accounts from unauthorised
          removal. We may contact you through your registered email or mobile
          number and may ask for limited information to confirm ownership.
        </p>
        <p>
          We aim to acknowledge requests within 7 business days and complete
          eligible deletion requests within 30 days after verification, unless a
          longer period is required for legal, tax, fraud prevention, safety,
          payment, refund, delivery, dispute, or technical reasons.
        </p>
      </LegalSection>

      <LegalSection title="What Will Be Deleted or Retained">
        <p>
          Account profile data, saved customer details, non-essential support
          records, and inactive marketplace profile content may be deleted,
          deactivated, anonymised, or restricted. You may lose access to orders,
          wallet features, subscriptions, referrals, badges, community groups,
          and farmer/vendor tools after deletion.
        </p>
        <p>
          We may retain order, payment, refund, accounting, tax, security,
          fraud prevention, delivery, dispute, and legal records where retention
          is required or reasonably necessary. We may also keep anonymised or
          aggregated data that no longer identifies you.
        </p>
      </LegalSection>

      <LegalSection title="Privacy Choices URL for App Store">
        <p>
          This page can be used as the public App Store Connect privacy choices
          or data deletion URL for the FR3SH iOS app. Privacy questions can also
          be sent to{" "}
          <a className="text-emerald-800 underline" href="mailto:support@fr3sh.in">
            support@fr3sh.in
          </a>
          .
        </p>
      </LegalSection>
    </LegalPage>
  );
}
