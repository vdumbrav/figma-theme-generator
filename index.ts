import { config } from "dotenv";
import { getColors } from "./src/getColors";
import { createApi } from "./src/figma-rest-api";
import { getSpacings } from "./src/getSpacings";
import { getBorders } from "./src/getBorders";
import { getSvgIcons } from "./src/getSvgIcons";
import { createFile } from "./src/utils";
import { getPngIcons } from "./src/getPngIcons";
import { Style, getTypography } from "./src/getTypography";
import { getPngImgs } from "./src/getPngImgs";
import { getSvgImgs } from "./src/getSvgImgs";
config({ path: "../.env.local" });
// config();
export async function main() {
  const apis = createApi({ personalAccessToken: process.env.FIGMA_TOKEN! });
  const nodes = await apis.getFileNodes({
    fileKey: process.env.FIGMA_FILE_ID!,
    ids: [
      process.env.FIGMA_COLORS_ID!,
      process.env.FIGMA_SPACINGS_ID!,
      process.env.FIGMA_RADIUS_ID!,
      process.env.FIGMA_SVG_ICONS_ID!,
      process.env.FIGMA_PNG_ICONS_ID!,
      process.env.FIGMA_TYPOGRAPHY_ID!,
      process.env.FIGMA_PNG_IMG_ID!,
      process.env.FIGMA_SVG_IMG_ID!,
    ],
  });
  const colors = await getColors(
    nodes.nodes[process.env.FIGMA_COLORS_ID!]?.document,
  );
  const spacings = await getSpacings(
    nodes.nodes[process.env.FIGMA_SPACINGS_ID!]?.document,
  );
  const borders = await getBorders(
    nodes.nodes[process.env.FIGMA_RADIUS_ID!]?.document,
  );
  await Promise.all([
    getSvgIcons(nodes.nodes[process.env.FIGMA_SVG_ICONS_ID!]?.document),
    getPngIcons(nodes.nodes[process.env.FIGMA_PNG_ICONS_ID!]?.document),
    getPngImgs(nodes.nodes[process.env.FIGMA_PNG_IMG_ID!]?.document),
    getSvgImgs(nodes.nodes[process.env.FIGMA_SVG_IMG_ID!]?.document),
  ]);

  const typography = await getTypography(
    nodes.nodes[process.env.FIGMA_TYPOGRAPHY_ID!],
  );

  const light = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    <color name="primary_dark">#FFFFFF</color>

    ${colors
      .map(
        (el) =>
          `<color name="${el.name}">${
            el.light.length > 7
              ? "#" + el.light.slice(-2) + el.light.slice(1, 7)
              : el.light
          }</color>`,
      )
      .join("\n    ")}
  </resources>`;
  const dark = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    <color name="primary_dark">#000000</color>

    ${colors
      .map(
        (el) =>
          `<color name="${el.name}">${
            el.dark.length > 7
              ? "#" + el.dark.slice(-2) + el.dark.slice(1, 7)
              : el.dark
          }</color>`,
      )
      .join("\n    ")}
  </resources>`;

  //todo revert Appearance after merge https://github.com/facebook/react-native/pull/39893
  const theme = `import {Platform, DynamicColorIOS, Appearance} from "react-native";
const isIos = Platform.OS === "ios";
export const theme = {
  colors: {
    ${colors
      .map(
        (el) =>
          `${el.name}: isIos ? DynamicColorIOS({light: "${el.light}", dark: "${el.dark}"}) : Appearance.getColorScheme() != "dark" ? "${el.light}" : "${el.dark}",`, //PlatformColor("@color/${el.name}"),`,
      )
      .join("\n    ")}
  },
  spacings: {
    ${spacings.map((el) => `${el.name}: ${el.value},`).join("\n    ")}
  },
  borders: {
    ${borders.map((el) => `${el.name}: ${el.value},`).join("\n    ")}
  },
  typography: {
    ${typography
      .map(
        (el) =>
          `${el.name}: {\n      ${Object.entries(el.value!)
            .map(
              (el) =>
                `${el[0]}: ${typeof el[1] === "string" ? `"${el[1]}"` : el[1]}`,
            )
            .join(",\n      ")}\n    },`,
      )
      .join("\n    ")}
  }
} as const`;

  const css = `${colors.map((el) => `$${el.name}: ${el.light}`).join(";\n")};
@media (prefers-color-scheme: dark) {
  ${colors.map((el) => `$${el.name}: ${el.dark}`).join(";\n  ")};
}
${spacings.map((el) => `$${el.name}: ${el.value}`).join(";\n")};
${borders.map((el) => `$${el.name}: ${el.value}`).join(";\n")};
${typography
  .map((el) => `.${el.name} {\n  ${styleToCss(el.value)}\n}`)
  .join(";\n")};
`;

  process.env.PATH_ANDROID_LIGHT &&
    (await createFile(process.env.PATH_ANDROID_LIGHT, light));
  process.env.PATH_ANDROID_DARK &&
    (await createFile(process.env.PATH_ANDROID_DARK, dark));
  process.env.PATH_THEME && (await createFile(process.env.PATH_THEME, theme));
  process.env.PATH_CSS && (await createFile(process.env.PATH_CSS, css));
}
main();

const styleToCss = (style: Style) => {
  return Object.entries(style)
    .map(([k, v]) => {
      const key = k as keyof Style;
      switch (key) {
        case "fontFamily":
          return `font-family: ${v}, sans-serif;`;
        case "fontSize":
          return `font-size: ${v}px;`;
        case "fontWeight":
          return `font-weight: ${v};`;
        case "letterSpacing":
          return `letter-spacing: ${v}px;`;
        case "lineHeight":
          return `line-height: ${v}px;`;
      }
    })
    .join("\n  ");
};
