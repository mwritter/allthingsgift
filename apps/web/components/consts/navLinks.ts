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
    href: "/dashboard",
    Icon: Home,
    text: "Home",
  },
  {
    href: "/dashboard/wishlist",
    Icon: Heart,
    text: "My Wishlist",
  },
  {
    href: "/dashboard/celebrations",
    Icon: PartyPopper,
    text: "Celebrations",
  },
  {
    href: "/dashboard/exchanges",
    Icon: Gift,
    text: "Exchanges",
  },
  {
    href: "/dashboard/settings",
    Icon: Settings,
    text: "Settings",
  },
] as const satisfies NavLink[];
