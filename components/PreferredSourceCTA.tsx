import { ArrowUpLeft, Sparkles } from "lucide-react";

const preferredSourceUrl = "https://www.google.com/preferences/source?q=khonenama.ir";

export default function PreferredSourceCTA({ compact = false }: { compact?: boolean }) {
  return (
    <div
      className={`preferred-source-card glass-panel${compact ? " preferred-source-card-compact" : ""}`}
      aria-label="افزودن خونه‌نما به منابع ترجیحی گوگل"
    >
      <span className="preferred-source-icon" aria-hidden="true"><Sparkles size={18} /></span>
      <div>
        <span className="section-kicker">Google Preferred Sources</span>
        <h3>خونه‌نما را به منابع ترجیحی گوگل اضافه کنید</h3>
        <p>
          اگر راهنماهای خونه‌نما برایتان مفید است، می‌توانید دامنه khonenama.ir را در Google به‌عنوان
          منبع ترجیحی انتخاب کنید تا در تجربه‌هایی که این قابلیت فعال است، محتوای خونه‌نما با نشان
          Preferred برجسته شود.
        </p>
      </div>
      <a href={preferredSourceUrl} target="_blank" rel="noopener noreferrer">
        افزودن به Preferred Sources <ArrowUpLeft size={15} />
      </a>
    </div>
  );
}
