import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import '../CSS/style/style.css';
import {apiRequest} from "../Util/api";
import {useTranslation} from "react-i18next";

const Review = () => {
    const location = useLocation();
    const { state } = location || {};
    const { room_number } = state || {}; // 전달된 데이터
    const { t } = useTranslation();

    const [reviews, setReviews] = useState([]); // 리뷰 데이터 상태 관리

    // API 호출 함수
    const fetchReviews = async (roomNumber) => {
        try {
            const response = await apiRequest(`/api/reviews/${roomNumber}`, "GET");
            setReviews(response);

        } catch (err) {
            console.error("Failed to fetch reviews:", err);
        }
    };

    // 컴포넌트가 로드될 때 방 번호로 리뷰 데이터 가져오기
    useEffect(() => {
        if (room_number) {
            fetchReviews(room_number);
        }
    }, [room_number]);

    return (
        <>
            <br/><br/>
            <h3>{room_number}{t("89")}</h3>
            <p style={{color: "#5A5A5A"}}>{t("90")}</p>
            <div style={{overflowY: "hidden", height: "65vh"}}>
                <div className="container-review" style={{height: "100%", overflow: "auto"}}>
                    <ul className="list-group">
                        {reviews.map((review) => (
                            <li key={review.review_id}
                                style={{height: "auto", borderBottom: "1px solid #222", padding: "0 1px"}}>
                                <div style={{display: "flex", marginTop: "3vh", marginBottom: "1vh"}}>
                                    <img alt="Teamtoys Logo" style={{width: "50px", height: "50px"}}/>
                                    <div style={{marginLeft: "1vh"}}>
                                        <b className="mb-1"
                                           style={{fontSize: "20px"}}>{review.customer_name || t("91")}</b>
                                        <p className="mb-1"><span id="stars">★</span> {review.rating}</p>
                                    </div>
                                    <br/>
                                </div>
                                <p>{review.review_text}</p>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default Review;
