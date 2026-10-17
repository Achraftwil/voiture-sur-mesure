import { formatDemandeDate } from "@/lib/demandes";
import type { MessageOffre } from "@/lib/offres";

export function FilMessages({ messages, vous }: { messages: MessageOffre[] | undefined; vous: "client" | "proprietaire" }) {
  if (!messages || messages.length === 0) return null;
  return (
    <ol className="mt-4 space-y-2">
      {messages.map((message) => {
        const moi = message.auteur === vous;
        const auteur = moi ? "Vous" : vous === "client" ? "Voiture sur mesure" : "Client";
        return (
          <li key={message.id} className={`border px-3 py-2 ${moi ? "border-[#e3dcd0] bg-white" : "border-[#d7d0c4] bg-[#f6f3ec]"}`}>
            <p className="text-sm text-[#5f5a52]">
              {auteur} · {formatDemandeDate(message.created_at)}
            </p>
            <p className="mt-1 whitespace-pre-wrap text-[15px] leading-6 text-[#1c1b17]">{message.corps}</p>
          </li>
        );
      })}
    </ol>
  );
}
