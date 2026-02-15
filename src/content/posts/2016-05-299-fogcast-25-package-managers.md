---
title: 299 Fogcast 25 - Package managers
date: 2016-05-05T19:46:00.000Z
episode: 299
audio_url: https://m2.reversim.com/reversim299_fogcast25-package-managers.mp3
legacy_url: https://www.reversim.com/2016/05/299-fogcast-25-package-managers.html
legacy_path: /2016/05/299-fogcast-25-package-managers
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">אנחנו בפרק 299, ה 19 למרץ 2016. בפרק זה רן וליאור מדברים על Package Managers</span></div>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-6f47de77-826d-8828-217c-4ad9537e79d1" style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">1:16 - תקציר </span><a href="http://www.reversim.com/2016/04/297-fogcast-24-lambda.html" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">הפרק על AWS Lambda</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">, ו Serverless architecture. רן בונה Web Crawler ולבסוף החליט שלא להשתמש בשירות של Lambda. הרושם חיובי, אבל חסר למערכת בגרות בשליטה על התהליך.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">4:16 - בסביבות רבות כגון &nbsp;Node.js, Rails יש חשיבות עליונה ל Package Managers. ב״עולם הישן״ של C++ , לא היו Package Managers ותחזוקת גרסאות של ספריות בתוך פרוייקט הייתה מטלה כבדה ומייגעת. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">5:30 - יש להבדיל בין סוגי ה Package Managers השונים. למפתח מדובר בהתקנת ספריות (למשל ב Node.js, Ruby). לעומת זאת בעולם ה Infrastructure, מדובר בהתקנת Executables על הוסט מסויים למשל apt, yam.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">6:15 - הגדרה - </span><a href="https://en.wikipedia.org/wiki/Package_manager" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Package Manager</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> מאפשר משיכת חבילה, לשלוט בגרסא הנמשכת, לעדכן את הגרסא, ולטעון את כל ה Dependencies -חבילות אחרות בהן החבילה המבוקשת תלויה (התלויות שלהן). כמשתמש הציפייה היא לבקש חבילה מסויימת ושכל ההליכים הנלווים יהיו מנוהלים אוטומטית.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">7:53 - נושא ניהול החבילות הדינמיות תמיד היה בעייתי. בעבר </span><a href="https://en.wikipedia.org/wiki/DLL_Hell" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">DLL Hell</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> היה אתגר נפוץ באקוסיסטם של מערכות הפעלה Windows. הקונספט שנועד לחסוך בשטח אחסון במחשב אפשר להוריד חבילה מסויימת ולהשתמש בה במגוון תוכנות במחשב. ה״גהינום של ה DLL״ החל כאשר תוכנות שונות השתמשו בגרסאות שונות של אותה חבילה, אך החבילה הייתה מותקנת אך ורק בגרסא אחת.</span></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;"><br></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">9:17 - הבעיה קיימת בעוד סביבות כמו Java או לינוקס גם כיום.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">10:04 - בעיית ה Versioning היא יחסית פתירה כבעיה טכנית, ובסביבות שבהן נבנה </span><a href="http://semver.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Semantic Versioning</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> מהיסוד של הטכנולוגיה, יש סדר יחסי. דוגמאות מוצלחות הן Node.js, ROR, אבל גם טכנולוגיות אחרות מתחילות להדביק את הפער.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">12:38 - ה Package Manager מאפשר שליטה במה שמשתמשים בו בפיתוח ובפרודקשן.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">12:47 ה Package Managers לפי סביבות הם : </span></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Node.js - </span><a href="https://www.npmjs.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Npm</span></a></div>
<div dir="ltr" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Ruby - </span><a href="https://rubygems.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Gem</span></a></div>
<div dir="ltr" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Python - </span><a href="https://pip.pypa.io/en/stable/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">pip</span></a></div>
<div dir="ltr" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">Java - </span><a href="https://maven.apache.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Maven</span></a></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;"><br></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">לכל שפה או טכנולוגיה כבר יש Package manager, אפילו ישנות כמו C.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">13:21 - מספרי גירסאות מנוהלים ע״י </span><a href="http://semver.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Semantic Versioning</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> - שלוש המספרים של גרסא. המספר הראשון הוא ה Major release - משתנה בד״כ אחת לכמה שנים. המספר השני מבטא שינויים ב API ויכול להגיע גם למאות. הנקודה האחרונה מבטאת שינויים שלא אמורים להשפיע על ה API, למשל תיקוני באגים.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">15:44 - אין מעקב ריאלי או אכיפה אחרי שינויים הגרסאות - זה מערב פרוע. בפריימוורק אחד טוענים שיש אכיפה סביב הנושא והוא </span><a href="http://elm-lang.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">ELM</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> (פריימוורק פרונט אנד לווב). </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">16:44 - מודל ה Semantic versioning איננו מושלם. יתכנו שינויים בתוצאות שמחזירות פונקציות מבלי לשנות את חתימתן, וכך לעקוף את מנגנון האכיפה.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">17:24 - איך נמנעים מבעיית הגרסאות השונות בפרויקט אמיתי במצב בו ספריות ה Dependencies משתמשות באותה ספריה, אך בגרסאות שונות ולא תואמות? ב Java זה יכול להיות סיוט ואף ליצור בעיות רק בזמן ריצה. עם קצת מזל מוצאים גרסא שמתאימה לכל הדרישות אך זה ידני. החלופה השניה היא שימוש ב </span><a href="https://www.osgi.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">OSGI</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> להכלה של חבילות, אך גם זה תהליך לא נעים.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">19:57 - אלטרנטיבה לפתרון היא השמה של החבילות בצורה מקבילה כך שכל חבילה מבודדת את החבילות שבה היא תלויה, זה בזבזני באחסון וזכרון, אבל לא משמעותי ביחס ליתרון. נעשה שימוש בשיטה זו ב NPM מעל Node.js.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">21:36 - בעולם ה Java זה לא ממש אפשר מפני שצריכת חבילות הוא לפי שם ה Class וכך אי אפשר ליצור את הבידוד. כשכתבו את Java לא היו מודעים לקיום הבעיה, והטכנולוגיות המודרניות כבר לקחו את המכשולים הללו בחשבון.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">22:42 - הבעיות הללו היו פתירות ב C++ וגם Java, אבל דורשות מעקפים ״מלוכלכים״ של עריכת הקוד בחבילות הנדרשות והקוד שאותו צורכים.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">24:38 - הבעיה קיימת גם בפייתון עם Hacks כמו טעינה דינמית או שינוי Path. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">26:00 - באקוסיסטם של GO, יש חידוש בתחום ה Deployment - הקומפילציה נעשית ביחד עם ״משתני הסביבה״, ויוצרת Executable בודד כך שאפשר בקלות יחסית להעלות לשרת ללא תלויות.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">27:31 - קול קורא: ישנה בעיה כיום של תקשורת ״דו-כיוונית״. המשתמש בחבילה צריך לדאוג לעדכן את החבילה בעצמו, ואילו אם כותב החבילה מתקן באג קריטי, אין לו יכולת ״להודיע״ למשתמשים בחבילה שעליהם לעדכן. דמיינו את העדכונים במערכות ההפעלה - היה טוב לו הייתה יכולת זו (לדחוף תיקונים ב Push) גם בעולם החבילות וה Package Managers.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">29:21 - למאזיני פודקאסטים שאוהבים מדע בדיוני - ממליצים על &nbsp;</span><a href="http://escapepod.org/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Escapepod</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.6667px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">.</span></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m2.reversim.com/reversim299_fogcast25-package-managers.mp3">כאן</a>, האזנה נעימה ותודה רבה לשי על התמלול<br></div></div></div>
<div style="clear: both;"></div>
</div>
