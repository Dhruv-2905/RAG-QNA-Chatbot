import { MessageOutlined, SendOutlined } from "@mui/icons-material";
import {
  Box,
  Button,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import { useEffect, useRef, useState } from "react";
import { useSelector, useDispatch } from "react-redux";
import { RootState } from "../redux/store";
import { setDisplayChat, setMessages, setNewMessage } from "../redux/chatbot";
import { api } from "../services/api";
import Loader from "../common/Loader";
import parseMarkdownToJSX from "../utils/parseMarkdownToJSX";
import avatar from "../assets/chatbot.png";
import user2 from "../assets/user2.webp";
import microphone from "../assets/microphone.png";
import SpeechRecognition, {
  useSpeechRecognition,
} from "react-speech-recognition";
import microphoneListening from "../assets/microphoneListening.jfif";
import { capitalizeQuestion } from "../utils/capitalizeQuestion";

const Messages = () => {
  const dispatch = useDispatch();
  const messages = useSelector((state: RootState) => state.chatbot.messages);
  const newMessage = useSelector(
    (state: RootState) => state.chatbot.newMessage
  );
  const [messageValue, setMessageValue] = useState("");
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const [loading, setLoading] = useState(false);
  const dataId = useSelector((state: RootState) => state.chatbot.dataId);
  const displayChat = useSelector(
    (state: RootState) => state.chatbot.displayChat
  );
  const { transcript, listening, resetTranscript } = useSpeechRecognition();

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  }, [messages, loading]);

  useEffect(() => {
    if (newMessage && newMessage.trim().length > 0 && displayChat) {
      dispatch(
        setMessages({
          text: capitalizeQuestion(newMessage),
          isUser: true,
          timestamp: getCurrentTime(),
        })
      );
      handleSearch(newMessage, true);
      dispatch(setNewMessage(""));
    }
  }, [newMessage, displayChat]);

  useEffect(() => {
    if (transcript) {
      setMessageValue(transcript);
    }
  }, [transcript]);

  const handleMessageValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    const message = capitalizeQuestion(e.target.value);
    setMessageValue(message);
  };

  const getCurrentTime = () => {
    const now = new Date();
    const hours = now.getHours().toString().padStart(2, "0");
    const minutes = now.getMinutes().toString().padStart(2, "0");
    return `${hours}:${minutes}`;
  };

  const handleSearch = async (
    message: string = messageValue,
    fromNewMessage: boolean = false
  ) => {
    if (message.trim().length === 0) return;
    const sentMessage = message.trim();
    if (!fromNewMessage) {
      dispatch(
        setMessages({
          text: sentMessage,
          isUser: true,
          timestamp: getCurrentTime(),
        })
      );
    }
    setMessageValue("");
    setLoading(true);
    const payload = { question: sentMessage, type: dataId };
    const url = `/chat/`;

    try {
      const response = await api.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      const botMessage = response.data.answers;
      const ambiguousData = response.data.ambiguous_data || [];
      const formattedBotMessage = parseMarkdownToJSX(botMessage);
      dispatch(
        setMessages({
          text: formattedBotMessage,
          isUser: false,
          timestamp: getCurrentTime(),
          ambiguous_data: ambiguousData,
        })
      );
    } catch (err) {
      console.error("Error sending message:", err);
      dispatch(
        setMessages({
          text: "Error: Could not send message",
          isUser: false,
          timestamp: getCurrentTime(),
        })
      );
    } finally {
      setLoading(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && messageValue.trim().length > 0) {
      handleSearch();
    }
  };

  const handleMicrophoneClick = () => {
    if (listening) {
      SpeechRecognition.stopListening();
      if (transcript.trim().length > 0) {
        handleSearch(transcript);
        resetTranscript();
      }
    } else {
      SpeechRecognition.startListening({ continuous: false });
    }
  };

  return (
    <Stack direction="column" height="100vh" position={"relative"}>
      <Box className="top-headers">
        <Typography
          textAlign={"center"}
          fontWeight="600"
          fontFamily="Poppins"
          sx={{ cursor: "default" }}
        >
          Messages
        </Typography>
      </Box>
      {!displayChat && messages.length === 0 ? (
        <Box
          sx={{
            overflowY: "auto",
            padding: "200px 12px 48px",
          }}
          display={"flex"}
          flexDirection={"column"}
          justifyContent={"space-between"}
          gap={1}
          alignItems={"center"}
        >
          <IconButton>
            <MessageOutlined sx={{ color: "#012954" }} />
          </IconButton>
          <Typography className="message-typos">No Messages</Typography>
          <Typography className="message-typos">
            Messages from the team will be shown here
          </Typography>
          <Button
            variant="contained"
            className="new-message-button"
            onClick={() => dispatch(setDisplayChat(true))}
          >
            Add New Message
          </Button>
        </Box>
      ) : (
        <>
          <Box
            mb={9}
            sx={{
              flexGrow: 1,
              overflowY: "auto",
              padding: "54px 12px 8px",
              display: "flex",
              flexDirection: "column-reverse",
              gap: "7px",
              justifyContent:
                messages.length === 0 && !loading ? "flex-end" : "flex-start",
            }}
          >
            <div ref={messagesEndRef} />
            {loading && (
          <Box
            display={"flex"}
            alignSelf={"flex-start"}
          >
            <img src={avatar} alt={"Bot Avatar"} className="avatar-image" />
            <Loader />
          </Box>
        )}
            {messages.length === 0 && !loading ? (
              <Typography
                color="#757575"
                fontFamily="Poppins"
                fontSize={18}
                textAlign="center"
                mt={24}
              >
                No Message Available
              </Typography>
            ) : (
              <>
                {messages
                  .slice()
                  .reverse()
                  .map((msg, index) => (
                    <Box
                      key={messages.length - 1 - index}
                      sx={{
                        display: "flex",
                        justifyContent: msg.isUser ? "flex-end" : "flex-start",
                        maxWidth: "80%",
                        alignSelf: msg.isUser ? "flex-end" : "flex-start",
                      }}
                    >
                      <Box display={"flex"} flexDirection={"column"} gap={0.5}>
                        <Typography
                          fontFamily="Poppins"
                          fontSize={10}
                          fontWeight={600}
                          mx={4}
                          color="#979797"
                          textAlign={msg.isUser ? "right" : "left"}
                        >
                          {msg.isUser ? "You" : "Chatbot"}
                        </Typography>
                        <Box
                          display={"flex"}
                          flexDirection={msg.isUser ? "row-reverse" : "row"}
                          alignItems={"start"}
                          gap={1}
                        >
                          <img
                            src={msg.isUser ? user2 : avatar}
                            alt={msg.isUser ? "User Avatar" : "Bot Avatar"}
                            className="avatar-image"
                          />
                          <Typography
                            mt={0.4}
                            className={msg.isUser ? "user-card" : "card"}
                            sx={{
                              backgroundColor: msg.isUser ? "#f5f5f7" : "#fff",
                            }}
                            fontFamily="Poppins"
                            fontWeight={400}
                            fontSize={10}
                          >
                            {msg.text}
                          </Typography>
                        </Box>
                        {msg.ambiguous_data &&
                          msg.ambiguous_data.length > 0 && (
                            <Box
                              display="flex"
                              flexDirection="column"
                              gap={0.5}
                              ml={4}
                            >
                              {msg.ambiguous_data.map((question, qIndex) => (
                                <Box
                                  display={"flex"}
                                  flexDirection={"row"}
                                  justifyContent={"center"}
                                  alignItems={"center"}
                                  key={`ambiguous-${qIndex}`}
                                  sx={{
                                    borderColor: "#98BEE7",
                                    backgroundColor: "#C2DDF9",
                                    color: "#012954",
                                    borderRadius: "6px",
                                    padding: "8px",
                                    cursor: "pointer",
                                    "&:hover": {
                                      backgroundColor: "#f0f0f0",
                                    },
                                  }}
                                  onClick={() => handleSearch(question)}
                                >
                                  <Typography
                                    fontFamily="Poppins"
                                    fontSize={9}
                                    fontWeight={500}
                                    color="black"
                                  >
                                    {capitalizeQuestion(question)}
                                  </Typography>
                                </Box>
                              ))}
                            </Box>
                          )}
                        <Typography
                          fontFamily="Poppins"
                          fontSize={8}
                          mx={4}
                          color="#979797"
                          textAlign={msg.isUser ? "right" : "left"}
                        >
                          {`Today ${msg.timestamp}`}
                        </Typography>
                      </Box>
                    </Box>
                  ))}
              </>
            )}
          </Box>

          <Box
            className="message-bottom"
            display="flex"
            alignItems="center"
            gap={1}
          >
            <TextField
              className="message-fields"
              fullWidth
              placeholder="Ask Anything..."
              value={messageValue}
              onChange={handleMessageValue}
              onKeyDown={handleKeyDown}
            />
            <IconButton
              className="microphone-icon-button"
              size="small"
              onClick={handleMicrophoneClick}
              aria-label="voice input"
              disabled={
                loading || !SpeechRecognition.browserSupportsSpeechRecognition()
              }
            >
              <img
                src={listening ? microphoneListening : microphone}
                alt="Microphone"
                style={{ height: "25px", width: "25px" }}
              />
            </IconButton>
            <IconButton
              size="small"
              onClick={() => handleSearch()}
              aria-label="send message"
              disabled={loading}
            >
              <SendOutlined sx={{ height: "25px", width: "25px" }} />
            </IconButton>
          </Box>
        </>
      )}
    </Stack>
  );
};

export default Messages;
