import "@mantine/core/styles.css";
import "@mantine/notifications/styles.css";

import { MantineProvider, AppShell, Group, Burger, Image } from "@mantine/core";
import { useDisclosure } from "@mantine/hooks";
import { Outlet, createRootRoute } from "@tanstack/react-router";
import { TanStackRouterDevtools } from "@tanstack/react-router-devtools";
import { Notifications } from "@mantine/notifications";
import { Link } from "@/components/Link";
import theme from "@/lib/theme";
import { QueryClient, QueryClientProvider } from "@tanstack/react-query";
import AuthMenu from "@/components/AuthMenu";
import logo from "@/assets/logo.svg";
export const Route = createRootRoute({
  component: Root,
});

function Root() {
  const [opened, { toggle }] = useDisclosure();
  const queryClient = new QueryClient();
  return (
    <>
      <QueryClientProvider client={queryClient}>
        <MantineProvider theme={theme}>
          <Notifications />
          <AppShell
            header={{ height: 60 }}
            navbar={{
              width: 300,
              breakpoint: "sm",
              collapsed: { mobile: !opened },
            }}
            padding="md"
          >
            <AppShell.Header>
              <Group h="100%" px="md" justify="space-between">
                <Burger
                  opened={opened}
                  onClick={toggle}
                  hiddenFrom="sm"
                  size="sm"
                />
                <a href="/">
                  {" "}
                  <Image h={50} fit="contain" src={logo} />{" "}
                </a>
                <AuthMenu />
              </Group>
            </AppShell.Header>
            <AppShell.Navbar p="md">
              <Link href="/" label="Welcome" />
              <Link href="/dashboard" label="Dashboard" />
              <Link href="/orgs" label="Organizations" />
              <Link href="/categories" label="Categories" />
            </AppShell.Navbar>
            <AppShell.Main>
              <Outlet />
              <TanStackRouterDevtools />
            </AppShell.Main>
          </AppShell>
        </MantineProvider>
      </QueryClientProvider>
    </>
  );
}
