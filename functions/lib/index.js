"use strict";
var __createBinding = (this && this.__createBinding) || (Object.create ? (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    var desc = Object.getOwnPropertyDescriptor(m, k);
    if (!desc || ("get" in desc ? !m.__esModule : desc.writable || desc.configurable)) {
      desc = { enumerable: true, get: function() { return m[k]; } };
    }
    Object.defineProperty(o, k2, desc);
}) : (function(o, m, k, k2) {
    if (k2 === undefined) k2 = k;
    o[k2] = m[k];
}));
var __setModuleDefault = (this && this.__setModuleDefault) || (Object.create ? (function(o, v) {
    Object.defineProperty(o, "default", { enumerable: true, value: v });
}) : function(o, v) {
    o["default"] = v;
});
var __importStar = (this && this.__importStar) || (function () {
    var ownKeys = function(o) {
        ownKeys = Object.getOwnPropertyNames || function (o) {
            var ar = [];
            for (var k in o) if (Object.prototype.hasOwnProperty.call(o, k)) ar[ar.length] = k;
            return ar;
        };
        return ownKeys(o);
    };
    return function (mod) {
        if (mod && mod.__esModule) return mod;
        var result = {};
        if (mod != null) for (var k = ownKeys(mod), i = 0; i < k.length; i++) if (k[i] !== "default") __createBinding(result, mod, k[i]);
        __setModuleDefault(result, mod);
        return result;
    };
})();
Object.defineProperty(exports, "__esModule", { value: true });
exports.checkScheduledEmails = exports.deletePrayerRequest = exports.getPrayerRequests = exports.getNewsletterHistory = exports.deleteScheduledNewsletter = exports.getScheduledNewsletters = exports.createScheduledNewsletter = exports.deleteSubscriber = exports.getSubscribersList = exports.sendMassNewsletter = exports.onNewSubscriber = void 0;
const firestore_1 = require("firebase-functions/v2/firestore");
const scheduler_1 = require("firebase-functions/v2/scheduler");
const admin = __importStar(require("firebase-admin"));
const nodemailer = __importStar(require("nodemailer"));
admin.initializeApp();
// 환경변수에서 메일 인증 정보 가져오기 (.env 파일)
const GMAIL_USER = process.env.GMAIL_USER || "";
const GMAIL_PASS = process.env.GMAIL_PASS || "";
// Nodemailer 트랜스포터 설정
const transporter = nodemailer.createTransport({
    service: "gmail",
    auth: {
        user: GMAIL_USER,
        pass: GMAIL_PASS,
    },
});
/**
 * 누군가 뉴스레터를 구독하면(Firestore에 문서 생성) 자동으로 실행되는 함수
 * 1. 구독자에게 환영 메일 발송
 * 2. 관리자에게 알림 메일 발송
 */
