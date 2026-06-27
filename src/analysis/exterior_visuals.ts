import { GoogleGenAI, Type } from '@google/genai';
import { moduleLogger } from '../logger.js';
import type { AssessExteriorVisualsInput, AssessExteriorVisualsOutput } from '../schemas.js';
import { getLoader } from '../data-loaders/registry.js';

const log = moduleLogger('exterior_visuals');

const GOOGLE_MAPS_API_KEY = process.env.GOOGLE_MAPS_API_KEY;
const GOOGLE_GENAI_API_KEY = process.env.GOOGLE_GENAI_API_KEY;

// Default coordinates per prefecture for geocoding fallback
const PREFECTURE_DEFAULTS: Record<string, { lat: number; lng: number; label: string }> = {
  '愛知県': { lat: 35.1709, lng: 136.8815, label: '名古屋駅前' },
  '東京都': { lat: 35.6812, lng: 139.7671, label: '東京駅前' },
  '大阪府': { lat: 34.7024, lng: 135.4959, label: '大阪駅前' },
  '福岡県': { lat: 33.5902, lng: 130.4207, label: '博多駅前' },
  '北海道': { lat: 43.0687, lng: 141.3508, label: '札幌駅前' },
  '神奈川県': { lat: 35.4658, lng: 139.6223, label: '横浜駅前' },
  '京都府': { lat: 34.9858, lng: 135.7588, label: '京都駅前' },
  '兵庫県': { lat: 34.6944, lng: 135.1955, label: '三ノ宮駅前' },
  '千葉県': { lat: 35.6131, lng: 140.1130, label: '千葉駅前' },
  '埼玉県': { lat: 35.9063, lng: 139.6240, label: '大宮駅前' },
};

/**
 * Perform visual exterior audit based on location (lat/lng or address).
 * Falls back to mock simulation if API keys are missing.
 */
