import { cookies } from "next/headers";
import { NextResponse } from "next/server";
import { clientCookieName, emailFromClientSession } from "@/lib/client-session";
import { lireDemandeSaisie, saisiePourBase } from "@/lib/demande-saisie";
import { getSupabase } from "@/lib/supabase";
export async function PATCH(request: Request, { params }: { params: Promise<{ id: string }> }) {
  const { id } = await params;
  if (!/^[0-9a-f-]{36}$/.test(id)) {
    return NextResponse.json({ error: "La recherche est introuvable." }, { status: 404 });
  }

  const jar = await cookies();
  const email = emailFromClientSession(jar.get(clientCookieName())?.value);
  if (!email) return NextResponse.json({ error: "Ouvrez le lien reçu par e-mail pour modifier la recherche." }, { status: 401 });

  let body: unknown;
  try {
    body = await request.json();
  } catch {
    return NextResponse.json({ error: "La demande n'a pas pu être lue." }, { status: 400 });
  }
  if (!body || typeof body !== "object") {
    return NextResponse.json({ error: "La demande n'a pas pu être lue." }, { status: 400 });
  }

  const { saisie, error } = lireDemandeSaisie(body as Record<string, unknown>);
  if (!saisie) return NextResponse.json({ error }, { status: 400 });

  const supabase = getSupabase();
  const secret = process.env.DEMANDE_READ_SECRET;
  if (!supabase || !secret) {
    return NextResponse.json({ error: "L'enregistrement est indisponible pour le moment." }, { status: 503 });
  }

  const { error: updateError } = await supabase.rpc("modifier_demande_client", {
    clef: secret,
    email,
    demande_id: id,
    saisie: saisiePourBase(saisie),
  });
  if (updateError) {
    console.error("modifier_demande_client", updateError.code);
    const message = updateError.code === "22023" ? "Une offre a été retenue : la recherche ne peut plus être modifiée." : "La recherche n'a pas pu être modifiée.";
    return NextResponse.json({ error: message }, { status: 400 });
  }
  return NextResponse.json({ ok: true });
}
