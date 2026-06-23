/**
 * Minimal ambient types for the vendored Kubeflow Design System custom
 * elements (`ds/kf-elements.js`). Only the surface this app touches is typed.
 */

/** `<kf-input>` exposes a `value` getter/setter and emits `input` events. */
export interface KfInputElement extends HTMLElement {
	value: string;
}

/** `<kf-select>` exposes a `value` getter/setter and emits `change` events. */
export interface KfSelectElement extends HTMLElement {
	value: string;
}
