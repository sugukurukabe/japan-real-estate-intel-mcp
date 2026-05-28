import { GoogleGenAI, Type } from '@google/genai';
import { moduleLogger } from '../logger.js';
import type { OpportunityCard } from '../schemas.js';

const log = moduleLogger('gemini_narrative');

const GEMINI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

interface NarrativeResult {
  creativeAngle: string;
  userQuestionSuggestions: string[];
}

const RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    creativeAngle: {
      type: Type.STRING,
      description:
        'A creative, insightful narrative (2-3 sentences) explaining why this area is interesting for the given goal, in Japanese.',
    },
    userQuestionSuggestions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Array of 3 follow-up questions the user might want to ask, in Japanese.',
    },
  },
  required: ['creativeAngle', 'userQuestionSuggestions'],
};

export function isGeminiAvailable(): boolean {
  return !!GEMINI_API_KEY;
}

/**
 * Generates a creative narrative and question suggestions for an opportunity card.
 * Returns null if Gemini API key is not set or the call fails.
 */
export async function generateNarrative(
  card: OpportunityCard,
  goal: string,
  prefecture: string,
): Promise<NarrativeResult | null> {
  if (!GEMINI_API_KEY) {
    log.debug('GOOGLE_GENAI_API_KEY not set, skipping narrative generation');
    return null;
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });

    const prompt = [
      `あなたは日本の不動産投資アナリストです。`,
      `以下のOpportunity Radarカードデータを基に、`,
      `「${prefecture}」の「${card.city}」エリアについて、`,
      `「${goal}」目的のユーザーに向けた独創的な洞察を生成してください。`,
      '',
      `カードデータ:`,
      `- タイトル: ${card.title}`,
      `- スコア: ${card.score}/100`,
      `- シグナル: ${card.signalType}`,
      `- 根拠: ${card.why.join('; ')}`,
      `- リスク: ${card.risks.join('; ')}`,
      card.evidence.pricePerSqm
        ? `- 平均㎡単価: ¥${card.evidence.pricePerSqm.toLocaleString()}`
        : '',
      card.evidence.population ? `- 人口: ${card.evidence.population.toLocaleString()}人` : '',
      '',
      `creativeAngle: データからは読み取りにくい「なぜこのエリアが面白いか」を`,
      `ストーリーとして2-3文で。数値の羅列ではなく洞察を。`,
      `userQuestionSuggestions: ユーザーが次に聞きたくなる質問3つ。`,
    ]
      .filter(Boolean)
      .join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: RESPONSE_SCHEMA,
        temperature: 0.7,
      },
    });

    const text = response.text ?? '';
    const parsed = JSON.parse(text) as NarrativeResult;

    if (!parsed.creativeAngle || !Array.isArray(parsed.userQuestionSuggestions)) {
      log.warn({ city: card.city }, 'Gemini response missing required fields');
      return null;
    }

    return parsed;
  } catch (err) {
    log.warn({ city: card.city, err }, 'Gemini narrative generation failed');
    return null;
  }
}

/**
 * Batch-generate narratives for multiple cards.
 * Processes sequentially to avoid rate limits.
 */
export async function generateNarrativeBatch(
  cards: OpportunityCard[],
  goal: string,
  prefecture: string,
): Promise<Map<string, NarrativeResult>> {
  const results = new Map<string, NarrativeResult>();
  if (!isGeminiAvailable()) return results;

  for (const card of cards) {
    const narrative = await generateNarrative(card, goal, prefecture);
    if (narrative) {
      results.set(card.city, narrative);
    }
  }

  return results;
}

// ── Composite Value Score narrative (v6.12.0) ──

interface CompositeAxis {
  label: string;
  score: number;
  rawValue: string;
}

interface CompositeNarrativeInput {
  area: string;
  prefecture: string;
  compositeScore: number;
  tier: string;
  axes: CompositeAxis[];
}

const COMPOSITE_RESPONSE_SCHEMA = {
  type: Type.OBJECT,
  properties: {
    executiveSummary: {
      type: Type.STRING,
      description: '3-line executive summary of composite analysis, in Japanese.',
    },
    strengths: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Top 3 strengths of this area, in Japanese.',
    },
    cautions: {
      type: Type.ARRAY,
      items: { type: Type.STRING },
      description: 'Top 2 caution points for this area, in Japanese.',
    },
  },
  required: ['executiveSummary', 'strengths', 'cautions'],
};

interface CompositeNarrativeResult {
  executiveSummary: string;
  strengths: string[];
  cautions: string[];
}

export async function generateCompositeNarrative(
  input: CompositeNarrativeInput,
): Promise<string | null> {
  if (!GEMINI_API_KEY) {
    return generateCompositeFallbackNarrative(input);
  }

  try {
    const ai = new GoogleGenAI({ apiKey: GEMINI_API_KEY });
    const axisDetail = input.axes
      .map((a) => `- ${a.label}: ${a.score}/100 (${a.rawValue})`)
      .join('\n');

    const prompt = [
      '日本の不動産投資アナリストとして、以下の総合価値スコア分析結果に基づき、',
      `「${input.prefecture}」「${input.area}」エリアの投資価値を分析してください。`,
      '',
      `総合スコア: ${input.compositeScore}/100 (Tier ${input.tier})`,
      '',
      '5軸スコア:',
      axisDetail,
      '',
      'executiveSummary: 3行で投資判断に役立つ要約',
      'strengths: 強み3つ（データに基づく具体的記述）',
      'cautions: 注意点2つ（リスクや改善余地）',
    ].join('\n');

    const response = await ai.models.generateContent({
      model: 'gemini-2.0-flash',
      contents: prompt,
      config: {
        responseMimeType: 'application/json',
        responseSchema: COMPOSITE_RESPONSE_SCHEMA,
        temperature: 0.5,
      },
    });

    const text = response.text ?? '';
    const parsed = JSON.parse(text) as CompositeNarrativeResult;

    if (!parsed.executiveSummary) {
      log.warn('Gemini composite response missing executiveSummary');
      return generateCompositeFallbackNarrative(input);
    }

    const lines = [
      parsed.executiveSummary,
      '',
      '**強み:**',
      ...parsed.strengths.map((s) => `- ${s}`),
      '',
      '**注意点:**',
      ...parsed.cautions.map((c) => `- ${c}`),
    ];
    return lines.join('\n');
  } catch (err) {
    log.warn({ err }, 'Gemini composite narrative failed, using fallback');
    return generateCompositeFallbackNarrative(input);
  }
}

export function generateCompositeFallbackNarrative(input: CompositeNarrativeInput): string {
  const sorted = [...input.axes].sort((a, b) => b.score - a.score);
  const top2 = sorted.slice(0, 2);
  const bottom = sorted[sorted.length - 1];

  const tierLabel: Record<string, string> = {
    S: '非常に高い',
    A: '高い',
    B: '標準的な',
    C: '改善余地のある',
  };
  const label = tierLabel[input.tier] ?? '標準的な';

  return [
    `${input.prefecture}${input.area}の総合価値スコアは${input.compositeScore}/100（Tier ${input.tier}）で、${label}投資価値を示しています。`,
    '',
    '**強み:**',
    ...top2.map((a) => `- ${a.label}（${a.score}点）: ${a.rawValue}`),
    `- 総合Tier ${input.tier}評価`,
    '',
    '**注意点:**',
    `- ${bottom.label}（${bottom.score}点）が相対的に低い: ${bottom.rawValue}`,
    '- 詳細な現地調査・市場分析を推奨',
  ].join('\n');
}
