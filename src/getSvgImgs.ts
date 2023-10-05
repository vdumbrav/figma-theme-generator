import { Node, createApi } from "./figma-rest-api";
import { createFile, fetchRetryText } from "./utils";

export const getSvgImgs = async (node?: Node) => {
  const apis = createApi({ personalAccessToken: process.env.FIGMA_TOKEN! });
  if (node && "children" in node) {
    node.children.map(async (elNode) => {
      if ("children" in elNode) {
        const iconAws = await apis.getImage({
          fileKey: process.env.FIGMA_FILE_ID!,
          ids: elNode.children.map((el) => el.id),
          format: "svg",
        });
        const iconNames: { name: string; path: string }[] = [];
        await Promise.all(
          Object.entries(iconAws.images).map(async ([id, url]) => {
            if (url) {
              const image = await fetchRetryText(url);

              const name = elNode.children.find((el) => el.id === id)!.name;
              const path = `${process.env.IMAGES_PATH}/${name}.svg`;
              iconNames.push({ name, path });
              await createFile(path, image);
            }
          }),
        );
        return iconNames;
      }
    });
  } else {
    throw new Error("svg icons not found");
  }
};
