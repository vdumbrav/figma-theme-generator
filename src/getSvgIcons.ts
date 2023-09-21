import { Node, createApi } from "./figma-rest-api";
import { createFile, fetchRetry } from "./utils";

export const getSvgIcons = async (node?: Node) => {
  const apis = createApi({ personalAccessToken: process.env.FIGMA_TOKEN! });
  if (node && "children" in node) {
    const iconNodes = node.children.filter((el) => el.name.match(/^\d\d/));
    const iconAws = await apis.getImage({
      fileKey: process.env.FIGMA_FILE_ID!,
      ids: iconNodes.map((el) => el.id),
      format: "svg",
    });
    const iconNames: { name: string; path: string }[] = [];
    await Promise.all(
      Object.entries(iconAws.images).map(async ([id, url]) => {
        if (url) {
          const image = await fetchRetry(url);
          const name =
            "_" +
            iconNodes
              .find((el) => el.id === id)!
              .name.replace(/ ./g, (match) => match.charAt(1).toUpperCase())
              .replace(/\//g, "");
          const path = `${process.env.ICONS_PATH}/${name}.svg`;
          iconNames.push({ name, path });
          await createFile(path, image);
        }
      }),
    );
    return iconNames;
  } else {
    console.log("svg icons not found");
    return [];
  }
};
