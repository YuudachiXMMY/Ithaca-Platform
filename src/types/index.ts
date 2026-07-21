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
  { label: "home", href: "/" },
  { label: "aboutUs", href: "/about-us" },
  {
    label: "programs",
    href: "/programs",
    children: [
      { label: "evTeam", href: "/programs/ev-challenge" },
      { label: "aiEntrepreneurshipCamp", href: "/programs/ai-entrepreneurship-camp" },
      { label: "eliteInterviews", href: "/programs/ithaca-dialogues" },
      { label: "otherPrograms", href: "/programs" },
    ],
  },
  { label: "contactUs", href: "/contact-us" },
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
    title: "team.joshuaWang.title",
    description: "team.joshuaWang.description",
    image: "/media/images/team/joshua-wang.jpg",
  },
  {
    name: "Mr. Jadyn Wu",
    title: "team.jadynWu.title",
    description: "team.jadynWu.description",
    image: "/media/images/team/jadyn-wu.png",
  },
  {
    name: "Ms. Kristen Perry",
    title: "team.kristenPerry.title",
    description: "team.kristenPerry.description",
    image: "/media/images/team/kristen-perry.png",
  },
  {
    name: "Mr. Grant Bourne",
    title: "team.grantBourne.title",
    description: "team.grantBourne.description",
    image: "/media/images/team/grant-bourne.png",
  },
];

export const CONTACT_INFO = {
  address: "205 Placer Ct unit 325, North York ON",
  email: "joshua.wang@ithacafo.com",
  phone: "+1(437) 226-8407",
  wechat: "joshuawong2015",
} as const;
