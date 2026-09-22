import type { ChainStatus } from "../data/types";

const STATUS_CLASS: Record<ChainStatus, string> = {
  正常: "st-ok",
  待复测: "st-wait",
  顺延复测: "st-extend",
  已关闭: "st-closed",
};

export function StatusBadge({ status }: { status: ChainStatus }) {
  return <span className={`status ${STATUS_CLASS[status]}`}>{status}</span>;
}
