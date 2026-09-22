import { MessageCircle } from "lucide-react";

const adminWhatsapp =
  "https://wa.me/989122606778?text=" +
  encodeURIComponent("سلام، از سایت خونه‌نما پیام می‌دهم. برای ارتباط با ادمین / پیشنهاد همکاری پیام دارم.");

export default function AdminContactFloat() {
  return (
    <a
      className="admin-contact-float"
      href={adminWhatsapp}
      target="_blank"
      rel="noopener noreferrer"
      aria-label="ارتباط با ادمین خونه‌نما در واتساپ"
      title="ارتباط با ادمین"
    >
      <span className="admin-contact-icon" aria-hidden="true">
        <MessageCircle size={20} />
      </span>
      <span className="admin-contact-label">ارتباط با ادمین</span>
    </a>
  );
}
