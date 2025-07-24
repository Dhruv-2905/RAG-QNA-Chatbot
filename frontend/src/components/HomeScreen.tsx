import { ChevronRight, SendOutlined } from "@mui/icons-material";
import {
  Box,
  IconButton,
  Stack,
  TextField,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import chatbot from "../assets/chatbot3.jpg";
import { useDispatch, useSelector } from "react-redux";
import { setActiveTab, setDisplayChat, setNewMessage, setDataId } from "../redux/chatbot";
import { api } from "../services/api";
import { RootState } from "../redux/store";
import Loader from "../common/Loader";
import { capitalizeQuestion } from "../utils/capitalizeQuestion";

const HomeScreen = () => {
  const dispatch = useDispatch();
  const [loading, setLoading] = useState(false);
  const dataId = useSelector((state: RootState) => state.chatbot.dataId);
  const [messageValue, setMessageValue] = useState("");
  const [messageError, setMessageError] = useState("");
  const [questions, setQuestions] = useState([]);

  const handleMessageValue = (e: React.ChangeEvent<HTMLInputElement>) => {
    setMessageValue(e.target.value);
    setMessageError("");
  };

  const handleSearch = async () => {
    setMessageValue("");
    setLoading(true);
    const payload = { type: dataId };
    const url = `/popular-questions/`;

    try {
      const response = await api.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      setQuestions(response.data.popular_questions);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    if (dataId) {
      handleSearch();
    }
  }, [dataId]);

  const handleSendClick = (message: string = messageValue) => {
    if (message.trim().length === 0) {
      setMessageError("Please enter a message");
    } else {
      dispatch(setDisplayChat(true));
      setMessageError("");
      dispatch(setNewMessage(message));
      setMessageValue("");
      dispatch(setActiveTab("message"));
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent<HTMLInputElement>) => {
    if (e.key === "Enter" && messageValue.trim().length > 0) {
      handleSendClick();
    }
  };

  return (
    <Stack
      direction={"column"}
      gap={0.5}
      padding={2}
      sx={{ background: "linear-gradient(180deg, #012954, #27517E, #FFFFFF)" }}
    >
      <Box display="flex" flexDirection="row" alignItems="center" justifyContent={'space-between'} gap={2}>
        <Box></Box>
        <img src={chatbot} alt="Chatbot" className="chatbot-image" />
      </Box>
      <Typography className="header-style">Welcome to Chatbot! How can I assist you?</Typography>
      <Box className="send-message">
        <TextField
          className="message-fields"
          fullWidth
          value={messageValue}
          placeholder="Send us a message"
          onChange={handleMessageValue}
          onKeyDown={handleKeyDown}
        />
        <IconButton
          disabled={messageValue.trim().length === 0}
          className="document-icon"
          onClick={() => handleSendClick()}
          aria-label="send message"
        >
          <SendOutlined />
        </IconButton>
      </Box>
      {messageError && (
        <Typography color="error" fontSize="9px" ml={3}>
          {messageError}
        </Typography>
      )}
      <Box className="container-column" mb={4}>
        <Typography className="container-text">Popular Searches</Typography>
        {loading ? (
          <Box display={"flex"} justifyContent={"center"}>
            <Loader />
          </Box>
        ) : questions && questions.length > 0 ? (
          <Box display="flex" flexDirection="column" mt={1} gap={0.1}>
            {questions.map((question, qIndex) => (
              <Box
                display={"flex"}
                flexDirection={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
                key={`ambiguous-${qIndex}`}
                sx={{
                  boxShadow: "3.31px 4.97px 19.88px 0px #1C57EE14, -1.66px -1.66px 16.57px 0px #1C57EE14",
                  borderRadius: "6px",
                  paddingX: "8px",
                  cursor: "pointer",
                  "&:hover": {
                    backgroundColor: "#f0f0f0",
                  },
                }}
                onClick={() => handleSendClick(question)}
              >
                <Typography
                  fontFamily="Poppins"
                  fontSize={10}
                  fontWeight={500}
                  color="#000"
                >
                  {capitalizeQuestion(question)}
                </Typography>
                <IconButton>
                  <ChevronRight
                    sx={{ height: "15px", width: "15px", color: "black" }}
                  />
                </IconButton>
              </Box>
            ))}
          </Box>
        ) : (
          <Box>
            <Typography
              color="#757575"
              fontFamily="Poppins"
              fontSize={12}
              textAlign="center"
            >
              No Search Found
            </Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default HomeScreen;