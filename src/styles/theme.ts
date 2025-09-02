// src/styles/theme.ts
// src/styles/theme.ts
import type { DefaultTheme } from "styled-components";

const base = {
  radius: { md: "10px", lg: "16px", xl: "20px" },
  shadow: {
    sm: "0 1px 2px rgba(0,0,0,0.06)",
    md: "0 8px 24px rgba(0,0,0,0.08)",
  },
};

export const lightTheme: DefaultTheme = {
  name: "light",
  colors: {
    bg: "#F7F7FB",
    surface: "#FFFFFF",
    border: "#E7E7EF",
    text: "#141414",
    textMuted: "#585B67",
    primary: "#FD4E06",
    primaryText: "#FFFFFF",
    userBubbleBg: "#FD4E06",
    assistantBubbleBg: "#F1F2F6",
  },
  ...base,
};

export const darkTheme: DefaultTheme = {
  name: "dark",
  colors: {
    bg: "#0F1115",
    surface: "#151821",
    border: "#222633",
    text: "#EDEEF3",
    textMuted: "#A6A9B5",
    primary: "#FD4E06",
    primaryText: "#FFFFFF",
    userBubbleBg: "#FD4E06",
    assistantBubbleBg: "#1C2030",
  },
  ...base,
};
