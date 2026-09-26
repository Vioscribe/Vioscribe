import AuthPageShell from "@/components/AuthPageShell";
import ForgotPasswordForm from "@/components/ForgotPasswordForm";

export const metadata = { title: "Forgot password | Vioscribe" };

export default async function ForgotPasswordPage({
  searchParams,
}: {
  searchParams: Promise<{ email?: string | string[]; error?: string | string[] }>;
}) {
  const params = await searchParams;
  const emailParam = params.email;
  const error = params.error;
  const initialEmail = Array.isArray(emailParam) ? emailParam[0] : emailParam;
  const initialMessage = Array.isArray(error) ? error[0] : error;

  return (
    <AuthPageShell backHref="/login" backLabel="← Back to log in">
      <ForgotPasswordForm initialEmail={initialEmail ?? ""} initialMessage={initialMessage} />
    </AuthPageShell>
  );
}
