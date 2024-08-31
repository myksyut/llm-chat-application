import React from 'react';
import MarkdownRenderer from '../utils/MarkdownRenderer';

const Message = ({ text, sender }) => (
  <div className={`flex justify-center mb-4`}>
    <div className={`w-full p-4 rounded-lg ${sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {sender === 'bot' ? <MarkdownRenderer content={text} /> : <p>{text}</p>}
    </div>
  </div>
);

const ChatMessages = ({ messages, isLoading }) => (
  <div className="space-y-4">
    {messages.map((message, index) => (
      <Message key={index} {...message} />
    ))}
  </div>
);

export default ChatMessages;