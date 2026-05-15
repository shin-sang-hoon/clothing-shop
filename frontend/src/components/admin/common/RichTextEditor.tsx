import { useEffect, useRef } from "react";
import { apiUploadItemImage } from "@/shared/api/admin/uploadApi";
import styles from "./RichTextEditor.module.css";

interface RichTextEditorProps {
    value: string;
    onChange: (html: string) => void;
    placeholder?: string;
    minHeight?: number;
}

/**
 * RichTextEditor
 * - contentEditable 기반 간단한 리치 텍스트 에디터
 * - 툴바: 제목(H2), 굵게, 기울임, 구분선, 이미지 업로드
 * - 이미지는 base64로 인라인 삽입
 * - value/onChange로 HTML 문자열 교환
 */
export default function RichTextEditor({
    value,
    onChange,
    placeholder = "내용을 입력하세요.",
    minHeight = 300,
}: RichTextEditorProps) {
    const editorRef = useRef<HTMLDivElement>(null);
    const isInternalChange = useRef(false);

    // 외부 value가 바뀌면 에디터 동기화 (커서 위치 유지)
    useEffect(() => {
        if (!editorRef.current) return;
        if (isInternalChange.current) {
            isInternalChange.current = false;
            return;
        }
        if (editorRef.current.innerHTML !== value) {
            editorRef.current.innerHTML = value;
        }
    }, [value]);

    function handleInput() {
        if (!editorRef.current) return;
        isInternalChange.current = true;
        onChange(editorRef.current.innerHTML);
    }

    function execCmd(command: string, value?: string) {
        editorRef.current?.focus();
        document.execCommand(command, false, value);
        handleInput();
    }

    function handleHeading() {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const selectedText = range.toString() || "제목";
        const h2 = document.createElement("h2");
        h2.className = "pd-heading";
        h2.textContent = selectedText;
        range.deleteContents();
        range.insertNode(h2);
        // 커서를 h2 뒤로
        range.setStartAfter(h2);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
    }

    function handleHR() {
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) return;
        const range = selection.getRangeAt(0);
        const hr = document.createElement("hr");
        range.collapse(false);
        range.insertNode(hr);
        range.setStartAfter(hr);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
    }

    async function handleImageUpload(e: React.ChangeEvent<HTMLInputElement>) {
        const file = e.target.files?.[0];
        if (!file) return;
        const uploadedUrl = await apiUploadItemImage(file);
        editorRef.current?.focus();
        const selection = window.getSelection();
        if (!selection || selection.rangeCount === 0) {
            e.target.value = "";
            return;
        }
        const range = selection.getRangeAt(0);
        const img = document.createElement("img");
        img.src = uploadedUrl;
        img.className = "pd-img";
        img.style.maxWidth = "100%";
        img.style.display = "block";
        img.style.margin = "12px 0";
        img.style.borderRadius = "8px";
        range.collapse(false);
        range.insertNode(img);
        range.setStartAfter(img);
        range.collapse(true);
        selection.removeAllRanges();
        selection.addRange(range);
        handleInput();
        e.target.value = "";
    }

    const isEmpty = !value || value === "<br>" || value === "";

    return (
        <div className={styles.wrap}>
            {/* 툴바 */}
            <div className={styles.toolbar}>
                <button
                    type="button"
                    className={styles.toolBtn}
                    title="제목 (H2)"
                    onMouseDown={(e) => { e.preventDefault(); handleHeading(); }}
                >
                    H2
                </button>
                <button
                    type="button"
                    className={styles.toolBtn}
                    title="굵게"
                    onMouseDown={(e) => { e.preventDefault(); execCmd("bold"); }}
                >
                    <b>B</b>
                </button>
                <button
                    type="button"
                    className={styles.toolBtn}
                    title="기울임"
                    onMouseDown={(e) => { e.preventDefault(); execCmd("italic"); }}
                >
                    <i>I</i>
                </button>
                <button
                    type="button"
                    className={styles.toolBtn}
                    title="밑줄"
                    onMouseDown={(e) => { e.preventDefault(); execCmd("underline"); }}
                >
                    <u>U</u>
                </button>
                <div className={styles.toolSep} />
                <button
                    type="button"
                    className={styles.toolBtn}
                    title="가로선"
                    onMouseDown={(e) => { e.preventDefault(); handleHR(); }}
                >
                    —
                </button>
                <div className={styles.toolSep} />
                <label className={`${styles.toolBtn} ${styles.imgBtn}`} title="이미지 삽입">
                    🖼 이미지
                    <input
                        type="file"
                        accept="image/*"
                        style={{ display: "none" }}
                        onChange={handleImageUpload}
                    />
                </label>
            </div>

            {/* 에디터 본문 */}
            <div className={styles.editorWrap}>
                <div
                    ref={editorRef}
                    className={styles.editor}
                    contentEditable
                    suppressContentEditableWarning
                    onInput={handleInput}
                    style={{ minHeight }}
                    data-placeholder={placeholder}
                />
                {isEmpty && (
                    <div className={styles.placeholder}>{placeholder}</div>
                )}
            </div>
        </div>
    );
}
