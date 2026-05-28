import { RecommendRenovationTargetsInput } from '../schemas.js';
import { calculateRenovationYield } from '../analysis/renovation_yield.js';
import { loadChochouData } from '../api-client/nagoya.js';

interface RankedTarget {
  rank: number;
  ward: string;
  chochou: string;
  grossYieldPct: number;
  netYieldPct: number;
  estimatedRentMonthly: number;
  totalInvestmentMid: number;
  exitStrategy: string;
  futureBoostProject: string | null;
}

export function recommendRenovationTargetsTool(rawArgs: Record<string, unknown>) {
  const input = RecommendRenovationTargetsInput.parse(rawArgs);
  const data = loadChochouData();
  if (!data) {
    return {
      content: [
        {
          type: 'text' as const,
          text: '町丁目データが読み込めません。data/aichi/chochou.json を確認してください。',
        },
      ],
    };
  }

  const candidates: RankedTarget[] = [];

  for (const ward of data.wards) {
    const sampleChochou = ward.chochou.slice(0, 5);
    for (const ch of sampleChochou) {
      try {
        const result = calculateRenovationYield({
          ward: ward.ward,
          chochou: ch.name,
          buildingAge: input.buildingAge,
          floorArea: input.floorArea,
          propertyType: input.propertyType,
        });
        candidates.push({
          rank: 0,
          ward: ward.ward,
          chochou: ch.name,
          grossYieldPct: result.grossYieldPct,
          netYieldPct: result.netYieldPct,
          estimatedRentMonthly: result.estimatedRent.monthly,
          totalInvestmentMid: result.totalInvestment.mid,
          exitStrategy: result.exitStrategy === 'rent' ? '賃貸運用' : '転売',
          futureBoostProject: result.whatIfBoost.futureProjectName,
        });
      } catch {
        // skip areas with missing data
      }
    }
  }

  candidates.sort((a, b) => b.netYieldPct - a.netYieldPct);
  const top = candidates.slice(0, input.limit).map((c, i) => ({ ...c, rank: i + 1 }));

  const md = [
    `# リノベ利回りランキング Top ${top.length}`,
    `条件: 築${input.buildingAge}年 / ${input.floorArea}㎡ / ${input.propertyType}`,
    '',
    `| 順位 | 区 | 町丁目 | 表面利回り | 実質利回り | 月額賃料 | 総投資額 | 戦略 |`,
    `|---|---|---|---|---|---|---|---|`,
  ];

  for (const t of top) {
    md.push(
      `| ${t.rank} | ${t.ward} | ${t.chochou} | ${t.grossYieldPct}% | ${t.netYieldPct}% | ${t.estimatedRentMonthly.toLocaleString()}円 | ${(t.totalInvestmentMid / 10000).toFixed(0)}万円 | ${t.exitStrategy} |`,
    );
  }

  if (top.length > 0 && top[0].futureBoostProject) {
    md.push(
      '',
      `> **注目**: ${top[0].ward}${top[0].chochou} は **${top[0].futureBoostProject}** の恩恵が期待されます`,
    );
  }

  return {
    content: [{ type: 'text' as const, text: md.join('\n') }],
    structuredContent: { rankings: top, conditions: input },
  };
}
