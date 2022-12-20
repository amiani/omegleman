import { clearArray } from "modules/array.js";
import { othervideo } from "ui/nodes/video.js";
import type { OmegleEvent } from '../Session';

const WEB = {
	config: {
		iceServers: [
			{
				urls: "stun:stun.l.google.com:19302",
			},
			{
				urls: "stun:stun.services.mozilla.com",
			},
		],
	},
	constrains: {
		offerToReceiveAudio: true,
		offerToReceiveVideo: true,
	},
};


const handleRTCEvent = async (event: OmegleEvent) => {
	switch (event.name) {
		case "icecandidate":
			if (!rtc.peer) {
				rtc.candidates.push(event.data);
				break;
			}
			pc.addIceCandidate(new RTCIceCandidate(event.data));
			break;
	}
};

const createPC = (media: MediaStream) => {
	pc = new PeerConnection();
	pc.addVideo(media);
	Object.freeze(pc);
};

const replaceTrack = async (mediaTrack: MediaStreamTrack) => {
	const senders = pc.getSenders();
	const sender = senders.find((s) => s.track.kind == mediaTrack.kind);
	sender.replaceTrack(mediaTrack);
};

const deletePC = () => {
	pc.close();
	delete pc.ontrack;
	delete pc.onicecandidate;
	pc = null;
};

let pc: PeerConnection;

export { handleRTCEvent, createPC, deletePC, replaceTrack };
