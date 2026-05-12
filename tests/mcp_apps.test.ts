import { describe, it, expect } from 'vitest';
import { RESOURCE_MIME_TYPE } from '@modelcontextprotocol/ext-apps';
import { createServer } from '../src/server.js';
import { getDashboardHtml } from '../src/resources/ui_dashboard.js';
import { getDashboard3dHtml } from '../src/resources/ui_dashboard_3d.js';
import {
  CrossAnalyzeInput,
  ForecastLandPriceTrendInput,
  GenerateReportInput,
  ScenarioWhatIfInput,
} from '../src/schemas.js';

type RegisteredTool = {
  _meta?: Record<string, unknown>;
  annotations?: Record<string, unknown>;
  outputSchema?: unknown;
};

type RegisteredResource = {
  metadata?: {
    mimeType?: string;
    _meta?: {
      ui?: {
        csp?: {
          resourceDomains?: string[];
          connectDomains?: string[];
        };
      };
    };
  };
  readCallback?: (uri: URL, extra: unknown) => Promise<{
    contents: Array<{
      uri: string;
      mimeType?: string;
      text?: string;
      _meta?: {
        ui?: {
          csp?: {
            resourceDomains?: string[];
            connectDomains?: string[];
          };
        };
      };
    }>;
  }>;
};

function getPrivateRegistries() {
  const server = createServer();
  return server as unknown as {
    _registeredTools: Record<string, RegisteredTool>;
    _registeredResources: Record<string, RegisteredResource>;
  };
}

describe('MCP Apps integration', () => {
  it('open_dashboard tool has modern and legacy MCP App resource metadata', () => {
    const { _registeredTools: tools } = getPrivateRegistries();
    const dashboard = tools.open_dashboard;

    expect(dashboard).toBeDefined();
    expect(dashboard.annotations?.readOnlyHint).toBe(true);
    expect((dashboard._meta?.ui as { resourceUri?: string })?.resourceUri).toBe('ui://japan-real-estate-intel/dashboard');
    expect(dashboard._meta?.['ui/resourceUri']).toBe('ui://japan-real-estate-intel/dashboard');
    expect(dashboard._meta?.['openai/outputTemplate']).toBe('ui://japan-real-estate-intel/dashboard');
    expect(dashboard.outputSchema).toBeDefined();
  });

  it('quick_visual_summary is registered as ChatGPT render tool', () => {
    const { _registeredTools: tools } = getPrivateRegistries();
    const summary = tools.quick_visual_summary;

    expect(summary).toBeDefined();
    expect(summary.annotations?.readOnlyHint).toBe(true);
    expect((summary._meta?.ui as { resourceUri?: string })?.resourceUri).toBe('ui://japan-real-estate-intel/dashboard');
    expect(summary._meta?.['openai/outputTemplate']).toBe('ui://japan-real-estate-intel/dashboard');
    expect(summary._meta?.['openai/toolInvocation/invoking']).toContain('ビジュアル要約');
    expect(summary.outputSchema).toBeDefined();
  });

  it('dashboard HTML includes MCP bridge script', () => {
    const html = getDashboardHtml();
    expect(html).toContain('__mcpBridge');
    expect(html).toContain('ui/initialize');
    expect(html).toContain('callServerTool');
  });

  it('dashboard-3d HTML includes MCP bridge script', () => {
    const html = getDashboard3dHtml();
    expect(html).toContain('__mcpBridge');
    expect(html).toContain('ui/initialize');
  });

  it('dashboard includes scenario panel', () => {
    const html = getDashboardHtml();
    expect(html).toContain('scenario-panel');
    expect(html).toContain('scenario-select');
    expect(html).toContain('scenario-result');
  });

  it('dashboard includes action buttons', () => {
    const html = getDashboardHtml();
    expect(html).toContain('btn-analyze');
    expect(html).toContain('btn-generate-report');
    expect(html).toContain('btn-portfolio');
    expect(html).toContain('rei-chat-action');
    expect(html).toContain('copy-chat-summary-btn');
    expect(html).toContain('copy-snapshot-svg-btn');
    expect(html).toContain('leveraged-cashflow-panel');
    expect(html).toContain('cashflow-tsv-copy-btn');
    expect(html).toContain('cashflow-chat-btn');
    expect(html).toContain('cashflow-disclaimer');
  });

  it('dashboard HTML has no unfilled build placeholders inside the bundle', () => {
    const html = getDashboardHtml();
    expect(html).not.toContain('<!-- JS_PLACEHOLDER -->');
    expect(html).not.toContain('<!-- CSS_PLACEHOLDER -->');
  });

  it('bridge implements postMessage protocol', () => {
    const html = getDashboardHtml();
    expect(html).toContain('window.parent.postMessage');
    expect(html).toContain('ui/notifications/initialized');
    expect(html).toContain('ui/notifications/tool-result');
    expect(html).toContain('tools/call');
    expect(html).toContain('ui/update-model-context');
    expect(html).toContain('ui/message');
    expect(html).not.toContain('modelContext:');
  });

  it('bridge sets correct protocol version', () => {
    const html = getDashboardHtml();
    expect(html).toContain('2026-01-26');
  });

  it('registered dashboard resources use MCP App MIME type and CSP metadata', async () => {
    const { _registeredResources: resources } = getPrivateRegistries();
    const dashboard = resources['ui://japan-real-estate-intel/dashboard'];
    const dashboard3d = resources['ui://japan-real-estate-intel/dashboard-3d'];

    expect(dashboard.metadata?.mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(dashboard3d.metadata?.mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(dashboard.metadata?._meta?.ui?.csp?.resourceDomains).toContain('https://*.basemaps.cartocdn.com');
    expect(dashboard3d.metadata?._meta?.ui?.csp?.resourceDomains).toContain('https://cdn.jsdelivr.net');

    const read2d = await dashboard.readCallback?.(new URL('ui://japan-real-estate-intel/dashboard'), {});
    const read3d = await dashboard3d.readCallback?.(new URL('ui://japan-real-estate-intel/dashboard-3d'), {});

    expect(read2d?.contents[0].mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(read2d?.contents[0]._meta?.ui?.csp?.resourceDomains).toContain('https://*.basemaps.cartocdn.com');
    expect(read3d?.contents[0].mimeType).toBe(RESOURCE_MIME_TYPE);
    expect(read3d?.contents[0]._meta?.ui?.csp?.resourceDomains).toContain('https://cdn.jsdelivr.net');
  });

  it('dashboard action payloads are valid tool inputs', () => {
    CrossAnalyzeInput.parse({
      prefecture: 'aichi',
      area: '名古屋市中区',
      propertyType: 'residential',
      timeRange: '3y',
      includeRisk: true,
      includeHumanFlow: true,
      includeEducation: false,
      includeCorporate: false,
    });

    GenerateReportInput.parse({
      prefecture: 'aichi',
      area: '名古屋市中区',
      purpose: 'investment',
      includeCharts: true,
      format: 'markdown',
    });

    ForecastLandPriceTrendInput.parse({
      prefecture: 'aichi',
      city: '名古屋市中区',
      landUse: 'all',
      horizon: '5y',
      method: 'linear',
      includeMarkdown: true,
    });

    ScenarioWhatIfInput.parse({
      prefecture: 'aichi',
      city: '名古屋市中区',
      scenario: 'new_station',
      scale: 'medium',
      horizon: '5y',
      includeMarkdown: true,
    });
  });
});
