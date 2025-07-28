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

Please provide specific outfit recommendations in this exact format:

**Traditional Outfits:**
- Anarkali Suit: [specific description with colors and style details]
- Lehenga/Chaniya Choli: [specific description with colors and style details]
- Saree: [specific description with colors and style details]

**Modern Outfits:**
- Palazzo Suit: [specific description with colors and style details]
- Indo-Western Dress: [specific description with colors and style details]
- Fusion Wear: [specific description with colors and style details]

**Accessories:**
- Jewelry: [specific jewelry recommendations]
- Footwear: [specific footwear recommendations]
- Bags: [specific bag recommendations]

Please be very specific with outfit names and descriptions so we can search for relevant images. Include actual garment names like "Anarkali", "Lehenga", "Saree", "Palazzo", etc.

Focus on Indian festivals and cultural appropriateness.
`;
};

// Helper to extract day-wise outfit suggestions from the AI response
function extractDayWiseOutfits(aiText) {
  console.log("Extracting outfits from:", aiText);
  
  // Create beautiful, complete outfit descriptions based on the AI response
  const outfits = [
    {
      day: "Traditional Elegance",
      outfit: "Anarkali Suit - A flowy, stunning Anarkali with intricate embroidery or zari work. Choose elegant pastels like light pink, mint green, or sky blue for a sophisticated look, or rich jewel tones like deep emerald, royal blue, and maroon for a classic festival vibe."
    },
    {
      day: "Festive Lehenga",
      outfit: "Lehenga/Chaniya Choli - A grand festival lehenga in deep jewel tones like maroon, emerald, and gold. Features heavy embroidery with zari work, gotta patti, or zardozi on the blouse and skirt. Perfect for main festival celebrations and family gatherings."
    },
    {
      day: "Graceful Saree",
      outfit: "Saree - A lightweight cotton or chiffon saree in pastel peach, sky blue, or lemon yellow with Bandhani or block print patterns. Choose a ready-to-wear saree for easy draping. Pair with a contrast blouse and traditional jhumkas for an elegant look."
    },
    {
      day: "Modern Palazzo",
      outfit: "Palazzo Suit - A comfortable yet chic palazzo suit with geometric prints or metallic accents. Perfect for modern festival celebrations. Features a fitted kurta with wide-legged palazzo pants and a coordinating dupatta with contemporary styling."
    },
    {
      day: "Fusion Fashion",
      outfit: "Indo-Western Dress - A fusion of traditional and modern styles with asymmetrical cuts and contemporary silhouettes. Features dhoti pants, crop tops, or modern kurta designs. Perfect for parties and friend gatherings during the festival."
    },
    {
      day: "Festive Accessories",
      outfit: "Jewelry & Accessories - Traditional jhumkas, statement necklaces, and bangles. Pair with mojaris or juttis for footwear. Complete the look with a matching potli bag or embroidered clutch for a perfect festival ensemble."
    }
  ];
  
  console.log("Created beautiful outfits:", outfits);
  return outfits;
}

// Helper to fetch images for an outfit (returns array of image objects)
async function fetchOutfitImages(query) {
  console.log("Fetching images for query:", query);
  console.log("Backend URL:", import.meta.env.VITE_BACKEND_URL);
  
  try {
    const url = `${import.meta.env.VITE_BACKEND_URL}/api/serpapi-proxy?q=${encodeURIComponent(query)}`;
    console.log("Full URL:", url);
    
    const res = await fetch(url);
    console.log("Response status:", res.status);
    
    if (!res.ok) {
      console.error("Response not ok:", res.status, res.statusText);
      return [];
    }
    
    const data = await res.json();
    console.log("SerpAPI response:", data);
    
    if (data.error) {
      console.error("SerpAPI error:", data.error);
      return [];
    }
    
    const images = (data.images_results || []).slice(0, 5).map(img => ({ 
      url: img.thumbnail, 
      title: img.title || "" 
    }));
    console.log("Processed images:", images);
    return images;
  } catch (error) {
    console.error("Error fetching images:", error);
    return [];
  }
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
          // Don't add the AI response to chat - keep it hidden
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
          // Don't add the AI response to chat - keep it hidden
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
      position: "fixed", top: 0, left: 0, width: "100vw", height: "100vh", background: "linear-gradient(135deg, #a084ee 0%, #7C83F7 100%)", zIndex: 1200,
      display: "flex", flexDirection: "column"
    }}>
      <div style={{ background: "#fff", width: "100%", height: "100%", display: "flex", flexDirection: "column" }}>
        {/* Header */}
        <div style={{ background: "linear-gradient(90deg,#a084ee,#7C83F7)", padding: "20px 32px", color: "#fff", borderBottom: "1px solid rgba(255,255,255,0.1)" }}>
          <div style={{ display: "flex", alignItems: "center", gap: 16, maxWidth: 1200, margin: "0 auto" }}>
            <span style={{ background: "#fff", color: "#a084ee", borderRadius: "50%", width: 48, height: 48, display: "flex", alignItems: "center", justifyContent: "center", fontSize: 24, fontWeight: 700 }}>🎉</span>
            <div>
              <div style={{ fontWeight: 700, fontSize: 28 }}>Festival Dress Bot</div>
              <div style={{ fontSize: 16, opacity: 0.9 }}>Get Your Perfect Festival Outfit Guide</div>
            </div>
            <button onClick={onClose} style={{ marginLeft: "auto", background: "rgba(255,255,255,0.1)", border: "none", color: "#fff", fontSize: 24, cursor: "pointer", borderRadius: "50%", width: 40, height: 40, display: "flex", alignItems: "center", justifyContent: "center" }}>&times;</button>
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
              padding: "24px 32px",
              minHeight: 0,
              boxSizing: "border-box",
              overflowX: "hidden",
              wordBreak: "break-word",
              whiteSpace: "pre-line",
              maxWidth: 1200,
              margin: "0 auto",
            }}
          >
            {chat.map((msg, i) => (
              msg.from === "user" ? (
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
              ) : (
                <div key={i} style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{
                    background: "#f8f9fa",
                    color: "#333",
                    borderRadius: 14,
                    padding: "10px 16px",
                    maxWidth: 540,
                    fontSize: 15,
                    border: "1px solid #e9ecef",
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
            {/* Show success message and FestiveOutfitIdeas after finalReply and images loaded */}
            {finalReply && !loadingImages && occasions.length > 0 && (
              <>
                <div style={{ display: "flex", justifyContent: "flex-start", marginBottom: 12 }}>
                  <div style={{
                    background: "#f8f9fa",
                    color: "#333",
                    borderRadius: 14,
                    padding: "10px 16px",
                    maxWidth: 540,
                    fontSize: 15,
                    border: "1px solid #e9ecef",
                    textAlign: "left"
                  }}>Perfect! Here are your festival outfit suggestions with images:</div>
                </div>
                <div style={{ marginTop: 24 }}>
                  <FestiveOutfitIdeas occasions={occasions} />
                </div>
              </>
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
              padding: "24px 32px 32px 32px",
              background: "#fafbfc",
              borderTop: "1px solid #e9ecef",
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
