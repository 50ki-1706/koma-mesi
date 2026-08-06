import type { Meta, StoryObj } from "@storybook/react";
import Button from "./Button";

const meta = {
  title: "Shared/Button",
  component: Button,
  args: {
    children: "Button",
  },
  argTypes: {
    borderRadius: { control: "text" },
    background: { control: "color" },
  },
} satisfies Meta<typeof Button>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const CustomRadius: Story = {
  args: {
    borderRadius: "999px",
  },
};

export const CustomColor: Story = {
  args: {
    background: "#10b981",
  },
};

export const FullCustom: Story = {
  args: {
    borderRadius: "999px",
    background: "#8b5cf6",
    children: "Custom Button",
  },
};
