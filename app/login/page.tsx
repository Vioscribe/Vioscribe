import AuthForm from "@/components/AuthForm";

export default async function LoginPage({
  searchParams,
}: {
  searchParams: Promise<{ error?: string | string[] }>;
}) {
  const error = (await searchParams).error;
  const initialMessage = Array.isArray(error) ? error[0] : error;

  return (
    <main className="landing-auth-page flex min-h-full items-center justify-center px-4 py-16">
      <AuthForm initialMessage={initialMessage} />
    </main>
  );
}
