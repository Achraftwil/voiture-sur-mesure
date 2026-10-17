import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { clientCookieName, emailFromClientSession, normaliserEmail } from "@/lib/client-session";
import { lireDemandeSaisie, saisiePourBase } from "@/lib/demande-saisie";
import { envoyerLienClient } from "@/lib/espace-client";
import { lancerRecherche } from "@/lib/propositions";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
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

  const jar = await cookies();
  const session = emailFromClientSession(jar.get(clientCookieName())?.value);
  const confirmed = session !== "" && session === normaliserEmail(saisie.contactEmail);

  const { data, error: insertError } = await supabase.rpc("enregistrer_demande", {
    clef: secret,
    saisie: { ...saisiePourBase(saisie), contact_email: saisie.contactEmail },
    confirmee: confirmed,
  });

  if (insertError) {
    console.error("enregistrer_demande", insertError.code);
    return NextResponse.json({ error: "L'envoi n'a pas abouti. Réessayez." }, { status: 500 });
  }

  if (confirmed) {
    if (typeof data === "string") after(() => lancerRecherche(data));
    return NextResponse.json({ confirmed: true, emailSent: true });
  }

  const mail = await envoyerLienClient(saisie.contactEmail, saisie.contactName, true);
  return NextResponse.json({ confirmed: false, emailSent: !mail.error });
}
