const Message = ({ message, isUser }) => {
  let containerClass = "bg-gray-50";
  if (isUser) {
    containerClass = "";
  }

  if (Array.isArray(message)) {
    message = message.join("");
  }

  if (!message || message === "") {
    return null;
  }

  return (
    <div
      className={`flex gap-x-4 rounded-md ${containerClass} py-1 px-5 mt-1 mb-3`}
    >
      {isUser ? (
        <span className="text-l sm:text-l" title="user">
          User:
        </span>
      ) : (
        <span className="text-l sm:text-l" title="AI">
          LLM  :
        </span>
      )}

      <div className="flex flex-col text-sm sm:text-base flex-1 gap-y-3">
        {message.split("\n").map(
          (text, index) =>
            text.length > 0 && (
              <span key={index} className="min-w-0">
                {text}
              </span>
            )
        )}
      </div>
    </div>
  );
};

export default Message;
