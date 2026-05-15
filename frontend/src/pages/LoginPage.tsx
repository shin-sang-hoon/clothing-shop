import LoginForm from "@/components/user/member/login/LoginForm";

/**
 * LoginPage
 * - 페이지는 조립만 담당
 * - 실제 로그인 UI/로직은 LoginForm 컴포넌트로 분리
 */
export default function LoginPage() {
  return <LoginForm />;
}