export async function analyzeExteriorVisuals(
  input: AssessExteriorVisualsInput,
  fetchImpl: typeof fetch = fetch,
): Promise<AssessExteriorVisualsOutput> {
  const prefName = input.prefecture;
  const loader = getLoader(prefName);

  let lat = input.latitude;
  let lng = input.longitude;

  // Resolve coordinates
  if ((lat === undefined || lng === undefined) && loader) {
    if (input.address) {
      const loc = loader.geocode(input.address);
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
      }
    }
    if ((lat === undefined || lng === undefined) && input.city) {
      const loc = loader.geocode(input.city);
      if (loc) {
        lat = loc.lat;
        lng = loc.lng;
      }
    }
  }

  // Final fallback to prefecture default center
  if (lat === undefined || lng === undefined) {
    const fallback = PREFECTURE_DEFAULTS[prefName] || PREFECTURE_DEFAULTS['愛知県']!;
    lat = fallback.lat;
    lng = fallback.lng;
    log.debug({ prefecture: prefName }, 'Coords unresolved, using prefecture fallback center');
  }

  const heading = input.heading ?? 0;
  const pitch = input.pitch ?? 0;

  // Determine if keys are available
  const hasMapsKey = !!GOOGLE_MAPS_API_KEY;
  const hasGenAiKey = !!GOOGLE_GENAI_API_KEY;

  let imageUrl = `https://maps.googleapis.com/maps/api/streetview?size=600x400&location=${lat},${lng}&heading=${heading}&pitch=${pitch}`;
  if (hasMapsKey) {
    imageUrl += `&key=${GOOGLE_MAPS_API_KEY}`;
  }

  let hasLiveImage = false;
  let hasLiveAnalysis = false;
  let base64Image: string | null = null;

  // Try fetching live street view image if key is present
  if (hasMapsKey) {
    try {
      const res = await fetchImpl(imageUrl);
      if (res.ok) {
        const buffer = await res.arrayBuffer();
        base64Image = Buffer.from(buffer).toString('base64');
        hasLiveImage = true;
      } else {
        log.warn({ status: res.status }, 'Failed to fetch Google Street View image');
      }
    } catch (err) {
      log.error({ err }, 'Error fetching Street View static image');
    }
  }

  // Attempt live Gemini vision analysis if image and key are present
  if (hasGenAiKey && base64Image) {
    try {
      const ai = new GoogleGenAI({ apiKey: GOOGLE_GENAI_API_KEY });
      const prompt = `あなたは不動産鑑定士および投資アナリストです。
添付された前面道路・建物のストリートビュー（街頭写真）を分析し、不動産価値・住環境・投資判断の観点から客観的に評価してください。

出力項目：
1. overallVibe（周辺環境の雰囲気・特性、1〜2文）
2. exteriorQuality（建物の外観グレード、劣化度、視覚的状態、1〜2文）
3. roadCondition（前面道路の幅員、舗装状態、歩道有無、交通量の推測、1〜2文）
4. parkingAvailability（敷地内の駐車スペースや周辺パーキングの状況、1〜2文）
5. issuesIdentified（マイナス要因。電線の乱雑さ、落書き、ゴミ置き場近傍、騒音源などの配列）
6. pros (プラス要因の配列。植栽、並木、高級感、新しさ、広い歩道など)
7. cons (マイナス要因の配列)
8. estimatedAgeVibe (築年数の視覚的推測。"新築/築浅", "築5〜15年", "築15〜30年", "築30年以上")
9. recommendationsJa (投資・仲介観点での改善点や評価に関する最終推奨事項、2文程度)

必ず日本語で回答し、妥当なJSON形式で出力してください。`;

      const response = await ai.models.generateContent({
        model: 'gemini-2.5-flash',
        contents: [
          prompt,
          {
            inlineData: {
              data: base64Image,
              mimeType: 'image/jpeg',
            },
          },
        ],
        config: {
          responseMimeType: 'application/json',
          responseSchema: {
            type: Type.OBJECT,
            properties: {
              overallVibe: { type: Type.STRING },
              exteriorQuality: { type: Type.STRING },
              roadCondition: { type: Type.STRING },
              parkingAvailability: { type: Type.STRING },
              issuesIdentified: { type: Type.ARRAY, items: { type: Type.STRING } },
              pros: { type: Type.ARRAY, items: { type: Type.STRING } },
              cons: { type: Type.ARRAY, items: { type: Type.STRING } },
              estimatedAgeVibe: { type: Type.STRING },
              recommendationsJa: { type: Type.STRING },
            },
            required: [
              'overallVibe', 'exteriorQuality', 'roadCondition', 'parkingAvailability',
              'issuesIdentified', 'pros', 'cons', 'estimatedAgeVibe', 'recommendationsJa'
            ],
          },
        },
      });

      if (response.text) {
        const jsonResult = JSON.parse(response.text);
        hasLiveAnalysis = true;

        const report = buildMarkdownReport(prefName, input.city ?? '', lat, lng, jsonResult, true);
        return {
          imageUrl,
          hasLiveImage,
          hasLiveAnalysis,
          latitude: lat,
          longitude: lng,
          analysis: jsonResult,
          markdownReport: report,
          attribution: 'Google Maps Street View & Gemini Vision AI',
        };
      }
    } catch (err) {
      log.error({ err }, 'Error analyzing image with Gemini Vision AI. Falling back to mock engine.');
    }
  }

  // Fallback / Mock engine
  const mockResult = generateMockAnalysis(prefName, input.city ?? '', input.address ?? '');
  
  // If no maps key, use an image placeholder
  if (!hasMapsKey) {
    imageUrl = `https://images.unsplash.com/photo-1580587771525-78b9dba3b914?auto=format&fit=crop&w=600&h=400&q=80`; // Beautiful house placeholder
  }

  const markdownReport = buildMarkdownReport(prefName, input.city ?? '', lat, lng, mockResult, false);

  return {
    imageUrl,
    hasLiveImage: false,
    hasLiveAnalysis: false,
    latitude: lat,
    longitude: lng,
    analysis: mockResult,
    markdownReport,
    attribution: 'Local Real Estate Intelligence Simulation Engine',
  };
}

/**
 * Generate highly realistic mock analysis based on location features.
 */
