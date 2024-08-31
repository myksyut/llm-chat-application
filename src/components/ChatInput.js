import React from 'react';
import { Send, Loader, StopCircle } from 'lucide-react';

const ChatInput = ({ inputMessage, setInputMessage, handleSendMessage, isLoading, handleAbort }) => (
  <div className="flex items-center space-x-2">
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
);

export default ChatInput;