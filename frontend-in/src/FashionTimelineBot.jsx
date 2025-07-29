import React, { useState, useRef, useEffect } from "react";
import FestiveOutfitIdeas from "./FestiveOutfitIdeas";

const OPENROUTER_API_KEY = import.meta.env.VITE_OPENROUTER_API_KEY;

const steps = [
  {
    bot: "Help me out with a few details first.",
    type: "intro",
    key: "intro"
  },
  {
    bot: "What is your gender?",
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
  {
    bot: "Where are you going?",
    type: "text",
    placeholder: "Enter location (e.g., Mumbai, Goa, Delhi)",
    key: "location",
  },
  {
    bot: "For how many days are you going?",
    type: "number",
    placeholder: "Enter number of days",
    key: "duration",
  },
];

const sleep = ms => new Promise(res => setTimeout(res, ms));

const buildPrompt = (answers) => {
  let genderWarning = '';
  if (answers.gender && answers.gender.toLowerCase() === 'male') {
    genderWarning = 'Do NOT mention or suggest sarees, lehengas, skirts, dresses, or any female clothing. Only suggest clothing for men.';
  } else if (answers.gender && answers.gender.toLowerCase() === 'female') {
    genderWarning = 'Do NOT mention or suggest sherwanis, kurtas, or any male clothing. Only suggest clothing for women.';
  } else {
    genderWarning = 'Only suggest clothing appropriate for the specified gender.';
  }
  return `
WARNING: You must follow these instructions exactly.
- ALL outfit suggestions MUST be for a ${answers.gender} traveler ONLY, and must be appropriate for the destination (${answers.location}).
- ${genderWarning}
- Do NOT provide suggestions for any other gender or for any other location. Gender and destination are the foremost priority for all suggestions.

User Details:
- Gender: ${answers.gender}
- Body Type: ${answers.body_type}
- Destination: ${answers.location}
- Duration: ${answers.duration} days

Provide exactly ${answers.duration} day(s) of outfit suggestions for a ${answers.gender} in ${answers.location}. Each day should be clearly marked as "Day 1:", "Day 2:", etc.

For each day, provide:
- One complete outfit suggestion for a ${answers.gender} in ${answers.location} (top, bottom, shoes, accessories)
- Weather considerations for that day in ${answers.location}
- Occasion-appropriate styling for a ${answers.gender}

Format your response as:
## Day 1: [Brief description]
**Outfit:** [Complete outfit details]
**Weather:** [Weather info]
**Occasion:** [Occasion info]

## Day 2: [Brief description]
**Outfit:** [Complete outfit details]
**Weather:** [Weather info]
**Occasion:** [Occasion info]

[Continue for all ${answers.duration} days]

Use only color names, no hex codes. Keep each day's outfit suggestion concise but complete.
`;
};

// Helper to extract day-wise outfit suggestions from the AI response (tailored for timeline format)
function extractTimelineDays(aiText, requestedDays) {
  // Match headings like '## Day 1:', '### Day 1:', '#### **Day 1:', etc.
  const dayRegex = /^#+\s*\**Day\s*\d+:[^\n]*/i;
  
  const lines = aiText.split(/\n+/);
  let days = [];
  let currentDay = null;
  let currentText = [];
  
  for (let i = 0; i < lines.length; i++) {
    const line = lines[i];
    
    // Check for day headers
    if (dayRegex.test(line.replace(/\*/g, '').trim())) {
      if (currentDay) {
        if (!currentDay.outfit) {
          currentDay.outfit = currentText.join(' ').replace(/[#*]/g, '').trim();
        }
        days.push(currentDay);
      }
      currentDay = { day: line.replace(/[#*]/g, '').trim(), outfit: '' };
      currentText = [];
    }
    // Collect outfit details for the current day
    else if (currentDay && (line.toLowerCase().includes('outfit:') || 
                           line.toLowerCase().includes('top:') || 
                           line.toLowerCase().includes('bottom:') ||
                           line.toLowerCase().includes('footwear:') ||
                           line.toLowerCase().includes('accessories:') ||
                           line.toLowerCase().includes('weather:') ||
                           line.toLowerCase().includes('occasion:'))) {
      currentText.push(line);
    }
    // Continue collecting lines for the current day until next day
    else if (currentDay && currentText.length > 0 && line.trim() !== '') {
      currentText.push(line);
    }
  }
  
  // Handle the last day
  if (currentDay) {
    if (!currentDay.outfit && currentText.length > 0) {
      currentDay.outfit = currentText.join(' ').replace(/[#*]/g, '').trim();
    }
    days.push(currentDay);
  }
  
  console.log('extractTimelineDays - days:', days);
  
  // Filter to only return the requested number of days
  return days.filter(d => d.outfit).slice(0, requestedDays);
}

// Helper to fetch images for an outfit (returns array of image objects)
async function fetchOutfitImages(query) {
  try {
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/serpapi-proxy?q=${encodeURIComponent(query)}`;
    const res = await fetch(url);
    if (!res.ok) return [];
    const data = await res.json();
    if (data.error) return [];
    return (data.images_results || []).slice(0, 5).map(img => ({ url: img.thumbnail, title: img.title || "" }));
  } catch {
    return [];
  }
}

const FashionTimelineBot = ({ onClose }) => {
  const [chat, setChat] = useState([
    { from: "bot", text: steps[0].bot }
  ]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [finalReply, setFinalReply] = useState(null);
  const [timeline, setTimeline] = useState([]); // [{day, outfit, images}]
  const [loadingImages, setLoadingImages] = useState(false);
  const [textInput, setTextInput] = useState("");
  const [numberInput, setNumberInput] = useState("");
  const chatEndRef = useRef(null);

  useEffect(() => {
    if (chatEndRef.current) {
      chatEndRef.current.scrollIntoView({ behavior: "smooth" });
    }
  }, [chat, timeline]);

  const handleOption = async (option) => {
    setChat(prev => [...prev, { from: "user", text: option.label || option }]);
    setTyping(true);
    await sleep(700);
    setTyping(false);
    setAnswers(prev => ({ ...prev, [steps[step].key]: option.value || option }));
    if (step < steps.length - 1) {
      setChat(prev => [...prev, { from: "bot", text: steps[step + 1].bot }]);
      setStep(step + 1);
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
    }
  };

  const handleNumberSubmit = async () => {
    if (!numberInput.trim() || isNaN(numberInput)) return;
    const duration = parseInt(numberInput);
    setChat(prev => [...prev, { from: "user", text: `${numberInput} days` }]);
    setTyping(true);
    await sleep(700);
    setTyping(false);
    // Merge the latest answer into a local object
    const updatedAnswers = { ...answers, [steps[step].key]: duration };
    setAnswers(updatedAnswers);
    setNumberInput("");
    // This is the last step, so generate the timeline
    setTyping(true);
    setTimeout(async () => {
      setTyping(false);
      try {
        const prompt = buildPrompt(updatedAnswers);
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
        const suggestion = data.choices?.[0]?.message?.content || "No timeline received.";
        console.log('AI suggestion:', suggestion);
        // Parse timeline and fetch images
        const days = extractTimelineDays(suggestion, duration);
        console.log('Extracted days:', days);
        setLoadingImages(true);
        const occs = await Promise.all(days.map(async d => {
          console.log('Fetching images for:', d.outfit);
          const images = await fetchOutfitImages(d.outfit);
          if (!images || images.length === 0) {
            console.warn('No images found for:', d.outfit);
          }
          return {
            day: d.day,
            title: d.outfit,
            images
          };
        }));
        console.log('Final occasions:', occs);
        setTimeline(occs);
        setLoadingImages(false);
      } catch {
        setFinalReply("Sorry, something went wrong. Please try again later.");
        setTimeline([]);
        setLoadingImages(false);
      }
    }, 1200);
  };

  const handleIntroContinue = async () => {
    setTyping(true);
    await sleep(700);
    setTyping(false);
    if (step < steps.length - 1) {
      setChat(prev => [...prev, { from: "bot", text: steps[step + 1].bot }]);
      setStep(step + 1);
    }
  };

  const currentStep = steps[step];

  return (
    <div style={{ height: "100vh", width: "100vw", background: "linear-gradient(135deg, #a084ee 0%, #7C83F7 100%)", display: "flex", flexDirection: "column", zIndex: 1200, position: "fixed", top: 0, left: 0 }}>
        {/* Header */}
      <div style={{ background: "linear-gradient(90deg,#a084ee,#7C83F7)", padding: "20px 32px", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
        <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
          <span style={{ background: "#fff", color: "#a084ee", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>🗼</span>
            <div>
            <div style={{ fontWeight: 700, fontSize: 28 }}>Fashion Timeline Bot</div>
            <div style={{ fontSize: 16, opacity: 0.9 }}>Get Your Personalized Fashion Timeline</div>
          </div>
          <button onClick={onClose} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
        </div>
      </div>
      {/* Main scrollable content */}
      <div style={{ flex: 1, overflowY: "auto", background: "#fff", width: "100%", display: "flex", flexDirection: "column", alignItems: "center" }}>
        <div style={{ width: "100%", maxWidth: 1200, padding: "32px 0 0 0" }}>
        {/* Chat area */}
          <div style={{ marginBottom: 32 }}>
            {chat.map((msg, i) => (
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  background: msg.from === "user" ? "#a084ee" : "#f8f9fa",
                  color: msg.from === "user" ? "#fff" : "#333",
                  borderRadius: 14,
                  padding: "10px 16px",
                  maxWidth: 540,
                  fontSize: 15,
                  boxShadow: msg.from === "user" ? "0 2px 8px #a084ee33" : "0 2px 8px #eee",
                  textAlign: "left"
                }}>{msg.text}</div>
              </div>
            ))}
            {typing && (
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                <div style={{ background: "#fff", color: "#aaa", borderRadius: 14, padding: "10px 16px", maxWidth: 180, fontSize: 15, fontStyle: "italic" }}>
                  <span className="typing-dots">Creating your timeline</span>
                </div>
              </div>
            )}
            <div ref={chatEndRef} />
          </div>
          {/* Timeline/image cards area */}
          {loadingImages && (
            <div style={{ marginTop: 32, textAlign: "center", color: "#a084ee", fontWeight: 600, fontSize: 20 }}>
              Loading outfit images...
            </div>
          )}
          {timeline.length > 0 && !loadingImages && (
            <>
              <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
            <div style={{
                  background: "#f8f9fa",
                  color: "#333",
                  borderRadius: 14,
                  padding: "10px 16px",
                  maxWidth: 540,
                  fontSize: 18,
                  border: "1px solid #e9ecef",
                  textAlign: "left",
                  fontWeight: 600
                }}>Here is your personalized fashion timeline with outfit images:</div>
              </div>
              <FestiveOutfitIdeas occasions={timeline} />
            </>
          )}
        </div>
      </div>
      {/* Input area (sticky at bottom) */}
      <div style={{ width: "100%", background: "#fafbfc", borderTop: "1px solid #e9ecef", padding: "24px 32px 32px 32px", position: "sticky", bottom: 0, zIndex: 10 }}>
        {/* Only show input if timeline is not ready */}
        {timeline.length === 0 && !loadingImages && !finalReply && (
          <>
              {/* Intro step - show continue button */}
              {currentStep.type === "intro" && (
                <div style={{ display: "flex", justifyContent: "center" }}>
                  <button
                    onClick={handleIntroContinue}
                    disabled={typing}
                    style={{
                      background: "#a084ee",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 24px",
                      fontWeight: 600,
                      fontSize: 15,
                      cursor: typing ? "not-allowed" : "pointer",
                      opacity: typing ? 0.6 : 1
                    }}
                  >
                    Continue
                  </button>
                </div>
              )}
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
              {/* Text input for location */}
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
              {/* Number input for duration */}
              {currentStep.type === "number" && (
                <div style={{ display: "flex", gap: 8 }}>
                  <input
                    type="number"
                    value={numberInput}
                    onChange={(e) => setNumberInput(e.target.value)}
                    placeholder={currentStep.placeholder}
                    onKeyPress={(e) => e.key === 'Enter' && handleNumberSubmit()}
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
                    onClick={handleNumberSubmit}
                    disabled={!numberInput.trim() || isNaN(numberInput) || typing}
                    style={{
                      background: "#a084ee",
                      color: "#fff",
                      border: "none",
                      borderRadius: 8,
                      padding: "12px 20px",
                      fontWeight: 600,
                      cursor: numberInput.trim() && !isNaN(numberInput) && !typing ? "pointer" : "not-allowed",
                      opacity: numberInput.trim() && !isNaN(numberInput) && !typing ? 1 : 0.6
                    }}
                  >
                    Send
                  </button>
                </div>
              )}
          </>
          )}
      </div>
    </div>
  );
};

export default FashionTimelineBot;