function generateMockAnalysis(prefecture: string, city: string, address: string) {
  const isDowntown = city.includes('中区') || city.includes('中村区') || city.includes('新宿') || city.includes('梅田') || city.includes('博多') || city.includes('栄') || city.includes('東区');

  if (isDowntown) {
    return {
      overallVibe: `${prefecture}${city}周辺は、高層ビルと商業施設が林立する非常に活気のある都市型エリアです。昼夜問わず人流が多く、利便性は極めて高いですが、やや賑やかな環境です。`,
      exteriorQuality: 'RC造の近代的なオフィス・マンションが多く、築年数に比してメンテナンスは良好に行われています。外壁タイル貼りの高級感ある物件が目立ちます。',
      roadCondition: '幅員約12m〜15mの広幅員道路（アスファルト舗装）で、整備された歩道が両側に完備されています。電線共同溝化（無電柱化）が進みつつあり、視覚的にスッキリしています。',
      parkingAvailability: '敷地内には機械式駐車場が数台分見受けられますが、満車の傾向あり。周辺はコインパーキングが多く存在しますが、料金設定は高めです。',
      issuesIdentified: ['近隣の商業活動による夜間の軽微な騒音', 'コインパーキング料金の高騰', '荷下ろし車両による一時的な車線塞ぎ'],
      pros: ['無電柱化による優れた美観', '夜間でも明るく防犯性の高い前面道路', '周辺に飲食店やコンビニが多数存在'],
      cons: ['静粛性の確保が難しい環境', '月極駐車場の相場が高い'],
      estimatedAgeVibe: '築5〜15年',
      recommendationsJa: '商業活動が活発な超一等地であり、テナテナントビルや単身者向け高級賃貸マンションとして極めて強い需要があります。騒音対策として二重サッシの導入や、セキュリティ強化（オートロック・宅配ボックス等）を徹底することで賃料プレミアの維持が可能です。',
    };
  } else {
    return {
      overallVibe: `${prefecture}${city}周辺は、第一種中高層住居専用地域を中心とする、緑豊かで閑静な邸宅街・住宅街です。ファミリー層が多く居住し、治安も非常に安定しています。`,
      exteriorQuality: '低層マンションや戸建てが中心。外壁サイディングや吹付仕上げが多く、築年相応の経年変化が見られますが、地域全体の美観は維持されています。',
      roadCondition: '幅員約4m〜6mの生活道路。歩車分離はなく、歩行時は対向車への注意が必要ですが、交通量は少なく静かです。',
      parkingAvailability: '戸建ては各戸1〜2台分の平置きカースペースがあり、マンションも平置き駐車場が主体。月極相場も手頃です。',
      issuesIdentified: ['歩車分離が不十分な狭幅員道路', '最寄り駅までの街路灯がやや少ない区間あり'],
      pros: ['静かで排気ガスの少ない住環境', '公園や並木などの緑豊かな環境', '近隣の生活道路のため車のスピードが控えめ'],
      cons: ['夜間の人通りが少ない', '前面道路が狭く大型車の進入に制限がある'],
      estimatedAgeVibe: '築15〜30年',
      recommendationsJa: '良好なファミリー向け居住地域であり、長期入居が期待できる安定資産です。駐車場付設率の高さをアピールポイントにしつつ、外構の定期的な修繕やLED防犯灯の設置による夜間視認性向上が資産価値向上に寄与します。',
    };
  }
}

function buildMarkdownReport(
  prefecture: string,
  city: string,
  lat: number,
  lng: number,
  analysis: any,
  isLive: boolean,
): string {
  const statusBadge = isLive 
    ? '`Live Analysis: Active (Gemini 2.5 Flash)`' 
    : '`Simulation Mode: Active (Local Rules Engine)`';

  return `# AI 街頭外観・環境監査レポート
${statusBadge}

対象エリア: **${prefecture} ${city}** (緯度: ${lat.toFixed(5)}, 経度: ${lng.toFixed(5)})

---

## 📸 外観・周辺環境の目視評価

### 1. 周辺エリアの雰囲気 (Overall Vibe)
${analysis.overallVibe}

### 2. 建物外観グレード (Exterior Quality)
${analysis.exteriorQuality}

### 3. 前面道路の状況 (Road Condition)
${analysis.roadCondition}

### 4. 駐車設備 (Parking & Access)
${analysis.parkingAvailability}

---

## ⚖️ メリット・デメリット分析

| 👍 プラス要因 (Pros) | 👎 マイナス・懸念点 (Cons) |
|----------------------|---------------------------|
| ${analysis.pros.map((p: string) => `• ${p}`).join('<br>')} | ${analysis.cons.map((c: string) => `• ${c}`).join('<br>')} |

### 🔍 検出されたリスク・懸念事項 (Issues Identified)
${analysis.issuesIdentified.map((i: string) => `- [!] ${i}`).join('\n')}

---

## 💡 推定築年イメージ & 推奨改善アクション

- **視覚的推定築年**: **${analysis.estimatedAgeVibe}**
- **不動産投資・仲介アドバイス**:  
  ${analysis.recommendationsJa}

---
*免責事項: 本レポートはGoogle Street View静止画像およびAI/シミュレーションによる分析結果であり、実際の境界画定や瑕疵担保責任を負うものではありません。現地重要事項説明および実測調査を併せて実施してください。*`;
}
