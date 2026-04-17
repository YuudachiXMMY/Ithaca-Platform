export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  error?: string;
}

export interface NavItem {
  label: string;
  href: string;
  children?: NavItem[];
}

export const NAV_ITEMS: NavItem[] = [
  { label: "Home", href: "/" },
  { label: "About Us", href: "/about-us" },
  {
    label: "Programs",
    href: "/programs",
    children: [
      { label: "EV Challenge", href: "/programs/ev-challenge" },
      {
        label: "AI Entrepreneurship Camp",
        href: "/programs/ai-entrepreneurship-camp",
      },
      {
        label: "Engineering Projects",
        href: "/programs/engineering-projects",
      },
      {
        label: "AI Pioneers Interview",
        href: "/programs/ai-pioneers-interview",
      },
      {
        label: "Summer & Winter Camps",
        href: "/programs/summer-winter-camps",
      },
      { label: "Ithaca Night", href: "/programs/ithaca-night" },
    ],
  },
  { label: "Contact Us", href: "/contact-us" },
];

export interface TeamMember {
  name: string;
  title: string;
  description: string;
  image?: string;
}

export const TEAM_MEMBERS: TeamMember[] = [
  {
    name: "Mr. Joshua Wang",
    title: "Founder & Principal",
    description:
      "Editorial writer of leading business media, adjunct professor at universities.",
  },
  {
    name: "Mr. Jadyn Wu",
    title: "Dean of Education & Technology",
    description:
      "Focusing on AI and Engineering Education for Youth.",
  },
  {
    name: "Ms. Kristen Perry",
    title: "Mentor of Business Module",
    description:
      "Founder, educator, and investor supporting entrepreneurs tackling complex global challenges.",
  },
  {
    name: "Mr. Grant Bourne",
    title: "EV Program Lead & Coach, Race Driver",
    description: "2025 Pirelli GT4 Champion.",
  },
];

export const CONTACT_INFO = {
  address: "205 Placer Ct unit 325, North York ON",
  email: "ithacafo@ithacafo.com",
  phone: "+1(437) 226-8407",
  wechat: "joshuawong2015",
} as const;
