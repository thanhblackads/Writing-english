import type { MetaFunction } from "@remix-run/node";
import { useState } from "react";

export const meta: MetaFunction = () => {
  return [
    { title: "English Learning App" },
    { name: "description", content: "Translate Vietnamese to English" },
  ];
};

// Sample data (replace with actual data fetching or state management later)
const sampleVietnameseText =
  "Starting a garden at home can bring a lot of benefits. Nó mang lại không khí trong lành, niềm vui và thức ăn. Đầu tiên, hãy chọn một vị trí thích hợp. Những nơi có nắng là lý tưởng cho cây trồng. Bắt đầu với những loại cây dễ trồng như thảo mộc hoặc rau. Các loại thảo mộc như húng quế và mùi tây phát triển nhanh. Các loại rau như cà chua và rau diếp cũng phát triển mạnh trong không gian nhỏ. Tiếp theo, hãy chuẩn bị đất. Đất tốt rất giàu chất dinh dưỡng. Thêm phân trộn có thể giúp cải thiện chất lượng đất. Tưới nước thường xuyên, nhưng tránh tưới quá nhiều. Cây cần độ ẩm, nhưng quá nhiều có thể gây hại cho cây. Ngoài ra, hãy cân nhắc sử dụng các thùng chứa. Chúng hoàn hảo cho không gian hạn chế và sân trong. Nghiên cứu các loại cây khác nhau để phù hợp với khí hậu địa phương. Một khu vườn nhỏ có thể cung cấp sản phẩm tươi quanh năm không? Làm vườn tại nhà có thể mang lại những lợi ích gì? Làm vườn không chỉ là trồng cây; mà là kết nối với thiên nhiên.";

const sentences = sampleVietnameseText
  .split(/[.?!]/)
  .map((s) => s.trim())
  .filter((s) => s.length > 0);

// Sample correct translations and feedback (for demonstration)
const correctTranslations = [
  "Starting a garden at home can bring a lot of benefits.",
  "It brings fresh air, joy, and food.",
  "First, choose a suitable location.",
  "Sunny spots are ideal for planting.",
  "Start with easy-to-grow plants like herbs or vegetables.",
  "Herbs like basil and parsley grow quickly.",
  "Vegetables like tomatoes and lettuce also thrive in small spaces.",
  "Next, prepare the soil.",
  "Good soil is rich in nutrients.",
  "Adding compost can help improve soil quality.",
  "Water regularly, but avoid overwatering.",
  "Plants need moisture, but too much can harm them.",
  "Also, consider using containers.",
  "They are perfect for limited spaces and patios.",
  "Research different plant varieties to suit the local climate.",
  "Can a small garden provide fresh produce year-round?",
  "What benefits can home gardening bring?",
  "Gardening is not just about planting; it's about connecting with nature.",
];

const sampleFeedback = {
  suggestion: "Suggestion: It brings fresh air, joy (happy), and food.",
  improvements: [
    "Bạn cần dùng thì present simple để đúng với ngữ cảnh của câu trong toàn bài. Câu nên dùng brings thay vì bring.",
    "Thay đổi từ nice asmushphere thành fresh air để diễn đạt chính xác hơn.",
    "Sử dụng từ joy hoặc happiness thay cho từ happy, vì bạn đang liệt kê các danh từ.",
  ],
  comment:
    "Nhận xét: Câu dịch của bạn vẫn cần một số điều chỉnh để rõ nghĩa hơn. Hãy cố gắng cải thiện và chính xác hóa từ vựng nhé! 🌱",
};

