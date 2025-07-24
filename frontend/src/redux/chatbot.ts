import { createSlice, PayloadAction } from '@reduxjs/toolkit';
import { JSX } from 'react';

interface Message {
  text: string | JSX.Element;
  isUser: boolean;
  timestamp: string;
  ambiguous_data?: string[];
}

type ChatbotState = {
  sessionId: string;
  tenantId: string;
  dataId: string;
  activeTab: string;
  newMessage: string;
  messages: Message[];
  displayChat: boolean;
};

const initialState: ChatbotState = {
  sessionId: '',
  tenantId: '',
  dataId: '',
  activeTab: 'home',
  newMessage: '',
  messages: [],
  displayChat: false,
};

const chatbotSlice = createSlice({
  name: 'chatbot',
  initialState,
  reducers: {
    setSessionId: (state, action: PayloadAction<string>) => {
      state.sessionId = action.payload;
    },
    setTenantId: (state, action: PayloadAction<string>) => {
      state.tenantId = action.payload;
    },
    setDataId: (state, action: PayloadAction<string>) => {
      state.dataId = action.payload;
    },
    setActiveTab: ( state, action: PayloadAction<string>) => {
      state.activeTab = action.payload;
    },
    setNewMessage: (state, action: PayloadAction<string>) => {
      state.newMessage = action.payload
    },
    setMessages: (state, action: PayloadAction<Message>) => {
      state.messages.push(action.payload);
    },
    setDisplayChat: (state, action: PayloadAction<boolean>) => {
      state.displayChat = action.payload;
    },
    clearMessages:(state) => {
      state.messages = [];
    }
}}
);

export const { setSessionId, setTenantId, setDataId, setActiveTab, setNewMessage,  setMessages, clearMessages, setDisplayChat } =
  chatbotSlice.actions;
export default chatbotSlice.reducer;