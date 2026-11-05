import { createKeyedResourceStore, createResourceStore } from './createResourceStore'
import type { IntakeEditorDetails } from '@/@types/intake/IntakeEditorExtras'
import type { IntakeQuestion } from '@/@types/intake/IntakeQuestion'
import type { IntakeRule } from '@/@types/intake/IntakeRule'

/*
 * Discovery intake stores, fed by the intake *SWRProviders (SWR → Zustand bridge, see useSyncResource).
 * After a mutation, call the store's refresh() or setData with the server's response.
 */

// ── The intake form (one per intake id) ──
const intakeEditorStores = createKeyedResourceStore<IntakeEditorDetails>()
export const useIntakeEditorStore = intakeEditorStores.useKeyedStore
export const getIntakeEditorState = intakeEditorStores.getState

// ── Admin → Intake & rules ──
export const useIntakeQuestionsStore = createResourceStore<IntakeQuestion[]>()
export const useIntakeRulesStore = createResourceStore<IntakeRule[]>()
