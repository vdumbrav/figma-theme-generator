import { Color, Node, PaintSolid } from "./figma-rest-api";
import { Checker, searchTree } from "./utils";

const checker = ((parentOfParent: Node) => {
  return !!(
    "children" in parentOfParent &&
    parentOfParent.children.find(
      (el) =>
        "children" in el &&
        el.children.find(
          (el) => el.type == "TEXT" && el.characters.startsWith("--"),
        ),
    )
  );
}) as Checker;

export const getColors = (node?: Node) => {
  if (node) {
    return searchTree(node, checker).map((node) => {
      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const el = node.children as any[];
      return {
        name: el[2].children[0].characters
          .replace("--", "")
          .replace(/-./g, (match: string) => match.charAt(1).toUpperCase()),
        light: getColorFromPaint(
          ("children" in el[0] ? el[0].children[0] : el[0]).fills[0],
        ),
        dark: getColorFromPaint(
          ("children" in el[1] ? el[1].children[0] : el[1]).fills[0],
        ),
      };
    });
  } else {
    throw new Error("Colors not found");
  }
};

export const getColorFromPaint = (paint: PaintSolid) => {
  const a = paint.opacity || paint.color.a;
  return getColorFromRGB(paint.color) + (a != 1 ? getHex(a) : "");
};

export const getColorFromRGB = (rgb: Color) => {
  const color = getHex(rgb.r) + getHex(rgb.g) + getHex(rgb.b);
  return `#${color}`;
};

export const getHex = (color = 0) => {
  return ("0" + Math.round(color * 255).toString(16)).slice(-2);
};
