import React, { useEffect, useState } from "react";
import {useNavigate, useLocation} from "react-router-dom";
import { apiRequest } from "../Util/api"; // API 요청 함수
import "../CSS/style/ReviewDetail.css"
import {useTranslation} from "react-i18next";

function ReviewDetail() {
    const navigate = useNavigate();
    const { t } = useTranslation();

    const location = useLocation();
    const { state } = location || {};
    const { reserved_room_number, customer_id,name } = state || {}; // 전달된 데이터

    const [reviewData, setReviewData] = useState([]); // 서버에서 받아온 리뷰 데이터
    const [rating, setRating] = useState(0); // 별점 (1~5)
    const [id, setID] = useState(0); // review_id
    const [reviewText, setReviewText] = useState(""); // 리뷰 텍스트

    const [isLoading, setIsLoading] = useState(false);

    // useEffect: 컴포넌트 로드 시 실행
    useEffect(() => {
        const fetchReview = async () => {
            if (!customer_id) {
                console.error("customer_id is missing");
                return;
            }
            try {
                const response = await apiRequest(`/review/${customer_id}`, "GET");
                if (response) {
                    setReviewData(response);
                    setRating(response[0].rating || 0);
                    setID(response[0].review_id || 0);
                    setReviewText(response[0].reviewText || "");
                }
            } catch (error) {
                console.error("Failed to fetch review:", error);
            }
        };

        if (customer_id) fetchReview();
    }, [customer_id]);

    // 별점 클릭 핸들러
    const handleRatingClick = (value) => {
        setRating(value);
    };

    // 저장 버튼 클릭 핸들러
    const handleSave = async () => {
        const endpoint = id !== 0 ? "/updateReview" : "/writeReview";
        const payload = {
            customer_id,
            rating,
            reviewText,
            name,
            reserved_room_number,
            id
        };

        console.log("review_id : " + id);
        console.log("customer_id : " + customer_id);
        // eslint-disable-next-line no-restricted-globals
        const check = confirm(t("92"));
        if (!check) return;


        setIsLoading(true); // 로딩 시작
        try {
            await apiRequest(endpoint, "POST", payload);
            alert(id !== 0 ? t("93") : t("94"));
            navigate(-1); // 이전 페이지로 이동
        } catch (error) {
            console.error("Error saving review:", error);
            alert(t("95"));
        }finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    // 삭제 버튼 클릭 핸들러
    const handleDelete = async () => {
        // eslint-disable-next-line no-restricted-globals
        const check = confirm(t("96"));
        if (!check) return;

        setIsLoading(true); // 로딩 시작
        try {
            await apiRequest("/deleteReview", "POST", { id });
            alert(t("97"));
            navigate(-1);
        } catch (error) {
            console.error("Error deleting review:", error);
            alert(t("98"));
        } finally {
            setIsLoading(false); // 로딩 종료
        }
    };

    return (
        <div className="review-write" style={{overflowY: "scroll", height: "70vh"}}>
            <h2><b>{t("99")}</b></h2>
            <p style={{color: "#5A5A5A"}}>{t("100")}</p>
            <div className="review-section">
                {/* 묵었던 호수 */}
                <div className="info">
                    <div>
                        <label>{t("101")}</label><br/>
                        <b>{reserved_room_number}</b>
                    </div>
                    <div>
                        <label>{t("102")}:</label>
                        <div className="rating-stars">
                            {[1, 2, 3, 4, 5].map((star) => (
                                <span key={star} className={`star ${rating >= star ? "selected" : ""}`}
                                      onClick={() => handleRatingClick(star)}>
                                ★
                            </span>
                            ))}
                        </div>
                    </div>
                </div>

                {/* 리뷰 텍스트 */}
                <div className="review-text">
                    <label>{t("103")}</label>
                    <textarea
                        rows="9"
                        value={reviewText}
                        onChange={(e) => setReviewText(e.target.value)}
                        placeholder={t("104")}
                    ></textarea>
                </div>

                {/* 버튼 섹션 */}
                <div className="button-section">
                    <button className="btn-save" onClick={handleSave}>
                        {id !== 0 ? t("105") : t("106")}
                    </button>
                    {id !== 0 && (
                        <button className="btn-delete" onClick={handleDelete}>
                            {t("107")}
                        </button>
                    )}
                    <button className="btn-cancel" onClick={() => navigate(-1)}>
                        {t("108")}
                    </button>
                </div>
                <hr/>
                <div style={{textAlign:"right"}}>
                    <label>{t("109")} : </label><span>{reviewData[0]?.REG_DTM}</span>
                </div>
            </div>
        </div>
    );
}

export default ReviewDetail;
