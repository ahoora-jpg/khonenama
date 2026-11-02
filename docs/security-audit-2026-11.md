# ممیزی امنیت خونه‌نما — آبان ۱۴۰۵

## Executive Summary

مبنا: `ecfe6844a5ecaf19ae1a1318d9c68c23516d5c7f` از `origin/main`؛ شاخه: `feat/security-hardening-nov`؛ بررسی در ۱ و ۲ نوامبر ۲۰۲۶.
این گزارش ممیزی کد، اسکن مخزن، آزمون‌های خودکار و خواندن تنظیمات زیرساخت است؛ گواهی امنیت مطلق یا آزمون نفوذ مستقل نیست. هیچ ادغام، انتشار این شاخه، پرداخت، ارسال آزمایشی واقعی یا تغییر دادهٔ مشتری برای این ممیزی انجام نشده است.
بازطراحی عملیاتی پیامک قبلاً در PR #79 و همین مبنا ادغام شده: توقف/ادامه/لغو، توقف عمومی، بازبینی تلاش مجدد قطعی و پیش‌نمایش شروع وجود دارند. آن معماری دوباره نوشته نشده است.

## Critical

مورد بحرانی تأییدشده‌ای در محدودهٔ بررسی پیدا نشد. این به معنی اثبات نبود همهٔ آسیب‌پذیری‌ها نیست.

## High

| شناسه | محل و ریسک | اصلاح و وضعیت | شواهد |
|---|---|---|---|
| H1 | خروجی JSON-LD پراکنده در صفحات؛ بعضی خروجی‌های `JSON.stringify` بدون فراردهی می‌توانستند با دادهٔ کنترل‌شده، تگ اسکریپت را ببندند | **Fixed**: تمام خروجی‌های JSON-LD از `lib/safe-json-ld.ts` استفاده می‌کنند؛ `< > & U+2028 U+2029` فراردهی می‌شوند | آزمون payload بستن script/SVG و بازخوانی بدون تغییر داده؛ کنترل همهٔ محل‌های JSON-LD |
| H2 | شاخهٔ `main` بدون محافظت؛ امکان دورزدن بازبینی و CI | **Fixed** در GitHub: PR اجباری، بررسی `build` و به‌روز بودن شاخه، اجرای محدودیت برای مدیر، منع force-push و حذف، حل گفت‌وگوهای باز | پاسخ موفق تنظیم و خواندن API؛ برای تیم تک‌نفره تعداد تأییدکنندهٔ اجباری صفر است |

## Medium

