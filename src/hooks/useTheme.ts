"use client";

import { useEffect, useLayoutEffect, useState } from "react";
import { useLocalStorage, useMediaQuery } from "usehooks-ts";

export enum Theme {
  LIGHT = "lemonade",
  DARK = "abyss",
}

export default function useTheme() {
  // const defaultTheme = useMediaQuery("(prefers-color-scheme: dark)")
  //   ? Theme.DARK
  //   : Theme.LIGHT;
  const defaultTheme = Theme.LIGHT;
  const [theme, setTheme] = useLocalStorage("theme", defaultTheme);

  return {
    theme,
    setTheme,
  };
}
