import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, PlusCircle, Database, Mail } from 'lucide-react';
import ReactMarkdown from 'react-markdown';

const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-gray-400">{text}</span>
  </div>
);

const ChatOptions = ({ onOptionClick }) => (
  <div className="grid grid-cols-2 gap-4 mb-8">
    <ChatOption icon={<PlusCircle size={24} />} text="プレゼンテーションの骨子を作成する" onClick={() => onOptionClick("プレゼンテーションの骨子を作成してください")} />
    <ChatOption icon={<Database size={24} />} text="製品を比較するキュレーション広告" onClick={() => onOptionClick("製品を比較するキュレーション広告を作成してください")} />
    <ChatOption icon={<MessageCircle size={24} />} text="キッチンにある材料で野菜多めのレシピ" onClick={() => onOptionClick("キッチンにある材料で野菜多めのレシピを提案してください")} />
    <ChatOption icon={<Mail size={24} />} text="日常のメールを素敵にするPythonスクリプト" onClick={() => onOptionClick("日常のメールを素敵にするPythonスクリプトを作成してください")} />
  </div>
);

const Message = ({ text, sender }) => (
  <div className={`flex ${sender === 'user' ? 'justify-end' : 'justify-start'}`}>
    <div className={`max-w-xs md:max-w-md p-2 rounded-lg ${sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {sender === 'bot' ? (
        <ReactMarkdown>{text}</ReactMarkdown>
      ) : (
        text
      )}
    </div>
  </div>
);

const ChatMessages = ({ messages }) => (
  <div className="space-y-4">
    {messages.map((message, index) => (
      <Message key={index} {...message} />
    ))}
  </div>
);

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
      placeholder="メッセージを送信する"
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
      const response = await fetch('http://localhost:8000/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({ question: text }),
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = '';
      setMessages(prev => [...prev, { text: '', sender: 'bot' }]);

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        // eslint-disable-next-line no-loop-func
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            botResponse += line.slice(6);
          }
        });
        // eslint-disable-next-line no-loop-func
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

  const handleReset = () => {
    setMessages([]);
    setInputMessage('');
  };

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div className="flex items-center cursor-pointer" onClick={handleReset}>
          <MessageCircle className="mr-2" />
          <span>ChatGPT</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ChatOptions onOptionClick={handleSendMessage} />
          </div>
        ) : (
          <>
            <ChatMessages messages={messages} />
            <div ref={messagesEndRef} />
          </>
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