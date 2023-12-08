import { Node, Api } from "./figma-rest-api";
import { createFile, fetchRetryText } from "./utils";
import sharp from "sharp";

export const getIcons = async (
  api: Api,
  path?: string,
  pngIds?: { id: string }[],
  node?: Node,
) => {
  if (!path) return;
  if (node && "children" in node) {
    const iconNodes = node.children.filter((el) => el.name.match(/^\d\d/));
    const iconAws = await api.getImage({
      ids: iconNodes.map((el) => el.id),
      format: "svg",
    });
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
          const imgPath = path + "/" + name;
          await createFile(imgPath + ".svg", image.replace(/fill=".*"/g, ""));
          console.log("created icon svg".padEnd(30, " "), imgPath);

          if (pngIds?.find((el) => el.id === iconNode.id)) {
            await createPngs(
              iconNode.absoluteBoundingBox.width,
              iconNode.absoluteBoundingBox.height,
              imgPath,
              Buffer.from(image.replace(/fill=".*"/g, `fill="#000000"`)),
            );
          }
        }
      }),
    );
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
      const imgPath = path + `${index > 1 ? `@${index}x` : ""}.png`;
      await createFile(
        imgPath,
        await sharp(svg)
          .resize({
            width: width * index,
            height: height * index,
          })
          .png()
          .toBuffer(),
      );
      console.log("created icon png".padEnd(30, " "), imgPath);
    }),
  );
};
