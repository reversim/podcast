---
title: 253 Fogcast 17 - Deployments
date: 2015-03-16T07:50:00.000Z
tags:
  - fogcast
episode: 253
audio_url: https://m.reversim.com/reversim253_fogcast17-deployments.mp3
cover_image: /images/blogger/8afd4ac157f3ba74b5aa.jpg
legacy_url: https://www.reversim.com/2015/03/253-fogcast-17-deployments.html
legacy_path: /2015/03/253-fogcast-17-deployments
---

<div class="post-body">
<div dir="ltr" style="text-align: left;" trbidi="on">
<div dir="rtl" style="line-height: 1.38; margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
<span style="background-color: transparent; color: black; font-family: Arial; font-size: 15px; font-style: normal; font-variant: normal; font-weight: normal; text-decoration: none; vertical-align: baseline; white-space: pre-wrap;">הפצה, או באנגלית - Deployment. באולפן - ליאור ורן.</span></div>
<div class="separator" dir="rtl" style="clear: both; text-align: center;">
<a href="/images/blogger/8afd4ac157f3ba74b5aa.jpg" imageanchor="1" style="clear: left; float: left; margin-bottom: 1em; margin-right: 1em;"><img border="0" height="130" src="/images/blogger/8afd4ac157f3ba74b5aa.jpg" width="200"></a></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="margin-bottom: 0pt; margin-top: 0pt; text-align: right;">
</div>
<ul dir="rtl" style="text-align: right;">
<li style="line-height: 1.38;"><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">קוד, שלא כמו שירה, לא כותבים למגרה - קוד מיועד לשימוש.</span></li>
<li style="line-height: 1.38;"><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">דרכים, גישות ושיטות שונות בשרשרת ההפצה של הקוד. </span></li>
<li style="line-height: 1.38;"><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">תגיבו כאן למטה, אולי זו תהיה תחילתה של סדרה.</span></li>
</ul>
<div dir="rtl" style="text-align: right;">
<span style="font-family: Arial;"><span style="font-size: 15px; line-height: 20.7000007629395px; white-space: pre-wrap;"><br></span></span></div>
<ul dir="rtl" style="text-align: right;">
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">תהליך ההפצה: מריצים, בודקים, עוקבים (לוגים) ומגיבים לשינויים וההתרחשויות השונות.</span></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">כל חברה והפלטפורמה שלה. </span></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">יש שעובדים ישירות עם החומרה ויש שעובדים על מכונה וירטואלית, ויש כמובן מכולות (Container). </span></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">יש כמובן פלטפורמות ששולחים להם את הקוד וכל השאר מטופל - PaaS</span></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">פלטפורמה כשירות נוח ויעיל כשעושים פרוייקטים קטנים מנסים משהו אולי לפרויקט לקהילה.</span></li>
</ul>
<div dir="rtl" style="text-align: right;">
<span style="font-family: Arial;"><span style="font-size: 15px; line-height: 20.7000007629395px; white-space: pre-wrap;"><br></span></span></div>
<ul dir="rtl" style="text-align: right;">
<li><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">הפצה עם פלטפורמת </span><a href="https://www.meteor.com/" style="line-height: 1.38; text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">מטאור</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">. מנטרים (</span><a href="http://monitority.com/" style="line-height: 1.38; text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Monitority</span></a><span style="font-family: Arial; font-size: 15px; vertical-align: baseline; white-space: pre-wrap;">). מגדירים שרתי אמזון עם </span><a href="http://aws.amazon.com/cloudformation/" style="line-height: 1.38; text-decoration: none;"><span style="color: #1155cc; font-family: Arial; font-size: 15px; text-decoration: underline; vertical-align: baseline; white-space: pre-wrap;">Cloud Formation</span></a></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">Chef מעולה להכנת המערכת לקראת שימוש. אך דרושים כלי המשך בשביל הקוד.</span></li>
</ul>
<div dir="rtl" style="text-align: right;">
<span style="font-family: Arial;"><span style="font-size: 15px; line-height: 20.7000007629395px; white-space: pre-wrap;"><br></span></span></div>
<ul dir="rtl" style="text-align: right;">
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">לקוחות בינונים זה המקום להתחיל.</span></li>
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">בחברת <a href="https://gormim.com/">גורמים</a> קשה לקבל תשלומים משירותים שונים בחו"ל ובעיקר כיף לשמוע שאנשים מוצאים עבודה על ידי החברה.</span></li>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<ul dir="rtl" style="text-align: right;">
<li><span style="font-family: Arial; font-size: 15px; line-height: 1.38; white-space: pre-wrap;">מוזמנים לבוא לדבר על הפצה במערכת Windows או תחומים אחרים הקשורים בהפצה.</span></li>
</ul>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
<br></div>
<div dir="rtl" style="text-align: right;">
הקובץ נמצא <a href="http://m.reversim.com/reversim253_fogcast17-deployments.mp3">כאן</a>, האזנה נעימה ותודה רבה ליוסי על התמלול</div>
</div>
<div style="clear: both;"></div>
</div>
