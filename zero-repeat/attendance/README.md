# درخواست منتور ZERO REPEAT

- فرم: https://mofid-academy.github.io/zero-repeat/attendance/
- مدیریت: https://mofid-academy.github.io/zero-repeat/attendance/admin.html

فرم روی نشانی قبلی منتشر شده است. نام، نام سازمانی و انتخاب «منتور می‌خواهم» یا «منتور نمی‌خواهم» الزامی‌اند. پس از تأیید ذخیرهٔ پاسخ، رسید نمایش داده می‌شود. با `?preview=1` می‌توان فرم و رسید را بدون ذخیره بررسی کرد.

با حساب مدیریت فعلی ZERO REPEAT، پاسخ‌ها را جست‌وجو یا فیلتر کنید. برای پاسخ‌های مثبت می‌توان نام منتور را ثبت، ویرایش یا پاک کرد. حذف پاسخ از پنل و اکسل به صورت نرم انجام می‌شود. خروجی XLSX شامل پاسخ‌های مطابق فیلتر، وضعیت تخصیص، نام منتور، زمان ثبت و خلاصهٔ تعداد پاسخ‌هاست.

`backend/mentor-schema.sql` جدول و تابع خصوصی درخواست منتور را ایجاد می‌کند. پاسخ‌های قدیمی حضور در `zr_attendance_responses` بایگانی هستند. نسخهٔ جدید `zero-repeat-attendance-api` ثبت حضور را بسته و برای گزارش قدیمی فقط خواندن با نشست مدیر را نگه می‌دارد. گزارش جدید از عملیات `admin_mentor_entries` استفاده می‌کند. پیکربندی مدیریت به شکل خصوصی از `zr_runtime_config` خوانده می‌شود.

بررسی: `node --test zero-repeat/attendance/tests/*.test.mjs`.

## مرجع طراحی

با درخواست مالک، ظاهر فرم بر اساس پیش‌نمایش این سه نمونه بازطراحی شده است:

- [Illos Team Invite Card — Naved](https://21st.dev/@navedux/components/illos-team-invite-card): قاب دعوت، تصویرسازی رابط و گوشه‌های نرم.
- [Animated Button — Abishekaraj Immanuel](https://21st.dev/@abishek1512/components/button-1): دکمهٔ کپسولی تیره و درخشش متحرک حاشیه.
- [Glassmorphism Profile Card — Berat Berkay Gökdemir](https://21st.dev/@beratberkayg/components/glassmorphism-profile-card): کارت نیمه‌شفاف، وضعیت بالای کارت و قاب تصویری.

پیاده‌سازی HTML/CSS و تصویر SVG این سایت مستقل و متناسب با فرم فارسی است؛ کد نیازمند ورود نمونه‌ها کپی نشده است. فونت Pinar و نشان موجود مفید حفظ شده‌اند. حرکت‌ها با تنظیم کاهش حرکت مرورگر خاموش می‌شوند.

نور کارت فرم بر اساس [Spotlight Card — Hossain Jahed](https://21st.dev/@jahed/components/spotlight-card) به موقعیت نشانگر واکنش نشان می‌دهد. نور بالای صفحه از [Hero — ohmfordev](https://21st.dev/@ohmfordev/components/hero) الهام گرفته است؛ فقط نور تزئینی استفاده شده و متن یا دکمه‌ای از نمونه به فرم اضافه نشده است. `light-effects.mjs` و `light-effects.css` مستقل از ثبت درخواست‌اند. لایه‌های نور کلیک‌ها را دریافت نمی‌کنند؛ دنبال‌کردن نشانگر برای لمس و حالت کاهش حرکت خاموش است.
