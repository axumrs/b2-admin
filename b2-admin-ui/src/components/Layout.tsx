import { Link, Outlet } from "react-router-dom";
import Container from "./Container";
import {
  NavigationMenu,
  NavigationMenuItem,
  NavigationMenuLink,
  NavigationMenuList,
  navigationMenuTriggerStyle,
} from "@/components/ui/navigation-menu";
import { ModeToggle } from "./ModeToggle";
import { Button } from "./ui/button";
import { useStateContext } from "@/contexts/StateContext";
import { Navigate } from "react-router-dom";

import SelectB2Dialog from "./SelectB2";

export default function Layout() {
  const { $auth, $b2 } = useStateContext();
  if (!$auth) {
    return <Navigate to="/login" />;
  }
  if (!$b2) {
    return (
      <SelectB2Dialog show>
        <></>
      </SelectB2Dialog>
    );
  }
  return (
    <>
      <header className="p-3 border-b">
        <Container className="flex items-center justify-between gap-x-2">
          <div className="flex items-center gap-x-6">
            <Link to="/" className="flex items-center gap-x-2">
              <img
                src="/logo.png"
                alt="LOGO"
                className="size-8 object-contain"
              />
              <h2 className="text-xl">B2管理面板</h2>
            </Link>

            <NavigationMenu>
              <NavigationMenuList>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Button variant="ghost" asChild>
                      <Link to="/">控制面板</Link>
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem>
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <SelectB2Dialog>
                      <Button variant="ghost">B2</Button>
                    </SelectB2Dialog>
                  </NavigationMenuLink>
                </NavigationMenuItem>
              </NavigationMenuList>
            </NavigationMenu>
          </div>
          <NavigationMenu>
            <NavigationMenuList>
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <ModeToggle />
                </NavigationMenuLink>
              </NavigationMenuItem>
            </NavigationMenuList>
          </NavigationMenu>
        </Container>
      </header>
      <main className="my-3 p-3">
        <Container>
          <Outlet />
        </Container>
      </main>
    </>
  );
}
