import styles from "@/pages/admin/members/MemberManagePage.module.css";

/**
 * MemberNoticeBox
 * - 회원 관리 화면 안내 문구 영역
 */
export default function MemberNoticeBox() {
    return (
        <div className={styles.noticeBox}>
            회원자료 삭제 시 다른 회원이 기존 회원아이디를 사용하지 못하도록
            회원아이디, 이름, 닉네임은 삭제하지 않고 영구 보관합니다.
        </div>
    );
}