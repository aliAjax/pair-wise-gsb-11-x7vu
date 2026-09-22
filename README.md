# 油气回收检测复测台

- 行业：石油
- 技术栈：React、Vite、TypeScript、Zustand、Ant Design
- 启动：`npm install && npm run dev`
- 构建：`npm run build`

由油站设备巡检清单扩展而来，数据保存在浏览器 localStorage（键：`dfwlfront-10-vapor-recovery`）。

## 业务规则

- 检测按区域、枪号登记三项指标：液阻（≤ 40 Pa）、密闭性衰减（≤ 30 Pa）、气液比（1.00 ~ 1.20）。
- 任一项越限即进入「待复测」，必须填写责任人与复测期限。
- 待复测链只能新增关联原单的复测，不提供记正常入口，也不计入合格数。
- 复测仍越限：新旧值一并保留在链历史中，须填写顺延后的期限（须晚于当前期限）。
- 复测（或更正）后全部合限才关闭原单；更正必须填写原因，旧版快照另存于更正记录。
- 统计（原单数、合格数、待复测数、复测次数、受阻项）全部由持久化的检测单推导，重载后一致。
- 受阻项列表展示枪号、指标、原值、最新值、限值与规则。

## 目录结构（数据 / 规则 / 页面分拆）

```
src/
  types.ts               共享类型（检测单、更正、持久化状态）
  utils.ts               id 与时间格式化
  data/
    config.ts            站点文案、区域与枪号、存储键
    seed.ts              首次加载的示例检测链
  rules/
    metrics.ts           三项指标限值与越限判定
    chain.ts             复测链推导、统计、受阻项汇总
  store/
    storage.ts           localStorage 读写与回退
  components/            表单、链卡片、受阻项表、更正记录等
  pages/
    ConsolePage.tsx      主页面组装与状态流转
```
