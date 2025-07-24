import { ChevronLeft, ChevronRight, Search } from "@mui/icons-material";
import {
  Box,
  IconButton,
  OutlinedInput,
  Stack,
  Typography,
} from "@mui/material";
import React, { useEffect, useState } from "react";
import { useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { api } from "../services/api";
import { useDispatch } from "react-redux";
import { setActiveTab, setDisplayChat, setNewMessage } from "../redux/chatbot";
import Loader from "../common/Loader";
import { capitalizeQuestion } from "../utils/capitalizeQuestion";

const InfoScreen = () => {
  const dispatch = useDispatch();
  const [searchValue, setSearchValue] = useState("");
  const [total, setTotal] = useState(0);
  const [searchError, setSearchError] = useState(
    "Please enter something to search..."
  );
  const [questions, setQuestions] = useState([]);
  const [loading, setLoading] = useState(false);
  const [pagination, setPagination] = useState({
    from: 0,
    to: 20,
  });

  const dataId = useSelector((state: RootState) => state.chatbot.dataId);
  const handleChange = (e: React.ChangeEvent<HTMLInputElement>) => {
    setSearchValue(e.target.value.toLowerCase());
  };

  const handleSendClick = (message: string = searchValue) => {
    if (message.trim().length === 0) {
      setSearchError("Please enter a message");
    } else {
      dispatch(setDisplayChat(true));
      setSearchError("");
      dispatch(setNewMessage(message));
      setSearchValue("");
      dispatch(setActiveTab("message"));
    }
  };

  const handleSearch = async (paginationParams = pagination) => {
    const message = searchValue;
    if (message.trim().length === 0) return;
    setLoading(true);
    const payload = {
      question: message,
      type: dataId,
      from_idx: paginationParams.from,
      to_idx: paginationParams.to,
    };
    const url = `/search/`;
    try {
      const response = await api.post(url, payload, {
        headers: {
          "Content-Type": "application/json",
        },
      });
      if (response.data.matching_questions.length === 0)
        setSearchError("No matching questions found");
      else setSearchError("");
      setQuestions(response.data.matching_questions);
      setTotal(response.data.totalNumbers);
    } catch (err) {
      console.error("Error sending message:", err);
    } finally {
      setLoading(false);
    }
  };

  const reset = () => {
    setSearchValue("");
    setSearchError("Please enter something to search...");
    setQuestions([]);
    setPagination({
      from: 0,
      to: 20,
    });
  };

  useEffect(() => {
    const timeOutID = setTimeout(async () => {
      if (searchValue.trim()) {
        await handleSearch();
      } else {
        reset();
      }
    }, 500);
    return () => clearTimeout(timeOutID);
  }, [searchValue]);

  return (
    <Stack direction="column" sx={{ position: "relative" }}>
      <Box className="top-headers">
        <Typography
          textAlign={"center"}
          fontWeight="600"
          fontFamily="Poppins"
          sx={{ cursor: "default" }}
        >
          Help
        </Typography>
        <OutlinedInput
          size="small"
          fullWidth
          placeholder="Search..."
          value={searchValue}
          endAdornment={<Search color="disabled" />}
          className="tab-search"
          onChange={handleChange}
        />
        {questions.length > 0 && <Box
              display={"flex"}
              flexDirection={"row"}
              justifyContent={"center"}
              alignItems={'center'}
              gap={2}
            >
              <IconButton
                className={pagination.from === 0 ? `disabled-link`: `container-link`}
                onClick={() => {
                  const newPagination = {
                    from: pagination.from - 20,
                    to: pagination.from,
                  };
                  setPagination(newPagination);
                  handleSearch(newPagination);
                }}
                disabled={pagination.from === 0}
              >
                <ChevronLeft sx={{height: "18px", width: "18px"}} />
              </IconButton>

              <Typography className="container-text">
                {questions.length < 20 && pagination.from === 0
                  ? `0 - ${questions.length || 0} of ${total} items`
                  : questions.length >= 20
                  ? `${pagination.from} - ${pagination.to} of ${total} items`
                  : `${pagination.from} - ${total} of ${total} items`}
              </Typography>
              <IconButton
                className={questions.length < 20 ? `disabled-link`: `container-link`}
                onClick={() => {
                  const newPagination = {
                    from: pagination.to,
                    to: pagination.to + 20,
                  };
                  setPagination(newPagination);
                  handleSearch(newPagination);
                }}
                disabled={questions.length < 20}
              >
                <ChevronRight sx={{height: "18px", width: "18px"}} />
              </IconButton>
            </Box>}
      </Box>
      <Box mt={13.5}>
        {loading ? (
          <Box display={"flex"} justifyContent={"center"} ml={5}>
            <Loader />
          </Box>
        ) : questions && questions.length > 0 ? (
          <Box className="container-column" mb={5.3}>
            
            {questions.map((question, qIndex) => (
              <Box
                display={"flex"}
                flexDirection={"row"}
                justifyContent={"space-between"}
                alignItems={"center"}
                key={`ambiguous-${qIndex}`}
                sx={{
                  boxShadow:
                    "3.31px 1.97px 12px 0px #1C57EE14, -1.66px -1.66px 1.57px 0px #1C57EE14",
                  borderRadius: "5px",
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
          <Box mt={5}>
            <Typography
              color="#757575"
              fontFamily="Poppins"
              fontSize={12}
              textAlign="center"
            >
              {searchError}
            </Typography>
          </Box>
        )}
      </Box>
    </Stack>
  );
};

export default InfoScreen;
