# کافه بازنشستگی — CMS نسخه ۲

## قابلیت‌ها
- مطالب: ایجاد، ویرایش، حذف، پیش‌نویس، انتشار
- آپلود تصویر (فشرده‌سازی در مرورگر + ذخیره در D1) یا لینک خارجی
- صفحات ثابت (درباره ما و ...)
- تنظیم بله و تلگرام از داخل پنل
- ارسال خودکار به بله/تلگرام هنگام انتشار

## دیپلوی
1. فایل‌ها را در ریپوی GitHub قرار دهید (پوشه functions الزامی است)
2. Cloudflare Pages → Connect to Git
3. Binding: Variable name = `DB` → دیتابیس D1
4. Environment variables:
   - ADMIN_PASSWORD
   - SESSION_SECRET
5. Redeploy

## پنل
/admin.html

## دامنه
Custom domains → kafebazneshastegi.ir
