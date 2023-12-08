import { Node, Api } from "./figma-rest-api";
import { createFile, fetchRetryText } from "./utils";

export const getSvgImgs = async (api: Api, path?: string, node?: Node) => {
  if (!path) return;
  if (node && "children" in node) {
    await Promise.all(
      node.children.map(async (elNode) => {
        if ("children" in elNode) {
          const iconAws = await api.getImage({
            ids: elNode.children.map((el) => el.id),
            format: "svg",
          });
          await Promise.all(
            Object.entries(iconAws.images).map(async ([id, url]) => {
              if (url) {
                const image = await fetchRetryText(url);

                const name = elNode.children.find((el) => el.id === id)!.name;
                const svgPath = path + "/" + name;
                await createFile(
                  svgPath + `.svg`,
                  image.replace(/;[-a-z]*:color\(display-p3.*\)/, ""),
                );
                console.log("created svg".padEnd(30, " "), svgPath);
              }
            }),
          );
        }
      }),
    );
  } else {
    throw new Error("svg icons not found");
  }
};
