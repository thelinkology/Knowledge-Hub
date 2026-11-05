import type { IntakeEditorData } from './Intake'

/** An article or library asset a rule links to, by title */
export interface LinkedItem {
    id: string
    title: string
}

/** Titles of the articles and assets linked from rules (for links in the guidance panel) */
export interface RuleLinkTitles {
    articles: LinkedItem[]
    assets: LinkedItem[]
}

/** GET/PUT /api/intakes/[intakeId]: the intake form's data plus the titles of the rules' links */
export interface IntakeEditorDetails extends IntakeEditorData {
    links: RuleLinkTitles
}
