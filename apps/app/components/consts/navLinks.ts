import {
  Gift,
  Heart,
  Home,
  LucideIcon,
  PartyPopper,
  Settings,
} from "lucide-react";

export type NavLink = {
  href: string;
  Icon: LucideIcon;
  text: string;
};

export default [
  {
    href: "/",
    Icon: Home,
    text: "Home",
  },
  {
    href: "/wishlist",
    Icon: Heart,
    text: "My Wishlist",
  },
  {
    href: "/celebrations",
    Icon: PartyPopper,
    text: "Celebrations",
  },
  {
    href: "/exchanges",
    Icon: Gift,
    text: "Exchanges",
  },
  {
    href: "/settings",
    Icon: Settings,
    text: "Settings",
  },
] as const satisfies NavLink[];
