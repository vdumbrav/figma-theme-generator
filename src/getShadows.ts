import { Node, EffectShadow, isEffectShadow } from "./figma-rest-api";

function findShadowEffects(
  node: Node,
  colorScheme: string,
  currentSection: string = ""
): EffectShadow[] {
  // Initialize the current section name if we're in a new section
  if (colorScheme === "SECTION") {
    currentSection = node.name;
  }

  const shadows: EffectShadow[] = [];

  // Process shadow effects for the current node
  if ("effects" in node) {
    const nodeShadows: EffectShadow[] = node.effects
      .filter(isEffectShadow)
      .map((effect) => ({
        ...effect,
        name: node.name,
        colorScheme: currentSection,
      }));
    shadows.push(...nodeShadows);
  }

  // Recursively search for shadows in child nodes
  if ("children" in node) {
    node.children.forEach((child) => {
      const childShadows = findShadowEffects(child, child.type, currentSection);
      shadows.push(...childShadows);
    });
  }

  return shadows;
}

export const getShadows = (node?: Node) => {
  if (!node) {
    throw new Error("Node is undefined");
  }

  // Directly use node.type for the colorScheme to simplify the call
  const shadowEffects = findShadowEffects(node, node.type);

  return shadowEffects.map((effect) => {
    const { color, offset, radius, spread, blendMode, type, name, colorScheme } = effect;
    const rgbaColor = `rgba(${Math.round(color.r * 255)}, ${Math.round(
      color.g * 255
    )}, ${Math.round(color.b * 255)}, ${color.a})`;
    return {
      name,
      colorScheme,
      type,
      color: rgbaColor,
      offsetX: offset.x,
      offsetY: offset.y,
      blur: radius,
      spread: spread ?? 0, // Default to 0 if spread is undefined
      blendMode,
    };
  });
};
