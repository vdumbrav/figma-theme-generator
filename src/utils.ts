import { FRAME, GROUP, Node, NodeCommon } from "./figma-rest-api";
import { promises as fs } from "fs";

const delay = (ms: number) => new Promise((res) => setTimeout(res, ms));
export const fetchRetry = async (
  url: string,
  retries = 5,
): Promise<ArrayBuffer> => {
  try {
    return await fetch(url).then((res) => res.arrayBuffer());
  } catch (e) {
    if (retries > 0) {
      await delay(500);
      return fetchRetry(url, retries - 1);
    } else {
      throw e;
    }
  }
};

export type Checker = (
  node: Node,
) => node is NodeCommon &
  (({ type: "FRAME" } & FRAME) | ({ type: "GROUP" } & GROUP));

export type NodesWithChildren = NodeCommon &
  (({ type: "FRAME" } & FRAME) | ({ type: "GROUP" } & GROUP));

export const searchTree = <T = Node>(
  element: Node,
  checker: (node: Node | T) => node is T,
  nodes: T[] = [],
) => {
  if (checker(element)) {
    nodes.push(element);
  } else if ("children" in element) {
    element.children.forEach((el) => searchTree(el, checker, nodes));
  }
  return nodes;
};

export const createFile = async (path: string, content: ArrayBuffer | string) => {
  await fs.mkdir(process.env.ICONS_PATH!, { recursive: true });
  await fs.writeFile(path, typeof content === "string" ? content : Buffer.from(content));
};
