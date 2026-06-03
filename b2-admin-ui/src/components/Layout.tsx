import { Link, Outlet, useNavigate, Navigate } from "react-router-dom";
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

import SelectB2Dialog from "./SelectB2";
import { BucketIcon, LogoutIcon } from "./Icons";
import { Confirm } from "./Confirm";

export default function Layout() {
  const nav = useNavigate();
  const { $auth, $b2, $setAuth, $setB2, $setCfg } = useStateContext();
  if (!$auth) {
    return <Navigate to="/login" />;
  }
  if (!$b2) {
    return (
      <SelectB2Dialog show>
        <button className="hidden">选择B2</button>
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
                {/* <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <Button variant="ghost" asChild>
                      <Link to="/">对象浏览</Link>
                    </Button>
                  </NavigationMenuLink>
                </NavigationMenuItem> */}
                <NavigationMenuItem>
                  <NavigationMenuLink
                    asChild
                    className={navigationMenuTriggerStyle()}
                  >
                    <SelectB2Dialog
                      onClose={() => {
                        nav("/");
                      }}
                    >
                      <Button variant="ghost">
                        <BucketIcon />
                        当前配置：{$b2.name || "未选择"}
                      </Button>
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
              <NavigationMenuItem>
                <NavigationMenuLink
                  asChild
                  className={navigationMenuTriggerStyle()}
                >
                  <Confirm
                    title="退出登录"
                    description="确认退出本次登录吗？"
                    onAction={() => {
                      $setAuth(null);
                      $setB2(null);
                      $setCfg(null);
                    }}
                  >
                    <Button variant="ghost" size="icon">
                      <LogoutIcon />
                    </Button>
                  </Confirm>
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