exports.onNewSubscriber = (0, firestore_1.onDocumentCreated)("newsletter_subscribers/{docId}", async (event) => {
    const snap = event.data;
    if (!snap)
        return;
    const data = snap.data();
    const subscriberEmail = data.email;
    if (!subscriberEmail)
        return;
    try {
        // 1. 구독자에게 보내는 환영 메일
        const welcomeMailOptions = {
            from: `"말씀의지혜" <${GMAIL_USER}>`,
            to: subscriberEmail,
            subject: "말씀의지혜 뉴스레터 구독을 환영합니다! 🎉",
            html: `
          <div style="font-family: sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #4A5568;">구독해 주셔서 감사합니다!</h2>
            <p>안녕하세요,</p>
            <p><strong>말씀의지혜</strong> 뉴스레터를 구독해 주셔서 진심으로 감사드립니다.</p>
            <p>앞으로 새롭게 올라오는 묵상 영상과 다양한 콘텐츠 소식을 가장 먼저 전해드릴 예정입니다.</p>
            <br/>
            <p>풍성한 은혜와 지혜가 가득한 하루 되시기를 바랍니다.</p>
            <p>감사합니다.</p>
            <p style="color: #A0AEC0; font-size: 12px; margin-top: 40px;">- 말씀의지혜 팀 드림 -</p>
          </div>
        `,
        };
        // 2. 관리자에게 보내는 알림 메일
        const adminMailOptions = {
            from: `"말씀의지혜 알림봇" <${GMAIL_USER}>`,
            to: GMAIL_USER, // 관리자 본인에게 전송
            subject: `[알림] 새로운 구독자가 등록되었습니다: ${subscriberEmail}`,
            html: `
          <div style="font-family: sans-serif; border: 1px solid #E2E8F0; padding: 20px; border-radius: 8px;">
            <h3 style="color: #2B6CB0; margin-top: 0;">새로운 뉴스레터 구독자 🎉</h3>
            <p>새로운 분이 말씀의지혜 뉴스레터를 구독했습니다!</p>
            <p><strong>이메일 주소:</strong> ${subscriberEmail}</p>
            <p style="color: #718096; font-size: 13px;">(이 메일은 시스템에서 자동으로 발송되었습니다.)</p>
          </div>
        `,
        };
        // 메일 발송 실행 (Promise.all로 병렬 처리)
        await Promise.all([
            transporter.sendMail(welcomeMailOptions),
            transporter.sendMail(adminMailOptions),
        ]);
        console.log(`[Success] 메일 발송 완료: ${subscriberEmail}`);
    }
    catch (error) {
        console.error("[Error] 메일 발송 실패:", error);
    }
});
const https_1 = require("firebase-functions/v2/https");
/**
 * 전체 구독자에게 뉴스레터를 일괄 발송하는 함수
 */
exports.sendMassNewsletter = (0, https_1.onCall)(async (request) => {
    const { password, subject, htmlContent } = request.data;
    // 1. 간단한 비밀번호 확인 (프론트엔드와 일치해야 함)
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    if (!subject || !htmlContent) {
        throw new https_1.HttpsError("invalid-argument", "제목과 본문 내용이 필요합니다.");
    }
    try {
        // 2. Firestore에서 모든 구독자 이메일 가져오기
        const subscribersSnap = await admin.firestore().collection("newsletter_subscribers").get();
        if (subscribersSnap.empty) {
            return { success: true, message: "구독자가 없습니다.", count: 0 };
        }
        const emails = [];
        subscribersSnap.forEach((doc) => {
            const email = doc.data().email;
            if (email)
                emails.push(email);
        });
        // 3. 발송 성공/실패 카운트
        let successCount = 0;
        let failCount = 0;
        // 4. 모든 구독자에게 메일 발송 (BCC로 한 번에 보내거나 개별로 보냄)
        // 개별 발송이 스팸 처리를 방지하는 데 더 유리하므로 개별 발송(병렬 처리) 적용
        const sendPromises = emails.map(async (email) => {
            const mailOptions = {
                from: `"말씀의지혜" <${GMAIL_USER}>`,
                to: email,
                subject: subject,
                html: htmlContent,
            };
            try {
                await transporter.sendMail(mailOptions);
                successCount++;
            }
            catch (err) {
                console.error(`Failed to send to ${email}:`, err);
                failCount++;
            }
        });
        await Promise.all(sendPromises);
        // 발송 이력(history)에 기록 저장
        await admin.firestore().collection("newsletter_history").add({
            subject: subject,
            sentAt: admin.firestore.FieldValue.serverTimestamp(),
            recipientCount: successCount,
            success: true
        });
        return {
            success: true,
            message: `총 ${emails.length}명 중 ${successCount}명에게 발송 성공, ${failCount}명 실패`,
            count: successCount
        };
    }
    catch (error) {
        console.error("Mass email sending error:", error);
        throw new https_1.HttpsError("internal", "메일 발송 중 서버 에러가 발생했습니다.");
    }
});
/**
 * 구독자 리스트 조회 함수 (어드민용)
 */
