import AuthForm from "@/components/AuthForm";
import AuthPageShell from "@/components/AuthPageShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[]; accountDeleted?: string }>;
}) {
  const params = await searchParams;
  const error = params.error;
  const initialMessage = (Array.isArray(error) ? error[0] : error)
    || (params.accountDeleted === "1" ? "Your account and associated personal data have been deleted." : null);

  return (
    <AuthPageShell>
      <AuthForm initialMessage={initialMessage} />
    </AuthPageShell>
  );
}