| شناسه | محل و ریسک | اصلاح و وضعیت | شواهد |
|---|---|---|---|
| M1 | ورود کسب‌وکار فقط به IP محدود بود؛ چند IP می‌توانستند یک حساب را هدف بگیرند؛ شمارندهٔ read/update هم‌زمانی را از دست می‌داد | **Fixed**: کلید مستقل SHA-256 حساب و IP؛ افزایش اتمی SQL؛ ورود موفق بودجهٔ IP مشترک را پاک نمی‌کند | آزمون IPهای متعدد، ۸ تلاش هم‌زمان، انقضای پنجره و تزریق SQL |
| M2 | CSP تنها چند دستور داشت | **Pending** برای اجرای کامل: سیاست کامل Report-Only، nonce تصادفی، انتقال nonce به renderer و اسکریپت ضروری آماده شد؛ سیاست اجرایی قبلی حفظ شد | آزمون ساخت سیاست و منع unsafe-eval/unsafe-inline اسکریپت؛ آزمون مرورگر محلی به چرخهٔ redirect HTTPS در محیط شبیه‌ساز برخورد کرد؛ سازگاری کامل nonce در مرورگر تولید هنوز تأیید نشده؛ بنابراین Enforce ادعا نمی‌شود |
| M3 | کنترل اولیهٔ تصویر فقط MIME اعلامی را بررسی می‌کرد | **Fixed** برای پیش‌بررسی: امضای JPEG/PNG/WEBP/AVIF/GIF و حدود AVIF؛ پردازش و بازکدگذاری اجباری موجود حذف نشد | فایل جعلی SVG/HTML و AVIF خراب رد می‌شوند؛ آزمون‌های پردازش تصویر و ذخیرهٔ R2 |
| M4 | خطای خام برخی مسیرهای حساب/ثبت‌نام/رسانه و بازیابی داده می‌توانست اطلاعات وابستگی را در لاگ بریزد | **Fixed** در محل‌های شناسایی‌شده: حذف exception خام؛ رخدادهای امنیتی ساخت‌یافته با شناسهٔ تصادفی و بدون body/header/شماره/توکن | بازبینی diff؛ logger ورودی آزاد برای exception یا payload ندارد؛ لاگ فعلی SMS بدون تغییر حفظ شد |
| M5 | ورود مدیر از همان کلید امضای نشست استفاده می‌کرد | **Pending** برای مهاجرت زنده: `ADMIN_LOGIN_PASSWORD_HASH` با قالب PBKDF2 نمک‌دار اضافه شد؛ با تنظیم آن، ورود با کلید امضا دیگر پذیرفته نمی‌شود | آزمون hash معتبر، رمز اشتباه، جلوگیری از fallback و قالب خراب؛ هیچ secret زنده تغییر نکرد |
| M6 | نسخهٔ نصب‌شدهٔ satori در زنجیرهٔ vinext → @vercel/og هشدار متوسط دارد | **Accepted موقت در این بررسی**: مسیر یا import تولید OG با محتوای کاربر در app/lib/components پیدا نشد؛ ارتقای کور چارچوب انجام نشد | npm audit کامل و تولید: ۳ متوسط، صفر بالا/بحرانی؛ پیگیری ارتقای سازگار لازم است |
| M7 | تهیهٔ پشتیبان خودکار فقط دیتابیس سایت را پوشش می‌داد؛ خروجی ابزار export ممکن بود URL امضاشده چاپ کند | **Fixed در کد / Pending اجرای واقعی**: دو کار مستقل برای سایت و SMS، لاگ export خصوصی، رمزگذاری و بازگردانی در حافظه | بازبینی workflow و اجرای موفق ابزار verify-backup-restore با دو دیتابیس مصنوعی سایت و پیامک؛ این شاخه هنوز روی GitHub اجرا نشده و بازیابی واقعی تازه ادعا نمی‌شود |
| M8 | Cloudflare Builds مستقل از انتشار دستی GitHub، روی main انتشار خودکار دارد | **Pending کنترل تکمیلی**: main اکنون CI اجباری دارد؛ workflow دستی نیز SHA دقیق main و CI موفق همان SHA را کنترل می‌کند. برای جلوگیری از انتشار این شاخه، فقط trigger پیش‌نمایش Cloudflare با حفظ استثنای main، شاخهٔ امنیتی را نیز مستثنا کرد؛ trigger انتشار main تغییر نکرد. مسیر خودکار Cloudflare هنوز باید پیش از انتشار بعدی با همین سیاست همسو شود | تنظیمات زندهٔ trigger بررسی شد: main از `npm run build:vinext` و deploy مستقیم استفاده می‌کند؛ این تنظیم Production بدون مجوز تازه تغییر نکرد |

## Low

