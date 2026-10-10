# کافه بازنشستگی — CMS کامل (Cloudflare Pages + D1)

سایت داینامیک رایگان با پنل مدیریت محتوا، انتشار خودکار به بله و تلگرام.

## قابلیت‌ها
- پنل مدیریت در `/admin.html` (رمز محافظت‌شده)
- ایجاد، ویرایش، حذف، پیش‌نویس و انتشار مطلب
- دسته‌بندی، نویسنده، لید، متن کامل، تصویر (با URL)
- نمایش خودکار مطالب در صفحه اصلی، آرشیو و صفحه مطلب
- **ارسال خودکار به بله و تلگرام** هنگام انتشار
- RTL کامل، فونت وزیرمتن، موبایل‌فرندلی
- هزینه صفر (Cloudflare Free + D1 Free)

## مراحل دیپلوی (گام‌به‌گام)

### ۱. ساخت ریپو در GitHub
1. برو به github.com → New repository
2. نام: `kafebazneshastegi` (یا هر نامی)
3. Public یا Private (هر دو کار می‌کند)
4. فایل‌های این پوشه را آپلود/پوش کن

### ۲. ساخت پروژه در Cloudflare Pages
1. وارد [dash.cloudflare.com](https://dash.cloudflare.com) شو
2. Workers & Pages → Create → Pages → Connect to Git
3. ریپو را انتخاب کن
4. تنظیمات بیلد:
   - Framework preset: None
   - Build command: (خالی بگذار یا `exit 0`)
   - Build output directory: `/` (یا خالی)
5. Save and Deploy

### ۳. ساخت دیتابیس D1
1. در Cloudflare → Workers & Pages → D1 → Create database
2. نام: `kafebazneshastegi-db`
3. Create
4. برو به پروژه Pages → Settings → Bindings → Add
   - Type: D1 database
   - Variable name: `DB`
   - D1 database: `kafebazneshastegi-db`
5. Save

### ۴. متغیرهای محیطی (خیلی مهم)
در پروژه Pages → Settings → Environment variables → Production:

| Variable | مقدار |
|----------|-------|
| `ADMIN_PASSWORD` | یک رمز قوی دلخواه (مثلاً `Cafe@2026Strong!`) |
| `SESSION_SECRET` | یک رشته تصادفی طولانی (مثلاً ۳۰ کاراکتر تصادفی) |
| `BALE_BOT_TOKEN` | توکن ربات بله (اختیاری فعلاً) |
| `BALE_CHAT_ID` | آیدی کانال/چت بله (اختیاری) |
| `TELEGRAM_BOT_TOKEN` | توکن ربات تلگرام (اختیاری) |
| `TELEGRAM_CHAT_ID` | آیدی کانال تلگرام (اختیاری) |

بعد از ذخیره، یک Deploy جدید بزن (Retry deployment).

### ۵. اتصال دامنه
1. در پروژه Pages → Custom domains → Set up a custom domain
2. دامنه `kafebazneshastegi.ir` و `www.kafebazneshastegi.ir` را اضافه کن
3. چون دامنه قبلاً در Cloudflare است، خودکار ست می‌شود
4. صبر کن تا Active شود (معمولاً چند دقیقه)

### ۶. تست
- برو به `https://kafebazneshastegi.ir/admin.html`
- با رمزی که در `ADMIN_PASSWORD` گذاشتی وارد شو
- یک مطلب تست منتشر کن
- صفحه اصلی باید مطلب را نشان دهد

## راه‌اندازی ربات بله (برای ارسال خودکار)

1. در بله به `@BotFather` پیام بده → `/newbot`
2. نام و یوزرنیم ربات را بساز → توکن را کپی کن (`BALE_BOT_TOKEN`)
3. ربات را ادمین کانالت کن
4. برای پیدا کردن Chat ID:
   - یک پیام در کانال بفرست
   - برو به `https://tapi.bale.ai/bot<TOKEN>/getUpdates`
   - مقدار `chat.id` را پیدا کن (معمولاً منفی است مثل `-100xxxxxxxxxx`)
5. این دو مقدار را در Environment Variables بگذار و Redeploy کن

همین کار برای تلگرام با `@BotFather` و `api.telegram.org` انجام می‌شود.

## مسیرهای API
- `POST /api/auth` ورود
- `GET /api/auth` بررسی ورود
- `DELETE /api/auth` خروج
- `GET /api/posts` مطالب منتشرشده
- `GET /api/posts?admin=1` همه مطالب (نیاز به لاگین)
- `POST /api/posts` ایجاد
- `PUT /api/posts?id=...` ویرایش
- `DELETE /api/posts?id=...` حذف

## نکات
- تصویر فعلاً با URL کار می‌کند (می‌توانی از سرویس‌های رایگان مثل ImgBB یا بعداً R2 استفاده کنی)
- برای امنیت بیشتر، بعد از دیپلوی لینک admin را فقط خودت بدان
- اگر خطای Binding دیدی، مطمئن شو نام متغیر دقیقاً `DB` است

ساخته‌شده برای کافه بازنشستگی — ۱۴۰۵
