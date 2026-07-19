/* ============================================================
   Home dashboard — data model.

   The page renders two regions driven by the `dashboard-home`
   ConfigMap (namespace `kubeflow`):
     • platform service cards  (data.services)
     • announcements           (data.announcements)
   See pages/home/example-configmap.yaml for the expected shape.
   ============================================================ */

/**
 * Color treatment for a service-card status badge. Maps onto the design
 * system's semantic status palette (ds/tokens/colors.css).
 */
export type StatusTone = 'success' | 'warning' | 'error' | 'info' | 'neutral';

/** Optional pill shown in the top-right corner of a service card. */
export interface ServiceStatus {
	/** Short text, e.g. "2 Running", "Online", "3 runs today". */
	label: string;
	/** Drives the badge colors. Defaults to `neutral` when omitted by the API. */
	tone?: StatusTone;
}

/** A platform service rendered as a clickable card in the "Platform services" grid. */
export interface PlatformService {
	id: string;
	/** Card heading, e.g. "Notebook Servers". */
	title: string;
	/** Material Icons ligature name, e.g. "book", "account_tree", "smart_toy". */
	icon: string;
	/** One-to-two sentence description. */
	description: string;
	/** Where the card navigates when clicked. */
	href: string;
	/** Call-to-action label next to the arrow. Defaults to "Open". */
	cta?: string;
	/** Optional status badge. */
	status?: ServiceStatus;
}

/**
 * Announcement category. Drives the icon and color treatment:
 *   • `info`      — neutral/informational (blue)
 *   • `important` — needs attention / time-sensitive (amber)
 */
export type AnnouncementCategory = 'info' | 'important';

/** Optional call-to-action link on an announcement. */
export interface AnnouncementLink {
	label: string;
	href: string;
}

/** A single announcement shown in the "Announcements" panel. */
export interface Announcement {
	id: string;
	title: string;
	/** Body copy (plain text). */
	body: string;
	category: AnnouncementCategory;
	link?: AnnouncementLink;
}

/** Combined payload returned by the ConfigMap-backed data loader. */
export interface HomeData {
	services: PlatformService[];
	announcements: Announcement[];
}
