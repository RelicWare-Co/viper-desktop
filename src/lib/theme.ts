import { createTheme } from "@mantine/core";
import type { MantineThemeOverride } from "@mantine/core";

const theme: MantineThemeOverride = createTheme({
  /** Put your mantine theme override here */
  primaryColor: "violet",
  fontFamily: "Inter, sans-serif",
});

export default theme;
