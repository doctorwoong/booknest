import {useLocation} from "react-router-dom";
import '../CSS/style/style.css'

const reviewInfo = [
    {seq:1 ,id : "Patrick", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:1 ,id : "Dorottya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:1 ,id : "Dorottya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:1 ,id : "Dorottya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:1 ,id : "Dorottya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:1 ,id : "Dorottya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:2 ,id : "Tommy", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:2 ,id : "Gage", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:2 ,id : "Tara", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:3 ,id : "Jesus", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:3 ,id : "Nancy", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:3 ,id : "Edwin", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:3 ,id : "Liza", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:3 ,id : "Devin", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:4 ,id : "Tina", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:4 ,id : "Ariadna", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:4 ,id : "Maria", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:5 ,id : "Laura", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:5 ,id : "Scott", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:5 ,id : "Samantha", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:6 ,id : "Roger", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:6 ,id : "Ua", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:6 ,id : "Holly", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:7 ,id : "Kennedy", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:7 ,id : "Jesus", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:7 ,id : "Karen", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:8 ,id : "Zhixuan", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:8 ,id : "Jon", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:8 ,id : "Karen", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:8 ,id : "Sally", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:9 ,id : "Olivia", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:9 ,id : "Yuvia", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:9 ,id : "Sabrina", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:9 ,id : "Supriya", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:10 ,id : "Krista", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:10 ,id : "Tim", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:10 ,id : "Alyssa", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:10 ,id : "Philip", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:10 ,id : "Elizabeth", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:11 ,id : "Mikko", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:11 ,id : "Kristen", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:11 ,id : "Johnathan", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
    {seq:11 ,id : "Dustin", clean : 4 , accur :5 , checkin :3 , comm :4 , loc : 5 , value :3 , reg_dtm:"2024-09-12", },
]

const Review = () =>{

    const location = useLocation();
    const { state } = location || {};
    const { title, content, img , seq} = state || {}; // 전달된 데이터

    // seq에 맞는 리뷰 필터링
    const filteredReviews = reviewInfo.filter(review => review.seq === seq);

    return (
        <>
            <h2 className="mt-4 mb-3">{title}</h2>
            <div>
                <h3 className="mb-4">리뷰 목록</h3>
                {filteredReviews.length > 0 ? (
                    <div className="row">
                        {filteredReviews.map((review, index) => (
                            <div className="col-12 col-md-6 col-lg-4 mb-4" key={index}>
                                <div className="card shadow-sm h-100">
                                    <div className="card-body">
                                        <h5 className="card-title text-primary">{review.id}</h5>
                                        <hr/>
                                        <p>
                                            <strong>청결도:</strong>
                                            {"★".repeat(review.clean)}
                                            {"☆".repeat(5 - review.clean)}
                                        </p>
                                        <p>
                                            <strong>정확도:</strong>
                                            {"★".repeat(review.accur)}
                                            {"☆".repeat(5 - review.accur)}
                                        </p>
                                        <p>
                                            <strong>체크인:</strong>
                                            {"★".repeat(review.checkin)}
                                            {"☆".repeat(5 - review.checkin)}
                                        </p>
                                        <p>
                                            <strong>의사소통:</strong>
                                            {"★".repeat(review.comm)}
                                            {"☆".repeat(5 - review.comm)}
                                        </p>
                                        <p>
                                            <strong>위치:</strong>
                                            {"★".repeat(review.loc)}
                                            {"☆".repeat(5 - review.loc)}
                                        </p>
                                        <p>
                                            <strong>가격 대비 만족도:</strong>
                                            {"★".repeat(review.value)}
                                            {"☆".repeat(5 - review.value)}
                                        </p>
                                        <hr/>
                                        <p className="text-muted"><small>작성일: {review.reg_dtm}</small></p>
                                    </div>
                                </div>
                            </div>
                        ))}
                    </div>
                ) : (
                    <div className="alert alert-warning">
                        해당 숙소에 대한 리뷰가 없습니다.
                    </div>
                )}
            </div>
        </>
    );
}

export default Review