| شناسه | محل و ریسک | اصلاح و وضعیت | شواهد |
|---|---|---|---|
| L1 | نشست مدیر تنها timestamp امضاشده بود و در یک میلی‌ثانیه تکرار می‌شد | **Fixed**: nonce تصادفی در هر ورود؛ طول عمر ۱۲ ساعت و امضای HMAC؛ پذیرش نشست‌های قدیمی فقط تا انقضا برای مهاجرت | آزمون دو نشست متفاوت، دستکاری، قطعهٔ اضافی و CSRF |
| L2 | درخواست بازیابی بدون ایمیل، ۳ ستون و ۴ جای‌نگهدار SQL داشت | **Fixed**: تعداد صحیح؛ درخواست پشتیبانی حتی با قطع SMS باقی می‌ماند | آزمون واقعی SQLite با قطع درگاه ساختگی |
| L3 | تعویض لوگوی موجود در ظرفیت پر مسدود می‌شد | **Fixed**: تشخیص لوگوی موجود با شناسهٔ غرفهٔ مالک؛ محدودیت ساخت تصویر تازه و کنترل اتمی حفظ شد | آزمون جایگزینی cover/logo و بارگذاری هم‌زمان |
| L4 | prefix امن کوکی و HSTS زیردامنه‌ها | **Accepted فعلی**: کوکی host-only با Secure/HttpOnly/SameSite و Path موجود حفظ شد؛ includeSubDomains/preload بدون فهرست و تأیید HTTPS همهٔ زیردامنه‌ها فعال نشد | بررسی کد؛ جلوگیری از قفل‌شدن سرویس‌ها و مهاجرت ناگهانی |

## Existing Controls

- سایت و SMS دو Worker، دو D1 و bindingهای مستقل دارند؛ `SMS_SERVICE` و `AUTH_SERVICE` حفظ شدند.
- جلسهٔ کاربر: توکن تصادفی ۳۲ بایت؛ فقط SHA-256 در DB؛ Secure/HttpOnly/SameSite=Lax، host-only و انقضا؛ عضویت فعال و نقش مالک/مدیر در سرور بررسی می‌شود.
- رمز کاربر: PBKDF2-HMAC-SHA256 با ۱۰۰٬۰۰۰ دور، نمک تصادفی ۱۶ بایت، خروجی ۳۲ بایت؛ مقایسهٔ ثابت‌زمان؛ نه plaintext.
- بازیابی: توکن تصادفی، فقط hash در DB، اعتبار ۱۵ دقیقه، یک‌بارمصرف و ابطال همهٔ نشست‌های قبلی به‌صورت batch تراکنشی.
- SMS: lease، شناسهٔ idempotent، رویداد پایدار/صف، reconcile، opt-out، محدودیت روزانه و وضعیت‌های مستقل ارسال/تحویل حفظ شدند؛ `unknown` دوباره ارسال نمی‌شود.
- پرداخت: مبلغ و مدت سرور، verify ارائه‌دهنده، تطابق invoice/payment/checkout و receipt، کنترل دوباره‌فعال‌سازی و افت طرح حفظ شدند.
- فایل: خواندن محدود multipart، اندازهٔ تصویر ۸MB و درخواست ۱۶MB، ویدیو ۱۵MB/۲۰ ثانیه، نام تصادفی سرور، عدم پذیرش SVG، بررسی مالکیت و ارائه با نوع محتوای درست.

## Changes Applied

فهرست دقیق فایل‌ها در بخش پایانی این گزارش از diff شاخه ثبت می‌شود. گروه‌های تغییر:
۱. سریال‌سازی مرکزی JSON-LD و جایگزینی همهٔ sinkها.
۲. ورود، نشست، محدودیت حساب و مدیر، بازیابی بدون ایمیل و Retry-After بازیابی.
۳. محافظت صفحات مدیریت در سرور؛ no-store/noindex؛ پوشش پاسخ‌های زودهنگام Worker و HTTPS.
۴. امضای تصویر و حفظ جایگزینی امن لوگو؛ حذف لاگ exception خام.
۵. readiness فقط برای مدیر در سایت و در مسیر SMS مستقل؛ بدون افشای مقدار یا hash کلید.
۶. secret scan در CI، Dependabot، حداقل مجوز workflow، pin انتشار به commit و بررسی CI.
۷. پشتیبان رمزگذاری‌شدهٔ جداگانهٔ دو DB و ابزار بررسی بازیابی.
۸. fixtureهای قدیمی آزمون با سیاست موجود ظرفیت/مهلت هماهنگ شدند؛ قیمت، ظرفیت واقعی و تاریخ طرح‌های محصول تغییر نکردند.

