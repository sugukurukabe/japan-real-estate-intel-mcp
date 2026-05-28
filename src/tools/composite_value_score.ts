import { CompositeValueScoreInput, type CompositeValueScoreOutput } from '../schemas.js';
import { resolvePrefecture, getPrefectureDisplayName } from '../prefecture/resolver.js';
import {
  computeCompositeValueScore,
  generateCompositeMarkdown,
} from '../analysis/composite_value.js';
import { generateCompositeNarrative } from '../analysis/gemini_narrative.js';

export async function compositeValueScoreTool(rawArgs: Record<string, unknown>): Promise<{
  content: { type: 'text'; text: string }[];
  structuredContent: Record<string, unknown>;
}> {
  const input = CompositeValueScoreInput.parse(rawArgs);
  const prefKey = resolvePrefecture(input.prefecture);
  const prefDisplay = getPrefectureDisplayName(prefKey);

  const result = computeCompositeValueScore(prefKey, input.area, input.weights ?? undefined);

  if (input.includeNarrative && result.axes.length > 0) {
    const narrative = await generateCompositeNarrative({
      area: input.area,
      prefecture: prefDisplay,
      compositeScore: result.compositeScore,
      tier: result.tier,
      axes: result.axes.map((a) => ({ label: a.label, score: a.score, rawValue: a.rawValue })),
    });
    if (narrative) {
      result.narrative = narrative;
    }
  }

  if (input.includeMarkdown) {
    result.markdownReport = generateCompositeMarkdown(input.area, prefDisplay, result);
  }

  const textOutput =
    result.markdownReport ??
    `${prefDisplay} ${input.area}: Composite ${result.compositeScore}/100 (${result.tier})`;

  return {
    content: [{ type: 'text' as const, text: textOutput }],
    structuredContent: { ...result } as Record<string, unknown>,
  };
}
