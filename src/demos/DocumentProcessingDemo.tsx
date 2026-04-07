import { useRef, useState } from 'react'
import './DocumentProcessingDemo.css'

interface Field {
  key: string
  value: string
  confidence: number
  decision?: 'approved' | 'rejected'
}

interface SampleDoc {
  id: string
  name: string
  type: string
  fields: Omit<Field, 'decision'>[]
  signatureConf: number
}

const DOCS: SampleDoc[] = [
  {
    id: 'invoice',
    name: 'Invoice_Mar2024.pdf',
    type: 'Invoice',
    fields: [
      { key: 'Vendor Name',   value: 'Acme Corp',      confidence: 0.97 },
      { key: 'Invoice Date',  value: 'March 15, 2024', confidence: 0.93 },
      { key: 'Total Amount',  value: '$4,250.00',      confidence: 0.91 },
      { key: 'PO Number',     value: 'PO-2024-0312',  confidence: 0.88 },
      { key: 'Payment Terms', value: 'Net-30',         confidence: 0.64 },
    ],
    signatureConf: 0.72,
  },
  {
    id: 'contract',
    name: 'ServiceAgreement.pdf',
    type: 'Contract',
    fields: [
      { key: 'Party A',        value: 'TechCorp Inc.',        confidence: 0.95 },
      { key: 'Party B',        value: 'Vendor Solutions LLC', confidence: 0.92 },
      { key: 'Effective Date', value: 'April 1, 2024',        confidence: 0.89 },
      { key: 'Contract Term',  value: '12 months',            confidence: 0.86 },
      { key: 'Governing Law',  value: 'State of Delaware',    confidence: 0.58 },
    ],
    signatureConf: 0.95,
  },
  {
    id: 'expense',
    name: 'ExpenseReport_Feb.pdf',
    type: 'Expense Form',
    fields: [
      { key: 'Employee',       value: 'J. Mitchell', confidence: 0.96 },
      { key: 'Department',     value: 'Engineering', confidence: 0.94 },
      { key: 'Expense Period', value: 'Feb 2024',    confidence: 0.88 },
      { key: 'Total Amount',   value: '$892.40',     confidence: 0.91 },
      { key: 'Approver',       value: 'R. Thompson', confidence: 0.52 },
    ],
    signatureConf: 0.61,
  },
]

function InvoicePdf() {
  return (
    <div className="pdf-page">
      <div className="pdf-badge">PDF</div>
      <div className="pdf-invoice-header">
        <div className="pdf-company">ACME CORP</div>
        <div className="pdf-invoice-tag">INVOICE</div>
      </div>
      <div className="pdf-invoice-num">#INV-2024-0312</div>
      <div className="pdf-rule" />
      <div className="pdf-rows">
        <div className="pdf-row"><span className="pdf-lbl">Date</span><span className="pdf-val">March 15, 2024</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Vendor</span><span className="pdf-val">Acme Corp</span></div>
        <div className="pdf-row"><span className="pdf-lbl">PO Number</span><span className="pdf-val">PO-2024-0312</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Terms</span><span className="pdf-val">Net-30</span></div>
      </div>
      <div className="pdf-amount-box">
        <span className="pdf-amount-label">Amount Due</span>
        <span className="pdf-amount">$4,250.00</span>
      </div>
    </div>
  )
}

function ContractPdf() {
  return (
    <div className="pdf-page pdf-page--contract">
      <div className="pdf-badge">PDF</div>
      <div className="pdf-contract-seal">⚖</div>
      <div className="pdf-contract-title">SERVICE AGREEMENT</div>
      <div className="pdf-contract-ref">Ref #SA-2024-04 · Confidential</div>
      <div className="pdf-rule" />
      <p className="pdf-contract-body">
        This Agreement is entered into as of April 1, 2024, by and between the undersigned parties and shall be governed under the laws of the State of Delaware.
      </p>
      <div className="pdf-rows">
        <div className="pdf-row"><span className="pdf-lbl">Party A</span><span className="pdf-val">TechCorp Inc.</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Party B</span><span className="pdf-val">Vendor Solutions LLC</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Term</span><span className="pdf-val">12 months</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Jurisdiction</span><span className="pdf-val">Delaware</span></div>
      </div>
    </div>
  )
}

function ExpensePdf() {
  return (
    <div className="pdf-page pdf-page--expense">
      <div className="pdf-badge">PDF</div>
      <div className="pdf-expense-header">
        <div className="pdf-expense-title">EXPENSE REPORT</div>
        <div className="pdf-expense-period">February 2024</div>
      </div>
      <div className="pdf-rule" />
      <div className="pdf-rows">
        <div className="pdf-row"><span className="pdf-lbl">Employee</span><span className="pdf-val">J. Mitchell</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Department</span><span className="pdf-val">Engineering</span></div>
        <div className="pdf-row"><span className="pdf-lbl">Period</span><span className="pdf-val">Feb 2024</span></div>
        <div className="pdf-row pdf-row--total"><span className="pdf-lbl">Total</span><span className="pdf-val pdf-val--bold">$892.40</span></div>
      </div>
      <div className="pdf-rule pdf-rule--dashed" />
      <div className="pdf-sig-block">
        <div className="pdf-sig-label">Manager Authorization</div>
        <svg className="pdf-sig-svg" viewBox="0 0 150 42" fill="none" xmlns="http://www.w3.org/2000/svg" aria-label="Signature">
          <path
            d="M6,30 C10,14 18,10 22,20 C25,28 22,16 30,18 C36,20 34,28 40,25 C45,22 43,14 50,17 C56,20 54,28 60,25 C65,22 67,14 75,18 C80,21 78,28 85,25 C90,22 92,14 100,17 C106,20 104,28 110,25 C114,22 116,16 124,19 C130,22 128,28 135,25 L142,22"
            stroke="#1e293b"
            strokeWidth="1.6"
            strokeLinecap="round"
            strokeLinejoin="round"
          />
          <path
            d="M8,36 C45,38 95,36 142,38"
            stroke="#1e293b"
            strokeWidth="0.8"
            strokeLinecap="round"
            opacity="0.35"
          />
        </svg>
        <div className="pdf-sig-name">R. Thompson</div>
        <div className="pdf-sig-title-text">Engineering Manager</div>
        <div className="pdf-sig-conf">Confidence: 61% — flagged for review</div>
      </div>
    </div>
  )
}

