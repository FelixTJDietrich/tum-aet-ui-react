import { useState } from 'react';
import type { Meta, StoryObj } from '@storybook/react-vite';
import { expect, fn, userEvent, within } from 'storybook/test';
import { Paginator, type PaginatorProps } from './paginator';

/** Holds the page and page size, like a consumer that owns the result set. */
function Controlled({
  page: initialPage = 0,
  pageSize: initialSize = 20,
  onPageChange,
  onPageSizeChange,
  ...rest
}: PaginatorProps) {
  const [page, setPage] = useState(initialPage);
  const [pageSize, setPageSize] = useState(initialSize);
  return (
    <Paginator
      {...rest}
      page={page}
      pageSize={pageSize}
      onPageChange={(next) => {
        setPage(next);
        onPageChange?.(next);
      }}
      onPageSizeChange={(next) => {
        setPage(0);
        setPageSize(next);
        onPageSizeChange?.(next);
      }}
    />
  );
}

const meta = {
  title: 'Data Display/Paginator',
  component: Paginator,
  args: {
    page: 2,
    pageSize: 20,
    totalRecords: 128,
    disabled: false,
    onPageChange: fn(),
    onPageSizeChange: fn(),
  },
  argTypes: {
    page: { control: { type: 'number', min: 0, step: 1 } },
    pageSize: { control: { type: 'number', min: 1, step: 1 } },
    totalRecords: { control: { type: 'number', min: 0, step: 1 } },
    onPageChange: { control: false },
    onPageSizeChange: { control: false },
  },
  render: (args) => <Controlled {...args} />,
  parameters: {
    layout: 'padded',
    docs: {
      description: {
        component:
          'Page links with first / previous / next / last buttons, a result range report and a rows-per-page select. Pages are zero-based. The paginator only requests pages: with `page` and `pageSize` set it is controlled and the consumer answers `onPageChange` / `onPageSizeChange`; without them it keeps its own state. Direction icons mirror in right-to-left layouts.',
      },
    },
  },
} satisfies Meta<typeof Paginator>;

export default meta;
type Story = StoryObj<typeof meta>;

export const Default: Story = {
  play: async ({ canvasElement, args }) => {
    const canvas = within(canvasElement);
    await userEvent.click(canvas.getByRole('button', { name: 'Next page' }));
    await expect(args.onPageChange).toHaveBeenCalledWith(3);
    await expect(canvas.getByRole('button', { name: '4' })).toHaveAttribute('aria-current', 'page');
  },
};

export const Empty: Story = {
  args: { page: 0, totalRecords: 0 },
};

export const Disabled: Story = {
  args: { disabled: true },
};

/** Without the report and the select, only the page buttons remain. */
export const Minimal: Story = {
  args: { showCurrentPageReport: false, showRowsPerPage: false },
};
