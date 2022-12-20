export default class PeerConnection extends RTCPeerConnection {
	constructor() {
		super(config)
	}

	ontrack = (event: RTCTrackEvent) => {
		othervideo.srcObject = event.streams[0];
	};

	onicecandidate = async (event: RTCPeerConnectionIceEvent) => {
		if (this.iceGatheringState === "complete") {
			return;
		}
		session.rtc.icelocal.push(event.candidate);
		clearTimeout(session.rtc.wait);
		session.rtc.wait = setTimeout(() => {
			backend.sendIdentifiedPOST("icecandidate", { candidate: session.rtc.icelocal });
			clearArray(session.rtc.icelocal);
			session.rtc.wait = null;
		}, 50);
	};

	addVideo(media: MediaStream) {
		const tracks = media.getTracks();
		for (const track of tracks) {
			this.addTrack(track, media);
		}
	}


	async answer(options?: RTCOfferOptions) {
		const sessionDescription = await this.createAnswer(options);
		await this.setLocalDescription(sessionDescription);
		//backend.sendIdentifiedPOST("rtcpeerdescription", { desc: sessionDescription });
		return sessionDescription
	}

	wait = 0;
}