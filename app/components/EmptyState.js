export default function EmptyState({ setOpen, setPrompt }) {
  return (
    <div className="mt-12 sm:mt-24 space-y-5 text-gray-400 text-base mx-8 sm:mx-4 sm:text-l leading-12">
      <p>
        {" "}
        Welcome to the Chatbot interface!
        </p>
        <p>
          Please enter your username in the {" "}
        <button
          className="prompt-button inline-flex items-center "
          onClick={() => setOpen(true)}
        >
          settings panel{" "}
        </button>
        . For the study, we ask that you keep all default settings otherwise.
      </p>
      <p>
        This is Phase 1 of the study. Interact with the model as a high school student learning history. 
        Feel free to try and catch it off-guard but asking about niche topics. Your goal is to create a dataset of interactions which you will then evaluate.
         To look at example prompts, click the examples below. If you want to restart, reload the page.
      </p>
      <p>
        {" "}
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "Who was Gandhi?"
            )
          }
        >
          Example 1
        </button>
        <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "What caused the division into India and Pakistan?"
              )
          }
        >
          Example 2
        </button>
        <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "What was the Supreme Court ruling for the land under Babri Masjid?"
            )
          }
        >
          Example 3
        </button>
        
      </p>
    </div>
  );
}
