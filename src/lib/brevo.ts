type OfferMail = {
  toEmail: string;
  toName: string;
  vehicle: string;
  price: number;
  link: string;
  pourcent?: number | null;
};

export function brevoReady() {
  return Boolean(process.env.BREVO_API_KEY && process.env.BREVO_SENDER_EMAIL);
}

export async function sendOfferEmail(mail: OfferMail) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) {
    return {
      error: "L'offre est enregistrée. L'e-mail n'est pas parti : la clé Brevo n'est pas encore en place.",
    };
  }

  const senderName = process.env.BREVO_SENDER_NAME || "Recherche voiture";
  const price = mail.price.toLocaleString("fr-FR");
  const name = escapeHtml(mail.toName);
  const vehicle = escapeHtml(mail.vehicle);
  const link = escapeHtml(mail.link);

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      replyTo: { name: senderName, email: senderEmail },
      to: [{ email: mail.toEmail, name: mail.toName }],
      subject: "Une proposition pour votre recherche",
      htmlContent: `<p>Bonjour ${name},</p>
<p>Nous avons une voiture qui correspond à votre recherche : <strong>${vehicle}</strong>, ${price} €.</p>
${mail.pourcent == null ? "" : `<p>Cette proposition correspond à ${mail.pourcent} % des critères que vous avez précisés.</p>`}
<p>Vous pouvez voir la proposition et y répondre sur cette page :</p>
<p><a href="${link}">${link}</a></p>
<p>Recherche voiture</p>`,
    }),
  });

  if (!response.ok) {
    const detail = await response.json().catch(() => null);
    const code = typeof detail?.code === "string" ? detail.code : "";
    const message = typeof detail?.message === "string" ? detail.message : "";
    console.error("brevo", response.status, code);
    if (/sender/i.test(message)) {
      return {
        error: `L'offre est enregistrée. Brevo refuse l'expéditeur ${senderEmail} : ajoutez et validez cette adresse dans Brevo (Expéditeurs et IP → Expéditeurs).`,
      };
    }
    if (response.status === 401 || /ip address|unrecognised|unrecognized|authoriz|verification/i.test(message)) {
      return {
        error:
          "L'offre est enregistrée. Brevo bloque l'envoi : dans Brevo, Sécurité → IPs autorisées, désactivez le blocage pour les clés API.",
      };
    }
    return { error: "L'offre est enregistrée, mais l'e-mail n'a pas pu partir." };
  }

  return {};
}

export async function sendQuestionAuProprio(mail: { clientName: string; vehicle: string; message: string; link: string }) {
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  const vehicle = escapeHtml(mail.vehicle);
  const message = escapeHtml(mail.message).replaceAll("\n", "<br>");
  const link = escapeHtml(mail.link);
  const name = escapeHtml(mail.clientName);
  return envoyerBrevo({
    toEmail: senderEmail || "",
    toName: process.env.BREVO_SENDER_NAME || "Voiture sur mesure",
    subject: "Question sur une offre",
    htmlContent: `<p>${name} pose une question sur <strong>${vehicle}</strong>.</p>
<p>${message}</p>
<p><a href="${link}">Voir les questions à répondre</a></p>`,
  });
}

export async function sendReponseAuClient(mail: { toEmail: string; toName: string; vehicle: string; message: string; link: string }) {
  const name = escapeHtml(mail.toName);
  const vehicle = escapeHtml(mail.vehicle);
  const message = escapeHtml(mail.message).replaceAll("\n", "<br>");
  const link = escapeHtml(mail.link);
  return envoyerBrevo({
    toEmail: mail.toEmail,
    toName: mail.toName,
    subject: "Réponse à votre question",
    htmlContent: `<p>Bonjour ${name},</p>
<p>Réponse au sujet de <strong>${vehicle}</strong> :</p>
<p>${message}</p>
<p>La réponse est aussi sur votre page :</p>
<p><a href="${link}">${link}</a></p>
<p>Voiture sur mesure</p>`,
  });
}

async function envoyerBrevo(mail: { toEmail: string; toName: string; subject: string; htmlContent: string }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail || !mail.toEmail) return { error: "L'e-mail n'a pas pu être envoyé." };
  const senderName = process.env.BREVO_SENDER_NAME || "Recherche voiture";
  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      replyTo: { name: senderName, email: senderEmail },
      to: [{ email: mail.toEmail, name: mail.toName }],
      subject: mail.subject,
      htmlContent: mail.htmlContent,
    }),
  });
  if (!response.ok) {
    console.error("brevo message", response.status);
    return { error: "L'e-mail n'a pas pu être envoyé." };
  }
  return {};
}

export async function sendClientLink(mail: { toEmail: string; toName: string; link: string; confirmation: boolean }) {
  const apiKey = process.env.BREVO_API_KEY;
  const senderEmail = process.env.BREVO_SENDER_EMAIL;
  if (!apiKey || !senderEmail) return { error: "L'e-mail n'a pas pu être envoyé." };

  const senderName = process.env.BREVO_SENDER_NAME || "Recherche voiture";
  const name = escapeHtml(mail.toName || "");
  const link = escapeHtml(mail.link);
  const subject = mail.confirmation ? "Confirmez votre recherche" : "Retrouvez vos recherches";
  const intro = mail.confirmation
    ? "Confirmez votre adresse pour que la recherche commence. Le même lien ouvre la page où vous suivrez son avancement."
    : "Ouvrez ce lien pour retrouver vos recherches et leur avancement.";

  const response = await fetch("https://api.brevo.com/v3/smtp/email", {
    method: "POST",
    headers: {
      accept: "application/json",
      "content-type": "application/json",
      "api-key": apiKey,
    },
    body: JSON.stringify({
      sender: { name: senderName, email: senderEmail },
      replyTo: { name: senderName, email: senderEmail },
      to: [{ email: mail.toEmail, name: mail.toName }],
      subject,
      htmlContent: `<p>Bonjour${name ? ` ${name}` : ""},</p>
<p>${intro}</p>
<p><a href="${link}">${link}</a></p>
<p>Sur le téléphone ou l'ordinateur où vous ouvrez ce lien, vous restez connecté. Le lien ne sert qu'une fois.</p>
<p>Voiture sur mesure</p>`,
    }),
  });

  if (!response.ok) {
    console.error("brevo lien", response.status);
    return { error: "L'e-mail n'a pas pu être envoyé." };
  }
  return {};
}

function escapeHtml(value: string) {
  return value
    .replaceAll("&", "&amp;")
    .replaceAll("<", "&lt;")
    .replaceAll(">", "&gt;")
    .replaceAll('"', "&quot;");
}
