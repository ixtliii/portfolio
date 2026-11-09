import { PROJECTS } from '../../projects'
import { goTo } from '../../lib/transition'
import { openContact } from '../../lib/contact'

// ─────────────────────────────────────────────────────────
// Little app windows floating around the About hero (desktop):
// each one is a doorway to another part of the site.
// ─────────────────────────────────────────────────────────
const CV = `${import.meta.env.BASE_URL}Artem_Diakunchak-CV.pdf`

const Bar = ({ name }) => (
    <div className="ab-win-bar">
        <span className="ab-win-dots" aria-hidden><i /><i /><i /></span>
        <span className="ab-win-name">{name}</span>
    </div>
)

const Go = () => (
    <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M5 15 15 5M7 5h8v8" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /></svg>
)

export default function Windows() {
    const n = PROJECTS.length
    return (
        <div className="ab-wins">
            <button type="button" className="ab-win ab-win--work" onClick={() => goTo('/work')} aria-label="Browse the work">
                <Bar name="work.archive" />
                <div className="ab-win-body">
                    <div className="ab-win-blocks" aria-hidden>
                        <i style={{ '--a': '#ffcca3', '--b': '#e3875a' }} />
                        <i style={{ '--a': '#d4c0ff', '--b': '#8e72dc' }} />
                        <i style={{ '--a': '#b6ebc6', '--b': '#62b884' }} />
                    </div>
                    <div className="ab-win-foot">
                        <span>{n} projects</span>
                        <span className="ab-win-go"><Go /></span>
                    </div>
                </div>
            </button>

            <button type="button" className="ab-win ab-win--mail" onClick={openContact} aria-label="Write Artem a message">
                <Bar name="new-message" />
                <div className="ab-win-body">
                    <p className="ab-win-field"><span>To</span>Artem</p>
                    <p className="ab-win-msg">Hey Artem, I have a project<b aria-hidden /></p>
                    <div className="ab-win-foot">
                        <span className="ab-win-pill">Send a message</span>
                    </div>
                </div>
            </button>

            <a className="ab-win ab-win--cv" href={CV} download="Artem Diakunchak - CV.pdf" aria-label="Download the CV">
                <Bar name="cv.pdf" />
                <div className="ab-win-body">
                    <div className="ab-win-doc" aria-hidden>
                        <i className="ab-win-avatar" />
                        <span style={{ width: '62%' }} /><span style={{ width: '40%' }} />
                        <span style={{ width: '88%' }} /><span style={{ width: '74%' }} /><span style={{ width: '81%' }} />
                    </div>
                    <div className="ab-win-foot">
                        <span>Download CV</span>
                        <span className="ab-win-go">
                            <svg width="14" height="14" viewBox="0 0 20 20" fill="none" aria-hidden><path d="M10 2.6v9.6M5.6 8.2 10 12.6l4.4-4.4" stroke="currentColor" strokeWidth="2.4" strokeLinecap="round" strokeLinejoin="round" /><rect x="3" y="15" width="14" height="3" rx="1.5" fill="currentColor" /></svg>
                        </span>
                    </div>
                </div>
            </a>
        </div>
    )
}
