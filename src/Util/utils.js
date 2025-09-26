export function formatDateToYYYYMMDD(date) {
    const year = date.getFullYear();
    const month = String(date.getMonth() + 1).padStart(2, '0'); // 1월은 0부터 시작하므로 +1
    const day = String(date.getDate()).padStart(2, '0');
    return `${year}${month}${day}`;
}

// 날짜 형식을 YYYY-MM-DD로 변환하는 함수
export function formatDate(dateString) {
    if (!dateString) return ""; // 값이 없을 경우 빈 문자열 반환
    return `${dateString.slice(0, 4)}-${dateString.slice(4, 6)}-${dateString.slice(6, 8)}`;
}

export const isWithinAWeek = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    const diffTime = Math.abs(today - targetDate);
    return diffTime <= 7 * 24 * 60 * 60 * 1000; // 7일 이내
};

export const isWithinAWeek2 = (dateString) => {
    const today = new Date();
    const targetDate = new Date(dateString);
    today.setHours(0, 0, 0, 0);
    const twoDaysAfterToday = new Date(today);
    twoDaysAfterToday.setDate(today.getDate() + 2);

    return targetDate >= today && targetDate <= twoDaysAfterToday;
};

export const delay = (ms) => new Promise(resolve => setTimeout(resolve, ms));

// 국가번호 +82 일때, 0 제거하여 +8210XXXX 형태로 변경
export function normalizePhone(countryCode, phone) {
    const onlyDigits = phone.replace(/[^0-9]/g, "");
    if (countryCode === "+82" && onlyDigits.startsWith("0")) {
        return "+82" + onlyDigits.slice(1);
    }
    return countryCode + onlyDigits;
}
