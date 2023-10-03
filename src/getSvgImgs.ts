import { Node, createApi } from "./figma-rest-api";
import { createFile, fetchRetryText } from "./utils";

export const getSvgImgs = async (node?: Node) => {
  const apis = createApi({ personalAccessToken: process.env.FIGMA_TOKEN! });
  if (node && "children" in node) {
    const iconAws = await apis.getImage({
      fileKey: process.env.FIGMA_FILE_ID!,
      ids: node.children.map((el) => el.id),
      format: "svg",
    });
    const iconNames: { name: string; path: string }[] = [];
    await Promise.all(
      Object.entries(iconAws.images).map(async ([id, url]) => {
        if (url) {
          const image = await fetchRetryText(url);

          const name = node.children.find((el) => el.id === id)!.name;
          const path = `${process.env.IMAGES_PATH}/${name}.svg`;
          iconNames.push({ name, path });
          await createFile(path, image.replace(/fill=".*"/g, ""));
        }
      }),
    );
    return iconNames;
  } else {
    throw new Error("svg icons not found");
  }
};
