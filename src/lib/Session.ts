import type Omegle from './Omegle'
import type { Settings } from './settings'

export type RemoteStreamHandler = (stream: MediaStream) => void
export type DisconnectHandler = (id: string) => void

export interface Message {
	author: string
	text: string
}

const rtcConfig = {
	iceServers: [
		{
			urls: "stun:stun.l.google.com:19302",
		},
		{
			urls: "stun:stun.services.mozilla.com",
		},
	],
}

export class Session {
	id: string
	//started: boolean
	connected: boolean
	//video: boolean
	isStrangerTyping: boolean
	rtc: {
		call: boolean,
		peer: boolean,
		candidates: RTCIceCandidate[],
		localICECandidates: RTCIceCandidate[],
		wait?: NodeJS.Timeout
	}
	peerConnection: RTCPeerConnection
	localStream: MediaStream
	remoteStream?: MediaStream
	settings: Settings
	messages: Message[] = []

	handleDisconnect: DisconnectHandler

	private constructor(
		id: string,
		settings: Settings,
		localStream: MediaStream,
		omegle: Omegle,
		onRemoteStream: RemoteStreamHandler,
		onDisconnect: DisconnectHandler
	) {
		this.id = id
		this.connected = false
		this.isStrangerTyping = false
		this.rtc = {
			call: false,
			peer: false,
			candidates: [],
			localICECandidates: [],
		}
		this.settings = settings
		this.handleDisconnect = onDisconnect

		this.localStream = localStream
		this.peerConnection = new RTCPeerConnection(rtcConfig)
		for (const track of localStream.getTracks()) {
			this.peerConnection.addTrack(track, localStream)
		}
		this.peerConnection.ontrack = (event: RTCTrackEvent) => {
			console.log('Received remote stream')
			this.remoteStream = event.streams[0]
			onRemoteStream(event.streams[0])
		}

		this.peerConnection.onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
			if (this.peerConnection.iceGatheringState === "complete") {
				return
			}
			event.candidate && this.rtc.localICECandidates.push(event.candidate);
			clearTimeout(this.rtc.wait);
			this.rtc.wait = setTimeout(() => {
				omegle.postWithId(this.id, "icecandidate", { candidate: this.rtc.localICECandidates });
				this.rtc.localICECandidates = []
				this.rtc.wait = undefined;
			}, 50);
		}
	}

	static async create(
		id: string,
		settings: Settings,
		omegle: Omegle,
		onRemoteStream: RemoteStreamHandler,
		onDisconnect: DisconnectHandler
	): Promise<Session> {
		const stream = await navigator.mediaDevices.getUserMedia({
			video: true,
			audio: {
				echoCancellation: true,
				noiseSuppression: true,
			},
		})
		return new Session(id, settings, stream, omegle, onRemoteStream, onDisconnect)
	}

	private async handleRTCCall(omegle: Omegle) {
		this.rtc.call = true
		const offer = await this.peerConnection.createOffer({
			offerToReceiveAudio: true,
			offerToReceiveVideo: true
		})
		await this.peerConnection.setLocalDescription(offer)
		omegle.postWithId(this.id, "rtcpeerdescription", { desc: offer })
	}

	private async handleRTCPeerDescription(event: OmegleEvent, omegle: Omegle) {
		await this.peerConnection.setRemoteDescription(
			new RTCSessionDescription(event.data)
		)
		this.rtc.peer = true
		for (let i = 0; i < this.rtc.candidates.length; i++) {
			const signal = this.rtc.candidates[i]
			await this.peerConnection.addIceCandidate(new RTCIceCandidate(signal))
		}
		this.rtc.candidates.splice(0, this.rtc.candidates.length)
		if (!this.rtc.call) {
			const sessionDescription = await this.peerConnection.createAnswer({
				offerToReceiveAudio: true,
				offerToReceiveVideo: true
			})
			await this.peerConnection.setLocalDescription(sessionDescription)
			omegle.postWithId(this.id, "rtcpeerdescription", { desc: sessionDescription });
		}
	}

	private async handleICECandidate(event: OmegleEvent) {
		const candidate = event.data
		if (!this.rtc.peer) {
			this.rtc.candidates.push(candidate)
			return
		}
		this.peerConnection.addIceCandidate(new RTCIceCandidate(candidate))
	}

	private handleConnected(omegle: Omegle) {
		//wait for video to be established, if it isn't after a delay, disconnect the session
		setTimeout(() => {
			const sessionBool = !this.remoteStream && this.connected
			const settingBool = this.settings.autodisconnect && this.settings.video
			if (settingBool && sessionBool) {
				omegle.postWithId(this.id, "disconnect")
			}
		}, this.settings.autodisconnect_delay)
		//clearAdd("You're now chatting with a random stranger.");
		this.connected = true
	}

	private handleTyping() {
		this.isStrangerTyping = true
	}

	private handleStoppedTyping() {
		this.isStrangerTyping = false
	}

	private handleGotMessage(event: OmegleEvent) {
		this.isStrangerTyping = false
		console.log(`Stranger: ${event.data}`)
		this.messages.push({ author: "Stranger", text: event.data })
	}

	public handleEvents(events: OmegleEvent[], omegle: Omegle) {
		for (const event of events) {
			this.handleEvent(event, omegle)
		}
	}

	public handleEvent(event: OmegleEvent, omegle: Omegle) {
		const { name, data } = event
		console.log(`received event: ${name}`)
		switch (name) {
			case "rtccall":
				this.handleRTCCall(omegle)
				break
			case "rtcpeerdescription":
				this.handleRTCPeerDescription(event, omegle)
				break
			case "icecandidate":
				this.handleICECandidate(event)
				break;
			case "gotMessage":
				this.handleGotMessage(event)
				break;
			case "typing":
				this.handleTyping()
				break;
			case "stoppedTyping":
				this.handleStoppedTyping()
				break;
			case "commonLikes":
				addStatus(getLikeString(data))
				break;
			case "connected":
				this.handleConnected(omegle)
				break;
			case "strangerDisconnected":
				this.handleDisconnect(this.id)
				break;
			case "nullRequest":
				this.handleDisconnect(this.id)
				break;
			case "waiting":
				clearAdd("Waiting")
				break
			case "identDigests":
				//return twiceSkipping(data)
				break
			case "serverMessage":
				addStatus(data)
				break
			case "error":
				if (data.includes("banned")) {
					settings.autoskip = false
				}
				console.log(event)
				break
			default:
				console.log(event)
				break
		}
	}
}

export interface OmegleEvent {
	name: string
	data?: any
}

