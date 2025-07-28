import React from "react";
import { Swiper, SwiperSlide } from "swiper/react";
import { Navigation, Autoplay } from "swiper/modules";
import "swiper/css";
import "swiper/css/navigation";

const FestiveOutfitIdeas = ({ occasions }) => {
  return (
    <div style={{
      display: "flex",
      flexDirection: "column",
      gap: 40,
      width: "100%",
      maxWidth: 1200,
      margin: "0 auto",
      padding: 0,
      boxSizing: "border-box"
    }}>
      {occasions.map((occasion, idx) => (
        <div
          key={idx}
          style={{
            background: "#fff",
            borderRadius: 20,
            boxShadow: "0 4px 24px rgba(160, 132, 238, 0.15)",
            padding: 32,
            marginBottom: 16,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center",
            border: "1px solid rgba(160, 132, 238, 0.1)"
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 28, marginBottom: 8, color: "#7C83F7", textAlign: "center" }}>
            {occasion.day}
          </div>
          {occasion.title && (
            <div style={{ color: "#666", fontSize: 18, marginBottom: 24, textAlign: "center", fontWeight: 500, lineHeight: 1.6, maxWidth: 800 }}>
              {occasion.title}
            </div>
          )}
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation
            autoplay={{ delay: 1000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            loop={occasion.images.length > 1}
            style={{ width: "100%", borderRadius: 16 }}
            spaceBetween={32}
            slidesPerView={1}
          >
            {occasion.images.slice(0, 5).map((img, i) => (
              <SwiperSlide key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 320 }}>
                  <img
                    src={typeof img === "string" ? img : img.url}
                    alt={occasion.title || occasion.day}
                    style={{
                      width: "100%",
                      maxWidth: 500,
                      height: 300,
                      objectFit: "contain",
                      borderRadius: 12,
                      boxShadow: "0 4px 16px rgba(0,0,0,0.1)",
                      background: "#fff",
                      marginBottom: 0,
                      display: "block"
                    }}
                  />
                </div>
              </SwiperSlide>
            ))}
          </Swiper>
        </div>
      ))}
    </div>
  );
};

export default FestiveOutfitIdeas; 