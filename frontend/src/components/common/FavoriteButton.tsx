import { useModalStore } from "@/shared/store/modalStore";
import { useAuthStore } from "@/shared/store/authStore";

type Props = {
  liked: boolean;
  onLike: () => void | Promise<void>;
  onUnlike: () => void | Promise<void>;
  className?: string;
  style?: React.CSSProperties;
  ariaLabel?: string;
  unlikeTitle?: string;
  unlikeMessage?: string;
  confirmText?: string;
  cancelText?: string;
};

export default function FavoriteButton({
  liked,
  onLike,
  onUnlike,
  className,
  style,
  ariaLabel,
  unlikeTitle = "좋아요 취소",
  unlikeMessage = "좋아요를 취소하시겠습니까?",
  confirmText = "취소하기",
  cancelText = "닫기",
}: Props) {
  const openConfirm = useModalStore((state) => state.openConfirm);
  const openAlert = useModalStore((state) => state.openAlert);
  const isLoggedIn = useAuthStore((state) => Boolean(state.accessToken && state.me));

  function handleClick(event: React.MouseEvent<HTMLButtonElement>) {
    event.stopPropagation();

    if (!isLoggedIn) {
      openAlert("warning", "로그인 필요", "좋아요는 로그인 상태에서만 사용할 수 있습니다.");
      return;
    }

    if (!liked) {
      void onLike();
      return;
    }

    openConfirm(
      "warning",
      unlikeTitle,
      unlikeMessage,
      () => {
        void onUnlike();
      },
      confirmText,
      cancelText,
    );
  }

  return (
    <button
      type="button"
      className={className}
      onClick={handleClick}
      aria-label={ariaLabel ?? (liked ? "좋아요 취소" : "좋아요 추가")}
      style={{
        color: liked ? "#e53e3e" : undefined,
        ...style,
      }}
    >
      {liked ? "❤️" : "♡"}
    </button>
  );
}
