import { Node } from "./figma-rest-api";
export const getBreakpoints = (node?: Node) => {
  if (node && "children" in node) {
    return node.children.reduce((accum, current) => {
      if(+current.name.split(" ")[1] && current.type == "TEXT") {
        return [...accum, current.name.split(" ")[1]];
      }
      return accum;
    }, [] as string[]);
  } else {
    throw new Error("borders not found");
  }
};