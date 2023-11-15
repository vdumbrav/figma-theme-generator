import { Node, createApi } from "./figma-rest-api";
import { createFile, fetchRetryText } from "./utils";
import sharp from "sharp";

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
          const image = await fetchRetryText(url);

          const iconNode = iconNodes.find((el) => el.id === id)!;
          const name =
            "_" +
            iconNode.name
              .replace(/ ./g, (match) => match.charAt(1).toUpperCase())
              .replace(/\//g, "");
          const path = `${process.env.ICONS_PATH}/${name}.svg`;
          iconNames.push({ name, path });
          await createFile(path, image.replace(/fill=".*"/g, ""));
          const sharpSvg = Buffer.from(
            image.replace(/fill=".*"/g, `fill="#000000"`),
          );
          if (process.env.PNG_ICONS_IDS!.includes(iconNode.id)) {
            await createPngs(
              iconNode.absoluteBoundingBox.width,
              iconNode.absoluteBoundingBox.height,
              path.replace(".svg", ""),
              sharpSvg,
            );
          }
        }
      }),
    );
    return iconNames;
  } else {
    throw new Error("svg icons not found");
  }
};

const createPngs = async (
  width: number,
  height: number,
  path: string,
  svg: Buffer,
) => {
  await Promise.all(
    new Array(4).fill(0).map(async (_, i) => {
      const index = i + 1;
      await createFile(
        path + `${index > 1 ? `@${index}x` : ""}.png`,
        await sharp(svg)
          .resize({
            width: width * index,
            height: height * index,
          })
          .png()
          .toBuffer(),
      );
    }),
  );
};
