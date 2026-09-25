import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Nav from "@/components/Nav";

export default async function StudyLayout({
  children,
}: {
  children: React.ReactNode;
}) {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();
  if (!user) redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("display_name")
    .eq("id", user.id)
    .single();

  return (
    <div className="study-app-shell flex min-h-full flex-col">
      <Nav displayName={profile?.display_name || "Student"} />
      <div className="study-content mx-auto w-full max-w-3xl flex-1 px-4 py-8">{children}</div>
    </div>
  );
}