exports.getSubscribersList = (0, https_1.onCall)(async (request) => {
    const { password } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    try {
        const subscribersSnap = await admin
            .firestore()
            .collection("newsletter_subscribers")
            .orderBy("createdAt", "desc")
            .get();
        const list = [];
        subscribersSnap.forEach((doc) => {
            const data = doc.data();
            list.push({
                id: doc.id,
                email: data.email,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null,
            });
        });
        return { success: true, list };
    }
    catch (error) {
        console.error("Get subscribers error:", error);
        throw new https_1.HttpsError("internal", "구독자 목록을 가져오는 데 실패했습니다.");
    }
});
/**
 * 구독자 단일 삭제 함수 (어드민용)
 */
exports.deleteSubscriber = (0, https_1.onCall)(async (request) => {
    const { password, id } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "삭제할 대상 아이디가 필요합니다.");
    }
    try {
        await admin.firestore().collection("newsletter_subscribers").doc(id).delete();
        return { success: true, message: "구독자 삭제 완료" };
    }
    catch (error) {
        console.error("Delete subscriber error:", error);
        throw new https_1.HttpsError("internal", "구독자 삭제에 실패했습니다.");
    }
});
/**
 * 예약 뉴스레터 생성 함수
 */
exports.createScheduledNewsletter = (0, https_1.onCall)(async (request) => {
    const { password, subject, htmlContent, scheduledAt } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    if (!subject || !htmlContent || !scheduledAt) {
        throw new https_1.HttpsError("invalid-argument", "필수 입력 정보가 누락되었습니다.");
    }
    try {
        const db = admin.firestore();
        const res = await db.collection("scheduled_newsletters").add({
            subject,
            htmlContent,
            scheduledAt: admin.firestore.Timestamp.fromDate(new Date(scheduledAt)),
            sent: false,
            createdAt: admin.firestore.FieldValue.serverTimestamp()
        });
        return { success: true, id: res.id };
    }
    catch (error) {
        console.error("Create scheduled newsletter error:", error);
        throw new https_1.HttpsError("internal", "예약 등록에 실패했습니다.");
    }
});
/**
 * 예약 뉴스레터 목록 조회 함수
 */
exports.getScheduledNewsletters = (0, https_1.onCall)(async (request) => {
    const { password } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    try {
        const db = admin.firestore();
        const snap = await db.collection("scheduled_newsletters")
            .where("sent", "==", false)
            .orderBy("scheduledAt", "asc")
            .get();
        const list = [];
        snap.forEach((doc) => {
            const data = doc.data();
            list.push({
                id: doc.id,
                subject: data.subject,
                scheduledAt: data.scheduledAt ? data.scheduledAt.toDate().toISOString() : null
            });
        });
        return { success: true, list };
    }
    catch (error) {
        console.error("Get scheduled newsletters error:", error);
        throw new https_1.HttpsError("internal", "예약 목록 조회에 실패했습니다.");
    }
});
/**
 * 예약 뉴스레터 삭제(취소) 함수
 */
exports.deleteScheduledNewsletter = (0, https_1.onCall)(async (request) => {
    const { password, id } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "삭제할 대상 아이디가 필요합니다.");
    }
    try {
        await admin.firestore().collection("scheduled_newsletters").doc(id).delete();
        return { success: true, message: "예약 취소 완료" };
    }
    catch (error) {
        console.error("Delete scheduled newsletter error:", error);
        throw new https_1.HttpsError("internal", "예약 취소에 실패했습니다.");
    }
});
/**
 * 뉴스레터 발송 이력 조회 함수 (캘린더 렌더링용)
 */
exports.getNewsletterHistory = (0, https_1.onCall)(async (request) => {
    const { password } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    try {
        const snap = await admin.firestore().collection("newsletter_history")
            .orderBy("sentAt", "desc")
            .get();
        const list = [];
        snap.forEach((doc) => {
            const data = doc.data();
            list.push({
                id: doc.id,
                subject: data.subject,
                sentAt: data.sentAt ? data.sentAt.toDate().toISOString() : null,
                recipientCount: data.recipientCount
            });
        });
        return { success: true, list };
    }
    catch (error) {
        console.error("Get newsletter history error:", error);
        throw new https_1.HttpsError("internal", "발송 이력을 가져오는 데 실패했습니다.");
    }
});
/**
 * 기도제목 리스트 조회 함수 (어드민용)
 */
