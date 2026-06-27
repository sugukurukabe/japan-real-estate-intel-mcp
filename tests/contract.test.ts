import { describe, it, expect } from 'vitest';
import { ContractSupportInput, AssessContractRiskInput } from '../src/schemas.js';

describe('v6.9.0 Contract schemas', () => {
  it('ContractSupportInput validates', () => {
    const input = ContractSupportInput.parse({
      ward: '中区',
      chochou: '栄三丁目',
      buildingAge: 28,
      floorArea: 72,
      price: 42000000,
    });
    expect(input.ward).toBe('中区');
  });

  it('AssessContractRiskInput validates', () => {
    const input = AssessContractRiskInput.parse({
      ward: '中村区',
      proposedTerms: { financingDays: 10, buildingInspection: true },
    });
    expect(input.ward).toBe('中村区');
  });
});

describe('contract tools', () => {
  it('generate_contract_support_package returns markdown', async () => {
    const { generateContractSupportPackageTool } =
      await import('../src/tools/generate_contract_support_package.js');
    const result = generateContractSupportPackageTool({
      ward: '中区',
      chochou: '栄',
      buildingAge: 28,
      floorArea: 72,
      price: 42000000,
      propertyType: 'mansion',
    });
    expect(result.content[0].text).toContain('売買契約支援パッケージ');
    expect(result.structuredContent.riskMatrix.length).toBeGreaterThan(0);
  });

  it('assess_contract_risk returns score', async () => {
    const { assessContractRiskTool } = await import('../src/tools/assess_contract_risk.js');
    const result = assessContractRiskTool({
      ward: '中村区',
      proposedTerms: { financingDays: 10, buildingInspection: true },
    });
    expect(result.structuredContent.overallRiskScore).toBeGreaterThan(0);
    expect(result.structuredContent.overallRiskScore).toBeLessThan(100);
  });
});
