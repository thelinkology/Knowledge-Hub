/**
 * Every icon in the app, by meaning. Components import from here — never from react-icons directly —
 * so the icon language stays consistent and can be swapped in one place.
 */
import type { ReactNode } from 'react'
import {
    TbAdjustmentsHorizontal,
    TbAlertTriangle,
    TbApi,
    TbArrowDown,
    TbArrowRight,
    TbArrowUp,
    TbArrowsMaximize,
    TbArrowsMinimize,
    TbBell,
    TbBold,
    TbBook,
    TbBooks,
    TbBuildingSkyscraper,
    TbBulb,
    TbCalendar,
    TbCheck,
    TbChecklist,
    TbChevronDown,
    TbChevronLeft,
    TbChevronRight,
    TbChevronUp,
    TbCircleCheck,
    TbClipboardList,
    TbClock,
    TbCode,
    TbCompass,
    TbCopy,
    TbDeviceFloppy,
    TbDownload,
    TbExternalLink,
    TbEye,
    TbEyeOff,
    TbFileDescription,
    TbFileText,
    TbFilter,
    TbFolders,
    TbGripVertical,
    TbH2,
    TbH3,
    TbHistory,
    TbHourglass,
    TbInfoCircle,
    TbInfoSquareRounded,
    TbItalic,
    TbKey,
    TbLayoutDashboard,
    TbLifebuoy,
    TbLink,
    TbList,
    TbListCheck,
    TbListNumbers,
    TbLock,
    TbLogin,
    TbLogout,
    TbMail,
    TbMoon,
    TbPackage,
    TbPencil,
    TbPhoto,
    TbPlayerPlay,
    TbPlugConnected,
    TbPlus,
    TbPresentation,
    TbPrinter,
    TbPuzzle,
    TbQuote,
    TbRefresh,
    TbRestore,
    TbRoute,
    TbSchool,
    TbSearch,
    TbSend,
    TbSeparatorHorizontal,
    TbShieldLock,
    TbSitemap,
    TbSparkles,
    TbSun,
    TbTable,
    TbTag,
    TbTemplate,
    TbTool,
    TbTrash,
    TbUpload,
    TbUserCog,
    TbUserPlus,
    TbUsers,
    TbVideo,
    TbX,
    TbKeyOff,
    TbRobot,
    TbTerminal2,
    TbArrowLeft,
    TbBolt,
    TbCloud,
    TbCube,
    TbDatabase,
    TbFileSpreadsheet,
    TbFocusCentered,
    TbHandClick,
    TbHierarchy,
    TbNote,
    TbReportAnalytics,
    TbServer2,
    TbTableDown,
    TbTopologyStar3,
    TbTransfer,
    TbUser,
    TbIndentIncrease,
    TbIndentDecrease,
    TbChevronsLeft,
    TbChevronsRight,
    TbListTree,
    TbCornerDownRight,
    TbFilePlus,
} from 'react-icons/tb'
import type { IconType } from 'react-icons'

// ── Actions ──
export const AddIcon = TbPlus
export const EditIcon = TbPencil
export const DeleteIcon = TbTrash
export const SaveIcon = TbDeviceFloppy
export const CopyIcon = TbCopy
export const RefreshIcon = TbRefresh
export const RestoreIcon = TbRestore
export const PreviewIcon = TbEye
export const ShowPasswordIcon = TbEye
export const HidePasswordIcon = TbEyeOff
export const EmailIcon = TbMail
export const PasswordIcon = TbKey
export const KeyIcon = TbKey
export const LinkIcon = TbLink
export const ExternalLinkIcon = TbExternalLink
export const UploadIcon = TbUpload
export const DownloadIcon = TbDownload
export const PrintIcon = TbPrinter
export const FileIcon = TbFileText
export const SubmitIcon = TbSend
export const StartIcon = TbPlayerPlay
export const CloseIcon = TbX
export const CheckIcon = TbCheck
export const SearchIcon = TbSearch
export const FilterIcon = TbFilter
export const DragIcon = TbGripVertical
export const MoveUpIcon = TbArrowUp
export const MoveDownIcon = TbArrowDown
export const NextIcon = TbChevronRight
export const PrevIcon = TbChevronLeft
export const ExpandIcon = TbChevronDown
export const CollapseIcon = TbChevronUp
export const ForwardIcon = TbArrowRight
export const SignInIcon = TbLogin
export const SignOutIcon = TbLogout
export const AddUserIcon = TbUserPlus
export const GenerateIcon = TbSparkles
export const TagIcon = TbTag
export const HistoryIcon = TbHistory

