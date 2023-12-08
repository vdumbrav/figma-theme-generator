import { Node } from "./figma-rest-api";

export const getBorders = (node?: Node) => {
  if (node && "children" in node) {
    return node.children.map((el) => {
      if (
        "children" in el &&
        el.children[0].type == "TEXT" &&
        "cornerRadius" in el.children[1]
      ) {
        return {
          name: el.children[0].characters
            .replace("--", "")
            .replace(/-./g, (match) => match.charAt(1).toUpperCase()),
          value: el.children[1].cornerRadius,
        };
      } else {
        throw new Error("borders bad");
      }
    });
  } else {
    throw new Error("borders not found");
  }
};
