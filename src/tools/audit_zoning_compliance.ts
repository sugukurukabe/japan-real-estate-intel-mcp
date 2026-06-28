import { auditZoningCompliance } from '../analysis/zoning_compliance.js';
import type { AuditZoningComplianceInput, AuditZoningComplianceOutput } from '../schemas.js';

export async function auditZoningComplianceTool(input: AuditZoningComplianceInput): Promise<AuditZoningComplianceOutput> {
  return auditZoningCompliance(input);
}
