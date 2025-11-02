// app/demo/Greeting.tsx
"use client";

import React from "react";

// 1. Định nghĩa kiểu cho props
type GreetingProps = {
  name: string;
  isLoggedIn: boolean;
};

// 2. Sử dụng props trong component
const Greeting: React.FC<GreetingProps> = ({ name, isLoggedIn }) => {
  return (
    <div>
      {isLoggedIn ? (
        <h3>Chào mừng trở lại, {name}!</h3>
      ) : (
        <h3>Vui lòng đăng nhập.</h3>
      )}
    </div>
  );
};

export default Greeting;
