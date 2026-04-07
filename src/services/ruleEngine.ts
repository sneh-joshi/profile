import type {
  RuleCondition,
  Rule,
  ContentInput,
  ValidationResult,
  ValidationReport,
} from '../types/rules';

export const DEFAULT_RULES: Rule[] = [
  {
    id: 'rule-001',
    name: 'Politics Word Count',
    description: 'Politics articles must meet minimum word count requirements.',
    conditions: [
      { field: 'category', operator: 'eq', value: 'Politics' },
      { field: 'wordCount', operator: 'lt', value: 300 },
    ],
    conditionOperator: 'AND',
    severity: 'error',
    message: 'Politics articles require at least 300 words.',
  },
  {
    id: 'rule-002',
    name: 'Missing Author',
    description: 'All content must have a valid author name.',
    conditions: [{ field: 'author', operator: 'eq', value: '' }],
    conditionOperator: 'AND',
    severity: 'error',
    message: 'Author field is required.',
  },
  {
    id: 'rule-003',
    name: 'Title Length Warning',
    description: 'Short titles may underperform in search engine results.',
    conditions: [{ field: 'titleLength', operator: 'lt', value: 10 }],
    conditionOperator: 'AND',
    severity: 'warning',
    message: 'Title may be too short for SEO.',
  },
  {
    id: 'rule-004',
    name: 'Restricted Category',
    description: 'Draft content must not be marked as published.',
    conditions: [
      { field: 'category', operator: 'eq', value: 'Draft' },
      { field: 'published', operator: 'eq', value: true },
    ],
    conditionOperator: 'AND',
    severity: 'error',
    message: 'Draft content cannot be published.',
  },
  {
    id: 'rule-005',
    name: 'Low Quality Score',
    description: 'Content below the quality threshold should be reviewed.',
    conditions: [{ field: 'qualityScore', operator: 'lt', value: 3 }],
    conditionOperator: 'AND',
    severity: 'warning',
    message: 'Content quality score is below recommended threshold.',
  },
];

export function evaluateCondition(
  condition: RuleCondition,
  input: ContentInput
): boolean {
  const rawValue = input[condition.field];
  const condValue = condition.value;

  switch (condition.operator) {
    case 'eq': {
      if (typeof rawValue === 'string' && typeof condValue === 'string') {
        return rawValue.toLowerCase() === condValue.toLowerCase();
      }
      return rawValue === condValue;
    }
    case 'neq': {
      if (typeof rawValue === 'string' && typeof condValue === 'string') {
        return rawValue.toLowerCase() !== condValue.toLowerCase();
      }
      return rawValue !== condValue;
    }
    case 'lt': {
      return typeof rawValue === 'number' && typeof condValue === 'number'
        ? rawValue < condValue
        : false;
    }
    case 'gt': {
      return typeof rawValue === 'number' && typeof condValue === 'number'
        ? rawValue > condValue
        : false;
    }
    case 'lte': {
      return typeof rawValue === 'number' && typeof condValue === 'number'
        ? rawValue <= condValue
        : false;
    }
    case 'gte': {
      return typeof rawValue === 'number' && typeof condValue === 'number'
        ? rawValue >= condValue
        : false;
    }
    case 'contains': {
      if (typeof rawValue === 'string' && typeof condValue === 'string') {
        return rawValue.toLowerCase().includes(condValue.toLowerCase());
      }
      return false;
    }
    case 'not_contains': {
      if (typeof rawValue === 'string' && typeof condValue === 'string') {
        return !rawValue.toLowerCase().includes(condValue.toLowerCase());
      }
      return true;
    }
    default:
      return false;
  }
}

export function evaluateRule(rule: Rule, input: ContentInput): ValidationResult {
  const failedConditions: string[] = [];

  const conditionResults = rule.conditions.map((condition) => {
    const passed = evaluateCondition(condition, input);
    if (!passed) {
      failedConditions.push(
        `${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`
      );
    }
    return passed;
  });

  let rulePassed: boolean;
  if (rule.conditionOperator === 'AND') {
    rulePassed = conditionResults.every(Boolean);
  } else {
    rulePassed = conditionResults.some(Boolean);
  }

  // For AND rules: rule fires (fails validation) when ALL conditions match.
  // For OR rules: rule fires when ANY condition matches.
  // A fired rule means validation did NOT pass for that rule.
  // failedConditions represents conditions that did NOT match (helpful for AND — shows what's missing).
  // We flip: the rule "passes" validation when it does NOT fire.
  const validationPassed = !rulePassed;

  return {
    ruleId: rule.id,
    ruleName: rule.name,
    passed: validationPassed,
    severity: rule.severity,
    message: rule.message,
    failedConditions: validationPassed ? [] : failedConditions,
  };
}

export function validateContent(
  rules: Rule[],
  input: ContentInput
): ValidationReport {
  const results = rules.map((rule) => evaluateRule(rule, input));

  const errorCount = results.filter(
    (r) => !r.passed && r.severity === 'error'
  ).length;
  const warningCount = results.filter(
    (r) => !r.passed && r.severity === 'warning'
  ).length;
  const passedCount = results.filter((r) => r.passed).length;

  return {
    input,
    results,
    errorCount,
    warningCount,
    passedCount,
    valid: errorCount === 0,
  };
}
