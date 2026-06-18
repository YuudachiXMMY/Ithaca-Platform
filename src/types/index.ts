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
        label: "Elite Interviews",
        href: "/programs/elite-interview",
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
      "Mr. Joshua Wang was an editorial writer of leading business media, adjunct professor at universities.",
    image:
      "https://img1.wsimg.com/isteam/ip/66d65d76-4785-410c-b8a1-b3b2d3199884/Weixin%20Image_20251125181810_444_1752.jpg/:/cr=t:4.88%25,l:0%25,w:100%25,h:84.37%25/rs=w:365,h:365,cg:true",
  },
  {
    name: "Mr. Jadyn Wu",
    title: "Dean of Education & Technology",
    description: "Focusing on AI and Engineering Education for Youth",
    image:
      "https://img1.wsimg.com/isteam/ip/66d65d76-4785-410c-b8a1-b3b2d3199884/Jadyn%20Wu.png/:/cr=t:7.94%25,l:0%25,w:100%25,h:79.29%25/rs=w:365,h:365,cg:true",
  },
  {
    name: "Ms. Kristen Perry",
    title: "Mentor of Business Module",
    description:
      "Ms. Kristen Perry is a founder, educator, and investor who focuses on supporting entrepreneurs looking to tackle complex global challenges.",
    image:
      "https://img1.wsimg.com/isteam/ip/66d65d76-4785-410c-b8a1-b3b2d3199884/Ms.%20Kristen%20Perry.png/:/cr=t:2.33%25,l:0%25,w:100%25,h:95.33%25/rs=w:365,h:365,cg:true",
  },
  {
    name: "Mr. Grant Bourne",
    title: "EV Program Lead & Coach",
    description: "2025 Pirelli GT4 Champion",
    image:
      "https://img1.wsimg.com/isteam/ip/66d65d76-4785-410c-b8a1-b3b2d3199884/Weixin%20Image_20260102150322_1634_1752.png/:/cr=t:0%25,l:0%25,w:100%25,h:100%25/rs=w:365,h:365,cg:true",
  },
];

export const CONTACT_INFO = {
  address: "205 Placer Ct unit 325, North York ON",
  email: "joshua.wang@ithacafo.com",
  phone: "+1(437) 226-8407",
  wechat: "joshuawong2015",
} as const;