exports.getPrayerRequests = (0, https_1.onCall)(async (request) => {
    const { password } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    try {
        const snap = await admin.firestore().collection("prayer_requests")
            .orderBy("createdAt", "desc")
            .get();
        const list = [];
        snap.forEach((doc) => {
            const data = doc.data();
            list.push({
                id: doc.id,
                name: data.name || "익명",
                content: data.content,
                shareConsent: data.shareConsent || false,
                createdAt: data.createdAt ? data.createdAt.toDate().toISOString() : null
            });
        });
        return { success: true, list };
    }
    catch (error) {
        console.error("Get prayer requests error:", error);
        throw new https_1.HttpsError("internal", "기도제목 목록 조회에 실패했습니다.");
    }
});
/**
 * 기도제목 삭제 함수
 */
exports.deletePrayerRequest = (0, https_1.onCall)(async (request) => {
    const { password, id } = request.data;
    if (password !== "wisdom123") {
        throw new https_1.HttpsError("permission-denied", "잘못된 비밀번호입니다.");
    }
    if (!id) {
        throw new https_1.HttpsError("invalid-argument", "삭제할 대상 아이디가 필요합니다.");
    }
    try {
        await admin.firestore().collection("prayer_requests").doc(id).delete();
        return { success: true, message: "기도제목 삭제 완료" };
    }
    catch (error) {
        console.error("Delete prayer request error:", error);
        throw new https_1.HttpsError("internal", "기도제목 삭제에 실패했습니다.");
    }
});
/**
 * 구글 스케줄러가 30분마다 자동 실행하여 예약 메일을 발송하는 함수
 */
exports.checkScheduledEmails = (0, scheduler_1.onSchedule)("every 30 minutes", async (event) => {
    const db = admin.firestore();
    const now = new Date();
    try {
        // 1. 발송 대상 예약 문서 찾기 (sent == false 이면서 예약시간 <= 현재시간)
        const querySnapshot = await db.collection("scheduled_newsletters")
            .where("sent", "==", false)
            .where("scheduledAt", "<=", admin.firestore.Timestamp.fromDate(now))
            .get();
        if (querySnapshot.empty) {
            return;
        }
        // 2. 전체 구독자 목록 가져오기
        const subscribersSnap = await db.collection("newsletter_subscribers").get();
        if (subscribersSnap.empty) {
            console.log("No subscribers found for scheduled newsletter.");
            return;
        }
        const emails = [];
        subscribersSnap.forEach((doc) => {
            const email = doc.data().email;
            if (email)
                emails.push(email);
        });
        // 3. 각 예약 뉴스레터 발송 처리
        for (const docSnap of querySnapshot.docs) {
            const newsletterData = docSnap.data();
            const { subject, htmlContent } = newsletterData;
            let successCount = 0;
            let failCount = 0;
            const sendPromises = emails.map(async (email) => {
                const mailOptions = {
                    from: `"말씀의지혜" <${GMAIL_USER}>`,
                    to: email,
                    subject: subject,
                    html: htmlContent,
                };
                try {
                    await transporter.sendMail(mailOptions);
                    successCount++;
                }
                catch (err) {
                    console.error(`Scheduled send failed to ${email}:`, err);
                    failCount++;
                }
            });
            await Promise.all(sendPromises);
            // 4. 예약 메일 문서 상태 완료 업데이트
            await docSnap.ref.update({
                sent: true,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                recipientCount: successCount
            });
            // 5. 발송 이력에 기록 추가
            await db.collection("newsletter_history").add({
                subject: subject,
                sentAt: admin.firestore.FieldValue.serverTimestamp(),
                recipientCount: successCount,
                success: true,
                isScheduled: true
            });
            console.log(`[Scheduled Success] "${subject}" 메일 ${successCount}명 발송 완료`);
        }
    }
    catch (error) {
        console.error("Scheduled email check and delivery failed:", error);
    }
});
//# sourceMappingURL=index.js.map