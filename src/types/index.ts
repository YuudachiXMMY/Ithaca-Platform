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
      { label: "EV Team", href: "/programs/ev-challenge" },
      {
        label: "AI Entrepreneurship Camp",
        href: "/programs/ai-entrepreneurship-camp",
      },
      {
        label: "Elite Interviews",
        href: "/programs/elite-interview",
      },
      { label: "Other Programs", href: "/programs" },
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
      "Mr. Joshua Wang was an editorial writer of leading business media, adjunct professor at universities.",
    image: "/media/images/team/joshua-wang.jpg",
  },
  {
    name: "Mr. Jadyn Wu",
    title: "Dean of Education & Technology",
    description: "Focusing on AI and Engineering Education for Youth",
    image: "/media/images/team/jadyn-wu.png",
  },
  {
    name: "Ms. Kristen Perry",
    title: "Mentor of Business Module",
    description:
      "Ms. Kristen Perry is a founder, educator, and investor who focuses on supporting entrepreneurs looking to tackle complex global challenges.",
    image: "/media/images/team/kristen-perry.png",
  },
  {
    name: "Mr. Grant Bourne",
    title: "EV Program Lead & Coach",
    description: "2025 Pirelli GT4 Champion",
    image: "/media/images/team/grant-bourne.png",
  },
];

export const CONTACT_INFO = {
  address: "205 Placer Ct unit 325, North York ON",
  email: "joshua.wang@ithacafo.com",
  phone: "+1(437) 226-8407",
  wechat: "joshuawong2015",
} as const;
