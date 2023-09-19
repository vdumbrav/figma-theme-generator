import { Node } from "./figma-rest-api";

export const getSpacings = async (node?: Node) => {
  if (node && "children" in node) {
    return node.children.map((el) => {
      if ("children" in el && el.children[0].type == "TEXT") {
        return {
          name: el.children[0].characters
            .replace("--", "")
            .replace(/-./g, (match: any) => match.charAt(1).toUpperCase())
            .replace(/\d/, "_$&"),
          value: el.children[1].absoluteBoundingBox.width,
        };
      } else {
        throw new Error("spacings bad");
      }
    });
  } else {
    console.log("spacings not found");
    return [];
  }
};
