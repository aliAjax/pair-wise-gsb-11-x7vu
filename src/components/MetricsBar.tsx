import type { ChainStats } from "../rules/chain";

interface MetricsBarProps {
  stats: ChainStats;
}

const CARDS: { key: keyof ChainStats; label: string }[] = [
  { key: "total", label: "原单总数" },
  { key: "qualified", label: "合格（正常+已关闭）" },
  { key: "pending", label: "待复测" },
  { key: "retests", label: "复测次数" },
  { key: "blocked", label: "受阻项" },
];

export function MetricsBar({ stats }: MetricsBarProps) {
  const rows = [
    { label: "正常", value: stats.normal },
    { label: "待复测", value: stats.pending },
    { label: "已关闭", value: stats.closed },
  ];
  const max = Math.max(1, ...rows.map((row) => row.value));

  return (
    <>
      <section className="metrics">
        {CARDS.map((card) => (
          <article className="metric" key={card.key}>
            <span>{card.label}</span>
            <strong>{stats[card.key]}</strong>
          </article>
        ))}
      </section>
      <section className="panel chart-panel">
        <div className="mini-chart">
          {rows.map((row) => (
            <div className="bar" key={row.label}>
              <span>{row.label}</span>
              <div className="bar-track">
                <div className="bar-fill" style={{ width: `${(row.value / max) * 100}%` }} />
              </div>
              <strong>{row.value}</strong>
            </div>
          ))}
        </div>
      </section>
    </>
  );
}
