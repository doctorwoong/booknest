const isLocal = window.location.hostname === "localhost";

export const BASE_URL = isLocal
    ? "http://localhost:30022"
    : "https://airbnbnoryangjin.co.kr/api";