import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, PlusCircle, Database, Mail } from 'lucide-react';

// ChatOption Component
const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-gray-400">{text}</span>
  </div>
);

// Header Component
const Header = ({ onReset }) => (
  <header className="flex items-center justify-between p-4 bg-gray-800">
    <div className="flex items-center cursor-pointer" onClick={onReset}>
      <MessageCircle className="mr-2" />
      <span>ChatGPT</span>
    </div>
  </header>
);

// ChatMessages Component
const ChatMessages = ({ messages, messagesEndRef }) => (
  <div className="space-y-4">
    {messages.map((message, index) => (
      <div key={index} className={`flex ${message.sender === 'user' ? 'justify-end' : 'justify-start'}`}>
        <div className={`max-w-xs md:max-w-md p-2 rounded-lg ${message.sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
          {message.text}
        </div>
      </div>
    ))}
    <div ref={messagesEndRef} />
  </div>
);

// ChatInput Component
const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading }) => (
  <div className="flex items-center bg-gray-700 rounded-lg">
    <input
      type="text"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && !isLoading) {
          handleSendMessage(inputMessage);
        }
      }}
      placeholder="ChatGPT にメッセージを送信する"
      className="flex-1 p-2 bg-transparent outline-none"
      disabled={isLoading}
    />
    <button 
      onClick={() => handleSendMessage(inputMessage)} 
      className="p-2 text-gray-400 hover:text-white"
      disabled={isLoading}
    >
      <Send size={20} />
    </button>
  </div>
);

// Main ChatApp Component
const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const messagesEndRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (text.trim() === '') return;

    setMessages(prev => [...prev, { text, sender: 'user' }]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/x-www-form-urlencoded',
        },
        body: `question=${encodeURIComponent(text)}`,
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();
      let botResponse = '';

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            botResponse += line.slice(6);
          }
        });
        setMessages(prev => {
          const newMessages = [...prev];
          newMessages[newMessages.length - 1] = { text: botResponse, sender: 'bot' };
          return newMessages;
        });
      }
    } catch (error) {
      console.error('Error:', error);
      setMessages(prev => [...prev, { text: 'エラーが発生しました。もう一度お試しください。', sender: 'bot' }]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleChatOptionClick = (text) => {
    handleSendMessage(text);
  };

  const handleReset = () => {
    setMessages([]);
    setInputMessage('');
  };

  const chatOptions = [
    { icon: <PlusCircle size={24} />, text: "プレゼンテーションの骨子を作成する", prompt: "プレゼンテーションの骨子を作成してください" },
    { icon: <Database size={24} />, text: "製品を比較するキュレーション広告", prompt: "製品を比較するキュレーション広告を作成してください" },
    { icon: <MessageCircle size={24} />, text: "キッチンにある材料で野菜多めのレシピ", prompt: "キッチンにある材料で野菜多めのレシピを提案してください" },
    { icon: <Mail size={24} />, text: "日常のメールを素敵にするPythonスクリプト", prompt: "日常のメールを素敵にするPythonスクリプトを作成してください" },
  ];

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <Header onReset={handleReset} />
      <main className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <div className="grid grid-cols-2 gap-4 mb-8">
              {chatOptions.map((option, index) => (
                <ChatOption
                  key={index}
                  icon={option.icon}
                  text={option.text}
                  onClick={() => handleChatOptionClick(option.prompt)}
                />
              ))}
            </div>
          </div>
        ) : (
          <ChatMessages messages={messages} messagesEndRef={messagesEndRef} />
        )}
      </main>
      <footer className="p-4 bg-gray-800">
        <ChatInput
          inputMessage={inputMessage}
          setInputMessage={setInputMessage}
          handleSendMessage={handleSendMessage}
          isLoading={isLoading}
        />
      </footer>
    </div>
  );
};

export default ChatApp;