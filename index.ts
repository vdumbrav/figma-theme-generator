import { config } from "dotenv";
import { getColors } from "./src/getColors";
import { createApi } from "./src/figma-rest-api";
import { getSpacings } from "./src/getSpacings";
import { getBorders } from "./src/getBorders";
import { getSvgIcons } from "./src/getSvgIcons";
import { createFile } from "./src/utils";
import { getPngIcons } from "./src/getPngIcons";
import { Style, getTypography } from "./src/getTypography";
config({ path: "../.env.local" });
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
  await getSvgIcons(nodes.nodes[process.env.FIGMA_SVG_ICONS_ID!]?.document);
  await getPngIcons(nodes.nodes[process.env.FIGMA_PNG_ICONS_ID!]?.document);
  const typography = await getTypography(
    nodes.nodes[process.env.FIGMA_TYPOGRAPHY_ID!],
  );

  const light = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    ${colors
      .map((el) => `<color name="${el.name}">${el.light}</color>`)
      .join("\n    ")}
  </resources>
</xml>`;
  const dark = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    ${colors
      .map((el) => `<color name="${el.name}">${el.dark}</color>`)
      .join("\n    ")}
  </resources>
</xml>`;

  const theme = `import {Platform, DynamicColorIOS, PlatformColor} from "react-native";
const isIos = Platform.OS === "ios";
export const theme = {
  colors: {
    ${colors
      .map(
        (el) =>
          `${el.name}: isIos ? DynamicColorIOS({light: "${el.light}", dark: "${el.dark}"}) : PlatformColor("@android:color/${el.name}"),`,
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
}`;

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
