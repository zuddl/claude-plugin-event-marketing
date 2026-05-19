// This file is overwritten by the attendee-chatbot skill at project-creation time.
// Edit it directly only if you know what you're doing — re-running the skill will
// stomp on your changes. To tweak branding or welcome copy across runs, tell the
// skill ("change the welcome message to ...") so it stays in sync.

export type BrandKit = {
  name: string;
  primaryColor: string;
  accentColor: string;
  textColor: string;
  bgColor: string;
  fontFamily: string;
  logoUrl?: string;
  iconGlyph: string;
};

export type WidgetConfig = {
  agentId: string;
  apiKey: string;
  model: string;
  brand: BrandKit;
  welcomeMessage: string;
  placeholder: string;
  position: "bottom-right" | "bottom-left";
};

export const config: WidgetConfig = {
  agentId: "REPLACE_WITH_AGENT_ID",
  apiKey: "REPLACE_WITH_API_KEY",
  model: "claude-sonnet-4-6",
  brand: {
    name: "Your Event",
    primaryColor: "#1d4ed8",
    accentColor: "#0ea5e9",
    textColor: "#111111",
    bgColor: "#ffffff",
    fontFamily: 'system-ui, -apple-system, "Segoe UI", Roboto, sans-serif',
    iconGlyph: "💬",
  },
  welcomeMessage:
    "Hi! I'm the event assistant. Ask me about the agenda, venue, or speakers.",
  placeholder: "Ask about the agenda, venue, sessions...",
  position: "bottom-right",
};
