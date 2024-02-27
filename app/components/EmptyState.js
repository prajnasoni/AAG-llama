export default function EmptyState({ setOpen, setPrompt }) {
  return (
    <div className="mt-12 sm:mt-24 space-y-6 text-gray-400 text-base mx-8 sm:mx-4 sm:text-2xl leading-12">
      <p>
        {" "}
        Option to customize Llama&apos;s settings:{" "}
        <button
          className="prompt-button inline-flex items-center "
          onClick={() => setOpen(true)}
        >
          here{" "}
        </button>{" "}
        . For the study we ask that you keep this default settings.
      </p>
      <p>
        This is Phase 1 of the study. We ask that you prompt the model ____ INSERT TEXT _____ To test what potential prompts can be click the examples below:
      </p>
      <p>
        {" "}
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "Explain the self-attention mechanism that Transformers use like I'm five."
            )
          }
        >
          Example 1
        </button>
        , <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt("Write a poem about open source machine learning. ")
          }
        >
          Example 2
        </button>
        , <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "Write a python script that trains `bert-large` on the `IMDB` dataset using the Transformers `Trainer` class and Datasets library. I have access to four GPUs, so let's use DDP. Please write the script and then tell me how to launch it on the command line."
            )
          }
        >
          Example 3
        </button>
        , <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "Respond to this question only based on the information provided here. Cats like dogs, and dogs like rabbits. Cats like anything that dogs like. I really really dislike rabbits. How do cats feel about rabbits?"
            )
          }
        >
          Example 4
        </button>
        , <br></br>
        <button
          className="prompt-button"
          onClick={() =>
            setPrompt(
              "please provide 10 fun names for a pet pelican. Please come up with unique emojis to go along with each name. Try not to repeat the same emojis. Make them fun, colorful, and loving names"
            )
          }
        >
          Example 5
        </button>
        .
      </p>
    </div>
  );
}
