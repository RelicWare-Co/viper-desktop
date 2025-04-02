import { NavLink } from "@mantine/core";
import { useRouter } from "@tanstack/react-router";
import { Link as TanStackLink } from "@tanstack/react-router";
export function Link({ href, label }: { href: string; label: string }) {
  const router = useRouter();
  const isActive = href === "/" ? router.parseLocation().pathname === href : router.parseLocation().pathname.startsWith(`${href}/`);
  return <NavLink component={TanStackLink} to={href} label={label} active={isActive} />;
}
