import React, { useState } from "react";
import "./index.css";
import ClothingImageResults from "./ClothingImageResults";
import StyleAssistant from "./StyleAssistant";
import FashionTimelineBot from "./FashionTimelineBot";
import DressForFestival from "./DressForFestival";
// Season brand colors
const seasonColors = {
  Spring: "#F4B400",
  Summer: "#00B0FF",
  Autumn: "#D2691E",
  Winter: "#6A5ACD",
};

// Helper to extract HEX and name
function parseColorString(str) {
  const match = str.match(/#([A-Fa-f0-9]{6})\s*\(([^)]+)\)/);
  if (match) {
    return { hex: `#${match[1]}`, name: match[2] };
  }
  return { hex: str, name: "" };
}

// Normalize palette keys for display mapping
function normalizeKey(str) {
  if (/primary/i.test(str)) return "primary";
  if (/warm/i.test(str)) return "warm";
  if (/cool/i.test(str)) return "cool";
  if (/neutral|black/i.test(str)) return "neutral";
  return str.toLowerCase().replace(/[^a-z]/g, '');
}

// Swatches Row
const SwatchRow = ({ colors }) => {
  if (!colors || colors.length === 0) return null;
  return (
    <div className="palette-swatches" style={{ display: 'flex', flexWrap: 'wrap', gap: 35, margin: '18px 0', justifyContent: 'center', width: '100%' }}>
      {colors.map((c, i) => {
        const color = typeof c === 'string' ? parseColorString(c) : c;
        return (
          <div className="palette-swatch" key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90, marginBottom: 8 }}>
            <div className="swatch-color" style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid #e0d7fa', marginBottom: 8, boxShadow: '0 2px 8px #a084ee22', background: color.hex }} />
         <div className="swatch-label" style={{ fontSize: 15, color: '#222', fontWeight: 600, width: 200, textAlign: 'center', wordBreak: 'break-all' }}>{color.name}</div>
            <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>{color.hex}</div>
          </div>
        );
      })}
    </div>
  );
};

// Add this helper for makeup swatches
const MakeupSwatchRow = ({ makeup }) => {
  if (!makeup || makeup.length === 0) return null;
  return (
    <div className="palette-swatches" style={{ display: 'flex', flexWrap: 'wrap', gap: 35, margin: '18px 0', justifyContent: 'center', width: '100%' }}>
      {makeup.map((m, i) => (
        <div className="palette-swatch" key={i} style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: 90, marginBottom: 8 }}>
          <div className="swatch-color" style={{ width: 48, height: 48, borderRadius: 12, border: '2px solid #e0d7fa', marginBottom: 8, boxShadow: '0 2px 8px #a084ee22', background: m.hex }} />
          <div className="swatch-label" style={{ fontSize: 15, color: '#222', fontWeight: 600, textAlign: 'center', wordBreak: 'break-all' }}>{m.part}: {m.name}</div>
          <div style={{ fontSize: 13, color: '#888', textAlign: 'center' }}>{m.hex}</div>
        </div>
      ))}
    </div>
  );
};

// Section Card
const SectionCard = ({ title, icon, bg, children }) => (
  <div style={{ background: bg, borderRadius: 18, boxShadow: "0 4px 32px #a084ee22", padding: "1.5rem 2rem", margin: "2rem 0" }}>
    <h3 style={{ display: "flex", alignItems: "center", fontWeight: 700, fontSize: 22, color: "#222", marginBottom: 18 }}>
      {icon && <span style={{ fontSize: 24, marginRight: 10 }}>{icon}</span>}{title}
    </h3>
    {children}
  </div>
);

// Suggestion List
const SuggestionList = ({ title, icon, items, color }) => (
  <div style={{ background: "#f6f3ff", borderRadius: 12, padding: 18, margin: 12, flex: 1, minWidth: 220 }}>
    <h4 style={{ color, fontWeight: 700, fontSize: 18, marginBottom: 10, display: "flex", alignItems: "center" }}>{icon && <span style={{ fontSize: 18, marginRight: 8 }}>{icon}</span>}{title}</h4>
    <ul style={{ listStyle: "none", padding: 0, margin: 0, color: "#555", fontSize: 15 }}>
      {items.map((item, idx) => <li key={idx} style={{ marginBottom: 6 }}>{item}</li>)}
    </ul>
  </div>
);

