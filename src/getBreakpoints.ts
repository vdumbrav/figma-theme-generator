import { Node } from "./figma-rest-api";
export const getBreakpoints = (node?: Node) => {
  if (node && "children" in node) {
    return node.children.reduce((accum, current) => {
      if(+current.name.split(" ")[1] && current.type == "TEXT") {
        return [...accum, { name: current.name.split(" ")[0], value: current.name.split(" ")[1] }];
      }
      return accum;
    }, [] as {name: string, value: string}[]);
  } else {
    throw new Error("borders not found");
  }
};