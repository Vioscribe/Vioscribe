import AuthForm from "@/components/AuthForm";
import AuthPageShell from "@/components/AuthPageShell";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = (await searchParams).error;
  const initialMessage = Array.isArray(error) ? error[0] : error;

  return (
    <AuthPageShell>
      <AuthForm initialMessage={initialMessage} />
    </AuthPageShell>
  );
}
