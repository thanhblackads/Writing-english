import type { MetaFunction, ActionFunctionArgs } from "@remix-run/node";
import { json } from "@remix-run/node";
import { useFetcher, useLoaderData } from "@remix-run/react";
import { useState, useEffect } from "react";
import { GoogleGenerativeAI, HarmCategory, HarmBlockThreshold } from "@google/generative-ai";

// --- Types ---
interface FeedbackData {
  accuracy: number | null; // Percentage (0-100) or null if not calculable
  suggestion: string | null; // Corrected/improved sentence
  improvements: string[]; // List of specific feedback points
  comment: string | null; // Overall comment
  error?: string; // Optional error message
}

// --- Sample Data (will be replaced by dynamic loading later) ---
const sampleVietnameseText =
  "Starting a garden at home can bring a lot of benefits. Nó mang lại không khí trong lành, niềm vui và thức ăn. Đầu tiên, hãy chọn một vị trí thích hợp. Những nơi có nắng là lý tưởng cho cây trồng. Bắt đầu với những loại cây dễ trồng như thảo mộc hoặc rau. Các loại thảo mộc như húng quế và mùi tây phát triển nhanh. Các loại rau như cà chua và rau diếp cũng phát triển mạnh trong không gian nhỏ. Tiếp theo, hãy chuẩn bị đất. Đất tốt rất giàu chất dinh dưỡng. Thêm phân trộn có thể giúp cải thiện chất lượng đất. Tưới nước thường xuyên, nhưng tránh tưới quá nhiều. Cây cần độ ẩm, nhưng quá nhiều có thể gây hại cho cây. Ngoài ra, hãy cân nhắc sử dụng các thùng chứa. Chúng hoàn hảo cho không gian hạn chế và sân trong. Nghiên cứu các loại cây khác nhau để phù hợp với khí hậu địa phương. Một khu vườn nhỏ có thể cung cấp sản phẩm tươi quanh năm không? Làm vườn tại nhà có thể mang lại những lợi ích gì? Làm vườn không chỉ là trồng cây; mà là kết nối với thiên nhiên.";

