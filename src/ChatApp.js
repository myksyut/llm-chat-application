import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Cpu, GraduationCap, Briefcase, Star, Loader} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-3 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-center text-gray-400">{text}</span>
  </div>
);

const ChatOptions = ({ onOptionClick }) => (
  <div className="grid grid-cols-2 gap-3 mb-6 mx-auto max-w-sm">
    <ChatOption icon={<Cpu size={20} />} text="スキルについて聞く" onClick={() => onOptionClick("宮木翔太のスキルを教えて")} />
    <ChatOption icon={<GraduationCap size={20} />} text="学歴について聞く" onClick={() => onOptionClick("宮木翔太の学歴を教えて")} />
    <ChatOption icon={<Briefcase size={20} />} text="職歴について聞く" onClick={() => onOptionClick("宮木翔太のこれまでの仕事を教えて")} />
    <ChatOption icon={<Star size={20} />} text="強みについて聞く" onClick={() => onOptionClick("宮木翔太の強みを教えて")} />
  </div>
);

const Message = ({ text, sender }) => (
  <div className={`flex justify-center mb-3`}>
    <div className={`max-w-full md:max-w-2xl w-full p-3 rounded-lg ${sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {sender === 'bot' ? (
        <ReactMarkdown
          className="prose prose-invert max-w-none text-sm md:text-base"
          rehypePlugins={[rehypeRaw]}
          remarkPlugins={[remarkGfm]}
          components={{
            code({node, inline, className, children, ...props}) {
              const match = /language-(\w+)/.exec(className || '')
              return !inline && match ? (
                <SyntaxHighlighter
                  style={dracula}
                  language={match[1]}
                  PreTag="div"
                  {...props}
                >
                  {String(children).replace(/\n$/, '')}
                </SyntaxHighlighter>
              ) : (
                <code className={className} {...props}>
                  {children}
                </code>
              )
            }
          }}
        >
          {text}
        </ReactMarkdown>
      ) : (
        <p className="text-sm md:text-base">{text}</p>
      )}
    </div>
  </div>
);

const ChatMessages = ({ messages, isLoading }) => (
  <div className="space-y-3">
    {messages.map((message, index) => (
      <Message key={index} {...message} />
    ))}
    {isLoading && (
      <div className="flex justify-center">
        <Loader className="animate-spin text-blue-500" size={20} />
      </div>
    )}
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
      className="flex-1 p-3 bg-transparent outline-none text-white text-sm"
      disabled={isLoading}
    />
    <button
      onClick={() => handleSendMessage(inputMessage)}
      className={`p-3 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
      disabled={isLoading}
    >
      {isLoading ? <Loader className="animate-spin" size={18} /> : <Send size={18} />}
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
    if (text.trim() === '' || isLoading) return;

    const newUserMessage = { text, sender: 'user' };
    setMessages(prev => [...prev, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);

    try {
      const response = await fetch('https://llm-chat-application-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          history: messages.concat(newUserMessage)
        }),
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
            try {
              const jsonData = JSON.parse(line.slice(5));
              botResponse += jsonData.text;
            } catch (e) {
              console.error('Error parsing JSON:', e);
              botResponse += line.slice(5);
            }
          }
        });
        setMessages(prev => {
          const newMessages = [...prev];
          if (newMessages[newMessages.length - 1].sender === 'bot') {
            newMessages[newMessages.length - 1] = {
              text: botResponse,
              sender: 'bot'
            };
          } else {
            newMessages.push({
              text: botResponse,
              sender: 'bot'
            });
          }
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
      <header className="flex items-center justify-between p-3 bg-gray-800">
        <div className="flex items-center cursor-pointer" onClick={handleReset}>
          <MessageCircle className="mr-2" size={20} />
          <span className="text-sm md:text-base">ChatMYK</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-3">
        {messages.length === 0 ? (
          <div className="flex flex-col items-center justify-center h-full">
            <ChatOptions onOptionClick={handleSendMessage} />
          </div>
        ) : (
          <>
            <ChatMessages messages={messages} isLoading={isLoading} />
            <div ref={messagesEndRef} />
          </>
        )}
      </main>
      <footer className="p-3 bg-gray-800">
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