const PDF_VIEWS: Record<string, React.ReactNode> = {
  invoice:  <InvoicePdf />,
  contract: <ContractPdf />,
  expense:  <ExpensePdf />,
}

const THRESHOLD = 0.75

export default function DocumentProcessingDemo() {
  const [doc, setDoc] = useState<SampleDoc>(DOCS[0])
  const [fields, setFields] = useState<Field[]>([])
  const [stage, setStage] = useState<'idle' | 'processing' | 'done'>('idle')
  const timers = useRef<ReturnType<typeof setTimeout>[]>([])

  const runPipeline = (target: SampleDoc) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setFields([])
    setStage('processing')

    const allFields: Omit<Field, 'decision'>[] = [
      ...target.fields,
      {
        key: 'Signature',
        value: target.signatureConf >= THRESHOLD ? 'Detected' : 'Uncertain',
        confidence: target.signatureConf,
      },
    ]

    allFields.forEach((f, i) => {
      const t = setTimeout(() => {
        setFields((prev) => [...prev, { ...f }])
        if (i === allFields.length - 1) setStage('done')
      }, i * 380 + 200)
      timers.current.push(t)
    })
  }

  const selectDoc = (d: SampleDoc) => {
    timers.current.forEach(clearTimeout)
    timers.current = []
    setDoc(d)
    setFields([])
    setStage('idle')
  }

  const decide = (key: string, d: 'approved' | 'rejected') => {
    setFields((prev) => prev.map((f) => (f.key === key ? { ...f, decision: d } : f)))
  }

  const lowConf = fields.filter((f) => f.confidence < THRESHOLD)
  const pending = lowConf.filter((f) => !f.decision)
  const allReviewed = stage === 'done' && lowConf.length > 0 && pending.length === 0
  const autoApproved = stage === 'done' && lowConf.length === 0

  return (
    <div className="docproc">
      {/* ── Document selector ── */}
      <div className="docproc__selector">
        {DOCS.map((d) => (
          <button
            key={d.id}
            className={`docproc__doc-btn${doc.id === d.id ? ' docproc__doc-btn--active' : ''}`}
            onClick={() => selectDoc(d)}
          >
            <span className="docproc__doc-pdf-icon">
              <span className="docproc__doc-pdf-label">PDF</span>
            </span>
            <span className="docproc__doc-name">{d.name}</span>
            <span className="docproc__doc-type">{d.type}</span>
          </button>
        ))}
      </div>

      <div className="docproc__body">
        {/* ── PDF document preview ── */}
        <div className="docproc__pdf-wrap">
          {PDF_VIEWS[doc.id]}
        </div>

        {/* ── Pipeline output ── */}
        <div className="docproc__pipeline">
          <div className="docproc__run-row">
            <button
              className="docproc__run-btn"
              onClick={() => runPipeline(doc)}
              disabled={stage === 'processing'}
            >
              {stage === 'processing' ? 'Processing…' : stage === 'done' ? 'Re-run →' : 'Run Pipeline →'}
            </button>
            {stage !== 'idle' && (
              <span className="docproc__status">
                {stage === 'processing' && '⟳ Extracting fields…'}
                {stage === 'done' && autoApproved && '✓ All fields auto-approved'}
                {stage === 'done' && allReviewed && '✓ Workflow complete'}
                {stage === 'done' && !autoApproved && !allReviewed && (
                  <span className="docproc__status--warn">
                    ⚠ {pending.length} field{pending.length !== 1 ? 's' : ''} need human review
                  </span>
                )}
              </span>
            )}
          </div>

          {fields.length > 0 && (
            <div className="docproc__fields">
              <p className="docproc__fields-label">Extracted Fields</p>
              <div className="docproc__fields-table">
                {fields.map((f) => {
                  const low = f.confidence < THRESHOLD
                  return (
                    <div
                      key={f.key}
                      className={`docproc__field${low ? ' docproc__field--low' : ''}`}
                    >
                      <span className="docproc__field-key">{f.key}</span>
                      <span className="docproc__field-val">{f.value}</span>
                      <span className={`docproc__conf docproc__conf--${low ? 'low' : 'ok'}`}>
                        {Math.round(f.confidence * 100)}%
                      </span>
                      {low && !f.decision && (
                        <div className="docproc__actions">
                          <button
                            className="docproc__action docproc__action--approve"
                            onClick={() => decide(f.key, 'approved')}
                            title="Approve"
                          >
                            ✓
                          </button>
                          <button
                            className="docproc__action docproc__action--reject"
                            onClick={() => decide(f.key, 'rejected')}
                            title="Reject"
                          >
                            ✗
                          </button>
                        </div>
                      )}
                      {f.decision && (
                        <span
                          className={`docproc__decision docproc__decision--${f.decision}`}
                        >
                          {f.decision === 'approved' ? '✓ Approved' : '✗ Rejected'}
                        </span>
                      )}
                      {!low && stage === 'done' && (
                        <span className="docproc__auto">auto ✓</span>
                      )}
                    </div>
                  )
                })}
              </div>
            </div>
          )}
        </div>
      </div>
    </div>
  )
}
