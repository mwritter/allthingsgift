import {
  NavigationMenu,
  NavigationMenuContent,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  NavigationMenuTrigger,
} from "@allthingsgift/ui/components/navigation-menu"
import { Button } from "@allthingsgift/ui/components/button"
import {
  Sheet,
  SheetClose,
  SheetContent,
  SheetFooter,
  SheetHeader,
  SheetTitle,
  SheetTrigger,
} from "@allthingsgift/ui/components/sheet"

const components: { title: string; href: string; description: string }[] = [
  {
    title: "Wishlists",
    href: '/',
    description:
      "One place to share your wishlist with everyone.",
  },
  {
    title: "Gift Exchanges",
    href: '/',
    description:
      "Create secret santa or other gift exchanges for any occasion.",
  },
  {
    title: "Celebrations",
    href: '/',
    description:
      "Create events for all celebrations.",
  },
  {
    title: "Invites",
    href: '/',
    description:
      "Invite friends, family or coworks.",
  }
]

export function Navbar() {
  return (
    <>
      <NavigationMenu className="hidden md:flex">
        <NavigationMenuList className="gap-10">
          <NavigationMenuItem>
            <NavigationMenuTrigger className="text-sm font-normal">
              Features
            </NavigationMenuTrigger>
            <NavigationMenuContent>
              <ul className="grid w-100 gap-2 p-2 md:w-125 md:grid-cols-2 lg:w-150">
                {components.map((component) => (
                  <ListItem
                    key={component.title}
                    href={component.href}
                    title={component.title}
                  >
                    {component.description}
                  </ListItem>
                ))}
              </ul>
            </NavigationMenuContent>
          </NavigationMenuItem>
          <NavigationMenuItem render={<a href="#" />}>
            How it works
          </NavigationMenuItem>
          <NavigationMenuItem className="mx-2">
            <Button>Login</Button>
          </NavigationMenuItem>
        </NavigationMenuList>
      </NavigationMenu>

      <Sheet>
        <SheetTrigger
          render={<Button variant="ghost" size="icon" className="md:hidden" />}
        >
          <MenuIcon />
          <span className="sr-only">Open menu</span>
        </SheetTrigger>
        <SheetContent side="left" className="overflow-y-auto">
          <SheetHeader>
            <SheetTitle>Menu</SheetTitle>
          </SheetHeader>
          <nav className="flex flex-col gap-1 px-2">
            <p className="px-2 pt-2 text-xs font-medium text-muted-foreground">
              Features
            </p>
            {components.map((component) => (
              <SheetClose
                key={component.title}
                render={
                  <a
                    href={component.href}
                    className="rounded-md px-2 py-2 hover:bg-muted"
                  />
                }
              >
                <span className="block text-sm font-medium">
                  {component.title}
                </span>
                <span className="line-clamp-2 text-sm text-muted-foreground">
                  {component.description}
                </span>
              </SheetClose>
            ))}
            <SheetClose
              render={
                <a
                  href="#"
                  className="rounded-md px-2 py-2 text-sm hover:bg-muted"
                />
              }
            >
              How it works
            </SheetClose>
          </nav>
          <SheetFooter>
            <Button>Login</Button>
          </SheetFooter>
        </SheetContent>
      </Sheet>
    </>
  )
}

function MenuIcon() {
  return (
    <svg
      xmlns="http://www.w3.org/2000/svg"
      viewBox="0 0 24 24"
      fill="none"
      stroke="currentColor"
      strokeWidth="2"
      strokeLinecap="round"
      strokeLinejoin="round"
      aria-hidden="true"
    >
      <path d="M4 6h16" />
      <path d="M4 12h16" />
      <path d="M4 18h16" />
    </svg>
  )
}

function ListItem({
  title,
  children,
  href,
  ...props
}: React.ComponentPropsWithoutRef<"li"> & { href: string }) {
  return (
    <li {...props}>
      <NavigationMenuLink render={<a href={href} />}>
        <div className="flex flex-col gap-1 text-sm">
          <div className="leading-none font-medium">{title}</div>
          <div className="line-clamp-2 text-muted-foreground">{children}</div>
        </div>
      </NavigationMenuLink>
    </li>
  )
}
