import MemberFormPage from "@/pages/admin/members/MemberFormPage";

/**
 * MemberRegisterPage
 * - 회원 등록 전용 래퍼 페이지
 */
export default function MemberRegisterPage() {
    return <MemberFormPage mode="create" />;
}