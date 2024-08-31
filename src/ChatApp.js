import React, { useState, useEffect, useRef } from 'react';
import { MessageCircle, Send, Cpu, GraduationCap, Briefcase, Star, Loader, CheckCircle, Circle, StopCircle} from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import rehypeRaw from 'rehype-raw';
import remarkGfm from 'remark-gfm';
import { Prism as SyntaxHighlighter } from 'react-syntax-highlighter';
import { dracula } from 'react-syntax-highlighter/dist/esm/styles/prism';

const APIProcessDisplay = ({ isLoading, processSteps }) => {
  const getCurrentStep = () => {
    const currentStepIndex = processSteps.findIndex(step => !step.completed);
    return currentStepIndex === -1 ? processSteps.length - 1 : currentStepIndex;
  };

  return (
    <div className="p-2 bg-gray-700 rounded-lg text-xs w-full">
      <h3 className="font-semibold mb-1">実行プロセス</h3>
      <ul className="flex justify-between">
        {processSteps.map((step, index) => {
          const isCurrentStep = index === getCurrentStep() && isLoading;
          const isCompleted = step.completed;

          return (
            <li
              key={index}
              className={`flex flex-col items-center transition-all duration-300 ease-in-out ${
                isCurrentStep ? 'text-blue-400' :
                isCompleted ? 'text-green-500' : 'text-gray-400'
              }`}
            >
              {isCurrentStep ? (
                <Loader className="animate-spin mb-1" size={12} />
              ) : isCompleted ? (
                <CheckCircle className="mb-1" size={20} />
              ) : (
                <Circle className="mb-1" size={12} />
              )}
              <span className="text-center">{step.name.split(' ')[0]}</span>
            </li>
          );
        })}
      </ul>
    </div>
  );
};

const ChatOption = ({ icon, text, onClick }) => (
  <div onClick={onClick} className="flex flex-col items-center justify-center p-4 bg-gray-800 rounded-lg cursor-pointer hover:bg-gray-700">
    {icon}
    <span className="mt-2 text-xs text-gray-400">{text}</span>
  </div>
);

const ChatOptions = ({ onOptionClick }) => (
  <div className="grid grid-cols-2 gap-2 w-full">
    <ChatOption icon={<Cpu size={30} />} text="スキル" onClick={() => onOptionClick("宮木翔太のスキルを教えて")} />
    <ChatOption icon={<GraduationCap size={30} />} text="学歴" onClick={() => onOptionClick("宮木翔太の学歴を教えて")} />
    <ChatOption icon={<Briefcase size={30} />} text="職歴" onClick={() => onOptionClick("宮木翔太のこれまでの仕事を教えて")} />
    <ChatOption icon={<Star size={30} />} text="強み" onClick={() => onOptionClick("宮木翔太の強みを教えて")} />
  </div>
);

const Message = ({ text, sender }) => (
  <div className={`flex justify-center mb-4`}>
    <div className={`w-full p-4 rounded-lg ${sender === 'user' ? 'bg-blue-600' : 'bg-gray-700'}`}>
      {sender === 'bot' ? (
        <ReactMarkdown
          className="prose prose-invert max-w-none"
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
        <p>{text}</p>
      )}
    </div>
  </div>
);

const ChatMessages = ({ messages, isLoading }) => (
  <div className="space-y-4">
    {messages.map((message, index) => (
      <Message key={index} {...message} />
    ))}
    {isLoading && (
      <div className="flex justify-center">
        <Loader className="animate-spin text-blue-500" size={24} />
      </div>
    )}
  </div>
);

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading }) => (
  <div className="flex-grow flex items-center bg-gray-700 rounded-lg">
    <input
      type="text"
      value={inputMessage}
      onChange={(e) => setInputMessage(e.target.value)}
      onKeyPress={(e) => {
        if (e.key === 'Enter' && !isLoading) {
          handleSendMessage(inputMessage);
        }
      }}
      placeholder="メッセージを送信"
      className="flex-grow p-2 bg-transparent outline-none text-white text-sm"
      disabled={isLoading}
    />
    <button
      onClick={() => handleSendMessage(inputMessage)}
      className={`p-2 ${isLoading ? 'text-gray-500 cursor-not-allowed' : 'text-gray-400 hover:text-white'}`}
      disabled={isLoading}
      aria-label={isLoading ? "送信中" : "メッセージを送信"}
    >
      {isLoading ? <Loader className="animate-spin" size={20} /> : <Send size={20} />}
    </button>
  </div>
);

