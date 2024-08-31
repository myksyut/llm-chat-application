import React from 'react';
import { MessageCircle } from 'lucide-react';

const ChatHeader = ({ handleReset, isLoading }) => (
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
);

export default ChatHeader;