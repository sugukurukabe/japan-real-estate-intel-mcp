/**
 * Synthetic earthquake / flood CSV profiles for `gen-risk-data.ts` (bootstrap only).
 */

export interface PrefRiskProfile {
  baseIntensity: number;
  liquefactionBias: number;
  slopeBias: number;
  floodBias: number;
  surgeBias: number;
  notes: Record<string, string>;
}

export const SYNTHETIC_RISK_PROFILES: Record<string, PrefRiskProfile> = {
  aichi: {
    baseIntensity: 72, liquefactionBias: 0.5, slopeBias: 0.2,
    floodBias: 0.4, surgeBias: 0.5,
    notes: {
      default: '濃尾平野は地盤が軟弱な地域あり',
      coastal: '伊勢湾台風級の高潮リスク',
      river: '庄内川・天白川の氾濫リスク',
    },
  },
  tokyo: {
    baseIntensity: 76, liquefactionBias: 0.6, slopeBias: 0.15,
    floodBias: 0.5, surgeBias: 0.4,
    notes: {
      default: '首都直下地震の想定震度6強',
      coastal: '東京湾沿岸は高潮注意',
      river: '荒川・隅田川の大規模氾濫リスク',
    },
  },
  osaka: {
    baseIntensity: 74, liquefactionBias: 0.55, slopeBias: 0.2,
    floodBias: 0.5, surgeBias: 0.6,
    notes: {
      default: '上町断層帯による直下型地震リスク',
      coastal: '大阪湾の高潮リスクが極めて高い',
      river: '淀川・大和川の広域氾濫に注意',
    },
  },
  fukuoka: {
    baseIntensity: 64, liquefactionBias: 0.3, slopeBias: 0.3,
    floodBias: 0.4, surgeBias: 0.3,
    notes: {
      default: '警固断層帯あり。西方沖地震(2005)の経験',
      coastal: '博多湾沿岸は高潮リスクあり',
      river: '那珂川・御笠川の氾濫リスク',
    },
  },
  hokkaido: {
    baseIntensity: 68, liquefactionBias: 0.35, slopeBias: 0.3,
    floodBias: 0.35, surgeBias: 0.2,
    notes: {
      default: '千島海溝地震の長周期震動に注意',
      coastal: '津波リスクが太平洋側で高い',
      river: '石狩川・豊平川の融雪出水リスク',
    },
  },
  kanagawa: {
    baseIntensity: 75, liquefactionBias: 0.55, slopeBias: 0.3,
    floodBias: 0.45, surgeBias: 0.5,
    notes: {
      default: '関東大震災の震源域。相模トラフ沿い',
      coastal: '相模湾・東京湾の津波リスク',
      river: '多摩川・鶴見川の氾濫に注意',
    },
  },
  kyoto: {
    baseIntensity: 66, liquefactionBias: 0.25, slopeBias: 0.35,
    floodBias: 0.45, surgeBias: 0.0,
    notes: {
      default: '花折断層帯など活断層が複数',
      coastal: '内陸盆地のため高潮リスクなし',
      river: '鴨川・桂川の水害リスク',
    },
  },
  hyogo: {
    baseIntensity: 73, liquefactionBias: 0.5, slopeBias: 0.3,
    floodBias: 0.4, surgeBias: 0.5,
    notes: {
      default: '阪神淡路大震災(1995)の経験。六甲断層帯',
      coastal: '大阪湾の高潮と南海トラフ津波',
      river: '武庫川・夙川の土砂災害リスク',
    },
  },
  chiba: {
    baseIntensity: 74, liquefactionBias: 0.5, slopeBias: 0.2,
    floodBias: 0.5, surgeBias: 0.45,
    notes: {
      default: '東京湾沿岸部は軟弱地盤と液状化に注意',
      coastal: '東京湾高潮・台風高潮リスク',
      river: '利根川・江戸川水系の氾濫リスク',
    },
  },
  saitama: {
    baseIntensity: 72, liquefactionBias: 0.45, slopeBias: 0.2,
    floodBias: 0.4, surgeBias: 0.15,
    notes: {
      default: '埼玉台地と低地の混在。荒川・利根川流域に注意',
      coastal: '内陸のため直接の高潮は限定的だが河川氾濫に注意',
      river: '荒川・荒川放水路・入間川の氾濫リスク',
    },
  },
};
