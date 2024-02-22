import { config } from "dotenv";
import { getColors } from "./src/getColors";
import { createApi } from "./src/figma-rest-api";
import { getSpacings } from "./src/getSpacings";
import { getBorders } from "./src/getBorders";
import { getIcons } from "./src/getIcons";
import { createFile } from "./src/utils";
import { Style, getTypography } from "./src/getTypography";
import { getPngImgs } from "./src/getPngImgs";
import { getSvgImgs } from "./src/getSvgImgs";
import { getBreakpoints } from "./src/getBreakpoints";

type Params = {
  /**
   * File ID for styles
   */
  figmaFileId: string;
  /**
   * Container ID for colors
   */
  colorsNodeId: string;
  /**
   * Container ID for spacings
   */
  spacingsNodeId: string;
  /**
   * Container ID for border radii
   */
  bordersNodeId: string;
  /**
   * Container ID for breakpoints
   */
  breakpointsNodeId?: string;
  /**
   * Container ID for monochrome SVG icons
   */
  iconsNodeId: string;
  /**
   * Container ID for typography
   */
  typographyNodeId: string;
  /**
   * Container ID for PNG icons
   */
  pngImgNodeId: string;
  /**
   * Container ID for SVG icons
   */
  svgImgNodeId: string;
  /**
   * Path to place the generated spacings, borders, typography, and colors for iOS in the project
   */
  themePath?: string;
  /**
   * Path to place the generated light theme colors for Android in the project
   */
  androidLightPath?: string;
  /**
   * Path to place the generated dark theme colors for Android in the project
   */
  androidDarkPath?: string;
  /**
   * Path to place the generated SCSS styles in the project
   */
  cssPath?: string;
  /**
   * Path to place the generated monochrome icons in the project
   */
  iconsPath?: string;
  /**
   * Path to place the generated images in the project
   */
  imgPath?: string;
  /**
   * Path to place the generated SVG icons in the project
   */
  svgPath?: string;
  /**
   * List icons that should be generated as PNG
   */
  pngIcons?: {
    /**
     * Figma icon node id
     */
    id: string;
    /**
     * Just for identification
     */
    description: string;
  }[];
  /**
   * Path to env file with figma token
   */
  envPath?: string;
  /**
   * Defines how styles should be applied. Options are 'cssClass' for direct CSS class application
   * or 'mixin' for generating and using SCSS mixins.
   */
  styleType?: 'cssClass' | 'mixin';
};

export async function generate({
  figmaFileId,
  colorsNodeId,
  spacingsNodeId,
  bordersNodeId,
  breakpointsNodeId,
  iconsNodeId,
  typographyNodeId,
  pngImgNodeId,
  svgImgNodeId,
  themePath,
  androidLightPath,
  androidDarkPath,
  cssPath,
  iconsPath,
  imgPath,
  svgPath,
  pngIcons,
  envPath,
  styleType,
}: Params) {
  const figmaToken = config({ path: envPath || ".env.local" }).parsed?.[
    "FIGMA_TOKEN"
  ];
  if (!figmaToken) {
    throw new Error("figma token not found");
  }
  const apis = createApi({
    personalAccessToken: figmaToken,
    fileKey: figmaFileId,
  });
  console.log("fetch figma file");
  const ids = [
    colorsNodeId,
    spacingsNodeId,
    bordersNodeId,
    iconsNodeId,
    typographyNodeId,
    pngImgNodeId,
    svgImgNodeId,
  ];
  const nodes = await apis.getFileNodes({
    fileKey: figmaFileId,
    ids: breakpointsNodeId ? [...ids, breakpointsNodeId] : ids,
  });
  const colors = getColors(nodes.nodes[colorsNodeId]?.document);
  const spacings = getSpacings(nodes.nodes[spacingsNodeId]?.document);
  const borders = getBorders(nodes.nodes[bordersNodeId]?.document);
  const typography = getTypography(nodes.nodes[typographyNodeId]);
  const breakpoints = breakpointsNodeId ? getBreakpoints(nodes.nodes[breakpointsNodeId]?.document) : undefined;
  console.log("create images");
  await Promise.all([
    getIcons(apis, iconsPath, pngIcons, nodes.nodes[iconsNodeId]?.document),
    getPngImgs(apis, imgPath, nodes.nodes[pngImgNodeId]?.document),
    getSvgImgs(apis, svgPath, nodes.nodes[svgImgNodeId]?.document),
  ]);

  console.log("write files");
  await createThemeFile(spacings, borders, typography, breakpointsNodeId ? undefined : colors, themePath);
  await createAndroidFiles(colors, androidLightPath, androidDarkPath);
  await createCssFile(colors, spacings, borders, typography, breakpoints, cssPath, styleType);
  console.log("success");
}

