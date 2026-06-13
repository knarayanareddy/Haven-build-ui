// Hard-coded copy for the 6 seeded consent packs.
// Mirrors what fn-consent-pack-list returns from the database.

export interface ConsentPackView {
  pack_key: 'core_meds' | 'core_voice' | 'core_family_msgs' | 'safety_location' | 'safety_fall' | 'shield_scam_coaching';
  title_nl: string;
  title_en: string;
  description_nl: string;
  description_en: string;
  recommended_day: number;
}

export const CONSENT_PACKS: ConsentPackView[] = [
  {
    pack_key: 'core_meds',
    title_nl: 'Medicijnen en herinneringen',
    title_en: 'Medications and reminders',
    description_nl: 'Wij helpen u herinneren wanneer u uw medicijnen inneemt. Familie ziet alleen of u ze hebt ingenomen, niet welke.',
    description_en: 'We help you remember your medications. Family only sees whether they were taken.',
    recommended_day: 0,
  },
  {
    pack_key: 'core_voice',
    title_nl: 'Spraakmetgezel',
    title_en: 'Voice companion',
    description_nl: 'Een vriendelijke digitale stem praat met u over uw dag. Er wordt niets opgenomen zonder uw toestemming.',
    description_en: 'A friendly digital voice chats with you. Nothing is recorded without your consent.',
    recommended_day: 0,
  },
  {
    pack_key: 'core_family_msgs',
    title_nl: 'Familieberichten',
    title_en: 'Family messages',
    description_nl: 'Familie kan u berichten, foto\'s en korte video\'s sturen. U leest of beluistert ze wanneer u wilt.',
    description_en: 'Family can send you messages, photos and short videos. You read or listen to them when you like.',
    recommended_day: 0,
  },
  {
    pack_key: 'safety_location',
    title_nl: 'Veilige zone',
    title_en: 'Safe zone',
    description_nl: 'Wij waarschuwen familie als u buiten een ingestelde zone bent. Precieze locatie wordt nooit getoond, alleen een globale omgeving.',
    description_en: 'We alert family if you leave a set zone. Precise location is never shown, only a global area.',
    recommended_day: 7,
  },
  {
    pack_key: 'safety_fall',
    title_nl: 'Valdetectie',
    title_en: 'Fall detection',
    description_nl: 'Uw telefoon of horloge detecteert mogelijke valpartijen. Wij vragen u of alles goed gaat en waarschuwen familie alleen als u niet reageert.',
    description_en: 'Your phone or watch detects possible falls. We ask if you are okay and only alert family if you do not respond.',
    recommended_day: 7,
  },
  {
    pack_key: 'shield_scam_coaching',
    title_nl: 'Scambescherming-coaching',
    title_en: 'Scam coaching',
    description_nl: 'U kunt elke verdachte oproep, sms of link aan HAVEN voorleggen. HAVEN legt in gewone taal uit wat u moet doen.',
    description_en: 'You can submit any suspicious call, message or link to HAVEN. HAVEN explains in plain language what to do.',
    recommended_day: 14,
  },
];
