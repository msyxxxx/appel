const socket = io();
let roomId;
let localStream;

document.getElementById('createRoomBtn').onclick = () => {
    roomId = Math.floor(Math.random() * 10000);
    document.getElementById('roomIdInput').value = roomId;
    startCall();
};

document.getElementById('joinRoomBtn').onclick = () => {
    roomId = document.getElementById('roomIdInput').value;
    startCall();
};

function startCall() {
    navigator.mediaDevices.getUserMedia({ audio: true }).then(stream => {
        localStream = stream;
        document.getElementById('audio').srcObject = stream;
        document.getElementById('status').innerText = `متصل بالغرفة ${roomId}`;

        socket.emit('join-room', roomId);

        socket.on('user-connected', userId => {
            setupConnection(userId);
        });

        socket.on('user-disconnected', () => {
            document.getElementById('status').innerText = 'غير متصل';
        });
    });
}

function setupConnection(userId) {
    const peerConnection = new RTCPeerConnection();
    localStream.getTracks().forEach(track => peerConnection.addTrack(track, localStream));

    peerConnection.onicecandidate = event => {
        if (event.candidate) {
            socket.emit('signal', { roomId, userId, candidate: event.candidate });
        }
    };

    socket.on('signal', async (data) => {
        if (data.candidate) {
            await peerConnection.addIceCandidate(new RTCIceCandidate(data.candidate));
        }
    });

    peerConnection.ontrack = event => {
        document.getElementById('audio').srcObject = event.streams[0];
    };
}
