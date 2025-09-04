// src/styles/styled.d.ts
import "styled-components";

declare module "styled-components" {
  export interface DefaultTheme {
    name: "light" | "dark";
    colors: {
      surfaceHover: string;
      bg: string;
      surface: string;
      border: string;
      text: string;
      textMuted: string;
      primary: string;
      primaryText: string;
      userBubbleBg: string;
      assistantBubbleBg: string;
    };
    radius: { md: string; lg: string; xl: string };
    shadow: { sm: string; md: string };
  }
}
