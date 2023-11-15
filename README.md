## Config for local develop
1. Change `config({ path: "../.env.local" });` to `config();` in `index.ts` file.
2. Need to create a .env.local file and place the following in it:

```FIGMA_API_URL=https://api.figma.com # Figma API URL
FIGMA_TOKEN=??? # Token for the Figma file Foundation
FIGMA_FILE_ID=G2eZ01ZtRYTCfSOaDy4vz8 # File ID for styles
FIGMA_COLORS_ID=230:956 # Container ID for colors
FIGMA_SPACINGS_ID=71:4899 # Container ID for spacings
FIGMA_RADIUS_ID=75:4989 # Container ID for border radii
FIGMA_SVG_ICONS_ID=90:1204 # Container ID for monochrome SVG icons
PNG_ICONS_IDS=91:2097,91:2094,91:2092 # Node IDs separated by commas for monochrome PNG icons
FIGMA_SVG_IMG_ID=655:126 # Container ID for SVG icons
FIGMA_PNG_IMG_ID=627:134 # Container ID for PNG icons
FIGMA_TYPOGRAPHY_ID=345:1259 # Container ID for typography
ICONS_PATH=../test/icon # Path to place the generated monochrome icons in the project (ensure to include "../" at the beginning)
IMAGES_PATH=../test/img # Path to place the generated icons in the project (ensure to include "../" at the beginning)
PATH_ANDROID_LIGHT=../android/app/src/main/res/values/colors.xml # Path to place the generated light theme colors for Android in the project
PATH_ANDROID_DARK=../android/app/src/main/res/values-night/colors.xml # Path to place the generated dark theme colors for Android in the project
PATH_THEME=../src/shared/theme/theme.ts # Path to place the generated spacings, borders, typography, and colors for iOS in the project
PATH_CSS=./test/theme.scss # Path to place the generated SCSS styles in the project.
```

### Init submodule for figma api

`git submodule update --init --recursive --remote`
