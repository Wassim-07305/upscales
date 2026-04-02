import type { ComponentConfig } from "@measured/puck";

interface SpacerProps {
  height: number;
}

export const Spacer: ComponentConfig<SpacerProps> = {
  label: "Espacement",
  fields: {
    height: {
      type: "number",
      label: "Hauteur (px)",
      min: 8,
      max: 200,
    },
  },
  defaultProps: {
    height: 48,
  },
  render: ({ height }) => <div style={{ height }} />,
};
