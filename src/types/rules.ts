export interface RuleCondition {
  field: string
  operator: 'eq' | 'neq' | 'lt' | 'gt' | 'lte' | 'gte' | 'contains' | 'not_contains'
  value: string | number | boolean
}

export interface Rule {
  id: string
  name: string
  description: string
  conditions: RuleCondition[]
  conditionOperator: 'AND' | 'OR'
  severity: 'error' | 'warning'
  message: string
}

export interface ContentInput {
  [key: string]: string | number | boolean
}

export interface ValidationResult {
  ruleId: string
  ruleName: string
  passed: boolean
  severity: 'error' | 'warning'
  message: string
  failedConditions: string[]
}

export interface ValidationReport {
  input: ContentInput
  results: ValidationResult[]
  errorCount: number
  warningCount: number
  passedCount: number
  valid: boolean
}