const ChatApp = () => {
  const [messages, setMessages] = useState([]);
  const [inputMessage, setInputMessage] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [processSteps, setProcessSteps] = useState([
    { name: 'リクエスト受信', completed: false },
    { name: 'クエリ生成', completed: false },
    { name: 'データベース検索', completed: false },
    { name: 'レスポンス生成', completed: false }
  ]);
  const messagesEndRef = useRef(null);
  const abortControllerRef = useRef(null);

  const scrollToBottom = () => {
    messagesEndRef.current?.scrollIntoView({ behavior: "smooth" });
  };

  useEffect(() => {
    scrollToBottom();
  }, [messages]);

  const handleSendMessage = async (text) => {
    if (text.trim() === '' || isLoading) return;

    const newUserMessage = { text, sender: 'user' };
    setMessages(prevMessages => [...prevMessages, newUserMessage]);
    setInputMessage('');
    setIsLoading(true);
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));

    abortControllerRef.current = new AbortController();

    try {
      const response = await fetch('https://llm-chat-application-backend.onrender.com/chat', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          question: text,
          history: [...messages, newUserMessage]
        }),
        signal: abortControllerRef.current.signal
      });

      if (!response.ok) {
        throw new Error(`HTTP error! status: ${response.status}`);
      }

      const reader = response.body.getReader();
      const decoder = new TextDecoder();

      let botResponse = '';
      let isFirstChunk = true;

      while (true) {
        const { value, done } = await reader.read();
        if (done) break;
        const chunk = decoder.decode(value);
        const lines = chunk.split('\n');
        // eslint-disable-next-line no-loop-func
        lines.forEach(line => {
          if (line.startsWith('data: ')) {
            try {
              const jsonData = JSON.parse(line.slice(5));
              if (jsonData.process_step) {
                setProcessSteps(steps => steps.map(step =>
                  step.name === jsonData.process_step ? { ...step, completed: true } : step
                ));
              } else {
                botResponse += jsonData.text;
                if (isFirstChunk) {
                  setMessages(prevMessages => [...prevMessages, { text: botResponse, sender: 'bot' }]);
                  isFirstChunk = false;
                } else {
                  setMessages(prevMessages => {
                    const newMessages = [...prevMessages];
                    const lastMessage = newMessages[newMessages.length - 1];
                    if (lastMessage && lastMessage.sender === 'bot') {
                      newMessages[newMessages.length - 1] = {
                        ...lastMessage,
                        text: botResponse
                      };
                    } else {
                      newMessages.push({ text: botResponse, sender: 'bot' });
                    }
                    return newMessages;
                  });
                }
              }
            } catch (e) {
              console.error('Error parsing JSON:', e);
              botResponse += line.slice(5);
            }
          }
        });
      }
    } catch (error) {
      if (error.name === 'AbortError') {
        console.log('Fetch aborted');
        setMessages(prevMessages => {
          const newMessages = [...prevMessages];
          const lastMessage = newMessages[newMessages.length - 1];
          if (lastMessage && lastMessage.sender === 'bot' && lastMessage.text.trim() === '') {
            // Remove the empty bot message if it exists
            newMessages.pop();
          }
          newMessages.push({ text: 'プロセスが中断されました。', sender: 'bot' });
          return newMessages;
        });
      } else {
        console.error('Error:', error);
        setMessages(prevMessages => [...prevMessages, { text: 'エラーが発生しました。もう一度お試しください。', sender: 'bot' }]);
      }
    } finally {
      setIsLoading(false);
      abortControllerRef.current = null;
    }
  };

  const handleAbort = () => {
    if (abortControllerRef.current) {
      abortControllerRef.current.abort();
    }
  };

  const handleReset = () => {
    if (isLoading) {
      handleAbort();
    }
    setMessages([]);
    setInputMessage('');
    setProcessSteps(steps => steps.map(step => ({ ...step, completed: false })));
    setIsLoading(false);
  };

  const showProcessDisplay = isLoading || processSteps.some(step => step.completed);

  return (
    <div className="flex flex-col h-screen bg-gray-900 text-white">
      <header className="flex items-center justify-between p-4 bg-gray-800">
        <div 
          className="flex items-center cursor-pointer" 
          onClick={handleReset}
          title={isLoading ? "プロセスを中断してトップページに戻る" : "トップページに戻る"}
        >
          <MessageCircle className="mr-2" size={24} />
          <span className="text-lg font-semibold">ChatMYK</span>
        </div>
      </header>
      <main className="flex-1 overflow-auto p-4">
        <div className="max-w-2xl mx-auto h-full">
          {messages.length === 0 ? (
            <div className="flex items-center justify-center h-full">
              <ChatOptions onOptionClick={handleSendMessage} />
            </div>
          ) : (
            <ChatMessages messages={messages} isLoading={isLoading} />
          )}
          <div ref={messagesEndRef} />
        </div>
      </main>
      <footer className="bg-gray-800 p-4">
        <div className="max-w-2xl mx-auto">
          {showProcessDisplay && (
            <div className="mb-2">
              <APIProcessDisplay isLoading={isLoading} processSteps={processSteps} />
            </div>
          )}
          <div className="flex items-center space-x-2">
            <ChatInput
              inputMessage={inputMessage}
              setInputMessage={setInputMessage}
              handleSendMessage={handleSendMessage}
              isLoading={isLoading}
            />
            {isLoading && (
              <button
                onClick={handleAbort}
                className="bg-grey-500 hover:bg-red-600 text-white p-2 rounded-full transition duration-150 ease-in-out flex-shrink-0 focus:outline-none focus:ring-2 focus:ring-red-500 focus:ring-opacity-50"
                aria-label="プロセスを中断"
                title="プロセスを中断"
              >
                <StopCircle size={24} />
              </button>
            )}
          </div>
        </div>
      </footer>
    </div>
  );
};

export default ChatApp;