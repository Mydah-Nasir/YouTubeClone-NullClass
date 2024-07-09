import React, { useEffect, useRef, useState, useContext } from "react";
import io from "socket.io-client";
import SimplePeer from "simple-peer";
import { RiPhoneFill } from "react-icons/ri";
import { RiVideoOnFill } from "react-icons/ri";
import { RiVideoOffFill } from "react-icons/ri";
import { RiChat4Fill } from "react-icons/ri";
import { RiChatOffFill } from "react-icons/ri";
import { SocketContext } from "../../SocketContext";

const VideoCall = () => {
  const {
    stream,
    receivingCall,
    caller,
    callerSignal,
    callAccepted,
    yourID,
    friendID,
    screenSharing,
    recordedChunks,
    recording,
    inCall,
    endCall,
    stopRecording,
    startRecording,
    replaceTrack,
    stopScreenSharing,
    startScreenSharing,
    acceptCall,
    callPeer,
    userVideo, partnerVideo, screenStream, mediaRecorder, peerRef ,socket, setFriendID
  } = useContext(SocketContext);

  const [dots, setDots] = useState("");
  //this will stay here
  const checkTime = () => {
    const currentTime = new Date();
    const currentHour = currentTime.getHours();
    return currentHour >= 10 && currentHour <= 23; // 6 PM to 12 AM
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
