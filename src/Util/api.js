const BASE_URL = "http://localhost:30021";

/**
 * API 요청 함수
 * @param {string} endpoint - API 경로
 * @param {string} method - HTTP 메서드 (GET, POST 등)
 * @param {object} [data] - 요청에 포함할 데이터 (POST, PUT 등에서 사용)
 * @returns {Promise<object>} - 서버 응답 데이터
 */
export const apiRequest = async (endpoint, method = "GET", data = null) => {
    try {
        let url = `${BASE_URL}${endpoint}`;

        // GET 요청에서 쿼리 파라미터 추가
        if (method === "GET" && data) {
            const queryParams = new URLSearchParams(data).toString();
            url += `?${queryParams}`;
        }

        const options = {
            method,
            headers: {
                "Content-Type": "application/json",
            },
        };

        // POST, PUT 등에서만 body 추가
        if (data && method !== "GET") {
            options.body = JSON.stringify(data);
        }

        const response = await fetch(url, options);

        if (!response.ok) {
            const errorText = await response.text();
            throw new Error(`Server Error: ${errorText}`);
        }

        return await response.json();
    } catch (error) {
        console.error(`Error in ${method} request to ${endpoint}:`, error);
        throw error;
    }
};
