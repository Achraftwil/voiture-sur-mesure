import { cookies } from "next/headers";
import { after, NextResponse } from "next/server";
import { clientCookieName, clientCookieOptions, clientSessionValue } from "@/lib/client-session";
import { consommerLienClient, siteUrl } from "@/lib/espace-client";
import { lancerRecherchesConfirmees } from "@/lib/propositions";

export async function GET(_request: Request, { params }: { params: Promise<{ token: string }> }) {
  const { token } = await params;
  const email = await consommerLienClient(token);
  if (!email) {
    return NextResponse.redirect(`${siteUrl()}/mes-recherches?lien=invalide`);
  }
  const jar = await cookies();
  jar.set(clientCookieName(), clientSessionValue(email), clientCookieOptions());
  after(() => lancerRecherchesConfirmees(email));
  return NextResponse.redirect(`${siteUrl()}/mes-recherches`);
}
