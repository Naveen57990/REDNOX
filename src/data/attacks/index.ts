import type { AttackCategory, AttackPlaybook } from "../types";
import { ATTACK_PLAYBOOKS_1A } from "./attack-playbooks-1a";
import { ATTACK_PLAYBOOKS_1B } from "./attack-playbooks-1b";
import { ATTACK_PLAYBOOKS_2 } from "./attack-playbooks-2";
import { ATTACK_PLAYBOOKS_3 } from "./attack-playbooks-3";
import { ATTACK_PLAYBOOKS_4 } from "./attack-playbooks-4";

export const ATTACK_PLAYBOOKS: AttackPlaybook[] = [
  ...ATTACK_PLAYBOOKS_1A,
  ...ATTACK_PLAYBOOKS_1B,
  ...ATTACK_PLAYBOOKS_2,
  ...ATTACK_PLAYBOOKS_3,
  ...ATTACK_PLAYBOOKS_4,
];

export interface AttackCategoryInfo {
  id: AttackCategory;
  label: string;
  description: string;
}

export const ATTACK_CATEGORIES: AttackCategoryInfo[] = [
  {
    id: "social",
    label: "Social engineering & phishing",
    description:
      "Attacks that target the person, not the machine — deception, urgency and trust are the vector.",
  },
  {
    id: "mobile",
    label: "Mobile & phone attacks",
    description:
      "Compromising the phone itself: trojanised APKs, remote-access payloads and supply-side app tricks.",
  },
  {
    id: "network",
    label: "Network & Wi-Fi attacks",
    description:
      "Fake access points, handshake cracking and man-in-the-middle position on shared networks.",
  },
  {
    id: "web",
    label: "Web app & credential attacks",
    description:
      "Injections, session theft and mass password replay against online services.",
  },
  {
    id: "system",
    label: "Systems & remote access",
    description:
      "Guessing your way into servers — exposed SSH/RDP and what a valid login unlocks.",
  },
  {
    id: "physical",
    label: "Physical & hardware attacks",
    description:
      "Keystroke-injecting USB devices, macro-laced documents and the human layers around the machine.",
  },
];

export function getAttackCategory(id: AttackCategory): AttackCategoryInfo {
  return (
    ATTACK_CATEGORIES.find((c) => c.id === id) ?? ATTACK_CATEGORIES[0]
  );
}

export function getAttackPlaybook(slug: string): AttackPlaybook | undefined {
  return ATTACK_PLAYBOOKS.find((p) => p.slug === slug);
}