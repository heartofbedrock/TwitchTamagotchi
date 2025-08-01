import { NextResponse } from "next/server";
import { verifyTwitchSignature, mapEventToInteraction, TwitchEvent } from "@/app/utils/twitch";

export async function POST(req: Request) {
  const body = await req.text();
  const secret = process.env.TWITCH_WEBHOOK_SECRET!;

  if (!verifyTwitchSignature(req.headers, body, secret)) {
    return new NextResponse("invalid signature", { status: 401 });
  }

  const messageType = req.headers.get("Twitch-Eventsub-Message-Type");
  if (messageType === "webhook_callback_verification") {
    const data = JSON.parse(body);
    return new Response(data.challenge);
    return NextResponse.json(data.challenge);
  }

  if (messageType === "notification") {
    const event = JSON.parse(body) as TwitchEvent;
    const interaction = mapEventToInteraction(event);
    if (interaction !== null) {
      await fetch(`${process.env.NEXT_PUBLIC_BASE_URL || ""}/api/interact`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify({ interactionType: interaction }),
      });
    }
  }

  return NextResponse.json({});
}
