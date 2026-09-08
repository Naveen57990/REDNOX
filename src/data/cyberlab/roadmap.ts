export type RoadmapDifficulty = "Beginner" | "Intermediate" | "Advanced";

export interface RoadmapTopic {
  title: string;
  description: string;
  difficulty: RoadmapDifficulty;
  resources: { label: string; href: string }[];
}

export interface RoadmapSection {
  tier: "Beginner" | "Intermediate" | "Advanced";
  topics: RoadmapTopic[];
}

export const ROADMAP_SECTIONS: RoadmapSection[] = [
  {
    tier: "Beginner",
    topics: [
      {
        title: "Computer Basics",
        description:
          "Hardware, operating systems, files, users and how a machine boots. The foundation everything else stands on.",
        difficulty: "Beginner",
        resources: [
          { label: "Terminal Sandbox", href: "/terminal" },
          { label: "Kali Learn: system info", href: "/learn" },
        ],
      },
      {
        title: "Linux Fundamentals",
        description:
          "The filesystem hierarchy, users, permissions, the shell, and daily command-line workflows on Debian-based Linux.",
        difficulty: "Beginner",
        resources: [
          { label: "Kali Learn", href: "/learn" },
          { label: "AI Assistant", href: "/assistant" },
        ],
      },
      {
        title: "Networking Fundamentals",
        description:
          "IP addressing, TCP/UDP, DNS, HTTP(S) and how data crosses the network — the map every security concept lives on.",
        difficulty: "Beginner",
        resources: [
          { label: "Kali Learn: networking", href: "/learn" },
          { label: "Tool Explorer", href: "/explorer" },
        ],
      },
      {
        title: "Command Line Basics",
        description:
          "Navigation, pipes, redirection, grep/awk/sed, and fast keyboard-driven workflows in the terminal.",
        difficulty: "Beginner",
        resources: [
          { label: "Kali Learn: commands", href: "/learn" },
          { label: "Terminal Sandbox", href: "/terminal" },
        ],
      },
    ],
  },
  {
    tier: "Intermediate",
    topics: [
      {
        title: "Web Technologies",
        description:
          "How the web works: requests, responses, sessions, cookies, APIs and the browser as an execution environment.",
        difficulty: "Intermediate",
        resources: [
          { label: "AI Assistant: web topics", href: "/assistant" },
          { label: "Tool Explorer: web", href: "/explorer" },
        ],
      },
      {
        title: "Web Security Fundamentals",
        description:
          "OWASP Top 10 classes — injection, broken auth, XSS, CSRF, SSRF, IDOR — understood through safe lab examples.",
        difficulty: "Intermediate",
        resources: [
          { label: "AI Assistant", href: "/assistant" },
          { label: "Tool Explorer: web security", href: "/explorer" },
        ],
      },
      {
        title: "Python Basics",
        description:
          "Write, run and debug small scripts to automate repetitive security-lab tasks and parse data at scale.",
        difficulty: "Intermediate",
        resources: [
          { label: "AI Assistant: python", href: "/assistant" },
          { label: "Kali Learn", href: "/learn" },
        ],
      },
      {
        title: "Network Analysis",
        description:
          "Capture and interpret traffic: protocols, handshakes, and what normal vs suspicious activity looks like.",
        difficulty: "Intermediate",
        resources: [
          { label: "Kali Learn: networking", href: "/learn" },
          { label: "Terminal Sandbox", href: "/terminal" },
        ],
      },
      {
        title: "Vulnerability Management",
        description:
          "Prioritize, track and remediate weaknesses — CVEs, CVSS, scanning results and realistic patching workflows.",
        difficulty: "Intermediate",
        resources: [
          { label: "Tool Explorer", href: "/explorer" },
          { label: "AI Assistant", href: "/assistant" },
        ],
      },
    ],
  },
  {
    tier: "Advanced",
    topics: [
      {
        title: "Penetration Testing Methodology",
        description:
          "A structured, documented engagement flow: scope → recon → enumeration → testing → reporting, always authorized.",
        difficulty: "Advanced",
        resources: [
          { label: "Tool Explorer", href: "/explorer" },
          { label: "AI Assistant: methodology", href: "/assistant" },
        ],
      },
      {
        title: "Incident Response",
        description:
          "How to detect, contain, eradicate and recover from an intrusion — with logs and evidence chains.",
        difficulty: "Advanced",
        resources: [
          { label: "Kali Learn: logs", href: "/learn" },
          { label: "AI Assistant: defensive", href: "/assistant" },
        ],
      },
      {
        title: "Digital Forensics",
        description:
          "Preserve, image and analyze disks, memory and artifacts without altering evidence.",
        difficulty: "Advanced",
        resources: [
          { label: "Tool Explorer: forensics", href: "/explorer" },
          { label: "AI Assistant", href: "/assistant" },
        ],
      },
      {
        title: "Secure Coding",
        description:
          "Write code that doesn't become the vulnerability: input validation, output encoding, least privilege, dependency hygiene.",
        difficulty: "Advanced",
        resources: [
          { label: "Kali Learn", href: "/learn" },
          { label: "AI Assistant", href: "/assistant" },
        ],
      },
      {
        title: "Cloud Security",
        description:
          "Identity, access and configuration risks in the cloud — misconfigured buckets, roles, policies and secrets.",
        difficulty: "Advanced",
        resources: [
          { label: "AI Assistant", href: "/assistant" },
          { label: "Tool Explorer", href: "/explorer" },
        ],
      },
    ],
  },
];

export const TOTAL_ROADMAP_TOPICS = ROADMAP_SECTIONS.reduce(
  (sum, s) => sum + s.topics.length,
  0,
);