## Secrets Scan

Gitleaks **8.30.1** از انتشار رسمی؛ SHA256 فایل دریافتی پیش از اجرا با checksum رسمی تطبیق شد. `git fetch --all --tags` و اسکن `git --log-opts=--all --redact=100`، **۱۲۷۸ commit قابل‌دسترسی در مبنا** را پوشش داد.
سه یافتهٔ اولیهٔ تاریخچه:
- دو مورد `docs/sms-center-env.example` در ثبت‌های `5dc496f…` و `2646566…`: مقدار ADMIN_ACCESS_KEY واقعاً خالی بود؛ regex از newline عبور می‌کرد. فقط fingerprint همان دو ثبت مستثنا شد، نه فایل یا commit کامل.
- یک مورد `tools/submit-indexnow.mjs`: کلید اثبات عمومی IndexNow که فایل عمومی متناظر در public دارد؛ فقط مقدار دقیق و همان مسیر با شرط AND مستثنا شد.
اسکن دوبارهٔ تاریخچه: **بدون نشت واقعی شناسایی‌شده**. فایل‌های محیطی/کلید خصوصی/پیکربندی رابط/دادهٔ صادرشده در نام فایل‌های تاریخچه نیز بررسی شدند.
اسکن پوشه پیش از build همان هشدارهای نمونه را داشت؛ پس از اصلاح نمونه و build، دو یافتهٔ تازه در `dist/server/vinext-server.json` و `dist/server/ssr/vinext-server.json` مربوط به `prerenderSecret` تولیدشدهٔ خود چارچوب است. این مقدار در خروجی خصوصی سرور و مسیر نادیده‌گرفته‌شدهٔ Git است؛ secret فعال Provider نیست و نباید به public منتقل شود. این دو مورد با استثنای گسترده پنهان نشدند. خروجی عمومی مرورگر جداگانه اسکن شد: بدون یافته؛ فایل source map عمومی نیز در build پیدا نشد.
فایل‌های کلید و اطلاعات واقعی محلی بیرون مخزن نگه داشته شدند و در گزارش چاپ نشدند. چون نشت واقعی تأیید نشد، credential زنده بی‌دلیل rotate نشد. اسکن الگوها تضمین یافتن هر نوع secret یا دادهٔ شخصی نیست.

## Dependencies

