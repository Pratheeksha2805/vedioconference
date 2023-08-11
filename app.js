const localVideo = document.getElementById('localVideo');
const remoteVideo = document.getElementById('remoteVideo');
const chatLog = document.getElementById('chatLog');
const chatInput = document.getElementById('chatInput');
const sendButton = document.getElementById('sendButton');
const startButton = document.getElementById('startButton');
const hangupButton = document.getElementById('hangupButton');
const startRecordingButton = document.getElementById('startRecordingButton');
const stopRecordingButton = document.getElementById('stopRecordingButton');

let localStream;
let remoteStream;
let pc;

sendButton.addEventListener('click', sendMessage);
startButton.addEventListener('click', startCall);
hangupButton.addEventListener('click', hangUp);
startRecordingButton.addEventListener('click', startRecording);
stopRecordingButton.addEventListener('click', stopRecording);

async function startCall() {
    try {
        localStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        localVideo.srcObject = localStream;

        const configuration = { iceServers: [{ urls: 'stun:stun.l.google.com:19302' }] };
        pc = new RTCPeerConnection(configuration);

        localStream.getTracks().forEach(track => pc.addTrack(track, localStream));

        pc.ontrack = event => {
            remoteStream = event.streams[0];
            remoteVideo.srcObject = remoteStream;
        };

        const offer = await pc.createOffer();
        await pc.setLocalDescription(offer);

        // Send the offer to the other participant (signaling is not shown in this example)
    } catch (error) {
        console.error('Error starting the call:', error);
    }
}

function hangUp() {
    if (pc) {
        pc.close();
    }
    if (localStream) {
        localStream.getTracks().forEach(track => track.stop());
    }
    if (remoteStream) {
        remoteStream.getTracks().forEach(track => track.stop());
    }

    localVideo.srcObject = null;
    remoteVideo.srcObject = null;
}

function sendMessage() {
    const message = chatInput.value;
    if (message.trim() !== '') {
        appendMessage('You: ' + message);
        // Send the message to the other participant (signaling is not shown in this example)
        chatInput.value = '';
    }
}

function appendMessage(message) {
    const messageElement = document.createElement('div');
    messageElement.textContent = message;
    chatLog.appendChild(messageElement);
}

let mediaRecorder;
let recordedChunks = [];

function startRecording() {
    if (remoteStream || localStream) {
        recordedChunks = [];
        mediaRecorder = new MediaRecorder(remoteStream || localStream, {
            mimeType: 'video/webm;codecs=vp9,opus' // Include audio (opus codec)
        });

        mediaRecorder.ondataavailable = event => {
            if (event.data.size > 0) {
                recordedChunks.push(event.data);
            }
        };

        mediaRecorder.onstop = () => {
            const blob = new Blob(recordedChunks, { type: 'video/webm' });
            const url = URL.createObjectURL(blob);
            const a = document.createElement('a');
            a.href = url;
            a.download = 'video_recording.webm';
            a.textContent = 'Download Recording';
            document.body.appendChild(a);
        };

        mediaRecorder.start();
        startRecordingButton.disabled = true;
        stopRecordingButton.disabled = false;
    }
}

function stopRecording() {
    if (mediaRecorder) {
        mediaRecorder.stop();
        mediaRecorder = null;
        startRecordingButton.disabled = false;
        stopRecordingButton.disabled = true;
    }
}
