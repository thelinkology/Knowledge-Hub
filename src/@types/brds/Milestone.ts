import { z } from 'zod'

const line = z.string().trim().min(1).max(300)

/** One milestone of a delivery plan: what is delivered and what it depends on */
export const MilestoneSchema = z.object({
    title: z.string().trim().min(2, 'Name the milestone').max(150),
    deliverables: z.array(line).max(30).default([]),
    dependencies: z.array(line).max(30).default([]),
    owner: z.string().trim().max(80).default(''),
    /** Free text: a date or a period ("Week 3") */
    due: z.string().trim().max(40).default(''),
})
export type Milestone = z.infer<typeof MilestoneSchema>
