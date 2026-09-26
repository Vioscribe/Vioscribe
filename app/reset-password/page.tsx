import AuthPageShell from "@/components/AuthPageShell";
import ResetPasswordForm from "@/components/ResetPasswordForm";
import { createClient } from "@/lib/supabase/server";

export const metadata = { title: "Set a new password | Vioscribe" };

export default async function ResetPasswordPage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  return (
    <AuthPageShell backHref="/login" backLabel="← Back to log in">
      <ResetPasswordForm hasSession={Boolean(user)} />
    </AuthPageShell>
  );
}
