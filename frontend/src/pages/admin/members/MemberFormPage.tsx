import { useEffect, useMemo, useState } from "react";
import { useNavigate, useParams } from "react-router-dom";
import AdminCard from "@/components/admin/common/AdminCard";
import AddressInput from "@/components/common/AddressInput";
import {
    AdminMemberRole,
    AdminMemberStatus,
    apiCheckAdminMemberEmail,
    apiCreateAdminMember,
    apiGetAdminMember,
    apiUpdateAdminMember,
} from "@/shared/api/adminApi";
import { useModalStore } from "@/shared/store/modalStore";
import { formatDateTimeKst } from "@/shared/utils/dateTime";
import styles from "./MemberFormPage.module.css";

/**
 * MemberFormMode
 * - 회원 등록/수정 모드
 */
type MemberFormMode = "create" | "edit";

/**
 * MemberFormPageProps
 * - 공통 회원 등록/수정 폼 props
 */
interface MemberFormPageProps {
    mode: MemberFormMode;
}

/**
 * MemberFormValue
 * - 폼 상태
 */
interface MemberFormValue {
    email: string;
    name: string;
    phoneNumber: string;
    role: AdminMemberRole;
    status: AdminMemberStatus;
    point: number;
    memo: string;
    zipCode: string;
    roadAddress: string;
    detailAddress: string;
    password: string;
    passwordConfirm: string;
    createdAt: string;
    lastLoginAt: string;
}

/**
 * MemberFormPage
 * - 회원 등록/수정 공통 폼
 * - 등록: 이메일 중복확인 필요
 * - 수정: 이메일 readonly, 비밀번호 입력 시에만 변경
 */
