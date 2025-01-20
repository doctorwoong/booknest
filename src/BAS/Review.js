import React, { useState, useEffect } from "react";
import { useLocation } from "react-router-dom";
import '../CSS/style/style.css';
import {apiRequest} from "../Util/api";
import pro from '../../src/resource/profil.jpeg';

const Review = () => {
    const location = useLocation();
    const { state } = location || {};
    const { room_number } = state || {}; // 전달된 데이터

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
            <h3>{room_number}호 리뷰</h3>
            <div style={{ overflowY: "scroll", height: "65vh" }}>
                <div className="container" style={{ height: "100%", overflow: "auto" }}>
                    <ul className="list-group">
                        {reviews.map((review) => (
                            <li key={review.review_id} className="list-group-item d-flex align-items-center">
                                <div style={{paddingRight:"10px"}}>
                                    <img src={pro} alt="Teamtoys Logo" style={{width: "100px", height: "100px"}}/>
                                </div>
                                <div>
                                    <p className="mb-1">작성자: {review.customer_name || "익명"}</p>
                                    <p className="mb-1">★ {review.rating}</p>
                                    <p className="mb-1">내용: {review.review_text}</p>
                                </div>
                            </li>
                        ))}
                    </ul>
                </div>
            </div>
        </>
    );
};

export default Review;