// -----------------
// 🧠 Parser Function
// -----------------
// Helper to parse "- #HEX (Name)" into {hex, name}
function parsePaletteArray(arr) {
  if (!Array.isArray(arr)) return [];
  return arr.map(str => {
    const match = str.match(/#([A-Fa-f0-9]{6})\s*\(([^)]+)\)/);
    if (match) return { hex: `#${match[1]}`, name: match[2] };
    return { hex: str, name: "" };
  });
}

function parseFormattedResponse(response) {
  let data = {
    season: "",
    why: [],
    palettes: {},
    clothing: [],
    makeup: [],
  };

  try {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    data.season = parsed.season || "";
    data.why = parsed.why ? [parsed.why] : [];
    const palettes = parsed.palettes || {};
    data.palettes = {
      primary: parsePaletteArray(palettes["Primary and Secondary Colors"]),
      warm: parsePaletteArray(palettes["Warm Tones"]),
      cool: parsePaletteArray(palettes["Cool Tones"]),
      neutral: parsePaletteArray(palettes["Neutral or Black Tones"]),
    };
    data.clothing = parsePaletteArray(parsed.clothing);
    data.makeup = Array.isArray(parsed.makeup) ? parsed.makeup : [];
    return data;
  } catch (e) {
    return data;
  }
}

// Helper to safely parse LLM response (strip markdown code block if present)
function safeParseLLMResponse(llm_response) {
  if (typeof llm_response !== 'string') return llm_response;
  let cleaned = llm_response.trim();
  if (cleaned.startsWith('```')) {
    cleaned = cleaned.replace(/^```[a-zA-Z]*\n?/, '').replace(/```$/, '').trim();
  }
  try {
    return JSON.parse(cleaned);
  } catch (e) {
    return llm_response;
  }
}


// -------------------------
// 🎨 AI Response Display UI
// -------------------------
const AIResponseDisplay = ({ response }) => {
  // Always parse the response safely before using
  const parsedResponse = safeParseLLMResponse(response);
  const {
    season, description, palettes, clothing, makeup,
    clothing_suggestions, makeup_suggestions, why
  } = parseFormattedResponse(parsedResponse);

  const seasonColor = seasonColors[season] || "#7b7be5";
  const hasContent = season || why.length || Object.values(palettes).some(p => p && p.length > 0) || clothing.length || Object.keys(makeup).length;
  const [showStyleAssistant, setShowStyleAssistant] = useState(false);
  const [showFashionTimeline, setShowFashionTimeline] = useState(false);
  const [showDressForFestival, setShowDressForFestival] = useState(false);

  // Extract season and palette colors from response
  let paletteColors = [];
  try {
    const parsed = typeof response === 'string' ? JSON.parse(response) : response;
    if (parsed.palettes) {
      paletteColors = Object.values(parsed.palettes).flat().map(c => typeof c === 'string' ? c : c.name || c.hex || "");
    }
  } catch {}

  return (
    <div className="palette-container" style={{ padding: "3rem", fontFamily: "Inter, sans-serif", position: "relative" }}>
      {/* Floating Chat Bubble */}
      <div style={{
        position: "fixed",
        bottom: "32px",
        right: "32px",
        display: "flex",
        flexDirection: "column",
        alignItems: "center",
        gap: "8px",
        zIndex: 100
      }}>
        {/* Floating Text */}
        <div style={{
          background: "rgba(255, 255, 255, 0.95)",
          color: "#7b7be5",
          padding: "8px 16px",
          borderRadius: "20px",
          fontSize: "14px",
          fontWeight: "600",
          boxShadow: "0 2px 12px rgba(123, 123, 229, 0.2)",
          whiteSpace: "nowrap",
          backdropFilter: "blur(8px)",
          border: "1px solid rgba(160, 132, 238, 0.2)"
        }}>
          What to wear today?
        </div>
        {/* Chat Button */}
        <button 
          onClick={() => setShowStyleAssistant(true)}
          className="floating-chat-bubble"
          style={{
            width: "72px",
            height: "72px",
            borderRadius: "50%",
            background: "linear-gradient(135deg, #a084ee 0%, #7b7be5 100%)",
            color: "#fff",
            border: "3px solid #fff",
            boxShadow: "0 6px 32px rgba(123, 123, 229, 0.4)",
            cursor: "pointer",
            fontSize: "28px",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            transition: "all 0.2s, transform 0.18s cubic-bezier(0.4,0,0.2,1)",
            zIndex: 100
          }}
          onMouseEnter={(e) => {
            e.target.style.transform = "scale(1.1)";
            e.target.style.boxShadow = "0 8px 40px rgba(123, 123, 229, 0.5)";
          }}
          onMouseLeave={(e) => {
            e.target.style.transform = "scale(1)";
            e.target.style.boxShadow = "0 6px 32px rgba(123, 123, 229, 0.4)";
          }}
          aria-label="What to wear today?"
        >
          🤔
        </button>
      </div>

      {hasContent ? <>
        {/* Season Header */}
        <div style={{ textAlign: "center", marginBottom: 32 }}>
          <div style={{ display: "inline-block", background: seasonColor + "22", color: seasonColor, borderRadius: 20, padding: "6px 22px", fontWeight: 700, fontSize: 40, marginBottom: 10 }}>
            {season ? `${season} Season` : "Season"}
          </div>
           {/* Why this Season */}
         {why.length > 0 && (
          <div
          style={{
            background: "linear-gradient(90deg, #f6f3ff 0%, #e0d7fa 100%)",
            borderRadius: 18,
            boxShadow: "0 4px 24px #a084ee22",
            padding: "2rem 2.5rem",
            margin: "2.5rem 0",
            textAlign: "center",
            position: "relative"
          }}
        >
          <div style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 12,
            marginBottom: 18
          }}>
            
            <span style={{
              fontWeight: 900,
              fontSize: 26,
              color: "#7b7be5",
              letterSpacing: "0.5px"
            }}>
              Why this season?
            </span>
          </div>
          <div style={{
            borderTop: "1.5px solid #e0d7fa",
            width: 60,
            margin: "0 auto 18px auto"
          }} />
          {why.map((line, idx) => (
            <div key={idx} style={{
              fontSize: 18,
              color: "#444",
              marginBottom: 8,
              fontWeight: 500,
              lineHeight: 1.6
            }}>
              {line}
            </div>
          ))}
        </div>
        )}
          <h2 style={{ fontSize: 32, fontWeight: 900, color: "#222", margin: "10px 0 0 0" }}>Your Palette</h2>
          <div style={{ color: "#888", fontSize: 17 }}>Bold shades for your bold personality.</div>
        </div>

        {/* Palette Sections */}
        {palettes.primary?.length > 0 && (
          <SectionCard title="Primary Colors" icon={<span style={{ color: '#3b82f6' }}>●</span>} bg="#fff">
            <SwatchRow colors={palettes.primary} />
          </SectionCard>
        )}
        {palettes.warm?.length > 0 && (
          <SectionCard title="Warm Tones" icon="🌞" bg="#fff5e6">
            <SwatchRow colors={palettes.warm} />
          </SectionCard>
        )}
        {palettes.cool?.length > 0 && (
          <SectionCard title="Cool Tones" icon="❄️" bg="#e6f0ff">
            <SwatchRow colors={palettes.cool} />
          </SectionCard>
        )}
        {palettes.neutral?.length > 0 && (
          <SectionCard title="Neutral & Black Tones" icon="◑" bg="#f7fafd">
            <SwatchRow colors={palettes.neutral} />
          </SectionCard>
        )}

       

        {clothing.length > 0 && (
          <SectionCard title="More Colors" icon="🎨" bg="#f6f3ff">
            <SwatchRow colors={clothing} />
          </SectionCard>
        )}

        {makeup.length > 0 && (
          <SectionCard title="Colors to go with your Makeup palette" icon="💄" bg="#f6f3ff">
            <MakeupSwatchRow makeup={makeup} />
          </SectionCard>
        )}
        
      </> : (
        <div style={{
          color: '#888',
          background: '#f8f8fa',
          padding: 24,
          borderRadius: 12,
          textAlign: 'center'
        }}>
          No recommendations available. Please try again.
        </div>
      )}
      {showStyleAssistant && (
        <StyleAssistant
          onClose={() => setShowStyleAssistant(false)}
          season={season}
          palette={paletteColors}
        />
      )}
      {showFashionTimeline && (
        <FashionTimelineBot
          onClose={() => {
            console.log('Closing Fashion Timeline');
            setShowFashionTimeline(false);
          }}
        />
      )}
      {showDressForFestival && (
        <DressForFestival
          onClose={() => {
            console.log('Closing Festival Dress');
            setShowDressForFestival(false);
          }}
        />
      )}

      {/* Advertisement Section */}
      <div style={{
        background: "#fff",
        borderRadius: "12px",
        padding: "24px",
        marginTop: "32px",
        border: "1px solid #e9ecef",
        textAlign: "center"
      }}>
        <div style={{
          color: "#6c757d",
          fontSize: "14px",
          fontWeight: "600",
          marginBottom: "16px",
          textTransform: "uppercase",
          letterSpacing: "1px"
        }}>
          Advertisement
        </div>
        <div style={{
          background: "#f8f9fa",
          borderRadius: "8px",
          padding: "20px",
          border: "2px dashed #dee2e6",
          position: "relative",
          overflow: "hidden",
          height: "90px",
          display: "flex",
          alignItems: "center",
          justifyContent: "center"
        }}>
          {/* Single Ad Card Container */}
          <div style={{
            position: "relative",
            width: "100%",
            height: "100%",
            display: "flex",
            alignItems: "center",
            justifyContent: "center"
          }}>
            {/* Fashion Timeline Ad */}
            <div
              id="fashion-timeline-ad"
              onClick={() => {
                console.log('Fashion Timeline Ad clicked');
                setShowFashionTimeline(true);
              }}
              style={{
                background: "linear-gradient(135deg, #a084ee 0%, #7C83F7 100%)",
                borderRadius: "12px",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(160, 132, 238, 0.4)",
                border: "3px solid #fff",
                width: "90%",
                maxWidth: "600px",
                height: "70px",
                transition: "all 0.3s ease",
                animation: "fadeInOut 3s linear infinite",
                position: "absolute",
                opacity: 0,
                zIndex: 1
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow = "0 8px 25px rgba(160, 132, 238, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 6px 20px rgba(160, 132, 238, 0.4)";
              }}
            >
              <span style={{ fontSize: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🗼</span>
              <div>
                <div style={{ 
                  color: "#fff", 
                  fontWeight: "800", 
                  fontSize: "20px",
                  letterSpacing: "0.5px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  marginBottom: "4px"
                }}>
                  Get Your Fashion Timeline
                </div>
                <div style={{ 
                  color: "rgba(255,255,255,0.95)", 
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  Personalized outfit suggestions
                </div>
              </div>
            </div>

            {/* Festival Dress Ad */}
            <div
              id="festival-dress-ad"
              onClick={() => {
                console.log('Festival Dress Ad clicked');
                setShowDressForFestival(true);
              }}
              style={{
                background: "linear-gradient(135deg, #ff6b6b 0%, #ff8e53 100%)",
                borderRadius: "12px",
                padding: "20px 32px",
                display: "flex",
                alignItems: "center",
                gap: "16px",
                cursor: "pointer",
                boxShadow: "0 6px 20px rgba(255, 107, 107, 0.4)",
                border: "3px solid #fff",
                width: "90%",
                maxWidth: "600px",
                height: "70px",
                transition: "all 0.3s ease",
                animation: "fadeInOut 3s linear infinite 1.5s",
                position: "absolute",
                opacity: 0,
                zIndex: 2
              }}
              onMouseEnter={(e) => {
                e.target.style.transform = "translateY(-3px) scale(1.02)";
                e.target.style.boxShadow = "0 8px 25px rgba(255, 107, 107, 0.5)";
              }}
              onMouseLeave={(e) => {
                e.target.style.transform = "translateY(0) scale(1)";
                e.target.style.boxShadow = "0 6px 20px rgba(255, 107, 107, 0.4)";
              }}
            >
              <span style={{ fontSize: "32px", filter: "drop-shadow(0 2px 4px rgba(0,0,0,0.3))" }}>🎉</span>
              <div>
                <div style={{ 
                  color: "#fff", 
                  fontWeight: "800", 
                  fontSize: "20px",
                  letterSpacing: "0.5px",
                  textShadow: "0 2px 4px rgba(0,0,0,0.3)",
                  marginBottom: "4px"
                }}>
                  Dress for Festival
                </div>
                <div style={{ 
                  color: "rgba(255,255,255,0.95)", 
                  fontSize: "14px",
                  fontWeight: "600"
                }}>
                  Stand out with festival-ready outfits
                </div>
              </div>
            </div>
          </div>
        </div>
        <div style={{
          color: "#6c757d",
          fontSize: "12px",
          marginTop: "16px",
          fontStyle: "italic"
        }}>
          Sponsored content helps keep ColorCraft free for everyone
        </div>

        {/* CSS Animation for Carousel */}
        <style>
          {`
                          @keyframes fadeInOut {
                0%, 45% { opacity: 1; z-index: 10; }
                50%, 95% { opacity: 0; z-index: 1; }
                100% { opacity: 1; z-index: 10; }
              }
          `}
        </style>
      </div>
    </div>
  );
};

export default AIResponseDisplay;