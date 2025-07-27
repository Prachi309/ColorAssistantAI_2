import React, { useState } from "react";
import FestiveOutfitIdeas from "./FestiveOutfitIdeas";
import ClothingImageResults from "./ClothingImageResults";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const steps = [
  {
    bot: "Hey! I'm here to help you plan your outfits for an upcoming festival. 🎉 What festival are you dressing for?",
    type: "text",
    placeholder: "Enter festival name (e.g., Diwali, Holi, Christmas, Eid)",
    key: "festival_name",
  },
  {
    bot: "Awesome! Where are you celebrating this festival?",
    type: "text",
    placeholder: "Enter location (e.g., Mumbai, Delhi, Bangalore)",
    key: "location",
  },
  {
    bot: "Got it! Could you please tell me your gender?",
    options: [
      { label: "Male", value: "Male" },
      { label: "Female", value: "Female" },
      { label: "Other", value: "Other" },
    ],
    key: "gender",
  },
  {
    bot: "What is your body type?",
    options: [
      { label: "Rectangle / Straight", value: "Rectangle / Straight" },
      { label: "Triangle / Pear-Shaped", value: "Triangle / Pear-Shaped" },
      { label: "Inverted Triangle / Apple-Shaped", value: "Inverted Triangle / Apple-Shaped" },
      { label: "Hourglass / Balanced", value: "Hourglass / Balanced" },
      { label: "Oval / Round", value: "Oval / Round" },
      { label: "Muscular / Athletic", value: "Muscular / Athletic" },
      { label: "I'm not sure", value: "I'm not sure" },
    ],
    key: "body_type",
  },
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

const buildPrompt = (answers) => {
  return `
Create a detailed festival outfit guide for ${answers.festival_name} celebration in ${answers.location}.

User Details:
- Festival: ${answers.festival_name}
- Location: ${answers.location}
- Gender: ${answers.gender}
- Body Type: ${answers.body_type}

Please provide:
1. Traditional and modern outfit suggestions for the festival
2. Day-wise outfit planning (consider the festival duration)
3. Accessories and jewelry recommendations
4. Makeup and grooming tips
5. Cultural significance and styling tips
6. Weather-appropriate considerations for the location
7. Mix and match options for different festival events

Format your response as:
- Festival-specific outfit recommendations
- Day-by-day styling guide
- Accessories and makeup suggestions
- Cultural styling tips
- Practical considerations

Keep the response comprehensive but well-structured for easy reading.
Focus on Indian festivals and cultural appropriateness.
`;
};

// Helper to extract day-wise outfit suggestions from the AI response
function extractDayWiseOutfits(aiText) {
  // Match headings like 'Day 1: Dhanteras', 'Day 2: Choti Diwali', etc.
  const dayRegex = /(?:Day\s*\d+:?\s*[^\n]*)|(?:Main Diwali Day \(Big Celebrations\))/gi;
  const lines = aiText.split(/\n+/);
  let days = [];
  let currentDay = null;
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    if (dayRegex.test(line)) {
      if (currentDay) days.push(currentDay);
      currentDay = { day: line.replace(/\*|#/g, '').trim(), outfit: '' };
      // Reset regex lastIndex for global regex
      dayRegex.lastIndex = 0;
    } else if (currentDay && (line.includes('Outfit:') || line.includes('outfit:'))) {
      currentDay.outfit = line.replace(/\*|#/g, '').replace(/Outfit:/i, '').trim();
    }
  }
  if (currentDay) days.push(currentDay);
  // Filter out days without outfit
  return days.filter(d => d.outfit);
}

// Helper to fetch images for an outfit (returns array of image objects)
async function fetchOutfitImages(query) {
  const res = await fetch(
    `${import.meta.env.VITE_BACKEND_URL}/api/serpapi-proxy?q=${encodeURIComponent(query)}`
  );
  const data = await res.json();
  return (data.images_results || []).slice(0, 5).map(img => ({ url: img.thumbnail, title: img.title || "" }));
}

const DressForFestival = ({ onClose }) => {
  const [chat, setChat] = useState([
    { from: "bot", text: steps[0].bot }
  ]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [finalReply, setFinalReply] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [occasions, setOccasions] = useState([]);
  const [loadingImages, setLoadingImages] = useState(false);

  const handleOption = async (option) => {
    setChat(prev => [...prev, { from: "user", text: option.label || option }]);
    setTyping(true);
    await sleep(700);
    setTyping(false);
    setAnswers(prev => ({ ...prev, [steps[step].key]: option.value || option }));
    if (step < steps.length - 1) {
      setChat(prev => [...prev, { from: "bot", text: steps[step + 1].bot }]);
      setStep(step + 1);
    } else {
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        try {
          const prompt = buildPrompt(answers);
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "mistralai/mistral-small-3.2-24b-instruct:free",
              messages: [{ role: "user", content: prompt }]
            })
          });
          const data = await response.json();
          const suggestion = data.choices?.[0]?.message?.content || "No festival guide received.";
          setFinalReply(suggestion);
          setChat(prev => [...prev, { from: "bot", text: suggestion }]);
          const days = extractDayWiseOutfits(suggestion);
          // Fetch images for each day
          setLoadingImages(true);
          const occs = await Promise.all(days.map(async d => {
            const images = await fetchOutfitImages(d.outfit);
            return {
              day: d.day,
              title: d.outfit,
              images
            };
          }));
          setOccasions(occs);
          setLoadingImages(false);
        } catch {
          setFinalReply("Sorry, something went wrong. Please try again later.");
          setChat(prev => [...prev, { from: "bot", text: "Sorry, something went wrong. Please try again later." }]);
          setOccasions([]);
          setLoadingImages(false);
        }
      }, 1200);
    }
  };

  const handleTextSubmit = async () => {
    if (!textInput.trim()) return;
    setChat(prev => [...prev, { from: "user", text: textInput }]);
    setTyping(true);
    await sleep(700);
    setTyping(false);
    setAnswers(prev => ({ ...prev, [steps[step].key]: textInput }));
    setTextInput("");
    if (step < steps.length - 1) {
      setChat(prev => [...prev, { from: "bot", text: steps[step + 1].bot }]);
      setStep(step + 1);
    } else {
      setTyping(true);
      setTimeout(async () => {
        setTyping(false);
        try {
          const prompt = buildPrompt(answers);
          const response = await fetch("https://openrouter.ai/api/v1/chat/completions", {
            method: "POST",
            headers: {
              "Authorization": `Bearer ${OPENROUTER_API_KEY}`,
              "Content-Type": "application/json"
            },
            body: JSON.stringify({
              model: "mistralai/mistral-small-3.2-24b-instruct:free",
              messages: [{ role: "user", content: prompt }]
            })
          });
          const data = await response.json();
          const suggestion = data.choices?.[0]?.message?.content || "No festival guide received.";
          setFinalReply(suggestion);
          setChat(prev => [...prev, { from: "bot", text: suggestion }]);
          const days = extractDayWiseOutfits(suggestion);
          // Fetch images for each day
          setLoadingImages(true);
          const occs = await Promise.all(days.map(async d => {
            const images = await fetchOutfitImages(d.outfit);
            return {
              day: d.day,
              title: d.outfit,
              images
            };
          }));
          setOccasions(occs);
          setLoadingImages(false);
        } catch {
          setFinalReply("Sorry, something went wrong. Please try again later.");
          setChat(prev => [...prev, { from: "bot", text: "Sorry, something went wrong. Please try again later." }]);
          setOccasions([]);
          setLoadingImages(false);
        }
      }, 1200);
    }
  };

  const currentStep = steps[step];

  return (
    <div style={{
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "rgba(123,123,229,0.10)", zIndex: 1200,
      display: "flex", alignItems: "center", justifyContent: "center"
    }}>
      <div style={{ background: "#fff", borderRadius: 18, boxShadow: "0 4px 32px #a084ee22", padding: 0, maxWidth: 700, width: "95vw", height: 600, maxHeight: "70vh", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(90deg,#a084ee,#7C83F7)", borderTopLeftRadius: 18, borderTopRightRadius: 18, padding: "18px 24px 10px 24px", color: "#fff" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
            <span style={{ background: "#fff", color: "#a084ee", borderRadius: "50%", width: 36, height: 36, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 22, fontWeight: 700 }}></span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 20 }}>Festival Dress Bot</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Get Your Perfect Festival Outfit Guide</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "none", border: "none", color: "#fff", fontSize: 26, cursor: "pointer" }}>&times;</button>
          </div>
        </div>
        {/* Chat area */}
        <div style={{
          width: "100%",
          height: "100%",
          display: "flex",
          flexDirection: "column",
          background: "transparent",
          boxSizing: "border-box",
          flex: 1,
          minHeight: 0,
        }}>
          <div
            style={{
              flex: 1,
              height: "100%",
              maxHeight: "100%",
              overflowY: "auto",
              background: "transparent",
              paddingRight: 8,
              minHeight: 0,
              boxSizing: "border-box",
              overflowX: "hidden",
              wordBreak: "break-word",
              whiteSpace: "pre-line",
            }}
          >
            {chat.map((msg, i) => (
              msg.from === "user" && (
                <div key={i} style={{ display: "flex", justifyContent: "flex-end", marginBottom: 12 }}>
                  <div style={{
                    background: "#a084ee",
                    color: "#fff",
                    borderRadius: 14,
                    padding: "10px 16px",
                    maxWidth: 540,
                    fontSize: 15,
                    boxShadow: "0 2px 8px #a084ee33",
                    textAlign: "left"
                  }}>{msg.text}</div>
                </div>
              )
            ))}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{ background: "#fff", color: "#aaa", borderRadius: 14, padding: "10px 16px", maxWidth: 180, fontSize: 15, fontStyle: "italic" }}>
                  <span className="typing-dots">Creating your festival guide</span>
                </div>
              </div>
            )}
            {/* Show FestiveOutfitIdeas after finalReply and images loaded */}
            {finalReply && !loadingImages && occasions.length > 0 && (
              <div style={{ marginTop: 24 }}>
                <FestiveOutfitIdeas occasions={occasions} />
              </div>
            )}
            {loadingImages && (
              <div style={{ marginTop: 32, textAlign: "center", color: "#a084ee", fontWeight: 600 }}>
                Loading outfit images...
              </div>
            )}
          </div>
          {/* Input area */}
          {!finalReply && (
            <div style={{
              padding: "16px 24px 24px 24px",
              background: "#fafbfc",
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}>
              {/* Options for selection steps */}
              {currentStep.options && (
                <div style={{
                  display: "flex",
                  flexWrap: "wrap",
                  justifyContent: "center",
                  gap: 12,
                  marginBottom: 16
                }}>
                  {currentStep.options.map((opt, i) => (
                    <button
                      key={i}
                      onClick={() => !typing && handleOption(opt)}
                      disabled={typing}
                      style={{
                        background: "#fff",
                        border: "1.5px solid #a084ee",
                        color: "#a084ee",
                        borderRadius: 8,
                        padding: "12px 18px",
                        fontWeight: 600,
                        fontSize: 15,
                        cursor: typing ? "not-allowed" : "pointer",
                        opacity: typing ? 0.6 : 1,
                        flex: "1 1 calc(50% - 16px)",
                        minWidth: 140,
                        maxWidth: 240,
                        boxSizing: "border-box"
                      }}
                    >
                      {opt.label}
                    </button>
                  ))}
                </div>
              )}
              {/* Text input for festival name and location */}
              {currentStep.type === "text" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="text"
                    value={textInput}
                    onChange={(e) => setTextInput(e.target.value)}
                    placeholder={currentStep.placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleTextSubmit()}
                    style={{
                      flex: 1,
                      padding: "12px 16px",
                      border: "1.5px solid #a084ee",
                      borderRadius: 8,
                      fontSize: 15,
                      outline: "none"
                    }}
                  />
                  <button
                    onClick={handleTextSubmit}
                    disabled={!textInput.trim() || typing}
                    style={{
                      background: "#a084ee",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 20px",
                      fontWeight: 600,
                      cursor: textInput.trim() && !typing ? "pointer" : "not-allowed",
                      opacity: textInput.trim() && !typing ? 1 : 0.6
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default DressForFestival;
