import type { Meta, StoryObj } from "@storybook/react";
import TransparentButton from "./TransparentButton";

const meta = {
  title: "Shared/TransparentButton",
  component: TransparentButton,
  args: {
    children: "Transparent Button",
  },
  argTypes: {
    borderRadius: { control: "text" },
    border: { control: "text" },
    borderColor: { control: "color" },
  },
} satisfies Meta<typeof TransparentButton>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {};

export const DashedBorder: Story = {
  args: {
    border: "2px dashed",
    borderColor: "#f59e0b",
  },
};

export const CustomRadius: Story = {
  args: {
    borderRadius: "999px",
  },
};

export const FullCustom: Story = {
  args: {
    borderRadius: "0.25rem",
    border: "3px solid",
    borderColor: "#06b6d4",
    children: "Outline Button",
  },
};
