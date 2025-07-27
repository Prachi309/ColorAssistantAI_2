import React, { useState } from "react";

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
  return `
Create a detailed fashion timeline for a ${answers.duration}-day trip to ${answers.location}.

User Details:
- Gender: ${answers.gender}
- Body Type: ${answers.body_type}
- Destination: ${answers.location}
- Duration: ${answers.duration} days

Please provide:
1. Weather-appropriate clothing suggestions for each day
2. Mix and match options for different occasions
3. Packing tips and essentials
4. Style recommendations based on the destination and weather

Format your response as a detailed timeline with:
- Day-by-day outfit suggestions
- Weather considerations
- Occasion-appropriate styling
- Packing recommendations
Dont use hexcodes just the color names.
Keep the response comprehensive but well-structured for easy reading.
`;
};

const FashionTimelineBot = ({ onClose }) => {
  const [chat, setChat] = useState([
    { from: "bot", text: steps[0].bot }
  ]);
  const [step, setStep] = useState(0);
  const [answers, setAnswers] = useState({});
  const [typing, setTyping] = useState(false);
  const [finalReply, setFinalReply] = useState(null);
  const [textInput, setTextInput] = useState("");
  const [numberInput, setNumberInput] = useState("");

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
    
    setChat(prev => [...prev, { from: "user", text: `${numberInput} days` }]);
    setTyping(true);
    await sleep(700);
    setTyping(false);
    
    setAnswers(prev => ({ ...prev, [steps[step].key]: parseInt(numberInput) }));
    setNumberInput("");
    
    // This is the last step, so generate the timeline
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
        const suggestion = data.choices?.[0]?.message?.content || "No timeline received.";
        setFinalReply(suggestion);
        setChat(prev => [...prev, { from: "bot", text: suggestion }]);
      } catch {
        setFinalReply("Sorry, something went wrong. Please try again later.");
        setChat(prev => [...prev, { from: "bot", text: "Sorry, something went wrong. Please try again later." }]);
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
              <div style={{ fontWeight: 700, fontSize: 20 }}>Fashion Timeline Bot</div>
              <div style={{ fontSize: 13, opacity: 0.9 }}>Get Your Personalized Fashion Timeline</div>
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
              <div key={i} style={{ display: "flex", justifyContent: msg.from === "user" ? "flex-end" : "flex-start", marginBottom: 12 }}>
                <div style={{
                  background: msg.from === "user" ? "#a084ee" : "#fff",
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
          </div>
          
          {/* Input area */}
          {!finalReply && (
            <div style={{
              padding: "16px 24px 24px 24px",
              background: "#fafbfc",
              borderBottomLeftRadius: 18,
              borderBottomRightRadius: 18,
            }}>
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
            </div>
          )}
        </div>
      </div>
    </div>
  );
};

export default FashionTimelineBot;