export default function MemberFormPage({ mode }: MemberFormPageProps) {
    const navigate = useNavigate();
    const params = useParams();
    const openModal = useModalStore((state) => state.openModal);

    const memberId = Number(params.id ?? 0);

    /**
     * 초기 폼 상태
     */
    const initialValue = useMemo<MemberFormValue>(
        () => ({
            email: "",
            name: "",
            phoneNumber: "",
            role: "USER",
            status: "정상",
            point: 0,
            memo: "",
            zipCode: "",
            roadAddress: "",
            detailAddress: "",
            password: "",
            passwordConfirm: "",
            createdAt: "",
            lastLoginAt: "",
        }),
        [],
    );

    const [form, setForm] = useState<MemberFormValue>(initialValue);
    const [isLoading, setIsLoading] = useState<boolean>(mode === "edit");
    const [isSubmitting, setIsSubmitting] = useState<boolean>(false);

    /**
     * 등록 화면 이메일 중복확인 여부
     */
    const [isEmailChecked, setIsEmailChecked] = useState<boolean>(false);
    const [emailCheckMessage, setEmailCheckMessage] = useState<string>("");

    /**
     * 수정 화면 상세 불러오기
     */
    useEffect(() => {
        if (mode !== "edit" || !memberId) {
            return;
        }

        const loadMember = async (): Promise<void> => {
            setIsLoading(true);

            try {
                const detail = await apiGetAdminMember(memberId);

                setForm({
                    email: detail.email,
                    name: detail.name,
                    phoneNumber: detail.phoneNumber,
                    role: detail.role,
                    status: detail.status,
                    point: detail.point ?? 0,
                    memo: detail.memo ?? "",
                    zipCode: detail.zipCode ?? "",
                    roadAddress: detail.roadAddress ?? "",
                    detailAddress: detail.detailAddress ?? "",
                    password: "",
                    passwordConfirm: "",
                    createdAt: detail.createdAt ?? "",
                    lastLoginAt: detail.lastLoginAt ?? "",
                });
            } catch (error) {
                console.error("회원 상세 조회 실패:", error);

                openModal(
                    "error",
                    "조회 실패",
                    "회원 정보를 불러오지 못했습니다.",
                    "확인",
                    () => {
                        navigate("/admin/members");
                    },
                );
            } finally {
                setIsLoading(false);
            }
        };

        void loadMember();
    }, [mode, memberId, navigate, openModal]);

    /**
     * 입력값 변경 처리
     */
    const handleAddressChange = (addr: { zipCode: string; roadAddress: string; detailAddress: string }): void => {
        setForm((prev) => ({
            ...prev,
            zipCode: addr.zipCode,
            roadAddress: addr.roadAddress,
            detailAddress: addr.detailAddress,
        }));
    };

    const handleChange = (
        key: keyof MemberFormValue,
        value: string | number,
    ): void => {
        setForm((prev) => ({
            ...prev,
            [key]: value,
        }));

        /**
         * 등록 화면에서 이메일이 바뀌면 중복확인 다시 필요
         */
        if (mode === "create" && key === "email") {
            setIsEmailChecked(false);
            setEmailCheckMessage("");
        }
    };

    /**
     * 이메일 중복확인
     */
    const handleCheckEmailDuplicate = async (): Promise<void> => {
        const email = form.email.trim();

        if (!email) {
            setIsEmailChecked(false);
            setEmailCheckMessage("이메일을 먼저 입력해주세요.");
            return;
        }

        try {
            const result = await apiCheckAdminMemberEmail(email);

            if (result.available) {
                setIsEmailChecked(true);
                setEmailCheckMessage("사용 가능한 이메일입니다.");
            } else {
                setIsEmailChecked(false);
                setEmailCheckMessage("이미 사용 중인 이메일입니다.");
            }
        } catch (error) {
            console.error("이메일 중복확인 실패:", error);
            setIsEmailChecked(false);
            setEmailCheckMessage("이메일 중복확인에 실패했습니다.");
        }
    };

    /**
     * 기본 검증
     */
    const validateForm = (): boolean => {
        if (!form.email.trim()) {
            openModal("warning", "입력 확인", "이메일을 입력해주세요.", "확인");
            return false;
        }

        if (!form.name.trim()) {
            openModal("warning", "입력 확인", "이름을 입력해주세요.", "확인");
            return false;
        }

        if (!form.phoneNumber.trim()) {
            openModal("warning", "입력 확인", "휴대폰 번호를 입력해주세요.", "확인");
            return false;
        }

        if (mode === "create" && !isEmailChecked) {
            openModal("warning", "입력 확인", "이메일 중복확인을 먼저 해주세요.", "확인");
            return false;
        }

        if (mode === "create") {
            if (!form.password) {
                openModal("warning", "입력 확인", "비밀번호를 입력해주세요.", "확인");
                return false;
            }

            if (form.password.length < 4) {
                openModal("warning", "입력 확인", "비밀번호는 4자 이상 입력해주세요.", "확인");
                return false;
            }

            if (form.password !== form.passwordConfirm) {
                openModal("warning", "입력 확인", "비밀번호 확인이 일치하지 않습니다.", "확인");
                return false;
            }
        }

        if (mode === "edit" && form.password) {
            if (form.password.length < 4) {
                openModal("warning", "입력 확인", "비밀번호는 4자 이상 입력해주세요.", "확인");
                return false;
            }

            if (form.password !== form.passwordConfirm) {
                openModal("warning", "입력 확인", "비밀번호 확인이 일치하지 않습니다.", "확인");
                return false;
            }
        }

        return true;
    };

    /**
     * 저장 처리
     */
    const handleSubmit = async (): Promise<void> => {
        if (!validateForm()) {
            return;
        }

        setIsSubmitting(true);

        try {
            if (mode === "create") {
                await apiCreateAdminMember({
                    email: form.email.trim(),
                    name: form.name.trim(),
                    phoneNumber: form.phoneNumber.replaceAll(/[^0-9]/g, ""),
                    role: form.role,
                    status: form.status,
                    point: Number(form.point ?? 0),
                    memo: form.memo.trim(),
                    zipCode: form.zipCode || undefined,
                    roadAddress: form.roadAddress || undefined,
                    detailAddress: form.detailAddress || undefined,
                    password: form.password,
                });

                openModal(
                    "success",
                    "등록 완료",
                    "회원이 등록되었습니다.",
                    "확인",
                    () => {
                        navigate("/admin/members");
                    },
                );

                return;
            }

            await apiUpdateAdminMember(memberId, {
                name: form.name.trim(),
                phoneNumber: form.phoneNumber.replaceAll(/[^0-9]/g, ""),
                role: form.role,
                status: form.status,
                point: Number(form.point ?? 0),
                memo: form.memo.trim(),
                zipCode: form.zipCode || undefined,
                roadAddress: form.roadAddress || undefined,
                detailAddress: form.detailAddress || undefined,
                password: form.password ? form.password : undefined,
            });

            openModal(
                "success",
                "저장 완료",
                "회원 정보가 수정되었습니다.",
                "확인",
                () => {
                    navigate("/admin/members");
                },
            );
        } catch (error: any) {
            console.error("회원 저장 실패:", error);

            const message =
                error?.response?.data?.message ??
                "회원 저장 중 오류가 발생했습니다.";

            openModal("error", "저장 실패", message, "확인");
        } finally {
            setIsSubmitting(false);
        }
    };

    /**
     * 취소
     */
    const handleCancel = (): void => {
        navigate(-1);
    };

    const pageTitle = mode === "create" ? "회원 등록" : "회원 수정";
    const pageDescription =
        mode === "create"
            ? "회원 기본 정보를 입력해 관리자가 직접 계정을 등록합니다. 이메일 인증 없이 등록되며 이메일 중복 여부만 확인합니다."
            : "회원 정보를 수정합니다. 비밀번호를 입력한 경우에만 비밀번호가 변경됩니다.";

    const submitButtonText = mode === "create" ? "등록" : "저장";

    if (isLoading) {
        return <div className={styles.loadingText}>불러오는 중...</div>;
    }

    return (
        <section className={styles.page}>
            <div className={styles.header}>
                <div className={styles.titleWrap}>
                    <h1 className={styles.title}>{pageTitle}</h1>
                    <p className={styles.description}>{pageDescription}</p>
                </div>

                <div className={styles.headerActions}>
                    <button
                        type="button"
                        className={styles.secondaryButton}
                        onClick={handleCancel}
                        disabled={isSubmitting}
                    >
                        취소
                    </button>

                    <button
                        type="button"
                        className={styles.primaryButton}
                        onClick={() => void handleSubmit()}
                        disabled={isSubmitting}
                    >
                        {isSubmitting ? "처리 중..." : submitButtonText}
                    </button>
                </div>
            </div>

            <AdminCard title="기본 정보">
                <div className={styles.formStack}>
                    <div className={styles.field}>
                        <label className={styles.label}>
                            이메일
                            <span className={styles.required}>*</span>
                        </label>

                        {mode === "edit" ? (
                            <div className={styles.readonlyBox}>{form.email}</div>
                        ) : (
                            <>
                                <div className={styles.inlineField}>
                                    <input
                                        type="email"
                                        className={styles.input}
                                        value={form.email}
                                        onChange={(event) => handleChange("email", event.target.value)}
                                        placeholder="example@email.com"
                                    />

                                    <button
                                        type="button"
                                        className={styles.checkButton}
                                        onClick={() => void handleCheckEmailDuplicate()}
                                    >
                                        중복확인
                                    </button>
                                </div>

                                {emailCheckMessage ? (
                                    <p
                                        className={
                                            isEmailChecked ? styles.successText : styles.warningText
                                        }
                                    >
                                        {emailCheckMessage}
                                    </p>
                                ) : null}
                            </>
                        )}
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            이름
                            <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={form.name}
                            onChange={(event) => handleChange("name", event.target.value)}
                            placeholder="이름 입력"
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            휴대폰 번호
                            <span className={styles.required}>*</span>
                        </label>
                        <input
                            type="text"
                            className={styles.input}
                            value={form.phoneNumber}
                            onChange={(event) => handleChange("phoneNumber", event.target.value)}
                            placeholder="010-0000-0000"
                        />
                    </div>

                    <div className={styles.twoColumnRow}>
                        <div className={styles.field}>
                            <label className={styles.label}>
                                역할
                                <span className={styles.required}>*</span>
                            </label>
                            <select
                                className={styles.select}
                                value={form.role}
                                onChange={(event) =>
                                    handleChange("role", event.target.value as AdminMemberRole)
                                }
                            >
                                <option value="USER">USER</option>
                                <option value="ADMIN">ADMIN</option>
                            </select>
                        </div>

                        <div className={styles.field}>
                            <label className={styles.label}>
                                상태
                                <span className={styles.required}>*</span>
                            </label>
                            <select
                                className={styles.select}
                                value={form.status}
                                onChange={(event) =>
                                    handleChange("status", event.target.value as AdminMemberStatus)
                                }
                            >
                                <option value="정상">정상</option>
                                <option value="차단">차단</option>
                                <option value="탈퇴">탈퇴</option>
                            </select>
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>포인트</label>
                        <input
                            type="number"
                            className={styles.input}
                            value={form.point}
                            onChange={(event) =>
                                handleChange("point", Number(event.target.value))
                            }
                            placeholder="0"
                        />
                    </div>
                </div>
            </AdminCard>

            <AdminCard title="비밀번호">
                <div className={styles.formStack}>
                    <div className={styles.field}>
                        <div className={styles.passwordGuide}>
                            {mode === "create"
                                ? "비밀번호는 4자 이상 입력해주세요."
                                : "수정 화면에서는 비밀번호를 입력한 경우에만 변경됩니다. 비밀번호는 4자 이상 입력해주세요."}
                        </div>
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            비밀번호
                            {mode === "create" ? (
                                <span className={styles.required}>*</span>
                            ) : null}
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            value={form.password}
                            onChange={(event) => handleChange("password", event.target.value)}
                            placeholder={mode === "create" ? "비밀번호 입력" : "변경 시에만 입력"}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>
                            비밀번호 확인
                            {mode === "create" ? (
                                <span className={styles.required}>*</span>
                            ) : null}
                        </label>
                        <input
                            type="password"
                            className={styles.input}
                            value={form.passwordConfirm}
                            onChange={(event) =>
                                handleChange("passwordConfirm", event.target.value)
                            }
                            placeholder={
                                mode === "create" ? "비밀번호 확인 입력" : "변경 시에만 입력"
                            }
                        />
                    </div>
                </div>
            </AdminCard>

            <AdminCard title="추가 정보">
                <div className={styles.formStack}>
                    {mode === "edit" ? (
                        <div className={styles.twoColumnRow}>
                            <div className={styles.field}>
                                <label className={styles.label}>가입일</label>
                                <div className={styles.readonlyBox}>
                                    {formatDateTimeKst(form.createdAt)}
                                </div>
                            </div>

                            <div className={styles.field}>
                                <label className={styles.label}>최종접속</label>
                                <div className={styles.readonlyBox}>
                                    {formatDateTimeKst(form.lastLoginAt)}
                                </div>
                            </div>
                        </div>
                    ) : null}

                    <div className={styles.field}>
                        <label className={styles.label}>주소</label>
                        <AddressInput
                            value={{
                                zipCode: form.zipCode,
                                roadAddress: form.roadAddress,
                                detailAddress: form.detailAddress,
                            }}
                            onChange={handleAddressChange}
                        />
                    </div>

                    <div className={styles.field}>
                        <label className={styles.label}>메모</label>
                        <textarea
                            className={styles.textarea}
                            value={form.memo}
                            onChange={(event) => handleChange("memo", event.target.value)}
                            placeholder="관리자 메모 입력"
                        />
                        <p className={styles.helpText}>
                            회원 관리 시 참고할 내부 메모를 남길 수 있습니다.
                        </p>
                    </div>
                </div>
            </AdminCard>
        </section>
    );
}