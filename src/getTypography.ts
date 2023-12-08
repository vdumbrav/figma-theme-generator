import { FileNode, Node, NodeCommon, TEXT } from "./figma-rest-api";
import { searchTree } from "./utils";

export const getTypography = (fileNode: FileNode | null) => {
  if (fileNode?.document) {
    const stylesIds = Object.keys(fileNode.styles);
    const checker = (
      node: Node,
    ): node is NodeCommon & { type: "TEXT" } & TEXT => {
      return !!(
        node.type == "TEXT" &&
        node.styles?.text &&
        stylesIds.includes(node.styles?.text)
      );
    };
    return searchTree(fileNode.document, checker).map((el) => {
      const name = fileNode.styles[el.styles!.text].name.replace(/\/| /g, "");
      return {
        name: name[0].toLowerCase() + name.slice(1),
        value: getTypographyFromText(el),
      };
    });
  } else {
    throw new Error("Typography not found");
  }
};

export type Style = {
  fontFamily: string;
  fontSize: number;
  fontWeight: "100";
  letterSpacing: number;
  lineHeight: number;
};

const getTypographyFromText = (node: TEXT): Style => {
  return {
    fontFamily: node.style.fontPostScriptName || node.style.fontFamily,
    fontSize: node.style.fontSize,
    fontWeight: node.style.fontWeight.toString() as "100",
    letterSpacing: node.style.letterSpacing,
    lineHeight: node.style.lineHeightPx,
  };
};
