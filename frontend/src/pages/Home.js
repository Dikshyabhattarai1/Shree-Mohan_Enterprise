import React from "react";
import SportsItems from "./SportsItems";
import "./Home.css";

function Home() {
  return (
    <div className="home-container">
      <h1 className="home-title">Welcome to Sports Store</h1>
      
      {/* Sports Items Grid */}
      <SportsItems />
    </div>
  );
}

export default Home;
