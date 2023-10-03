import { Node, createApi } from "./figma-rest-api";
import { downloadFormAWS } from "./getPngIcons";
import { Checker, searchTree } from "./utils";

const checker = ((parentOfParent: Node) => {
  return !!(
    "children" in parentOfParent &&
    parentOfParent.children.find(
      (el) => "children" in el && el.children.length > 0,
    )
  );
}) as Checker;

const getUrlImageAWS = async (el: Node[], scale = 1) => {
  const apis = createApi({ personalAccessToken: process.env.FIGMA_TOKEN! });
  const iconAws = await apis.getImage({
    fileKey: process.env.FIGMA_FILE_ID!,
    ids: el.map((item) => item.id),
    format: "png",
    scale,
  });
  const icons = Object.entries(iconAws.images).map(([id, url]) => ({
    url,
    name: el.find((el) => el.id === id)!.name,
  }));

  return await downloadFormAWS(icons, scale, process.env.IMAGES_PATH!);
};

const getImageByParams = async (node: Node) => {
  if ("children" in node) {
    const nodes = searchTree(node, checker)
      .map((node) => node.children)
      .flat()
      .map((node) => ("children" in node ? node.children : [node]))
      .flat();

    return await Promise.all([
      getUrlImageAWS(nodes, 1),
      getUrlImageAWS(nodes, 2),
      getUrlImageAWS(nodes, 3),
      getUrlImageAWS(nodes, 4),
    ]);
  }
  return [];
};

export const getPngImgs = async (node?: Node) => {
  if (node) {
    await getImageByParams(node);
  } else {
    throw new Error("Png icons not found");
  }
};