const sentences = sampleVietnameseText
  .split(/[.?!]/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// --- Remix Loader (can be used for initial data loading if needed) ---
export const loader = async () => {
  // For now, just pass the sentences array
  // Later, this could fetch lesson data from a DB
  return json({ sentences });
};

// --- Remix Action (Handles the translation submission) ---
export const action = async ({ request }: ActionFunctionArgs) => {
  // --- Server-Side Only Logic ---
  // Load environment variables and initialize Gemini ONLY within the action
  // Note: In a real app, consider initializing the client once outside
  // if performance becomes an issue, but ensure it's done server-side.
  // Remix's built-in process.env access might be sufficient without dotenv
  // depending on the deployment environment (e.g., Netlify, Vercel handle .env).
  // However, explicitly using dotenv here ensures it works locally via `npm run dev`.
  const dotenv = await import('dotenv'); // Dynamically import dotenv server-side
  dotenv.config();

  const API_KEY = process.env.GEMINI_API_KEY;

  if (!API_KEY) {
    console.error("Gemini API Key not found on server. Ensure GEMINI_API_KEY is set in .env");
    return json<FeedbackData>({ accuracy: null, suggestion: null, improvements: [], comment: null, error: "API Key not configured on the server." }, { status: 500 });
  }

  const genAI = new GoogleGenerativeAI(API_KEY);
  const model = genAI.getGenerativeModel({ model: "gemini-1.5-flash" });
  // --- End Server-Side Only Logic ---


  const formData = await request.formData();
  const originalSentence = formData.get("originalSentence") as string;
  const userTranslation = formData.get("userTranslation") as string;

  if (!originalSentence || !userTranslation) {
    return json<FeedbackData>({ accuracy: null, suggestion: null, improvements: [], comment: null, error: "Missing sentence or translation." }, { status: 400 });
  }

  const prompt = `
    You are an English teacher evaluating a Vietnamese student's translation.
    Analyze the student's English translation of the following Vietnamese sentence.

    Vietnamese Sentence: "${originalSentence}"
    Student's English Translation: "${userTranslation}"

    Provide feedback in JSON format with the following structure:
    {
      "accuracy": <number | null>, // Estimated accuracy percentage (0-100). Use null if unsure or not applicable.
      "suggestion": "<string | null>", // Provide a corrected or improved version of the translation. If the translation is perfect, make this null or a confirmation message.
      "improvements": ["<string>", "<string>", ...], // Provide a list of 2-4 specific points for improvement (grammar, vocabulary choice, phrasing, etc.). Focus on the most important ones. If perfect, provide an empty array or positive reinforcement.
      "comment": "<string | null>" // Give a brief, encouraging overall comment. If perfect, say so.
    }

    Instructions for analysis:
    1.  **Accuracy:** Assess how well the meaning is conveyed. Is it grammatically correct? Is the vocabulary appropriate?
    2.  **Suggestion:** Offer a natural-sounding, correct English version. If the student's version is already good, you can suggest minor improvements or confirm its correctness.
    3.  **Improvements:** Be specific. Instead of saying "grammar is wrong," point out the specific error (e.g., "Use 'brings' instead of 'bring' for third-person singular present tense"). Mention vocabulary choices if better words exist.
    4.  **Comment:** Keep it concise and encouraging.
    5.  **Format:** Strictly adhere to the JSON format requested above. Ensure keys and values are enclosed in double quotes. Avoid markdown formatting like \`\`\`json.
  `;

  try {
    const generationConfig = {
      temperature: 0.3, // Lower temperature for more deterministic feedback
      topK: 1,
      topP: 1,
      maxOutputTokens: 2048,
      // responseMimeType: "application/json", // Keep commented out unless sure model supports it reliably
    };

     const safetySettings = [
      { category: HarmCategory.HARM_CATEGORY_HARASSMENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_HATE_SPEECH, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_SEXUALLY_EXPLICIT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
      { category: HarmCategory.HARM_CATEGORY_DANGEROUS_CONTENT, threshold: HarmBlockThreshold.BLOCK_MEDIUM_AND_ABOVE },
    ];

    const result = await model.generateContent({
       contents: [{ role: "user", parts: [{ text: prompt }] }],
       generationConfig,
       safetySettings,
     });

    const responseText = result.response.text();
    console.log("Gemini Raw Response:", responseText); // Log raw response for debugging

    // Attempt to parse the JSON response
    try {
      // Clean potential markdown fences if present
      const jsonString = responseText.replace(/^```json\s*|\s*```$/g, '');
      const feedback: FeedbackData = JSON.parse(jsonString);
      console.log("Parsed Feedback:", feedback); // Log parsed feedback
      return json<FeedbackData>(feedback);
    } catch (parseError) {
      console.error("Failed to parse Gemini response:", responseText, parseError);
      return json<FeedbackData>({ accuracy: null, suggestion: null, improvements: [], comment: "Error: Could not understand the feedback format from AI.", error: `Failed to parse API response. Raw text: ${responseText}` }, { status: 500 });
    }

  } catch (error) {
    console.error("Error calling Gemini API:", error);
     let errorMessage = "An unknown error occurred while getting feedback.";
     if (error instanceof Error) {
       errorMessage = `API Error: ${error.message}`;
       // Add more specific error handling if needed (e.g., check error.code or status)
       if (error.message.includes('API key not valid')) {
          errorMessage = "API Error: Invalid API Key. Please check your .env file.";
       }
     }
     // Check for specific API error types if the SDK provides them
     // Example: if (error.status === 429) { errorMessage = "API rate limit exceeded." }

    return json<FeedbackData>({ accuracy: null, suggestion: null, improvements: [], comment: null, error: errorMessage }, { status: 500 });
  }
};

// --- Meta Function ---
export const meta: MetaFunction = () => {
  return [
    { title: "English Learning App" },
    { name: "description", content: "Translate Vietnamese to English with AI Feedback" },
  ];
};

// --- React Component ---
export default function Index() {
  const { sentences: initialSentences } = useLoaderData<typeof loader>();
  const fetcher = useFetcher<FeedbackData>(); // Use fetcher for form submissions

  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState("");
  // Removed local feedback/accuracy state, now derived from fetcher.data

  const totalSentences = initialSentences.length;
  const currentSentence = initialSentences[currentSentenceIndex];

  // Derive feedback and accuracy from fetcher
  const feedback = fetcher.data && !fetcher.data.error ? fetcher.data : null;
  const accuracy = feedback?.accuracy ?? null;
  const apiError = fetcher.data?.error ?? null;
  const isLoading = fetcher.state === "submitting" || fetcher.state === "loading";


  const handleSubmit = () => {
    if (isLoading || !userTranslation.trim()) return; // Prevent multiple submissions or empty submissions

    const formData = new FormData();
    formData.append("originalSentence", currentSentence);
    formData.append("userTranslation", userTranslation);

    // Submit data to the Remix action using the fetcher
    fetcher.submit(formData, { method: "post" });
  };

  const handleHint = () => {
    alert("Hint functionality not implemented yet.");
  };

  const handleQuit = () => {
    alert("Quit functionality not implemented yet.");
  };

  const handleNextSentence = () => {
     if (currentSentenceIndex < totalSentences - 1) {
       setCurrentSentenceIndex(currentSentenceIndex + 1);
       // setUserTranslation(""); // Clear input on next sentence (handled by useEffect)
       // Clear previous fetcher data when moving to the next sentence
       // This might not be strictly necessary as the component re-renders,
       // but explicitly loading nothing can sometimes help clear state visually.
       // fetcher.load(window.location.pathname); // Reload current route without action data
     } else {
       alert("Lesson Complete!");
       // Optionally reset to the beginning or navigate elsewhere
       // setCurrentSentenceIndex(0);
     }
  }

  // Effect to clear user input and feedback when sentence changes
  useEffect(() => {
    setUserTranslation("");
    // Reset fetcher state visually if needed. Since fetcher is tied to the route,
    // changing the sentence index (state) causes a re-render, but fetcher.data
    // might persist until the next submission. Explicitly clearing might be needed
    // if stale feedback is shown briefly. However, the isLoading/feedback checks
    // should prevent displaying old data during loading or after index change.
  }, [currentSentenceIndex]);


  return (
    <div className="min-h-screen bg-gray-900 text-gray-200 p-6 font-sans">
      {/* Header */}
      <header className="flex justify-between items-center mb-4">
        <h1 className="text-xl font-bold text-yellow-400">
          Cultivating a Green Space: Starting a Small Home Garden
        </h1>
        <div className="flex items-center space-x-6 text-sm">
          <span>🪙 7 credits</span>
          <span>⭐ 10 points</span>
          <span>
            Progress: {currentSentenceIndex + 1}/{totalSentences} sentences
          </span>
        </div>
      </header>

      {/* Progress Bar */}
      <div className="w-full bg-gray-700 rounded-full h-2.5 mb-6">
        <div
          className="bg-yellow-400 h-2.5 rounded-full"
          style={{ width: `${((currentSentenceIndex + 1) / totalSentences) * 100}%` }}
        ></div>
      </div>

      {/* Main Content Area */}
      <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
        {/* Left Panel (Text and Input) */}
        <div className="md:col-span-2 bg-gray-800 p-6 rounded-lg shadow-lg">
          <div className="mb-4">
            <p className="text-lg leading-relaxed">{currentSentence}</p>
          </div>
          {/* Use fetcher.Form for automatic submission handling */}
          {/* Add a key to the form that changes with the sentence index */}
          {/* This helps ensure Remix treats it as a "new" form instance */}
          {/* and clears previous submission state (fetcher.data) more reliably */}
          <fetcher.Form key={currentSentenceIndex} method="post" onSubmit={(e) => { e.preventDefault(); handleSubmit(); }}>
             {/* Hidden inputs to pass data to the action */}
             <input type="hidden" name="originalSentence" value={currentSentence} />
             <textarea
              name="userTranslation" // Make sure name matches formData key
              className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-100 placeholder-gray-500"
              placeholder="Enter your English translation here..."
              value={userTranslation}
              onChange={(e) => setUserTranslation(e.target.value)}
              disabled={isLoading} // Disable textarea while loading
            ></textarea>
            <div className="flex justify-between items-center mt-4">
              <button
                type="button" // Prevent form submission
                onClick={handleQuit}
                className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium"
                disabled={isLoading}
              >
                ← Quit
              </button>
              <div className="space-x-3">
                <button
                  type="button" // Prevent form submission
                  onClick={handleHint}
                  className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-md text-sm font-medium"
                  disabled={isLoading}
                >
                  💡 Hint
                </button>
                <button
                  type="submit" // Submit the form
                  className={`px-6 py-2 rounded-md text-sm font-bold ${
                    isLoading
                      ? "bg-gray-500 text-gray-400 cursor-not-allowed"
                      : "bg-yellow-400 hover:bg-yellow-500 text-gray-900"
                  }`}
                  disabled={isLoading || !userTranslation.trim()}
                >
                  {isLoading ? "Checking..." : `Submit ${feedback && !accuracy ? 'Retry' : '1'} 🪙`}
                </button>
                 {/* Keep Next button for dev/testing */}
                 {/* Only show Next button after successful feedback? Or always? */}
                 {/* Let's show it after feedback is received */}
                 {feedback && !isLoading && (
                    <button
                      type="button"
                      onClick={handleNextSentence}
                      className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium ml-2"
                      disabled={isLoading}
                    >
                      Next →
                    </button>
                 )}
              </div>
            </div>
          </fetcher.Form>
        </div>

        {/* Right Panel (Feedback, etc.) */}
        <div className="space-y-6">
          {/* Dictionary & Accuracy */}
          <div className="grid grid-cols-2 gap-4">
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex items-center justify-center text-center h-24">
              <span className="text-sm">📖 Dictionary</span>
              {/* Dictionary content would go here */}
            </div>
            <div className="bg-gray-800 p-4 rounded-lg shadow-lg flex flex-col items-center justify-center text-center h-24">
              {isLoading ? (
                 <span className="text-sm text-gray-400">Checking Accuracy...</span>
              ) : accuracy !== null ? (
                <>
                  <div className="relative w-12 h-12 mb-1">
                    <svg className="w-full h-full" viewBox="0 0 36 36">
                      <path
                        className="text-gray-700"
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                      />
                      <path
                        className={accuracy >= 75 ? "text-green-500" : accuracy >= 40 ? "text-yellow-500" : "text-red-500"}
                        d="M18 2.0845 a 15.9155 15.9155 0 0 1 0 31.831 a 15.9155 15.9155 0 0 1 0 -31.831"
                        fill="none"
                        strokeWidth="3"
                        strokeDasharray={`${accuracy}, 100`}
                        strokeLinecap="round"
                      />
                    </svg>
                     <span className="absolute top-1/2 left-1/2 transform -translate-x-1/2 -translate-y-1/2 text-xs font-bold">
                       🎯
                    </span>
                  </div>
                  <span className="text-xs font-semibold">{accuracy.toFixed(0)}% Accuracy</span>
                </>
              ) : (
                 // Show Accuracy text only if there's no error and not loading
                 !apiError && <span className="text-sm text-gray-400">Accuracy</span>
               )}
            </div>
          </div>

          {/* Feedback Area */}
          {/* Show loading indicator */}
          {isLoading && (
            <div className="bg-gray-800 p-6 rounded-lg shadow-lg text-center">
              <p className="text-yellow-400 animate-pulse">Getting feedback from AI...</p>
            </div>
          )}

          {/* Show API Error if present and not loading */}
          {apiError && !isLoading && (
             <div className="bg-red-900 border border-red-700 text-red-100 p-4 rounded-lg shadow-lg">
              <h3 className="font-bold mb-2 text-lg">Error</h3>
              <p className="text-sm">{apiError}</p>
              {apiError.includes("API Key") && <p className="text-xs mt-2">Please ensure your `GEMINI_API_KEY` is correctly set in the `.env` file and the server has restarted.</p>}
              {!apiError.includes("API Key") && <p className="text-xs mt-2">There might be an issue with the AI service or the request. Please try again later.</p>}
            </div>
          )}

          {/* Show Feedback if present, no error, and not loading */}
          {feedback && !apiError && !isLoading && (
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="font-bold mb-3 text-lg">Feedback</h3>
              {feedback.suggestion && (
                <div className="mb-4 text-sm">
                  <h4 className="font-semibold text-gray-400 mb-1">Suggestion:</h4>
                  {/* Basic formatting for suggestion - can be improved */}
                  <p className="text-green-300 bg-gray-700 p-2 rounded">{feedback.suggestion}</p>
                </div>
              )}
              {feedback.improvements && feedback.improvements.length > 0 && (
                <div className="mb-4 text-sm space-y-2">
                  <h4 className="font-semibold text-gray-400">Improvements:</h4>
                  <ul className="list-disc list-inside space-y-1 pl-2">
                    {feedback.improvements.map((item, index) => (
                      <li key={index} className="text-gray-300">{item}</li> // Simple list item for now
                    ))}
                  </ul>
                </div>
              )}
               {feedback.comment && (
                 <p className="text-sm text-yellow-300 italic border-t border-gray-700 pt-3 mt-3">{feedback.comment}</p>
               )}
               {/* Handle case where AI might return empty feedback object */}
               {!feedback.suggestion && (!feedback.improvements || feedback.improvements.length === 0) && !feedback.comment && (
                 <p className="text-sm text-gray-400">The AI provided feedback, but it appears to be empty. This might happen if the translation was considered perfect or if there was an issue generating specific points.</p>
               )}
            </div>
          )}


          {/* Today's Achievements */}
          <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
            <h3 className="font-bold mb-3 text-lg">Today's Achievements</h3>
            <div className="grid grid-cols-2 gap-4">
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <span className="text-2xl mb-1 block">🔥</span>
                <span className="text-xs">0 Day Streak</span>
              </div>
              <div className="bg-gray-700 p-4 rounded-lg text-center">
                <span className="text-2xl mb-1 block">💡</span>
                <span className="text-xs">Bright Mind</span>
              </div>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
