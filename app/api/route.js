import Replicate from "replicate";
import { ReplicateStream, StreamingTextResponse } from "ai";
export const runtime = "edge";

const replicate = new Replicate({
  auth: process.env.REPLICATE_API_TOKEN,
});

if (!process.env.REPLICATE_API_TOKEN) {
  throw new Error(
    "The REPLICATE_API_TOKEN environment variable is not set. See README.md for instructions on how to set it."
  );
}

export async function POST(req) {
  const params = await req.json();

  let response;
  response = await runLlama({ ...params, model: "meta/llama-2-70b-chat" });
  
  // Convert the response into a friendly text-stream
  const stream = await ReplicateStream(response);

  // if (response && response.urls && response.urls.stream) {
  //   const source = new EventSource(response.urls.stream, { withCredentials: true });
  
  //   source.addEventListener("output", (e) => {
  //     console.log("output", e.data);
  //   });
  
  //   source.addEventListener("error", (e) => {
  //     console.error("error", JSON.parse(e.data));
  //   });
  
  //   source.addEventListener("done", (e) => {
  //     source.close();
  //     console.log("done", JSON.parse(e.data));
  //   });
  // }

  // Store prompt and response to csv
  // console.log(stream)
  // const csvLine = `"${params.prompt.replace(/"/g, '""')}","${response.replace(/"/g, '""')}"\n`;
  // await fs.appendFile('data.csv', csvLine, 'utf8');
  
  // Respond with the stream
  return new StreamingTextResponse(stream);
}

async function runLlama({
  model,
  prompt,
  systemPrompt,
  maxTokens,
  temperature,
  topP,
}) {
  console.log("running llama");
  console.log("model", model);

  return await replicate.predictions.create({
    model: model,
    stream: true,
    input: {
      prompt: `${prompt}`,
      prompt_template: "{prompt}",
      max_new_tokens: maxTokens,
      temperature: temperature,
      repetition_penalty: 1,
      top_p: topP,
    },
  });
}
