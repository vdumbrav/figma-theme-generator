import { Node, Api } from "./figma-rest-api";
import { Checker, createFile, fetchRetry, searchTree } from "./utils";

const checker = ((parentOfParent: Node) => {
  return !!(
    "children" in parentOfParent &&
    parentOfParent.children.find(
      (el) => "children" in el && el.children.length > 0,
    )
  );
}) as Checker;

const getUrlImageAWS = async (
  api: Api,
  el: Node[],
  scale = 1,
  path: string,
) => {
  const iconAws = await api.getImage({
    ids: el.map((item) => item.id),
    format: "png",
    scale,
  });
  const icons = Object.entries(iconAws.images).map(([id, url]) => ({
    url,
    name: el.find((el) => el.id === id)!.name,
  }));

  await downloadFormAWS(icons, scale, path);
};

const getImageByParams = async (api: Api, node: Node, path: string) => {
  if ("children" in node) {
    const nodes = searchTree(node, checker)
      .map((node) => node.children)
      .flat()
      .map((node) => ("children" in node ? node.children : [node]))
      .flat();

    return await Promise.all([
      getUrlImageAWS(api, nodes, 1, path),
      getUrlImageAWS(api, nodes, 2, path),
      getUrlImageAWS(api, nodes, 3, path),
      getUrlImageAWS(api, nodes, 4, path),
    ]);
  }
  return [];
};

export const getPngImgs = async (api: Api, path?: string, node?: Node) => {
  if (!path) return;
  if (node) {
    await getImageByParams(api, node, path);
  } else {
    throw new Error("Png icons not found");
  }
};

const downloadFormAWS = async (
  icon: { url: string | null; name: string }[],
  scale: number,
  pathToSave: string,
) => {
  const iconNames: { name: string; path: string }[] = [];
  await Promise.all(
    icon.map(async ({ name, url }) => {
      if (url) {
        const image = await fetchRetry(url);
        const fixedName =
          "_" +
          name
            .replace(/ ./g, (match) => match.charAt(1).toUpperCase())
            .replace(/\//g, "");

        const path = `${pathToSave}/${
          scale === 1 ? fixedName : `${fixedName}@${scale}x`
        }.png`;
        if (scale === 1) {
          iconNames.push({ name: fixedName, path });
        }
        await createFile(path, image);
        console.log("created png".padEnd(30, " "), path);
      }
    }),
  );
  return iconNames;
};
