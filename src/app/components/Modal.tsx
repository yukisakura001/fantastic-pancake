import React, { useEffect } from "react";

interface ModalProps {
  isOpen: boolean;
  onClose: () => void;
  children: React.ReactNode;
}

const Modal: React.FC<ModalProps> = ({ isOpen, onClose, children }) => {
  useEffect(() => {
    if (isOpen) {
      // スクロールバーの幅を取得
      const scrollBarWidth =
        window.innerWidth - document.documentElement.clientWidth;

      // bodyにスクロールバー幅を反映
      document.body.style.paddingRight = `${scrollBarWidth}px`;
      document.body.style.overflow = "hidden";
    } else {
      // モーダルが閉じられたらリセット
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    }

    // クリーンアップ関数で、コンポーネントがアンマウントされたときにもリセット
    return () => {
      document.body.style.overflow = "";
      document.body.style.paddingRight = "";
    };
  }, [isOpen]);

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center rounded-lg shadow-md">
      {/* 背景の半透明オーバーレイ */}
      <div className="fixed inset-0 bg-black bg-opacity-50" onClick={onClose} />
      {/* モーダルのコンテンツ */}
      <div className="relative bg-white rounded-lg p-8 z-10 max-h-screen overflow-y-auto w-11/12 md:w-3/4 lg:w-1/2 shadow-lg">
        {/* バツボタン */}
        <button
          onClick={onClose}
          className="absolute top-4 right-4 text-gray-500 hover:text-gray-700 focus:outline-none"
          aria-label="Close Modal"
        >
          {/* バツアイコン（SVG） */}
          <svg
            xmlns="http://www.w3.org/2000/svg"
            className="h-6 w-6"
            fill="none"
            viewBox="0 0 24 24"
            stroke="currentColor"
          >
            <path
              strokeLinecap="round"
              strokeLinejoin="round"
              strokeWidth={2}
              d="M6 18L18 6M6 6l12 12"
            />
          </svg>
        </button>
        {/* モーダルの子コンテンツ */}
        {children}
      </div>
    </div>
  );
};

export default Modal;
