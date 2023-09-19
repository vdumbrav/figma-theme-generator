import { AxiosResponse, Method as AxiosMethod } from "axios";
import { FRAME, GROUP, Node, NodeCommon } from "./figma-rest-api";
import { promises as fs } from "fs";

export function toQueryParams(x: any): string {
  if (!x) return "";
  return Object.entries(x)
    .map(([k, v]) => k && v && `${k}=${encodeURIComponent(v as any)}`)
    .filter(Boolean)
    .join("&");
}

export type Disposer = () => void;

export class ApiError extends Error {
  constructor(public response: AxiosResponse, message?: string) {
    super(message);
  }
}

export type ApiRequestMethod = <T>(
  url: string,
  opts?: { method: AxiosMethod; data: string }
) => Promise<T>;

export type Checker = (
  node: Node
) => node is NodeCommon &
  (({ type: "FRAME" } & FRAME) | ({ type: "GROUP" } & GROUP));

export type NodesWithChildren = NodeCommon &
  (({ type: "FRAME" } & FRAME) | ({ type: "GROUP" } & GROUP));

export const searchTree = <T = Node>(
  element: Node,
  checker: (node: Node | T) => node is T,
  nodes: T[] = []
) => {
  if (checker(element)) {
    nodes.push(element);
  } else if ("children" in element) {
    element.children.forEach((el) => searchTree(el, checker, nodes));
  }
  return nodes;
};

export const createFile = async (path: string, content: string) => {
  await fs.mkdir(process.env.ICONS_PATH!, { recursive: true });
  await fs.writeFile(path, content);
};
