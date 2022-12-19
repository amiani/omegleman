type Theme = "dark" | "light"

interface KeyBind {
	mode: string,
	code: string,
	command: string,
}

const settings = {
	autoskip: false,
	autoskip_delay: 500,
	block_unload: false,
	twiceskip: false,
	skip_with_esc: false,
	autodisconnect: false,
	autodisconnect_delay: 10000,
	autoclearchat: true,
	silent_typing: false,
	cmd_history: 25,
	likes: <string[]>[],
	likes_enabled: false,
	lang: "en",
	theme: <Theme>"light",
	video: true,
	socials: {},
	bindings: <KeyBind[]>[],
}

export type Settings = typeof settings

export default settings