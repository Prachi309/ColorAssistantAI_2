import React, { useState, useEffect, useRef } from "react";
import ClothingImageResults from "./ClothingImageResults";

const FestivalOutfitSlider = ({ dayOutfits }) => {
  const [current, setCurrent] = useState(0);
  const intervalRef = useRef(null);
  const [paused, setPaused] = useState(false);
  if (!dayOutfits || dayOutfits.length === 0) return null;

  const goTo = (idx) => {
    if (idx < 0) idx = dayOutfits.length - 1;
    if (idx >= dayOutfits.length) idx = 0;
    setCurrent(idx);
  };

  // Auto-advance logic with random interval between 1 and 2 seconds
  useEffect(() => {
    if (paused) return;
    function setRandomInterval() {
      clearInterval(intervalRef.current);
      const randomMs = 1000 + Math.floor(Math.random() * 1000); // 1000-2000ms
      intervalRef.current = setInterval(() => {
        setCurrent((prev) => (prev + 1) % dayOutfits.length);
      }, randomMs);
    }
    setRandomInterval();
    return () => clearInterval(intervalRef.current);
  }, [dayOutfits.length, paused, current]);

  // Pause on hover
  const handleMouseEnter = () => setPaused(true);
  const handleMouseLeave = () => setPaused(false);

  return (
    <div
      style={{ width: "100%", maxWidth: 520, margin: "0 auto", position: "relative", background: "#fafbfc", borderRadius: 16, boxShadow: "0 2px 12px #eee", padding: 24 }}
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      {/* Slide: Only one outfit per occasion at a time */}
      <div style={{ minHeight: 220, display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center" }}>
        <div style={{ fontWeight: 700, fontSize: 18, marginBottom: 8, color: "#7C83F7" }}>{dayOutfits[current].day}</div>
        <div style={{ color: "#444", fontSize: 15, marginBottom: 12, textAlign: "center" }}>{dayOutfits[current].outfit}</div>
        <ClothingImageResults query={dayOutfits[current].outfit} />
      </div>
      {/* Navigation */}
      <button onClick={() => goTo(current - 1)} style={{ position: "absolute", left: 8, top: "50%", transform: "translateY(-50%)", background: "#fff", border: "1.5px solid #a084ee", color: "#a084ee", borderRadius: "50%", width: 32, height: 32, fontSize: 20, cursor: "pointer", zIndex: 2 }}>&lt;</button>
      <button onClick={() => goTo(current + 1)} style={{ position: "absolute", right: 8, top: "50%", transform: "translateY(-50%)", background: "#fff", border: "1.5px solid #a084ee", color: "#a084ee", borderRadius: "50%", width: 32, height: 32, fontSize: 20, cursor: "pointer", zIndex: 2 }}>&gt;</button>
      {/* Dots */}
      <div style={{ display: "flex", justifyContent: "center", gap: 8, marginTop: 18 }}>
        {dayOutfits.map((_, idx) => (
          <span
            key={idx}
            onClick={() => goTo(idx)}
            style={{
              display: "inline-block",
              width: 10,
              height: 10,
              borderRadius: "50%",
              background: idx === current ? "#a084ee" : "#ddd",
              cursor: "pointer"
            }}
          />
        ))}
      </div>
    </div>
  );
};

export default FestivalOutfitSlider; 