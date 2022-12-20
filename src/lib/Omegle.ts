import { findAndUnshift, getRandom } from "$lib/array-tools";
import { Session, type DisconnectHandler, type OmegleEvent } from './Session';
import type { Settings } from './settings';

type ErrorHandler = (error: string | Error) => void;
type EventData = string | Record<string, unknown>;
type Event = [string, EventData?];

const encodeObject = (data: Record<string, unknown>) => {
	const formData: string[] = [];
	const append = (key: string, value: string) => {
		formData.push(key + "=" + encodeURIComponent(value));
	};

	for (const key in data) {
		const value = data[key];
		switch (typeof value) {
			case "string":
				append(key, value);
				break;
			case "object":
				if (Array.isArray(value)) {
					value.forEach((element) => {
						append(key, JSON.stringify(element));
					});
					continue;
				}
				append(key, JSON.stringify(value));
				break;
			case "boolean":
				append(key, Number(value).toString());
				break;
		}
	}
	return formData.join("&");
};

interface ConnectionConfig {
	caps: string,
	webrtc?: boolean,
	firstevents: boolean,
	lang: string,
	topics?: string,
}

class Omegle {
	private connectionConfig: ConnectionConfig
	private errorHandler: ErrorHandler
	private server: string

	private constructor(server: string, settings: Settings) {
		this.connectionConfig = this.createConnectionConfig(settings)
		this.errorHandler = _ => void 0	//TODO: handle errors for real
		this.server = server
	}

	static async create(settings: Settings): Promise<Omegle> {
		const server = await this.chooseServer()
		return new Omegle(server, settings)
	}

	private createConnectionConfig(settings: Settings): ConnectionConfig {
		return {
			caps: "t2",
			webrtc: settings.video ? true : undefined,
			firstevents: false,
			lang: settings.lang,
			topics: settings.likes_enabled ? JSON.stringify(settings.likes) : undefined,
		}
	}

	static formatURL(server: string, path: string) {
		//const host = window?.parent.location.host || window.location.host
		//const domain = host.replace("www.", "")
		//const protocol = window?.parent.location.protocol || window.location.protocol
		return `http://${server}.localhost:5173/${path}`
	}

	static async chooseServer(): Promise<string> {
		const res = await fetch(this.formatURL("chatserv", "status"))
			//.catch(this.errorHandler)
		const data = await res?.json()
		const server = getRandom(data.servers) as string
		console.log(`Chose server ${server}`)
		return server
	}

	private async post(path: string, data?: string) {
		return fetch(Omegle.formatURL(this.server, path), {
			method: "POST",
			body: data,
			headers: {
				"content-type": "application/x-www-form-urlencoded",
			},
			referrerPolicy: "no-referrer",
		})
		.catch(this.errorHandler)
	}
	
	public postWithId(id: string, path: string, data: Record<string, unknown> = {}) {
		const encodedData = encodeObject({ id, ...data })
		return this.post(path, encodedData)
	}

	private async connect() {
		//@ts-expect-error TODO: fix this
		const args = encodeObject(this.connectionConfig)
		const res = await this.post(`start?${args}`)
		return res?.json()
	}

	public async getEvents(session: Session): Promise<OmegleEvent[]> {
		const res = await this.postWithId(session.id, "events")
		if (!res || !res.ok) {
			return []
		}
		const data = await res.json().catch(() => [] as OmegleEvent[])
		return this.parseEvents(data)
	}

	public async startSession(settings: Settings, onDiconnect: DisconnectHandler): Promise<Session> {
		console.log('Starting new Session')
		const res = await this.connect()
		const session = await Session.create(res.clientID, settings, onDiconnect)
		const events = this.parseEvents(res.events)
		session.handleEvents(events, this)
		return session
	}

	private parseEvents(events: Event[]): OmegleEvent[] {
		if (events == null) {
			return [{ name: "nullRequest" }]
		}
		events = findAndUnshift(events, (element: (EventData | undefined)[]) => element[0] === "identDigests")
		return events.map(event => ({
			name: event[0],
			data: event[1],
		}))
	}
}

export default Omegle;
