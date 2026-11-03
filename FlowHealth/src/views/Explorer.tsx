import { useState } from 'react'
import { Icon, type IconName } from '../components/Icon'

// Step 2 will turn this into real openEHR and FHIR output generated from the latest weigh-in.
export function Explorer({ latestWeight }: { latestWeight: number }) {
  const [developer, setDeveloper] = useState(false)
  const flow = [
    { step: '01', type: 'USER ENTRY', title: `${latestWeight.toFixed(1)} kg`, detail: 'Measured body weight', icon: 'scale' as IconName },
    { step: '02', type: 'SNOMED CT', title: '27113001', detail: 'Body weight', icon: 'code' as IconName },
    { step: '03', type: 'openEHR', title: 'Body weight v2', detail: 'Clinical archetype', icon: 'data' as IconName },
    { step: '04', type: 'COMPOSITION', title: 'Stored in EHR', detail: 'Versioned health record', icon: 'check' as IconName },
    { step: '05', type: 'FHIR R4', title: 'Observation', detail: 'Interoperable resource', icon: 'spark' as IconName },
  ]
  return (
    <>
      <section className="explorer-head">
        <div className="explorer-badge"><Icon name="data" /></div>
        <p className="eyebrow">HEALTH DATA EXPLORER</p>
        <p className="screen-title">One measurement.<br />A connected health record.</p>
        <p className="screen-copy">Explore how FlowHealth turns a simple weight entry into standards-based clinical data.</p>
        <div className="readiness-badges">
          <span>openEHR Ready</span>
          <span>FHIR Ready</span>
          <span>SNOMED CT Ready</span>
        </div>
      </section>
      <div className="mode-toggle">
        <div><Icon name="code" /><span><strong>Developer mode</strong><small>Future backend implementation</small></span></div>
        <button className={developer ? 'toggle on' : 'toggle'} onClick={() => setDeveloper(!developer)} aria-label="Toggle developer mode"><span /></button>
      </div>
      <section className="data-flow">
        <div className="future-label">Future backend implementation</div>
        <div className="flow-line" />
        {flow.map((item, index) => (
          <div className="flow-step" key={item.type}>
            <span className="step-index">{item.step}</span>
            <article>
              <span className={`flow-icon flow-${index}`}><Icon name={item.icon} /></span>
              <div className="flow-content">
                <span className="tiny-label">{item.type}</span>
                <strong>{item.title}</strong>
                <small>{item.detail}</small>
                {developer && index === 1 && <code>code: 27113001<br />system: http://snomed.info/sct</code>}
                {developer && index === 2 && <code>openEHR-EHR-OBSERVATION.<br />body_weight.v2</code>}
                {developer && index === 3 && <code>composition → content[0]<br />→ data → events[0]</code>}
                {developer && index === 4 && <code>resourceType: Observation<br />status: final · valueQuantity</code>}
              </div>
              <Icon name="chevron" className="flow-chevron" />
            </article>
          </div>
        ))}
      </section>
      <section className="standards-card">
        <div><span className="standard-mark">S</span><strong>SNOMED CT</strong><small>Meaning</small></div>
        <span className="standard-link" />
        <div><span className="standard-mark">oe</span><strong>openEHR</strong><small>Structure</small></div>
        <span className="standard-link" />
        <div><span className="standard-mark">F</span><strong>FHIR</strong><small>Exchange</small></div>
      </section>
      <div className="trust-note"><Icon name="check" /><span><strong>Built for interoperability</strong><small>Standards help your health data remain understandable and portable.</small></span></div>
    </>
  )
}
