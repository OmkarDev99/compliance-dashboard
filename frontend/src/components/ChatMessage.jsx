import React from 'react';

const ChatMessage = ({ message, type }) => {
  const isUser = type === 'user';

  return (
    <div className={`mb-4 flex ${isUser ? 'justify-end' : 'justify-start'}`}>
      <div
        className={`max-w-[85%] rounded-2xl px-4 py-3 text-[11px] leading-5 sm:max-w-[72%] ${
          isUser
            ? 'rounded-br-md bg-[#3157D5] text-white shadow-sm'
            : 'rounded-bl-md border border-slate-200 bg-white text-slate-800 shadow-sm'
        }`}
      >
        <p>{message}</p>
      </div>
    </div>
  );
};

export default ChatMessage;
