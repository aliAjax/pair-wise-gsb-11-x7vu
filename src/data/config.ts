export const project = {
  industry: "石油",
  title: "油气回收检测复测台",
  subtitle:
    "按区域与枪号登记液阻、密闭性衰减与气液比；任一指标越限即转入待复测并落实责任人与期限，复测仍越限保留新旧值并顺延，全部合限方可关闭原单。",
  stack: ["React", "Vite", "TypeScript", "Zustand", "Ant Design"],
  storageKey: "dfwlfront-10-vapor-recovery",
  formTitle: "新增油气回收检测",
  primaryAction: "登记检测",
} as const;

export interface AreaOption {
  name: string;
  nozzles: string[];
}

export const AREAS: AreaOption[] = [
  { name: "前场加油区", nozzles: ["1号枪", "2号枪", "3号枪", "4号枪", "5号枪", "6号枪"] },
  { name: "后场加油区", nozzles: ["7号枪", "8号枪", "9号枪", "10号枪"] },
  { name: "公交专用区", nozzles: ["11号枪", "12号枪"] },
];

export const AREA_FILTERS = ["全部区域", ...AREAS.map((area) => area.name)];

export const STATUS_FILTERS = ["全部状态", "正常", "待复测", "已关闭"];

export function nozzlesOf(areaName: string): string[] {
  return AREAS.find((area) => area.name === areaName)?.nozzles ?? [];
}