const createThemeFile = async (
  spacings: ReturnType<typeof getSpacings>,
  borders: ReturnType<typeof getBorders>,
  typography: ReturnType<typeof getTypography>,
  colors?: ReturnType<typeof getColors>,
  path?: string,
) => {
  if (path) {
    const file = `import {Platform, DynamicColorIOS, PlatformColor} from "react-native";
const isIos = Platform.OS === "ios";
export const theme = {
  colors: {
    transparent: "transparent",
    ${colors
        ?.map(
          (el) =>
            `${el.name}: isIos ? DynamicColorIOS({ light: "${el.light}", dark: "${el.dark}"}) : PlatformColor("@color/${el.name}"),
    ${el.name}Object: { light: "${el.light}", dark: "${el.dark}"},`,
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
    await createFile(path, file);
  }
};

const createAndroidFiles = async (
  colors: ReturnType<typeof getColors>,
  light?: string,
  dark?: string,
) => {
  if (light) {
    const file = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    <color name="primary_dark">#FFFFFF</color>

    ${colors
        .map(
          (el) =>
            `<color name="${el.name}">${el.light.length > 7
              ? "#" + el.light.slice(-2) + el.light.slice(1, 7)
              : el.light
            }</color>`,
        )
        .join("\n    ")}
  </resources>`;

    await createFile(light, file);
  }

  if (dark) {
    const file = `<?xml version="1.0" encoding="utf-8"?>
  <resources>
    <color name="primary_dark">#000000</color>

    ${colors
        .map(
          (el) =>
            `<color name="${el.name}">${el.dark.length > 7
              ? "#" + el.dark.slice(-2) + el.dark.slice(1, 7)
              : el.dark
            }</color>`,
        )
        .join("\n    ")}
  </resources>`;

    await createFile(dark, file);
  }
};

const createCssFile = async (
  colors: ReturnType<typeof getColors>,
  spacings: ReturnType<typeof getSpacings>,
  borders: ReturnType<typeof getBorders>,
  typography: ReturnType<typeof getTypography>,
  breakpoints?: ReturnType<typeof getBreakpoints>,
  path?: string,
  styleType: 'cssClass' | 'mixin' = 'cssClass'
) => {
  if (path) {
    const file = `
@use "sass:map";

${colors.map((el) => `$${el.name}: ${el.light}`).join(";\n")};
${colors.map((el) => `$${el.name}-dark: ${el.dark}`).join(";\n")};

$themes: (
  light: (
    ${colors.map((el) => `${el.name}: $${el.name}`).join(",\n    ")}
  ),
  dark: (
    ${colors.map((el) => `${el.name}: $${el.name}-dark`).join(",\n    ")}
  ),
);

@mixin themed {
    @each $theme, $map in $themes {
      :global(.#{$theme}) & {
        $theme-map: () !global;
  
        @each $key, $submap in $map {
          $value: map.get($map, $key);
          $theme-map: map.merge(
            $theme-map,
            (
              $key: $value,
            )
          ) !global;
        }
        @content;
  
        $theme-map: null !global;
      }
    }
  }
  
  @mixin gthemed {
    @each $theme, $map in $themes {
      .#{$theme} & {
        $theme-map: () !global;
  
        @each $key, $submap in $map {
          $value: map.get($map, $key);
          $theme-map: map.merge(
            $theme-map,
            (
              $key: $value,
            )
          ) !global;
        }
        @content;
  
        $theme-map: null !global;
      }
    }
  }
  
  @function t($key) {
    @return map-get($theme-map, $key);
  }
  
${spacings.map((el) => `$${el.name}: ${el.value}px`).join(";\n")};

${borders.map((el) => `$${el.name}: ${el.value}px`).join(";\n")};

${breakpoints?.map((el) => `$${el.name}: ${el.value}px`).join(";\n") ?? ''};

${typography
  .map((el) => {
      const cssContent = styleToCss(el.value);
      return styleType === 'mixin'
          ? `@mixin ${el.name} {\n  ${cssContent}\n}`
          : `.${el.name} {\n  ${cssContent}\n}`;
  })
  .join(styleType === 'mixin' ? "\n" : ";\n") + (styleType !== 'mixin' ? ';' : '')};
`;

    await createFile(path, file);
  }
};

const styleToCss = (style: Style) => {
  return Object.entries(style)
    .map(([k, v]) => {
      const key = k as keyof Style;
      switch (key) {
        case "fontFamily":
          return `font-family: var(--${`${v}`.toLowerCase()});`;
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
