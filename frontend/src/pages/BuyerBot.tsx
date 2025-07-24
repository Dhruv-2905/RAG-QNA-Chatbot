
import { Box, IconButton, Stack, Typography } from "@mui/material";
import { HelpOutlineOutlined, HomeOutlined, MessageOutlined } from "@mui/icons-material";
import MessageScreen from "../components/MessageScreen";
import HelpScreen from "../components/HelpScreen";
import HomeScreen from "../components/HomeScreen";
import { useDispatch, useSelector } from "react-redux";
import { RootState } from "../redux/store";
import { setActiveTab, setDisplayChat } from "../redux/chatbot";
import { useEffect } from "react";

const BuyerBot = () => {
  const dispatch = useDispatch();
  const activeTab = useSelector((state: RootState) => state.chatbot.activeTab);
 const messages = useSelector((state: RootState) => state.chatbot.messages);

  const TabData = [
    { icon: <HomeOutlined />, label: "Home", tabName: "home" },
    { icon: <HelpOutlineOutlined />, label: "Help", tabName: "help" },
    { icon: <MessageOutlined />, label: "Message", tabName: "message" },
  ];

  useEffect(()=>{
    if(messages.length === 0){
      dispatch(setDisplayChat(false))
    }
  }, [activeTab])
  
  return (
    <Stack
      direction="column"
      gap={1.3}
      justifyContent="space-between"
      height="auto"
    >
      {activeTab === "message" ? (
        <MessageScreen />
      ) : activeTab === "help" ? (
        <HelpScreen />
      ) : (
        <HomeScreen />
      )}

      <Box
        className="footer-buttons"
        display="flex"
        justifyContent="space-around"
        boxShadow={3}
      >
        {TabData.map((tab) => {
          const isActive = activeTab === tab.tabName;
          const color = isActive ? "#012954" : "#98BEE7";
          return (
            <Box
              key={tab.tabName}
              display="flex"
              flexDirection="column"
              justifyContent="center"
              alignItems="center"
              onClick={() => dispatch(setActiveTab(tab.tabName))}
              sx={{ cursor: "pointer", gap: "2px" }}
            >
              <IconButton
                sx={{
                  color: color,
                  padding: "0px",
                  "& .MuiSvgIcon-root": { fontSize: "22px" },
                }}
                aria-label={`Switch to ${tab.label} tab`}
              >
                {tab.icon}
              </IconButton>
              <Typography
                fontSize={10}
                fontWeight={600}
                fontFamily={"Poppins"}
                color={color}
                sx={{ marginTop: "-2px" }}
              >
                {tab.label}
              </Typography>
            </Box>
          );
        })}
      </Box>
    </Stack>
  );
};

export default BuyerBot;