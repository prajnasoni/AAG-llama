"use client";

import { useEffect, useReducer, useRef, useState } from "react";
import ChatForm from "./components/ChatForm";
import Message from "./components/Message";
import SlideOver from "./components/SlideOver";
import EmptyState from "./components/EmptyState";
import QueuedSpinner from "./components/QueuedSpinner";
import { Cog6ToothIcon, ArchiveBoxArrowDownIcon } from "@heroicons/react/20/solid";
import { useCompletion } from "ai/react";
import { Toaster, toast } from "react-hot-toast";
import { LlamaTemplate } from "../src/prompt_template";

import { countTokens } from "./src/tokenizer.js";

const MODELS = [
  {
    id: "meta/llama-2-7b-chat",
    name: "Llama 2 7B",
    shortened: "7B",
  },
  {
    id: "meta/llama-2-13b-chat",
    name: "Llama 2 13B",
    shortened: "13B",
  },
  {
    id: "meta/llama-2-70b-chat",
    name: "Llama 2 70B",
    shortened: "70B",
  },
  {
    id: "mistralai/mixtral-8x7b-instruct-v0.1",
    name: "Mistral 8x7B",
    shortened: "M8x7B",
  },
];

const llamaTemplate = LlamaTemplate();

const generatePrompt = (template, systemPrompt, messages) => {
  const chat = messages.map((message) => ({
    role: message.isUser ? "user" : "assistant",
    content: message.text,
  }));

  return template([
    {
      role: "system",
      content: systemPrompt,
    },
    ...chat,
  ]);
};

const metricsReducer = (state, action) => {
  switch (action.type) {
    case "START":
      return { startedAt: new Date() };
    case "FIRST_MESSAGE":
      return { ...state, firstMessageAt: new Date() };
    case "COMPLETE":
      return { ...state, completedAt: new Date() };
    default:
      throw new Error(`Unsupported action type: ${action.type}`);
  }
};

const transformArray = (dataArray) => {
  return dataArray.reduce((acc, curr) => {
    // Append "[Prompt] " to prompts by user
    if (curr.isUser) {
      curr.text = `[Prompt] ` + curr.text;
    }
    // Check if text contains newline characters
    if (curr.text.includes('\n')) {
      // Split the text by newline and create new objects for each line
      const lines = curr.text.split('\n').filter(line => line.trim() !== ''); // Filter out empty lines
      const newObjects = lines.map(line => ({ text: line, isUser: curr.isUser }));
      acc.push(...newObjects); // Spread and push to accumulator
    } else {
      acc.push(curr); // Push original object if no newline characters
    }
    // console.log(acc)
    return acc;
  }, []); // Initial accumulator is an empty array
};


const downloadCSV = (username, messages, completion) => {
  // assign messages to new array (don't interfere with state)
  const downloadArray = [...messages]

  // Push last LLM response
  if (completion.length > 0) {
    downloadArray.push({
      text: completion,
      isUser: false,
    });
  }

  // Transform the array first
  const transformedArray = transformArray(downloadArray);

  // Then map through the transformed array to add IDs
  const withIds = transformedArray.map((item, index) => ({
    ...item,
    id: index + 1
  }));

  const header = "ID,TEXT\n0," + username.toUpperCase() + " CHAT\n"; // Add CSV header
  const combinedText = withIds
    .map(obj => `${obj.id},"${obj.text.replace(/"/g, '""')}"`) // Enclose each field in double quotes and escape double quotes in text
    .join("\n");

  // Convert the combined string to CSV format
  const csvContent = "data:text/csv;charset=utf-8," + header + combinedText;

  // Encode and create a link to trigger the download
  const encodedUri = encodeURI(csvContent);
  const link = document.createElement("a");
  link.setAttribute("href", encodedUri);
  link.setAttribute("download", `${username.toLowerCase()}_chat.csv`);
  document.body.appendChild(link);

  link.click(); // Trigger download

  document.body.removeChild(link); // Clean up after download
};

