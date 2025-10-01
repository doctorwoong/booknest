import React, { useEffect, useState } from "react";
import { useParams, useLocation } from "react-router-dom";
import { apiRequest } from "../Util/api";
import "../CSS/style/inquiry.css";
import adminLogo from "../resource/admin_noyang.png";

const InquiryDetail = () => {
    const { id } = useParams();
    const location = useLocation();
    const isAdmin = location.state?.isAdmin1231;

    const [inquiry, setInquiry] = useState(null);
    const [comments, setComments] = useState([]);
    const [commentText, setCommentText] = useState("");

    // 상세조회 + 댓글조회
    useEffect(() => {
        const fetchDetail = async () => {
            try {
                const data = await apiRequest(`/inquiry/${id}`, "GET");
                setInquiry(data.data);

                const commentData = await apiRequest(`/inquiry-comments/${id}`, "GET");
                setComments(commentData.data || []);
            } catch (e) {
                console.error("상세 불러오기 실패:", e);
            }
        };
        fetchDetail();
    }, [id]);

    // 댓글 등록
    const handleCommentSubmit = async (e) => {
        e.preventDefault();
        if (!commentText.trim()) return;

        try {
            const res = await apiRequest("/inquiry-comment-insert", "POST", {
                inquiry_id: id,
                CONTENT: commentText,
                TYPE: isAdmin,
            });

            if (res.success) {
                setComments([...comments, { CONTENT: commentText, TYPE: isAdmin }]);
                setCommentText("");
            } else {
                alert("댓글 등록 실패");
            }
        } catch (e) {
            console.error("댓글 등록 실패:", e);
        }
    };

    if (!inquiry) return <p>Loading...</p>;

    return (
        <div className="inquiry-detail">
            {/* 상세정보 카드 */}
            <div className="inquiry-card">
                <h2 className="inquiry-title">{inquiry.TITLE}</h2>
                <div className="inquiry-meta">
                    <p><b>작성자:</b> {inquiry.NAME}</p>
                    <p><b>이메일:</b> {inquiry.EMAIL}</p>
                    <p><b>전화번호:</b> {inquiry.PHONE}</p>
                    <p><b>작성일:</b> {inquiry.REG_DTM}</p>
                </div>
                <div className="inquiry-content-box">
                    <p>{inquiry.CONTENT}</p>
                </div>
            </div>

            {/* 댓글 */}
            <div className="comment-container">
                <h4 className="comment-title">댓글</h4>
                <div className="comment-list">
                    {comments.map((c, idx) => (
                        <div key={idx} className={`comment-item ${c.TYPE}`}>
                            {c.TYPE === "admin2" && (
                                <div className="comment-avatar">
                                    <span className="admin-icon"><img alt="admin Logo" src={adminLogo}
                                                                      style={{width: '23px', height: '24px'}}/></span>
                                </div>
                            )}
                            <div className="comment-content">
                                {c.TYPE === "admin2" ? (
                                    <div className="comment-author">관리자</div>
                                ) : null}
                                <div className="comment-bubble">{c.CONTENT}</div>
                            </div>
                        </div>
                    ))}
                </div>
            </div>

            {/* 댓글 작성 */}
            <form onSubmit={handleCommentSubmit} className={`comment-form ${isAdmin}`}>
                <textarea
                    placeholder="댓글을 입력하세요"
                    value={commentText}
                    onChange={(e) => setCommentText(e.target.value)}
                />
                <button
                    type="submit"
                    className={commentText.trim() ? "answer" : "answer2"}
                >
                    등록
                </button>
            </form>
        </div>
    );
};

export default InquiryDetail;
