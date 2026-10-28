const COMMON_PROPERTIES = ["opacity", "width", "height", "rotation"];
const STROKE_PROPERTIES = ["strokeColor", "strokeWidth"];
const FILL_PROPERTIES = ["fillStyle", "fillColor", "gradientType", "gradientStops"];
const FONT_PROPERTIES = ["fontSize", "fontFamily", "textColor"];
const SHAPE_PROPERTIES = [...COMMON_PROPERTIES, ...STROKE_PROPERTIES, ...FILL_PROPERTIES];

const ELEMENT_PROPERTIES = new Map([
  ...["rectangle", "ellipse", "diamond", "parallelogram", "star"].map(type => [type, new Set(SHAPE_PROPERTIES)]),
  ...["line", "arrow", "image", "website"].map(type => [type, new Set([...COMMON_PROPERTIES, ...STROKE_PROPERTIES])]),
  ["path", new Set(["opacity", "rotation", ...STROKE_PROPERTIES])],
  ["text", new Set([...COMMON_PROPERTIES, ...STROKE_PROPERTIES, ...FONT_PROPERTIES, "textAlign"])],
  ...["markdown", "table"].map(type => [type, new Set([...SHAPE_PROPERTIES, ...FONT_PROPERTIES])]),
]);

export function supportsElementProperty(element, propertyName) {
  return ELEMENT_PROPERTIES.get(element?.type)?.has(propertyName) || false;
}
