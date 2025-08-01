import crypto from "crypto";
import { INTERACTION } from "./interaction";
export function verifyTwitchSignature(headers: Headers, body: string, secret: string): boolean {
  const messageId = headers.get('Twitch-Eventsub-Message-Id');
  const timestamp = headers.get('Twitch-Eventsub-Message-Timestamp');
  const signature = headers.get('Twitch-Eventsub-Message-Signature');
  if (!messageId || !timestamp || !signature) return false;
  const hmac = crypto.createHmac('sha256', secret);
  hmac.update(messageId + timestamp + body);
  const expected = 'sha256=' + hmac.digest('hex');
  return crypto.timingSafeEqual(Buffer.from(signature), Buffer.from(expected));
}

export interface TwitchEvent {
  subscription: { type: string };
  event: any;
}

export function mapEventToInteraction(evt: TwitchEvent): number | null {
  if (evt.subscription.type === 'channel.channel_points_custom_reward_redemption.add') {
    const title = evt.event.reward.title.toLowerCase();
    if (title.includes('feed')) return INTERACTION.FEED;
    if (title.includes('play')) return INTERACTION.PLAY;
    if (title.includes('clean') || title.includes('bath')) return INTERACTION.BATH;
    if (title.includes('discipline')) return INTERACTION.DISCIPLINE;
    if (title.includes('hospital') || title.includes('heal')) return INTERACTION.GO_TO_HOSPITAL;
  }
  if (evt.subscription.type === 'channel.cheer') {
    const bits = evt.event.bits ?? 0;
    if (bits >= 1000) return INTERACTION.GO_TO_HOSPITAL;
    if (bits >= 500) return INTERACTION.BATH;
    if (bits >= 100) return INTERACTION.PLAY;
    return INTERACTION.FEED;
  }
  return null;
}
