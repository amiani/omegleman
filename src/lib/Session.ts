import type Omegle from './Omegle'
import type { Settings } from './settings'

export class Session {
	id: string
	//started: boolean
	connected: boolean
	video: boolean
	typing: false
	rtc: {
		call: boolean,
		peer: boolean,
		candidates: RTCIceCandidate[],
		icelocal: RTCIceCandidate[],
		wait: 0,
	}
	settings: Settings

	private constructor(id: string, settings: Settings) {
		this.id = id
		this.connected = false
		this.video = false
		this.typing = false
		this.rtc = {
			call: false,
			peer: false,
			candidates: [],
			icelocal: [],
			wait: 0,
		}
		this.settings = settings
	}

	static create(id: string, settings: Settings): Session {
		return new Session(id, settings)
	}

	private handleConnected(omegle: Omegle) {
		console.log('connected')
		//wait for video to be established, if it isn't after a delay, disconnect the session
		setTimeout(() => {
			const sessionBool = !this.video && this.connected;
			const settingBool = this.settings.autodisconnect && this.settings.video;
			if (settingBool && sessionBool) {
				omegle.postWithId(this.id, "disconnect")
			}
		}, this.settings.autodisconnect_delay);
		//clearAdd("You're now chatting with a random stranger.");
		this.connected = true;
	}

	public handleEvents(events: OmegleEvent[], omegle: Omegle) {
		for (const event of events) {
			const shouldBreak = this.handleEvent(event, omegle);
			if (shouldBreak) {
				break
			}
		}
	}

	public handleEvent(event: OmegleEvent, omegle: Omegle) {
		const { name, data } = event;
		switch (name) {
			case "rtccall":
			case "rtcpeerdescription":
			case "icecandidate":
				eventHandlerRTC(event);
				break;
			case "gotMessage":
				setTyping(false);
				addMessage(data, "stranger");
				break;
			case "typing":
				setTyping(true);
				break;
			case "stoppedTyping":
				setTyping(false);
				break;
			case "commonLikes":
				addStatus(getLikeString(data));
				break;
			case "connected":
				this.handleConnected(omegle);
				break;
			case "strangerDisconnected":
				userDisconect("Stranger");
				break;
			case "nullRequest":
				if (session.connected) {
					userDisconect("Stranger");
				}
				break;
			case "waiting":
				clearAdd("Waiting");
				break;
			case "identDigests":
				return twiceSkipping(data);
			case "serverMessage":
				addStatus(data);
				break;
			case "error":
				if (data.includes("banned")) {
					settings.autoskip = false;
				}
				console.log(event);
				break;
			default:
				console.log(event);
				break;
		}
	}
}

export interface OmegleEvent {
	name: string;
	data?: any;
}