export default function Index() {
  const [currentSentenceIndex, setCurrentSentenceIndex] = useState(0);
  const [userTranslation, setUserTranslation] = useState("");
  const [feedback, setFeedback] = useState<typeof sampleFeedback | null>(null);
  const [accuracy, setAccuracy] = useState<number | null>(null);

  const totalSentences = sentences.length;
  const currentSentence = sentences[currentSentenceIndex];

  const handleSubmit = () => {
    // --- Placeholder for actual translation analysis ---
    // In a real app, you would send `currentSentence` and `userTranslation`
    // to an API (like Google Translate, OpenAI, or a custom backend)
    // along with the `correctTranslations[currentSentenceIndex]` for comparison.
    // The API would return accuracy and detailed feedback.

    // Simple simulation:
    const isCorrect =
      userTranslation.trim().toLowerCase() ===
      correctTranslations[currentSentenceIndex].toLowerCase();
    setAccuracy(isCorrect ? 100 : 42.86); // Simulated accuracy
    setFeedback(isCorrect ? null : sampleFeedback); // Show sample feedback if incorrect

    // Move to the next sentence if correct (or provide option to retry)
    // For now, let's just show feedback
    // if (!isCorrect) {
    //   // Allow retry or show hint
    // } else if (currentSentenceIndex < totalSentences - 1) {
    //   setCurrentSentenceIndex(currentSentenceIndex + 1);
    //   setUserTranslation("");
    //   setFeedback(null);
    //   setAccuracy(null);
    // } else {
    //   // Lesson complete
    //   alert("Lesson Complete!");
    // }
    console.log("Submitted:", userTranslation);
  };

  const handleHint = () => {
    // Placeholder for hint logic (e.g., show first word, provide definition)
    alert("Hint functionality not implemented yet.");
  };

  const handleQuit = () => {
    // Placeholder for quit logic (e.g., navigate back, show summary)
    alert("Quit functionality not implemented yet.");
  };

  const handleNextSentence = () => {
     if (currentSentenceIndex < totalSentences - 1) {
       setCurrentSentenceIndex(currentSentenceIndex + 1);
       setUserTranslation("");
       setFeedback(null);
       setAccuracy(null);
     } else {
       alert("Lesson Complete!");
     }
  }

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
          <textarea
            className="w-full h-32 p-3 bg-gray-700 border border-gray-600 rounded-md focus:outline-none focus:ring-2 focus:ring-yellow-400 text-gray-100 placeholder-gray-500"
            placeholder="Enter your English translation here..."
            value={userTranslation}
            onChange={(e) => setUserTranslation(e.target.value)}
          ></textarea>
          <div className="flex justify-between items-center mt-4">
            <button
              onClick={handleQuit}
              className="px-4 py-2 bg-gray-600 hover:bg-gray-500 rounded-md text-sm font-medium"
            >
              ← Quit
            </button>
            <div className="space-x-3">
              <button
                onClick={handleHint}
                className="px-4 py-2 bg-gray-700 hover:bg-gray-600 border border-gray-500 rounded-md text-sm font-medium"
              >
                💡 Hint
              </button>
              <button
                onClick={handleSubmit}
                className="px-6 py-2 bg-yellow-400 hover:bg-yellow-500 text-gray-900 rounded-md text-sm font-bold"
              >
                Submit {feedback && !accuracy ? 'Retry' : '1'} 🪙
              </button>
               {/* Add a "Next" button for easier navigation during testing/dev */}
               <button
                onClick={handleNextSentence}
                className="px-4 py-2 bg-blue-500 hover:bg-blue-600 text-white rounded-md text-sm font-medium ml-2"
              >
                Next →
              </button>
            </div>
          </div>
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
              {accuracy !== null && (
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
                       🎯 {/* Using an emoji as placeholder */}
                    </span>
                  </div>
                  <span className="text-xs font-semibold">{accuracy.toFixed(2)}% Accuracy</span>
                </>
              )}
               {accuracy === null && (
                 <span className="text-sm text-gray-400">Accuracy</span>
               )}
            </div>
          </div>

          {/* Feedback */}
          {feedback && (
             <div className="bg-gray-800 p-6 rounded-lg shadow-lg">
              <h3 className="font-bold mb-3 text-lg">Feedback</h3>
              <div className="mb-4 text-sm">
                <p dangerouslySetInnerHTML={{ __html: feedback.suggestion.replace(/(\([^)]+\))/g, '<span class="text-red-400 line-through">$1</span>').replace(/,(?![^(]*\))/g, ',<br/>') }} />
              </div>
              <div className="mb-4 text-sm space-y-2">
                <h4 className="font-semibold text-gray-400">Suggested improvements:</h4>
                <ul className="list-disc list-inside space-y-1">
                  {feedback.improvements.map((item, index) => (
                    <li key={index} dangerouslySetInnerHTML={{ __html: item.replace(/(\b(?:present simple|brings|bring|fresh air|nice asmushphere|joy|happiness|happy)\b)/gi, '<strong class="text-yellow-400">$1</strong>') }} />
                  ))}
                </ul>
              </div>
              <p className="text-sm text-green-400">{feedback.comment}</p>
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