`npm audit --json` و `npm audit --omit=dev --json`: **۰ بحرانی، ۰ بالا، ۳ متوسط، ۰ پایین**. هر سه از یک زنجیرهٔ satori / @vercel/og / vinext هستند. هیچ وابستگی تازهٔ runtime اضافه نشد؛ lockfile تغییر نکرد. به‌روزرسانی سازگار framework در PR جدا با build و مرورگر لازم است.
مرجع اصلی: [هشدار Satori](https://github.com/advisories/GHSA-wx4j-mvgx-mqwp). استفاده از محتوای مهاجم در OG تا رفع زنجیره ممنوع بماند.

## Authentication & Sessions

پارامتر PBKDF2 کاهش نیافت و دور افزایش نیافت تا حساب‌های موجود در Workers قفل نشوند. محدوده و طول hash/salt پیش از محاسبه بررسی می‌شود؛ مقدار خراب یا هزینهٔ بیش از سقف فعلی رد می‌شود. افزایش بعدی نیازمند آزمون runtime و progressive rehash است. [بحث رسمی سقف Workers](https://github.com/cloudflare/workerd/pull/7550) نشان می‌دهد افزایش کورِ دور قابل اتکا نیست.
نشست جدید مدیر اکنون تصادفی است؛ نشست قدیمی تا پایان عمرش معتبر می‌ماند. ابطال مرکزی تک‌نشست مدیر هنوز وجود ندارد؛ خروج فقط کوکی مرورگر را پاک می‌کند و کلید امضا در Secret Store است. این ریسک محدود ۱۲ساعته و نیاز به طراحی ابطال یا Cloudflare Access ثبت می‌شود.

## Admin Security

صفحات admin و SMS قبل از render، نشست مدیریت لازم دارند؛ صفحهٔ ورود مستثناست. همهٔ handlerهای admin در بازبینی منبع guard دارند؛ مسیرهای ورود و خروج استثنای منطقی‌اند. APIها همچنان خودشان مجوز را بررسی می‌کنند.
readiness اصلی: `/api/admin/security-readiness`؛ پنل مستقل: `/api/admin/sms/security-readiness`. فقط وضعیت نام کلیدها و role، بدون مقدار/طول/hash. نبودن یا قالب نامعتبر کلید ضروری، وضعیت غیرآماده می‌دهد.
تنظیم hash مدیر اختیاری و آمادهٔ مهاجرت است؛ تا تأیید انسانی هیچ رمز زنده تغییر نکرد. Cloudflare Access به‌عنوان لایه دوم توصیه می‌شود، اما بدون حساب بازیابی و آزمون ورود فعال نشده است.

## SMS Security

۱۲۲ آزمون موجود پیامک موفق بود: import بزرگ، جداسازی tenant، opt-out، retry قطعی، idempotency، توقف عمومی، رویداد پایدار، لینک اختصاصی، projection، bridge و قطع وابستگی. SIM پیش‌فرض کاربر حفظ شد. هیچ متن، مخاطب، صف یا زمان‌بندی در این شاخه تغییر نکرد.
در ۲ نوامبر به درخواست کاربر، جدا از انتشار این شاخه، سلامت گوشی `/health` و heartbeat سایت با پاسخ ۲۰۰ بررسی شد؛ پنل enabled و gateway enabled، توقف عمومی صفر و SIM پیش‌فرض را گزارش کرد. برای این بررسی پیام آزمایشی تازه ارسال نشد. وظیفهٔ محلی `KhonenamaSmsBridgeWatchdog` هر ۵ دقیقه و پس از ورود ویندوز فقط نبودن رابط را بررسی و آن را دوباره اجرا می‌کند؛ اجرای هم‌زمان دوم نمی‌سازد. روشن‌بودن لپ‌تاپ، اینترنت و Local server گوشی همچنان لازم است؛ دریافت heartbeat اثبات تحویل SMS نیست.

## Upload Security

تشخیص امضا پیش‌شرط است، نه جایگزین decode. خروجی تصویر باید توسط پردازشگر فعلی بازکدگذاری و سپس مشخصات، ابعاد و حجمش بررسی شود؛ fallback خام اضافه نشد. R2 فقط نسخهٔ پردازش‌شدهٔ WebP و thumbnail را نگه می‌دارد؛ سوابق قدیمی حذف نشدند.
ویدیو با parser محدود ISO-BMFF، مدت movie و track، mdat و video track بررسی می‌شود. این parser **decoder کامل codec نیست**؛ بررسی/تبدیل کامل ویدیو به سرویس پردازش جدا نیاز دارد و در این شاخه ادعا نمی‌شود. آزمون‌های malformed/بزرگ/طولانی و quota هم‌زمان برقرارند. نوع محتوا و nosniff حفظ شد؛ فایل کاربر به HTML/JS تبدیل نمی‌شود.

## Payment Security

منطق خرید و قیمت تغییر نکرد. آزمون‌های پرداخت، تغییر مبلغ/مدت، عدم verify، callback تکراری، تطابق receipt و invoice، فعال‌سازی یک‌باره و جلوگیری از downgrade ناخواسته را بررسی کردند. هیچ خرید واقعی انجام نشد. نتیجهٔ query مرورگر مجوز فعال‌سازی نیست.

## Database Security

DBها جدا باقی ماندند. **Migration جدیدی در این شاخه لازم نیست**؛ فقط همان جدول‌های موجود محدودیت ورود استفاده می‌شوند. migration توقف SMS قبلاً در PR79 و DB مستقل SMS اعمال شده بود؛ اینجا دوباره اجرا نشد.
پارامترهای کاربر در مسیرهای بررسی‌شده bind می‌شوند؛ SQL پویا شامل قطعه‌ها/شناسه‌های ثابت و لیست مجاز است. آزمون login/search/city تزریق SQL و آزمون‌های IDOR رسانه/آلبوم/درخواست و tenant اجرا می‌شوند؛ این شواهد جای ممیزی مستقل تمام مسیرهای آینده نیست.
نگهداری: توکن بازیابی مصرف‌شده/منقضی و پنجره بازیابی در cleanup موجود یک روز؛ inbox journal رابط ۷ روز؛ artifact پشتیبان رمزگذاری‌شده ۷ روز. تاریخچهٔ ارسال/پرداخت/رویداد مشتری برای بهینه‌سازی پاک نشد. نگهداری بلندمدت audit و دادهٔ مشتری باید طبق سیاست مصوب کسب‌وکار تعیین شود؛ این شاخه حذف دادهٔ واقعی انجام نمی‌دهد.
پشتیبان دو DB باید جدا decrypt و در محیط ایزوله restore و `PRAGMA quick_check` شوند؛ ابزار جدید اجازهٔ restore روی Production ندارد.

## HTTP/CSP/CORS

هدرهای موجود HSTS/nosniff/Referrer/Permissions/Frame حفظ شدند. پاسخ زودهنگام bridge و service binding نیز محافظت می‌شود. HTTP عمومی به HTTPS می‌رود؛ APIهای خصوصی no-store هستند. CORS به‌صورت default-deny ماند و wildcard همراه credential اضافه نشد. CSRF Origin/Sec-Fetch-Site حفظ شد؛ Native بدون Origin همچنان سازگار است.
CSP جدید **Report-Only** است؛ inline script ضروری nonce دارد و renderer از هدر داخلی nonce می‌گیرد. هدر nonce ورودی کاربر بازنویسی می‌شود. `unsafe-eval` وجود ندارد؛ استثنای inline فقط برای styleهای فعلی React است، نه JavaScript. تصاویر خود سایت، blob/data و endpoint ImageKit و سرویس تحلیل Cloudflare در سیاست اولیه لحاظ شده‌اند. تکمیل allowlist و اجرای واقعی سیاست نیازمند مرورگر staging با دادهٔ نماینده و بررسی violationهاست؛ پیش از آن ادعای Enforce کامل نکنید.
پیش از includeSubDomains/preload باید تمام DNS/گواهی‌های زیردامنه‌ها بررسی شوند؛ این تغییر انجام نشد. COOP/CORP عمومی به‌دلیل احتمال اختلال ورود/رسانه بدون آزمون اضافه نشد.

## Tests

نتیجهٔ نهایی و شمارش اجرای یکپارچه در انتهای گزارش ثبت می‌شود. آزمون‌ها از SQLite موقت، درگاه ساختگی و دادهٔ مصنوعی استفاده می‌کنند. تست‌های `test-live-*` عمداً در اجرای عمومی وارد نشده‌اند؛ ممکن است دادهٔ واقعی بسازند.
- امنیت افزوده: خروجی JSON-LD، PBKDF2 خراب، nonce نشست، hash مدیر، brute-force توزیع‌شده، شمارنده اتمی، CSRF، SQLi، هدرهای early-return، سیاست CSP، readiness و امضای تصویر.
- بازیابی: یک‌بارمصرف، انقضا، hash، ابطال نشست‌ها، rate limit و ثبت durable درخواست بدون ایمیل با قطع SMS.
- پیامک: ۱۲۲ آزمون بدون SMS واقعی.
- پرداخت/رسانه/IDOR/محدودیت فایل و رجوع از خطای موقت.
- TypeScript، vinext check، build، audit و اسکن تاریخچه/درخت/خروجی عمومی.
- بررسی مرورگر کامل CSP هنوز **Pending** است؛ محیط شبیه‌ساز محلی به redirect تکراری HTTPS برخورد کرد. این نقص بررسی گزارش شد و به‌جای دستکاری HTTPS تولید، سیاست جدید اجرایی نشد.

## Remaining Risks

۱. CSP کامل هنوز Report-Only است؛ بررسی مرورگر staging و سپس Enforce پس از مجوز انتشار لازم است.
۲. مسیر خودکار Cloudflare Builds باید با gate انتشار نهایی همسو شود؛ بدون تغییر Production در این کار، وضعیت آن مستند شده است.
۳. مهاجرت رمز نمک‌دار مدیر و ابطال مرکزی نشست‌های مدیر نیازمند تصمیم/تنظیم secret و smoke test مجاز است؛ کلید زنده تغییر نکرد.
۴. سه هشدار متوسط وابستگی تا ارتقای سازگار باقی است؛ مسیر فعال تولید OG از دادهٔ کاربر پیدا نشد.
۵. ویدیو decoder کامل ندارد؛ processor جدا برای تضمین عمیق‌تر لازم است.
۶. job پشتیبان تازهٔ SMS و نگهداری بیرون GitHub باید در اجرای مجاز واقعی و بازیابی دوره‌ای تأیید شود.
۷. nonce در layout ریشه ممکن است cache/prerender صفحات را کاهش دهد؛ هزینهٔ CPU و اثر cache هنوز در staging اندازه‌گیری نشده است.
۸. سیاست جامع retention و هشدار عملیاتیِ spike باید با نیاز کسب‌وکار و ابزار پایش انتخاب شود؛ حذف دادهٔ حیاتی انجام نشده.
بنابراین این گزارش و PR «آمادهٔ بازبینی» هستند، نه تأیید امنیت مطلق یا مجوز انتشار خودکار.

## Recommended Follow-up

پس از بازبینی PR و اجازهٔ صریح:
۱. مسیر Cloudflare Builds را با CI اجباری همسو یا انتشار آن را به workflow کنترل‌شده محدود کنید؛ SHA دقیق منتشر شود.
۲. snapshot رمزگذاری‌شده از هر دو D1 و آزمون restore ایزوله؛ هیچ restore روی Production انجام نشود.
۳. انتشار staging با bindingهای غیرتولیدی؛ مرورگر desktop/mobile برای login، ثبت‌نام، reset، upload، callback ساختگی، داشبورد و کنترل SMS؛ بررسی CSP violation و nonceهای framework. تنها پس از نتیجهٔ سالم Enforce کنید.
۴. اگر مهاجرت hash مدیر انتخاب شد، مقدار `pbkdf2-sha256$100000$<salt-32-hex>$<hash-64-hex>` را با ابزار محلی از رمز جدید تولید و فقط در Cloudflare Secret با نام `ADMIN_LOGIN_PASSWORD_HASH` قرار دهید. `ADMIN_ACCESS_KEY` کلید امضا می‌ماند؛ با وجود hash، fallback ورود با آن خاموش است. مسیر بازیابی امن را پیش از تغییر تأیید کنید.
۵. smoke test غیرمخرب Production: ورود/خروج، 401/403 ناشناس، no-store، رخدادهای tracking و اتصال؛ بدون SMS/خرید واقعی.
۶. ارتقای سازگار Satori/چارچوب در PR جدا، processor ویدیو، ابطال نشست مدیر و هشدارهای عملیاتی.

## Revision & Files

SHA نهایی از head همین PR قابل بازیابی است؛ دستور بازبینی: `git log -1 --format=%H` و `git diff --name-status ecfe6844a5ecaf19ae1a1318d9c68c23516d5c7f...HEAD`. هیچ secret یا دادهٔ واقعی در فایل‌های این PR نباید باشد. فهرست فایل‌ها و نتیجهٔ نهایی آزمون به این بخش افزوده می‌شود.

### نتیجهٔ اجرای نهایی

- تمام **۳۵۱ آزمون محلی** در یک اجرای یکپارچه موفق: ۳۵۱ موفق، صفر ناموفق/حذف‌شده. تست‌های live از این اجرا کنار گذاشته شدند.
- پس از تکمیل ثبت ساخت‌یافتهٔ رخدادها، ۹ آزمون متمرکز آن نیز موفق شد.
- TypeScript بدون خطا؛ `vinext check` با ۹۵٪ سازگاری، تنها هشدار شناخته‌شدهٔ reactStrictMode در App Router؛ build کامل موفق.
- اسکن خروجی client: بدون یافته؛ source map عمومی صفر.
- restore مصنوعی مستقل برای جدول سایت و جدول SMS هر دو موفق؛ backup واقعی جدید اجرا نشد.
- مجوز فایل پیکربندی محلی رابط: فقط حساب مالک ویندوز؛ مقدار credential چاپ نشد.
- آزمون مرورگر کامل CSP موفق اعلام نشده؛ چرخهٔ HTTPS شبیه‌ساز مانع بررسی شد.

### فایل‌های این تغییر

- `.github/dependabot.yml`
- `.github/workflows/backup-d1.yml`
- `.github/workflows/ci.yml`
- `.github/workflows/deploy-cloudflare.yml`
- `.gitignore`
- `.gitleaks.toml`
- `.gitleaksignore`
- `app/about/page.tsx`
- `app/api/admin/security-readiness/route.ts`
- `app/api/admin/sms/login/route.ts`
- `app/api/admin/sms/security-readiness/route.ts`
- `app/api/auth/business/login/route.ts`
- `app/api/auth/business/recovery/route.ts`
- `app/api/businesses/register/route.ts`
- `app/api/health/db/route.ts`
- `app/api/me/business/media/upload/route.ts`
- `app/api/me/business/route.ts`
- `app/business/[slug]/page.tsx`
- `app/category/[slug]/page.tsx`
- `app/for-business/online-discovery-guide/page.tsx`
- `app/for-business/page.tsx`
- `app/help/page.tsx`
- `app/karaj/baraghan/page.tsx`
- `app/karaj/curtain/markets/page.tsx`
- `app/karaj/page.tsx`
- `app/layout.tsx`
- `app/magazine/[slug]/page.tsx`
- `app/magazine/page.tsx`
- `app/page.tsx`
- `app/privacy/page.tsx`
- `app/terms/page.tsx`
- `app/tools/carpet-estimator/page.tsx`
- `app/tools/curtain-fabric-calculator/page.tsx`
- `app/tools/flooring-estimator/page.tsx`
- `app/tools/page.tsx`
- `app/tools/smart-home-scope/page.tsx`
- `app/tools/wallpaper-calculator/page.tsx`
- `components/LocalSeoLanding.tsx`
- `docs/security-audit-2026-11.md`
- `docs/sms-center-env.example`
- `lib/request-gate.ts`
- `lib/request-security.ts`
- `lib/safe-json-ld.ts`
- `lib/server/admin-login-rate-limit.ts`
- `lib/server/admin-session.ts`
- `lib/server/business-session.ts`
- `lib/server/business-sitemap.ts`
- `lib/server/image-signature.ts`
- `lib/server/password-recovery.ts`
- `lib/server/password.ts`
- `lib/server/public-businesses.ts`
- `lib/server/response-security.ts`
- `lib/server/security-audit.ts`
- `lib/server/security-readiness.ts`
- `lib/server/service-sitemap.ts`
- `tools/test-auth-hardening.mjs`
- `tools/test-custom-capacity.mjs`
- `tools/test-gallery-security.mjs`
- `tools/test-password-recovery.mjs`
- `tools/test-public-business-hydration.mjs`
- `tools/test-request-security.mjs`
- `tools/test-security-hardening.mjs`
- `tools/test-sms-admin.mjs`
- `tools/test-subscription-lifecycle.mjs`
- `tools/test-video-plans.mjs`
- `tools/test-welcome-trial.mjs`
- `tools/verify-backup-restore.mjs`
- `worker.ts`
