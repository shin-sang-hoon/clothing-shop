import { useEffect, useState } from "react";

/**
 * App
 * - React ↔ Spring 연결 테스트 화면
 * - Vite proxy 설정이 되어 있으면 /api/ping이 자동으로 8080으로 프록시된다.
 */
export default function App() {
  const [msg, setMsg] = useState<string>("loading...");

  useEffect(() => {
    fetch("/api/ping")
      .then(async (res) => {
        if (!res.ok) throw new Error(`HTTP ${res.status}`);
        return res.text();
      })
      .then((text) => setMsg(text))
      .catch((err) => {
        console.error(err);
        setMsg("API 호출 실패 - 백엔드 /api/ping 및 프록시 설정 확인");
      });
  }, []);

  return (
    <div style={{ padding: 24 }}>
      <h1>React + Spring Boot 연결 테스트</h1>
      <p>결과: {msg}</p>
    </div>
  );
}
