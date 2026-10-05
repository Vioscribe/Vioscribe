import { createClient as createSupabaseClient } from "@supabase/supabase-js";
import { createClient } from "@/lib/supabase/server";

export async function POST(request: Request) {
  const origin = request.headers.get("origin");
  if (!origin || origin !== new URL(request.url).origin) {
    return Response.json({ error: "This request could not be verified." }, { status: 403 });
  }

  const supabase = await createClient();
  const {
    data: { user },
    error: authError,
  } = await supabase.auth.getUser();

  if (authError || !user) {
    return Response.json({ error: "Sign in to delete your account." }, { status: 401 });
  }

  let confirmation: unknown;
  try {
    const body = await request.json();
    confirmation = body?.confirmation;
  } catch {
    return Response.json({ error: "Confirm account deletion to continue." }, { status: 400 });
  }

  if (confirmation !== "DELETE") {
    return Response.json({ error: "Type DELETE to confirm account removal." }, { status: 400 });
  }

  const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
  if (!serviceRoleKey) {
    return Response.json({ error: "Account deletion is not configured yet. Please contact support." }, { status: 503 });
  }

  const admin = createSupabaseClient(
    process.env.NEXT_PUBLIC_SUPABASE_URL!,
    serviceRoleKey,
    { auth: { autoRefreshToken: false, persistSession: false } },
  );
  const { error } = await admin.auth.admin.deleteUser(user.id);

  if (error) {
    return Response.json({ error: "Your account could not be deleted. Please try again or contact support." }, { status: 500 });
  }

  return Response.json({ deleted: true });
}