// ── Table of contents (sub-articles) ──
export const IndentIcon = TbIndentIncrease
export const OutdentIcon = TbIndentDecrease
export const HideTocIcon = TbChevronsLeft
export const ShowTocIcon = TbChevronsRight
export const TocIcon = TbListTree
export const SubArticleIcon = TbCornerDownRight
export const AddSubArticleIcon = TbFilePlus

// ── Status ──
export const SuccessIcon = TbCircleCheck
export const ApproveIcon = TbCircleCheck
export const WarningIcon = TbAlertTriangle
export const InfoIcon = TbInfoCircle
export const LockedIcon = TbLock
export const ClockIcon = TbClock
export const CalendarIcon = TbCalendar
export const DurationIcon = TbHourglass
export const NotificationIcon = TbBell
export const DarkModeIcon = TbMoon
export const LightModeIcon = TbSun
export const GotchaIcon = TbAlertTriangle
export const BestPracticeIcon = TbBulb

// ── People & admin ──
export const StudentsIcon = TbUsers
export const PeopleIcon = TbUsers
export const RolesIcon = TbUserCog
export const SettingsIcon = TbAdjustmentsHorizontal
export const AuditIcon = TbShieldLock

// ── Editor toolbar ──
export const HeadingIcon = TbH2
export const SubheadingIcon = TbH3
export const BoldIcon = TbBold
export const ItalicIcon = TbItalic
export const LinkInsertIcon = TbLink
export const BulletListIcon = TbList
export const NumberedListIcon = TbListNumbers
export const QuoteIcon = TbQuote
export const CalloutIcon = TbInfoSquareRounded
export const CodeIcon = TbCode
export const TableIcon = TbTable
export const DividerIcon = TbSeparatorHorizontal
export const ImageIcon = TbPhoto
export const VideoIcon = TbVideo
export const FullScreenIcon = TbArrowsMaximize
export const ExitFullScreenIcon = TbArrowsMinimize

// ── Agent integration ──
export const RevokeKeyIcon = TbKeyOff
export const AgentIcon = TbRobot
export const TerminalIcon = TbTerminal2

const navigationIcon = {
    dashboard: <TbLayoutDashboard />,
    knowledge: <TbBooks />,
    collection: <TbFolders />,
    article: <TbFileText />,
    library: <TbPackage />,
    clients: <TbBuildingSkyscraper />,
    intake: <TbClipboardList />,
    brd: <TbFileDescription />,
    users: <TbUserCog />,
    products: <TbPackage />,
    rules: <TbRoute />,
    integrations: <TbPlugConnected />,
    api: <TbApi />,
    audit: <TbShieldLock />,
    recent: <TbCompass />,
    help: <TbLifebuoy />,
    route: <TbRoute />,
    checklist: <TbChecklist />,
    // Article kinds (ArticleKindOptions.articleKindIcon)
    concept: <TbBulb />,
    howTo: <TbListCheck />,
    tutorial: <TbSchool />,
    reference: <TbBook />,
    troubleshooting: <TbTool />,
    bestPractice: <TbCircleCheck />,
    // Asset kinds (Asset.assetKindIcon)
    script: <TbCode />,
    architecture: <TbSitemap />,
    demo: <TbPresentation />,
    component: <TbPuzzle />,
    template: <TbTemplate />,
} satisfies Record<string, ReactNode>

export type NavigationIconKey = keyof typeof navigationIcon

export default navigationIcon as Record<NavigationIconKey, ReactNode>

// ── Architecture diagrams (library/Diagram: component kinds and the designer) ──
export const DiagramIcon = TbTopologyStar3
export const NoteIcon = TbNote
export const MoveLeftIcon = TbArrowLeft
export const MoveRightIcon = TbArrowRight
export const FitViewIcon = TbFocusCentered

const diagramIcons = {
    source: TbServer2,
    database: TbDatabase,
    cube: TbCube,
    dimension: TbHierarchy,
    procedure: TbBolt,
    fact: TbTableDown,
    report: TbReportAnalytics,
    person: TbUser,
    action: TbHandClick,
    pipeline: TbTransfer,
    service: TbCloud,
    file: TbFileSpreadsheet,
} satisfies Record<string, IconType>

export type DiagramIconKey = keyof typeof diagramIcons

/** Icon components for diagram component kinds (Diagram.diagramKindIcon) */
export const diagramIcon: Record<DiagramIconKey, IconType> = diagramIcons
