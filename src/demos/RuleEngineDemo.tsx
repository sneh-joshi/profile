import { useState } from 'react';
import type { Rule, ContentInput, ValidationReport } from '../types/rules';
import { DEFAULT_RULES, validateContent } from '../services/ruleEngine';
import './RuleEngineDemo.css';

const SAMPLE_INPUT: ContentInput = {
  category: 'Politics',
  wordCount: 150,
  author: 'Jane Doe',
  titleLength: 8,
  qualityScore: 2,
  published: false,
};

function conditionLabel(condition: Rule['conditions'][number]): string {
  return `${condition.field} ${condition.operator} ${JSON.stringify(condition.value)}`;
}

function RuleCard({ rule }: { rule: Rule }) {
  const [showJson, setShowJson] = useState(false);

  return (
    <div className="red-rule-card">
      <div className="red-rule-card__header">
        <span className="red-rule-card__name">{rule.name}</span>
        <span
          className={`red-badge red-badge--${rule.severity}`}
          aria-label={`severity: ${rule.severity}`}
        >
          {rule.severity}
        </span>
      </div>
      <p className="red-rule-card__desc">{rule.description}</p>
      <div className="red-rule-card__conditions">
        {rule.conditions.map((c, i) => (
          <code key={i} className="red-condition">
            {conditionLabel(c)}
          </code>
        ))}
        {rule.conditions.length > 1 && (
          <span className="red-condition-op">
            operator: <strong>{rule.conditionOperator}</strong>
          </span>
        )}
      </div>
      <button
        className="red-json-toggle"
        onClick={() => setShowJson((v) => !v)}
        aria-expanded={showJson}
      >
        {showJson ? 'Hide JSON' : 'View JSON'}
      </button>
      {showJson && (
        <pre className="red-json-block">
          {JSON.stringify(rule, null, 2)}
        </pre>
      )}
    </div>
  );
}

function ResultsPanel({ report }: { report: ValidationReport | null }) {
  if (!report) {
    return (
      <div className="red-panel red-results-panel red-results-panel--empty">
        <p className="red-empty-state">Enter content and click Validate</p>
      </div>
    );
  }

  return (
    <div className="red-panel red-results-panel">
      <h3 className="red-panel__title">Validation Results</h3>
      <div className="red-summary">
        <span className="red-summary__item red-summary__item--error">
          {report.errorCount} error{report.errorCount !== 1 ? 's' : ''}
        </span>
        <span className="red-summary__item red-summary__item--warning">
          {report.warningCount} warning{report.warningCount !== 1 ? 's' : ''}
        </span>
        <span className="red-summary__item red-summary__item--passed">
          {report.passedCount} passed
        </span>
        <span
          className={`red-summary__valid ${report.valid ? 'red-summary__valid--ok' : 'red-summary__valid--fail'}`}
        >
          {report.valid ? 'VALID' : 'INVALID'}
        </span>
      </div>
      <ul className="red-results-list">
        {report.results.map((result) => (
          <li
            key={result.ruleId}
            className={`red-result-item red-result-item--${result.passed ? 'passed' : result.severity}`}
          >
            <div className="red-result-item__header">
              <span className="red-result-item__name">{result.ruleName}</span>
              <span
                className={`red-badge red-badge--${result.passed ? 'passed' : result.severity}`}
              >
                {result.passed ? 'PASS' : 'FAIL'}
              </span>
            </div>
            {!result.passed && (
              <>
                <p className="red-result-item__message">{result.message}</p>
                {result.failedConditions.length > 0 && (
                  <div className="red-result-item__failed">
                    <span className="red-result-item__failed-label">
                      Matched conditions:
                    </span>
                    {result.failedConditions.map((fc, i) => (
                      <code key={i} className="red-condition red-condition--fail">
                        {fc}
                      </code>
                    ))}
                  </div>
                )}
              </>
            )}
          </li>
        ))}
      </ul>
    </div>
  );
}

export default function RuleEngineDemo() {
  const [inputJson, setInputJson] = useState(
    JSON.stringify(SAMPLE_INPUT, null, 2)
  );
  const [parseError, setParseError] = useState<string | null>(null);
  const [report, setReport] = useState<ValidationReport | null>(null);

  function handleValidate() {
    let parsed: ContentInput;
    try {
      parsed = JSON.parse(inputJson) as ContentInput;
      setParseError(null);
    } catch (err) {
      setParseError(
        err instanceof Error ? err.message : 'Invalid JSON input.'
      );
      setReport(null);
      return;
    }
    const result = validateContent(DEFAULT_RULES, parsed);
    setReport(result);
  }

  return (
    <section className="red-section" id="rule-engine-demo">
      <div className="red-section__header">
        <h2 className="red-section__title">Rule Engine Demo</h2>
        <p className="red-section__desc">
          Lightweight validation engine with JSON-defined rules, dynamic
          condition evaluation, and structured error reporting.
        </p>
      </div>

      <div className="red-grid">
        {/* Panel 1 — Rules */}
        <div className="red-panel red-rules-panel">
          <h3 className="red-panel__title">
            Validation Rules
            <span className="red-panel__count">{DEFAULT_RULES.length}</span>
          </h3>
          <div className="red-rules-list">
            {DEFAULT_RULES.map((rule) => (
              <RuleCard key={rule.id} rule={rule} />
            ))}
          </div>
        </div>

        {/* Panel 2 — Input */}
        <div className="red-panel red-input-panel">
          <h3 className="red-panel__title">Content Input</h3>
          <p className="red-panel__subtitle">
            Edit the JSON below to test different scenarios.
          </p>
          <textarea
            className={`red-textarea${parseError ? ' red-textarea--error' : ''}`}
            value={inputJson}
            onChange={(e) => setInputJson(e.target.value)}
            spellCheck={false}
            aria-label="Content input JSON"
          />
          {parseError && (
            <p className="red-parse-error" role="alert">
              JSON parse error: {parseError}
            </p>
          )}
          <button className="red-validate-btn" onClick={handleValidate}>
            Validate
          </button>
        </div>

        {/* Panel 3 — Results */}
        <ResultsPanel report={report} />
      </div>
    </section>
  );
}
