declare module "astro:actions" {
	type Actions = typeof import("C:/Users/Dheeraj/Documents/GitHub/web_development/Shop/src/actions/index.ts")["server"];

	export const actions: Actions;
}