export default function HomePage() {
  const MAX_TOKENS = 4096 * 3;
  const bottomRef = useRef(null);
  const [messages, setMessages] = useState([]);
  const [open, setOpen] = useState(false);
  const [error, setError] = useState(null);
  const [starting, setStarting] = useState(false);
  const [username, setUsername] = useState('default');
  //   Llama params
  const [model, setModel] = useState(MODELS[2]); // default to 70B
  const [systemPrompt, setSystemPrompt] = useState(
    "You are an education assistant for high school students studying history in India. Answer questions to help pique the student's curiosity of the topic. Limit your answers to 2 paragraphs."
  );
  const [temp, setTemp] = useState(0.75);
  const [topP, setTopP] = useState(0.9);
  const [maxTokens, setMaxTokens] = useState(800);

  const [metrics, dispatch] = useReducer(metricsReducer, {
    startedAt: null,
    firstMessageAt: null,
    completedAt: null,
  });

  const { complete, completion, setInput, input } = useCompletion({
    api: "/api",
    body: {
      model: model.id,
      systemPrompt: systemPrompt,
      temperature: parseFloat(temp),
      topP: parseFloat(topP),
      maxTokens: parseInt(maxTokens),
    },

    onError: (error) => {
      setError(error);
    },
    onResponse: (response) => {
      setStarting(false);
      setError(null);
      dispatch({ type: "FIRST_MESSAGE" });
    },
    onFinish: () => {
      dispatch({ type: "COMPLETE" });
    },
  });

  const setAndSubmitPrompt = (newPrompt) => {
    handleSubmit(newPrompt);
  };

  const handleSettingsSubmit = async (event) => {
    event.preventDefault();
    setOpen(false);
    setSystemPrompt(event.target.systemPrompt.value);
    setUsername(event.target.username.value);
  };

  const handleSubmit = async (userMessage) => {
    setStarting(true);
    const SNIP = "<!-- snip -->";

    const messageHistory = [...messages];
    if (completion.length > 0) {
      messageHistory.push({
        text: completion,
        isUser: false,
      });
    }
    messageHistory.push({
      text: userMessage,
      isUser: true,
    });

    // Generate initial prompt and calculate tokens
    let prompt = `${generatePrompt(
      llamaTemplate,
      systemPrompt,
      messageHistory
    )}\n`;
    // Check if we exceed max tokens and truncate the message history if so.
    while (countTokens(prompt) > MAX_TOKENS) {
      if (messageHistory.length < 3) {
        setError(
          "Your message is too long. Please try again with a shorter message."
        );

        return;
      }

      // Remove the third message from history, keeping the original exchange.
      messageHistory.splice(1, 2);

      // Recreate the prompt
      prompt = `${SNIP}\n${generatePrompt(
        llamaTemplate,
        systemPrompt,
        messageHistory
      )}\n`;
    }

    setMessages(messageHistory);

    dispatch({ type: "START" });

    complete(prompt);
  };

  useEffect(() => {
    if (messages?.length > 0 || completion?.length > 0) {
      bottomRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [messages, completion]);

  return (
    <>
      <header className="z-10 top-0 left-0 right-0 border-t-2 fixed bg-slate-100">
        <nav className="grid grid-cols-2 pt-2 pb-3 pl-3 pr-3 sm:grid-cols-3 sm:pl-0">
          <div className="hidden sm:inline-block"></div>
          <div className="font-semibold text-gray-500 sm:text-center">
            <img src="https://algorithmicalignment.csail.mit.edu/docs/assets/logo.png" alt="AAG Logo" className="inline-block mr-2 sm:mr-3 h-6" />
            <span className="hidden sm:inline-block">MIT CSAIL Algorithmic Alignment Group: Llama Chat</span>{" "}
          </div>
          <div className="inline-flex justify-end py-auto px-3">
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => {
                // Display the confirmation dialog
                const isConfirmed = window.confirm("Are you sure you have completed your interactions with the assistant? Export only at the end of your interactions.\n\n* Please ensure you have entered your assigned username in the Settings 'Username' field.");

                // If the user clicks "Yes" (OK), proceed with the download
                if (isConfirmed) {
                  downloadCSV(username, messages, completion);
                }
                // If the user clicks "No" (Cancel), do nothing
              }}
            >
              <ArchiveBoxArrowDownIcon
                className="w-5 h-5 text-gray-500 sm:mr-2 group-hover:text-gray-900"
                aria-hidden="true"
              />{" "}
              <span className="hidden sm:inline">Export Chat</span>
            </button>
            <button
              type="button"
              className="inline-flex items-center px-3 py-2 text-sm font-semibold text-gray-900 bg-white rounded-md shadow-sm ring-1 ring-inset ring-gray-300 hover:bg-gray-50"
              onClick={() => setOpen(true)}
            >
              <Cog6ToothIcon
                className="w-5 h-5 text-gray-500 sm:mr-2 group-hover:text-gray-900"
                aria-hidden="true"
              />{" "}
              <span className="hidden sm:inline">Settings</span>
            </button>
          </div>
        </nav>
      </header>


      <Toaster position="top-left" reverseOrder={false} />

      <main className="max-w-2xl pb-5 mx-auto mt-4 sm:px-4">
        <div className="text-center"></div>
        {messages.length == 0 && (
          <EmptyState setPrompt={setAndSubmitPrompt} setOpen={setOpen} />
        )}

        <SlideOver
          open={open}
          setOpen={setOpen}
          systemPrompt={systemPrompt}
          setSystemPrompt={setSystemPrompt}
          handleSubmit={handleSettingsSubmit}
          username={username}
          setUsername={setUsername}
        />

        <ChatForm
          prompt={input}
          setPrompt={setInput}
          onSubmit={handleSubmit}
        />

        {error && <div>{error}</div>}

        <article className="pb-24 pt-20">

          {messages.map((message, index) => (
            <Message
              key={`message-${index}`}
              message={message.text}
              isUser={message.isUser}
            />
          ))}
          <Message message={completion} isUser={false} />

          {starting && <QueuedSpinner />}

          <div ref={bottomRef} />
        </article>
      </main>
    </>
  );
}
