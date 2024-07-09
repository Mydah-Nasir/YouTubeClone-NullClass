import React, { useEffect, useRef, useState } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { RiPhoneFill } from "react-icons/ri";
import { RiVideoOnFill } from "react-icons/ri";
import { RiVideoOffFill } from "react-icons/ri";
import { RiChat4Fill } from "react-icons/ri";
import { RiChatOffFill } from "react-icons/ri";
import { SocketContext } from "../../SocketContext";

const VideoCall = () => {
  const [stream, setStream] = useState(null);
  const [receivingCall, setReceivingCall] = useState(false);
  const [caller, setCaller] = useState("");
  const [callerSignal, setCallerSignal] = useState();
  const [callAccepted, setCallAccepted] = useState(false);
  const [yourID, setYourID] = useState("");
  const [friendID, setFriendID] = useState("");
  const [screenSharing, setScreenSharing] = useState(false);
  const [recordedChunks, setRecordedChunks] = useState([]);
  const [recording, setRecording] = useState(false);
  const [inCall, setInCall] = useState(false);
  const [dots, setDots] = useState("");
  const userVideo = useRef();
  const partnerVideo = useRef();
  const screenStream = useRef();
  const mediaRecorder = useRef();
  const peerRef = useRef();
  const socket = useRef();

  useEffect(() => {
    // socket.current = io.connect("http://localhost:5000/");
    socket.current = io.connect("https://youtubeclone-nullclass.onrender.com/");

    const getUserMedia = async () => {
      try {
        const newStream = await navigator.mediaDevices.getUserMedia({ video: true, audio: true });
        setStream(newStream);
        if (userVideo.current) {
          userVideo.current.srcObject = newStream;
          console.log('stream set')
        }
      } catch (error) {
        console.error("Error accessing media devices:", error);
      }
    };
  
    getUserMedia(); // Call getUserMedia when the component mounts

    socket.current.on("yourID", (id) => {
      setYourID(id);
    });

    socket.current.on("hey", (data) => {
      setReceivingCall(true);
      setCaller(data.from);
      setCallerSignal(data.signal);
    });

    // Added this to handle end call event
    socket.current.on("callEnded", () => {
      endCall();
    });
  }, []);

  const callPeer = (id) => {
    const peer = new SimplePeer({
      initiator: true,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("callUser", {
        userToCall: id,
        signalData: data,
        from: yourID,
      });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    peer.on("close", () => {
      endCall();
    });

    socket.current.on("callAccepted", (signal) => {
      setCallAccepted(true);
      setInCall(true);
      peer.signal(signal);
    });

    peerRef.current = peer;
  };

  const acceptCall = () => {
    const peer = new SimplePeer({
      initiator: false,
      trickle: false,
      stream: stream,
    });

    peer.on("signal", (data) => {
      socket.current.emit("acceptCall", { signal: data, to: caller });
    });

    peer.on("stream", (stream) => {
      if (partnerVideo.current) {
        partnerVideo.current.srcObject = stream;
      }
    });

    peer.on("close", () => {
      endCall();
    });

    peer.signal(callerSignal);
    setCallAccepted(true);
    setInCall(true);
    peerRef.current = peer;
  };

  const startScreenSharing = async () => {
    try {
      screenStream.current = await navigator.mediaDevices.getDisplayMedia({
        video: true,
      });
      setScreenSharing(true);
      replaceTrack(screenStream.current.getVideoTracks()[0]);
      if (userVideo.current) {
        userVideo.current.srcObject = screenStream.current;
      }
    } catch (error) {
      console.error("Error sharing screen:", error);
    }
  };

  const stopScreenSharing = () => {
    screenStream.current.getTracks().forEach((track) => track.stop());
    setScreenSharing(false);
    navigator.mediaDevices
      .getUserMedia({ video: true, audio: true })
      .then((newStream) => {
        setStream(newStream);
        replaceTrack(newStream.getVideoTracks()[0]);
        if (userVideo.current) {
          userVideo.current.srcObject = newStream;
        }
      });
  };

  const replaceTrack = (newTrack) => {
    const peer = peerRef.current;
    const sender = peer.streams[0].getVideoTracks()[0];
    peer.replaceTrack(sender, newTrack, peer.streams[0]);
  };

  const startRecording = () => {
    setRecording(true);
    mediaRecorder.current = new MediaRecorder(stream);
    mediaRecorder.current.ondataavailable = (event) => {
      if (event.data.size > 0) {
        setRecordedChunks((prev) => [...prev, event.data]);
      }
    };
    mediaRecorder.current.start();
  };

  const stopRecording = () => {
    setRecording(false);
    mediaRecorder.current.stop();
    const blob = new Blob(recordedChunks, {
      type: "video/webm",
    });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.style.display = "none";
    a.href = url;
    a.download = "recording.webm";
    document.body.appendChild(a);
    a.click();
    window.URL.revokeObjectURL(url);
    setRecordedChunks([]);
  };
  //this will stay here
  const checkTime = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    return currentHour >= 10 && currentHour <= 23; // 6 PM to 12 AM
  };

  const endCall = () => {
    if (peerRef.current) {
      peerRef.current.destroy();
    }
    setCallAccepted(false);
    setInCall(false);
    setReceivingCall(false);
    setCaller('');
    setCallerSignal(null);
    if (partnerVideo.current) {
      partnerVideo.current.srcObject = null;
    }
    // Emit endCall event to the other user
    socket.current.emit('endCall', { to: caller || friendID });
  };

  // Animation for trailing dots
  useEffect(() => {
    const interval = setInterval(() => {
      setDots((prevDots) => (prevDots.length < 3 ? prevDots + "." : ""));
    }, 500);
    return () => clearInterval(interval);
  }, []);

  const vibrateStyle = `
        @keyframes vibrate {
            0% { transform: translate(0); }
            20% { transform: translate(-2px, 2px); }
            40% { transform: translate(-2px, -2px); }
            60% { transform: translate(2px, 2px); }
            80% { transform: translate(2px, -2px); }
            100% { transform: translate(0); }
        }
    `;

  const buttonStyle = {
    backgroundColor: "green",
    color: "white",
    // borderRadius: '50%',
    width: "40px",
    height: "40px",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
  };

  const grayBtnStyle = {
    color: "white",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    margin: "0 10px", // Add margin to space out the buttons
  };

  const iconStyle = {
    fill: "lightgray",
    width: "24px",
    height: "24px",
  };

  const grayIconStyle = {
    fill: "darkgray",
    width: "24px",
    height: "24px",
  };

  const containerStyle = {
    display: "flex",
    alignItems: "center",
    marginTop: "20px",
    justifyContent: "center",
  };

  const callingContainer = {
    alignItems: "center",
    justifyContent: "center",
  };

  const inputStyle = {
    width: "360px",
    padding: "10px",
    height: "40px", // Align the input height with the button height
    boxSizing: "border-box", // Ensure padding and border are included in the element's total width and height
  };

  const acceptCallBtn = {
    backgroundColor: "green",
    color: "white",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    marginLeft: "50%", // Add margin to space out the buttons
    animation: "vibrate 0.5s infinite",
  };
  const endCallStyle = {
    backgroundColor: "red",
    color: "white",
    borderRadius: "50%",
    width: "50px",
    height: "50px",
    display: "flex",
    alignItems: "center",
    justifyContent: "center",
    border: "none",
    cursor: "pointer",
    margin: "0 10px", // Add margin to space out the buttons
  };

  return (
    <div
      style={{
        width: "100%",
        display: "flex",
        justifyContent: "center",
        alignItems: "center",
        flexDirection: "column",
        marginTop: "20px",
      }}
    >
      {checkTime() ? (
        <div>
          <div
            style={{
              display: "flex",
              justifyContent: "center",
              alignItems: "center",
              margin: "auto",
            }}
          >
            {stream && (
              <video
                playsInline
                muted
                ref={userVideo}
                autoPlay
                style={{
                  width: "400px",
                  marginBottom: "10px",
                  marginRight: "20px",
                }}
              />
            )}
            {callAccepted && (
              <video
                playsInline
                ref={partnerVideo}
                autoPlay
                style={{ width: "400px", marginBottom: "10px" }}
              />
            )}
          </div>
          <div>
            <p style={{ color: "white", textAlign: "center" }}>
              Your ID: {yourID}
            </p>
            <div style={containerStyle}>
              <input
                type="text"
                placeholder="Enter friend's ID to call"
                value={friendID}
                onChange={(e) => setFriendID(e.target.value)}
                style={inputStyle}
              />
              <button onClick={() => callPeer(friendID)} style={buttonStyle}>
                <RiPhoneFill style={iconStyle} />
              </button>
            </div>
          </div>
          <style>{vibrateStyle}</style>
          <div>
            {receivingCall && !callAccepted && (
              <div style={callingContainer}>
                <h1 style={{ color: "white" }}>
                  {caller} is calling you {dots}
                </h1>
                <button onClick={acceptCall} style={acceptCallBtn}>
                  <RiPhoneFill style={iconStyle} />
                </button>
              </div>
            )}
          </div>
          <div style={containerStyle}>
            <div>
              {screenSharing ? (
                <button onClick={stopScreenSharing} style={grayBtnStyle}>
                  <RiChatOffFill style={grayIconStyle} />
                </button>
              ) : (
                <button onClick={startScreenSharing} style={grayBtnStyle}>
                  <RiChat4Fill style={grayIconStyle} />
                </button>
              )}
            </div>
            <div>
              {recording ? (
                <button onClick={stopRecording} style={grayBtnStyle}>
                  <RiVideoOffFill style={grayIconStyle} />
                </button>
              ) : (
                <button onClick={startRecording} style={grayBtnStyle}>
                  <RiVideoOnFill style={grayIconStyle} />
                </button>
              )}
            </div>
            <div>
              {inCall && (
                <button onClick={endCall} style={endCallStyle}>
                  <RiPhoneFill style={iconStyle} />
                </button>
              )}
            </div>
          </div>
        </div>
      ) : (
        <div>
          <h1>Video calls are only allowed from 6 PM to 12 AM</h1>
        </div>
      )}
    </div>
  );
};

export default VideoCall;
