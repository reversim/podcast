---
title: 297 Fogcast 24 - Lambda
date: 2016-04-20T22:20:00.000Z
tags:
  - fogcast
episode: 297
audio_url: https://m2.reversim.com/reversim297_fogcast24.mp3
cover_image: https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhNk-3k8WUP1Eb-yviY509HE58JSyrNp_kp9Oi0vdCaFv7NhRHZSP77c-j-bPHIbX9khJXKT9bKlGMghVnooJ3G7F93SQHWtJO8BItsQEwJmnTgXePphrMNb3hyYnjLwIt1YkV7ByfVF18/s200/aws-lambda.png
legacy_url: https://www.reversim.com/2016/04/297-fogcast-24-lambda.html
legacy_path: /2016/04/297-fogcast-24-lambda
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<div class="separator" style="clear: both; text-align: center;">
<a href="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhNk-3k8WUP1Eb-yviY509HE58JSyrNp_kp9Oi0vdCaFv7NhRHZSP77c-j-bPHIbX9khJXKT9bKlGMghVnooJ3G7F93SQHWtJO8BItsQEwJmnTgXePphrMNb3hyYnjLwIt1YkV7ByfVF18/s1600/aws-lambda.png" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="200" src="https://blogger.googleusercontent.com/img/b/R29vZ2xl/AVvXsEhNk-3k8WUP1Eb-yviY509HE58JSyrNp_kp9Oi0vdCaFv7NhRHZSP77c-j-bPHIbX9khJXKT9bKlGMghVnooJ3G7F93SQHWtJO8BItsQEwJmnTgXePphrMNb3hyYnjLwIt1YkV7ByfVF18/s200/aws-lambda.png" width="200"></a></div>
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">בפרק זה רן וליאור מדברים על AWS Lambda והנסיון של רן בכתיבת crawler מעל שרות זה.</span></div>
<div dir="rtl" style="text-align: right;">
<b id="docs-internal-guid-23d45799-35be-b6b1-cfb6-865255f97ee9" style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">2:10 בניית פריימוורק ל </span><a href="https://aws.amazon.com/lambda/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">AWS Lambda</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> עבור </span><a href="https://yodas.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Yodas</span></a></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">3:37 המוצר AWS Lambda נוצר ע״י אמאזון עם הקונספט של ״פונקציות ולא סרברים״. אין לך סרבר משלך , המתכנת מממש פונקציה משלו ב Node.js, Python, Java או אחר. ואלו רצות על תשתיות על אמאזון מבלי דאגות של Scale.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">5:00 ההבדל בין Microservice לבין AWS Lambda, אוסף של פונקציות לעומת תשתית</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">6:57 ההבדל המשמעותי בין Lambda לבין Heroku ו Paas אחרים הוא שב Lambda כותבים אך ורק פונקציה - היחידה האטומית היא מאוד קטנה לעומת כתיבת Service שהוא שרת שלם.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">7:46 הסוד הוא ב </span><a href="http://www.confluent.io/blog/apache-kafka-samza-and-the-unix-philosophy-of-distributed-data" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">UNIXification</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> של התוכנה. כותבים הרבה מאוד יחידות קטנות של פונקציונליות ומחברים אותן עם כלים חזקים כמו Message queues או דאטאבייסים המייצאים Stream, והתשתית הזו מסופקת ע״י אמאזון (או ספק אחר). הכלים הללו הבשילו לרמת פרודקשן והופכים לאופציה ריאלית לפיתוח.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">9:30 קונספטים של למבדה: הפונקציות הן Stateless - בין הרצה להרצה לא שומרים על קבצים, אחרי ריצה - הדיסק ״מתאדה״. כשפונקציה מתחילה לרוץ היא מתחילה ״מאפס״ - ומוזנת מ ה Event או מידע מ S3 או דאטאבייס. זה אמנם אילוץ, אך הוא דוחף לארכיטקטורה נכונה שניתן לעשות לה Scale בפשטות יחסית.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">11:24 אין סרברים, לא צריך לתכנת אותם, לתחזק אותם, לנטר אותם. הכל מאחורי אבסטרקציה, ומוריד הרבה מטלות תחזוקה.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">12:25 הפונקציות הן Event driven - מחכות להודעות כדי לעבוד. יכולות להיות מוזנות ע״י הזנה לחלק אחר מהאקוסיסטם של אמאזון - S3, SQS, Kinesis, Dynamo DB. לדוגמא, אפשר לכתוב פונקציית Lambda, שבכל הזנה של קובץ תמונה ל S3, מייצרת עבורו גם Thumbnail (תמונה מוקטנת). הפונקציה תופעל לאחר שהוספת הקובץ ל S3, תבצע &nbsp;״Trigger״ באופן אוטומטי של ה״Event״.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">13:45 שימוש ב Api Gateway של אמאזון כדי לחבר גם פעולות שמקורן בווב. זו אבולוציה של ה Lambda שהחל כיכולת ״פנימית״ בלבד לארכיטקטורה ואח״כ התווספה היכולת לקבל איוונטים מבחוץ ולהחזיר תשובות.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">15:10 הקונספט של ״Infinite Scalability, Zero maintenance״ - כמובן בגבול הסביר.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">15:41 גוגל הכריזו על </span><a href="https://cloud.google.com/functions/docs" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Google cloud functions</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> - אלטרנטיבה ל Lambda שנמצאת באלפא וכרגע תומכת רק ב Node.js. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">16:10 שירות בשם</span><a href="https://www.iron.io/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;"> iron.io</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> שגם מציע אלטרנטיבה דומה.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">16:55 &nbsp;סכנת ה Lock-in לספק השירות הספציפי - למשל ב AWS, התשתית תהיה תלויה בשירותים המשלימים של אמאזון ונוצרת סכנה של &nbsp;״Vendor Lock in״. הקוד עצמו (הלוגיקה) גנרי ולא תלוי תשתית, אך התלות ב״דבק״ - השירותים שמשנעים את המידע, מאוד תלוי ספק.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">18:40 דוגמא איך הבדלי סמנטיקה בין ה Message Queues יכולה להשפיע על המימוש וליצור Lock-in, אפילו למוצר מסויים בתוך אותו השירות (כמו SQS לעומת Kinesis ששניהם שירותי תורים של AWS).</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">20:45 זה לא לחלוטין ניתן להעברה. יש Vendor Lock in גבוהה יותר מאשר כתיבת שרת ״old fashioned״, של node+ express, אבל זה צפוי להשתפר. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">21:52 בטווך הארוך הרעיון הוא לבנות תשתית פונקציונלית בסיסית, והציפייה היא שהשירותים יישרו קו ויתמכו בפורמטים דומים.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">23:00 טוב שיש תחרות מגוגל - כי יש בעיות רבות ואמאזון צריכים תחרות</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">23:30 מימוש: אפשר לכתוב Node.js, Python, Java או לכתוב Shim שיאפשר לכתוב בשפה אחרת - למשל Go, ע״י הרצתו כ Process עם Input - output. פריימוורק שמאפשר את זה מבלי לכתוב את ה Shim בעצמך הוא </span><a href="https://github.com/apex/apex" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Apex</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">24:57 התהליך של העלאת הפונקציות וניהולן די מתיש מול הממשק של AWS, ובגלל שצריך גם ניהול קוד. Apex נותן פתרון טוב ל Version control, Deployment, Rollback ותמיכה ב Go בנוסף לשפות שמוצעות ע״י Lambda.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">27:00 בנוסף Apex נותן יכולות טובות לחיבור הפונקציות ל Events וניטור של התהליך. הניהול הזה הוא חלק נכבד מתהליך הפיתוח ב Lambda.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">28:03 ב Apex החליטו לעבוד עם </span><a href="https://www.terraform.io/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Terraform</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">, כלי לניהול ה Infrastructure בענן. הכלי יכול לשמש למגוון של use cases להגדרת התשתיות בקוד (עם Version control). ב Apex השימוש ב Terraform הוא די הכרחי. ייתכן כי Apex יתרחב בעתיד מעבר לתשתיות של AWS בלבד.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">31:31 נקודת התורפה בקונספט - האם באמת נחסך הצורך בלימוד כלים לניהול ה Infrastructure? אכן הניהול הוא נקודת חיכוך משמעותית ב Flow של Lambda. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">32:43 זה יהיה הרבה יותר נחמד אם זה פשוט יעבוד. זה לא בשמיים לחבר פונקציה לתור והאבסטרקציה תגיע בקרוב. AWS LAmbda עוד צעיר ונמצא בגרסא 0.7</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">33:57 פריימוורק נוסף </span><a href="http://serverless.com/" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Serverless</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> גם מנסה להתחרות בספייס הזה - להריץ Lambda על עננים שונים (כרגע רק באמאזון). Apex יחסית פשוט יותר, אבל שניהם בכיוון הנכון. חיוני להשתמש באחד מהם כדי לעבוד עם &nbsp;Lambda.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">35:09 ניהול התשתיות הוא נקודת חיכוך שקיימת גם ככה בניהול שרתים ״Old school״. עדיף לעשות את זה נכון עם ניהול הרשאות</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">36:05 ה Tool fatigue מהאקוסיסטם של Javascript מגיע גם ל Devops, ולימוד של כלי חדש (כמו Lambda) מכריח ללמוד כלים נלווים נוספים.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">38:28 יש מגוון Use cases. למשל Api Gateway + Lambda. שירות Cronjob (למשל שליחה ל Slack פעם ביום בשעה 10). דוגמא נוספת ל </span><a href="https://github.com/yodasco/slackwork" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Slack</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> היא שליחת הודעות בתגובה ל Events בתשתית (העלאת שרת, הורדת שרת). העלויות זניחות למקרה שבו ה Workload נמוך - זה עדיף מהחזקת שרת לצורך המשימה.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">40:44 שימוש ב Analytics. חברת </span><a href="https://github.com/yodasco/slackwork" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Segment.com</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> פרסמה תיאור מעניין של Data pipeline בעזרת Lambda. זה יכול לשמש גם לניתוח מסוג Crawling. העלויות לעיבוד בקנה מידה גדול משמעותיות, וזה יכול להוות פקטור בבחירת הטכנולוגיה.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">43:21 מימוש Data pipeline באמצעות </span><a href="https://github.com/yodasco/slackwork" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Lambda Architechture</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">, המימוש של AWS Lambda דומה בקונספט ל Use case של Data processing - פונקציות קטנות שהן Stateless שעושות את עבודתן ומעבירות הלאה. לא להתבלבל בין שניהם.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">44:55 מימוש של רן ל Crawler הוא ניסוי. כרגע נראה שזה לא משתלם מבחינת זמן, אבל רק בעתיד נדע.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">45:29 המלצה להשתמש ב Lambda רק עבור שירותים פנימיים ולא כחלק מליבת המוצר. זה כדי לחסוך בעלויות ולהכיר את טכנולוגיית העתיד במקום עם סיכון נמוך.</span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">48:10 ב </span><a href="https://www.linkedin.com/company/3276916?trk=prof-exp-company-name" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Bringg</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;"> מגייסים מתכנתי iOS. </span></div>
<div dir="rtl" style="text-align: right;">
<b style="font-weight: normal;"><br></b></div>
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">תודה רבה לשי אלון על התקצור. הקובץ נמצא </span><a href="http://m2.reversim.com/reversim297_fogcast24.mp3" style="text-decoration: none;"><span style="background-color: transparent; color: #1155cc; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">כאן</span></a><span style="background-color: transparent; color: black; font-family: &quot;arial&quot;; font-size: 14.666666666666666px; font-style: normal; font-variant: normal; font-weight: 400; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">.</span></div>
<div dir="rtl" style="text-align: right;">
<br></div>
</div>
<iframe allowfullscreen="" height="30" mozallowfullscreen="" msallowfullscreen="" oallowfullscreen="" scrolling="no" src="//html5-player.libsyn.com/embed/episode/id/4234054/height/30/width/400/theme/standard-mini/autoplay/no/autonext/no/thumbnail/yes/preload/no/no_addthis/no/direction/backward/no-cache/true/" style="border: none;" webkitallowfullscreen="" width="400"></iframe></div>
<div style="clear: both;"></div>
</div>
