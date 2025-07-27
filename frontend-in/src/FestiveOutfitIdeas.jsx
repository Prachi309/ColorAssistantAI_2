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
      gap: 32,
      width: "100%",
      maxWidth: 700,
      margin: "0 auto",
      padding: 24,
      boxSizing: "border-box"
    }}>
      {occasions.map((occasion, idx) => (
        <div
          key={idx}
          style={{
            background: "#fff",
            borderRadius: 16,
            boxShadow: "0 2px 16px #e0e0f7",
            padding: 24,
            marginBottom: 8,
            minWidth: 0,
            display: "flex",
            flexDirection: "column",
            alignItems: "center"
          }}
        >
          <div style={{ fontWeight: 800, fontSize: 24, marginBottom: 6, color: "#7C83F7", textAlign: "center" }}>
            {occasion.day}
          </div>
          {occasion.title && (
            <div style={{ color: "#666", fontSize: 16, marginBottom: 18, textAlign: "center", fontWeight: 500 }}>
              {occasion.title}
            </div>
          )}
          <Swiper
            modules={[Navigation, Autoplay]}
            navigation
            autoplay={{ delay: 1000, disableOnInteraction: false, pauseOnMouseEnter: true }}
            loop={occasion.images.length > 1}
            style={{ width: "100%", borderRadius: 12 }}
            spaceBetween={24}
            slidesPerView={1}
          >
            {occasion.images.slice(0, 5).map((img, i) => (
              <SwiperSlide key={i}>
                <div style={{ display: "flex", flexDirection: "column", alignItems: "center", justifyContent: "center", minHeight: 240 }}>
                  <img
                    src={typeof img === "string" ? img : img.url}
                    alt={occasion.title || occasion.day}
                    style={{
                      width: "100%",
                      maxWidth: 340,
                      height: 220,
                      objectFit: "contain",
                      borderRadius: 10,
                      boxShadow: "0 2px 8px #eee",
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